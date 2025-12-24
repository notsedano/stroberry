"use client"

import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react"
import { motion, type PanInfo } from "framer-motion"
import Image from "next/image"
import { ChevronUp, ChevronDown } from "lucide-react"

type MediaItem = {
  id: number
  src: string
  alt: string
  type?: "image" | "video" // Optional: auto-detected if not provided
}

// Helper function to detect if a file is a video
const isVideoFile = (src: string): boolean => {
  const videoExtensions = [".webm", ".mp4", ".mov", ".avi", ".mkv", ".ogv"]
  return videoExtensions.some((ext) => src.toLowerCase().endsWith(ext))
}

// Showreel videos from /public/videos/
// Note: Next.js serves files from /public directly, so paths start with /
// Files with spaces/parentheses should work, but browser will handle encoding automatically
const images: MediaItem[] = [
  {
    id: 1,
    src: "/videos/videostro1_webm.webm",
    alt: "Stro Showreel Video 1",
    type: "video",
  },
  {
    id: 2,
    src: "/videos/videostro2_webm.webm",
    alt: "Stro Showreel Video 2",
    type: "video",
  },
  {
    id: 3,
    src: "/videos/video_stro3_webm (1).webm",
    alt: "Stro Showreel Video 3",
    type: "video",
  },
  {
    id: 4,
    src: "/videos/video_stro3_webm (2).webm",
    alt: "Stro Showreel Video 4",
    type: "video",
  },
  {
    id: 5,
    src: "/videos/videostro2_webm 5.webm",
    alt: "Stro Showreel Video 5",
    type: "video",
  },
]

// Memoized card component to prevent unnecessary re-renders
const MediaCard = memo(({ 
  item, 
  index, 
  currentIndex, 
  total, 
  videoRefs,
  onDragEnd
}: { 
  item: MediaItem
  index: number
  currentIndex: number
  total: number
  videoRefs: React.MutableRefObject<{ [key: number]: HTMLVideoElement | null }>
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void
}) => {
  // Calculate style once per render
  const style = useMemo(() => {
    let diff = index - currentIndex
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 100, rotateX: 0 } // Much higher z-index for current
    } else if (diff === -1) {
      return { y: -160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 }
    } else if (diff === -2) {
      return { y: -280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 }
    } else if (diff === 1) {
      return { y: 160, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 }
    } else if (diff === 2) {
      return { y: 280, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 }
    } else {
      return { y: diff > 0 ? 400 : -400, scale: 0.6, opacity: 0, zIndex: 0, rotateX: diff > 0 ? -20 : 20 }
    }
  }, [index, currentIndex, total])

  const isVisible = Math.abs(style.zIndex) > 0
  const isCurrent = index === currentIndex
  const isVideo = item.type === "video" || isVideoFile(item.src)

  if (!isVisible) return null

  return (
    <motion.div
      key={item.id}
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        willChange: "transform, opacity",
        transformStyle: "preserve-3d",
        zIndex: style.zIndex,
        backfaceVisibility: "hidden",
        isolation: "isolate", // Create new stacking context to ensure proper z-index
        pointerEvents: isCurrent ? "auto" : "none", // Only current video is interactive
      }}
      animate={{
        y: style.y,
        scale: style.scale,
        opacity: style.opacity,
        rotateX: style.rotateX,
        // z-index should NOT be animated - it causes stacking issues
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
      }}
      drag={isCurrent ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={onDragEnd}
    >
      <div
        className="relative h-[420px] w-[280px] overflow-hidden rounded-3xl bg-card ring-1 ring-border/20"
        style={{
          boxShadow: isCurrent
            ? "0 25px 50px -12px hsl(var(--foreground) / 0.15), 0 0 0 1px hsl(var(--foreground) / 0.05)"
            : "0 10px 30px -10px hsl(var(--foreground) / 0.1)",
          transform: "translateZ(0)",
          position: "relative",
        }}
      >
        {/* Card inner glow - uses foreground with low opacity */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-foreground/10 via-transparent to-transparent" />

        {isVideo ? (
          <video
            ref={(el) => {
              if (el) {
                videoRefs.current[index] = el
                // Ensure video loads when ref is set for current video
                if (isCurrent) {
                  el.load()
                }
              }
            }}
            src={item.src}
            className="absolute inset-0 h-full w-full object-cover"
            loop
            muted
            playsInline
            autoPlay={isCurrent}
            preload={isCurrent ? "auto" : "metadata"}
            draggable={false}
            style={{ 
              transform: "translateZ(0)",
              backgroundColor: "#000", // Show black background while loading
              position: "absolute",
              zIndex: 0, // Video is inside card, so relative to card's z-index
            }}
            onError={(e) => {
              console.error(`Failed to load video: ${item.src}`, e)
              const video = e.currentTarget
              console.error(`Video error details:`, {
                error: video.error,
                networkState: video.networkState,
                readyState: video.readyState,
                src: video.src
              })
            }}
            onLoadedMetadata={() => {
              // Video metadata loaded - ready to play
              const video = videoRefs.current[index]
              if (video && isCurrent && video.paused) {
                video.play().catch((err) => {
                  console.warn(`Autoplay failed for video ${index}:`, err)
                })
              }
            }}
            onCanPlay={() => {
              // Video can start playing
              const video = videoRefs.current[index]
              if (video && isCurrent && video.paused) {
                video.play().catch((err) => {
                  console.warn(`Autoplay failed for video ${index}:`, err)
                })
              }
            }}
          />
        ) : (
          <Image
            src={item.src || "/placeholder.svg"}
            alt={item.alt}
            fill
            className="object-cover w-full h-full"
            draggable={false}
            priority={isCurrent}
            loading={isCurrent ? "eager" : "lazy"}
          />
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
    </motion.div>
  )
})

MediaCard.displayName = "MediaCard"

export function VerticalImageStack() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const lastNavigationTime = useRef(0)
  const navigationCooldown = 400 // ms between navigations
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({})

  const navigate = useCallback((newDirection: number) => {
    const now = Date.now()
    if (now - lastNavigationTime.current < navigationCooldown) return
    lastNavigationTime.current = now

    setCurrentIndex((prev) => {
      const currentItem = images[prev]
      const isCurrentVideo = currentItem.type === "video" || isVideoFile(currentItem.src)
      
      // Pause current video if it's a video
      if (isCurrentVideo && videoRefs.current[prev]) {
        videoRefs.current[prev]?.pause()
      }

      const newIndex = newDirection > 0 
        ? (prev === images.length - 1 ? 0 : prev + 1)
        : (prev === 0 ? images.length - 1 : prev - 1)
      
      const newItem = images[newIndex]
      const isNewVideo = newItem.type === "video" || isVideoFile(newItem.src)
      
      // Play new video if it's a video
      if (isNewVideo && videoRefs.current[newIndex]) {
        videoRefs.current[newIndex]?.play().catch(() => {
          // Handle autoplay restrictions
        })
      }

      return newIndex
    })
  }, [])

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    if (info.offset.y < -threshold) {
      navigate(1)
    } else if (info.offset.y > threshold) {
      navigate(-1)
    }
  }, [navigate])

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          navigate(1)
        } else {
          navigate(-1)
        }
      }
    },
    [navigate],
  )

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: true })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  // Handle video playback when currentIndex changes - optimized to only handle visible videos
  useEffect(() => {
    // Only process videos within visible range (currentIndex ± 2)
    const visibleRange = 2
    const startIndex = Math.max(0, currentIndex - visibleRange)
    const endIndex = Math.min(images.length - 1, currentIndex + visibleRange)

    for (let index = startIndex; index <= endIndex; index++) {
      const item = images[index]
      const isVideo = item.type === "video" || isVideoFile(item.src)
      const video = videoRefs.current[index]
      
      if (isVideo && video) {
        if (index === currentIndex) {
          // Ensure video is loaded before playing
          if (video.readyState >= 2) {
            // HAVE_CURRENT_DATA or higher
            video.play().catch((err) => {
              console.warn(`Failed to play video ${index}:`, err)
            })
          } else {
            // Wait for video to load
            const handleCanPlay = () => {
              video.play().catch((err) => {
                console.warn(`Failed to play video ${index} after load:`, err)
              })
              video.removeEventListener('canplay', handleCanPlay)
            }
            video.addEventListener('canplay', handleCanPlay)
            video.load() // Force load if not already loading
          }
        } else {
          video.pause()
          if (Math.abs(index - currentIndex) > 1) {
            video.currentTime = 0 // Reset to start only if far from current
          }
        }
      }
    }
  }, [currentIndex])

  // Memoize visible items to prevent unnecessary re-renders
  // Sort so current video is rendered last (ensures it's on top in DOM order)
  const visibleItems = useMemo(() => {
    const items = images.map((item, index) => {
      let diff = index - currentIndex
      const total = images.length
      if (diff > total / 2) diff -= total
      if (diff < -total / 2) diff += total
      return { item, index, isVisible: Math.abs(diff) <= 2, isCurrent: index === currentIndex }
    }).filter(({ isVisible }) => isVisible)
    
    // Sort: current video last, then by z-index (higher first)
    return items.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return 1 // Current goes last
      if (!a.isCurrent && b.isCurrent) return -1
      // Otherwise maintain original order
      return a.index - b.index
    })
  }, [currentIndex])

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden" style={{ willChange: "contents" }}>

      {/* Card Stack */}
      <div 
        className="relative flex h-[500px] w-[320px] items-center justify-center" 
        style={{ 
          perspective: "1200px",
          transformStyle: "preserve-3d",
          willChange: "transform",
          isolation: "isolate", // Create stacking context for proper z-index handling
        }}
      >
        {visibleItems.map(({ item, index }) => (
          <MediaCard
            key={item.id}
            item={item}
            index={index}
            currentIndex={currentIndex}
            total={images.length}
            videoRefs={videoRefs}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {/* Navigation dots */}
      <div className="absolute right-8 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (index !== currentIndex) {
                setCurrentIndex(index)
              }
            }}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "h-6 bg-foreground" : "bg-foreground/30 hover:bg-foreground/50"
            }`}
            aria-label={`Go to item ${index + 1}`}
            style={{ willChange: "height, background-color" }}
          />
        ))}
      </div>

      {/* Instruction hint */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        style={{ willChange: "opacity, transform" }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
            style={{ willChange: "transform" }}
          >
            <ChevronUp className="h-6 w-6" />
          </motion.div>
          <span className="text-xs font-medium tracking-widest uppercase">Contact STRO</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
            style={{ willChange: "transform" }}
          >
            <ChevronDown className="h-6 w-6" />
          </motion.div>
        </div>
      </motion.div>

      {/* Counter */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <span className="text-4xl font-light text-foreground tabular-nums">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <div className="my-2 h-px w-8 bg-foreground/20" />
          <span className="text-sm text-muted-foreground tabular-nums">{String(images.length).padStart(2, "0")}</span>
        </div>
      </div>
    </div>
  )
}


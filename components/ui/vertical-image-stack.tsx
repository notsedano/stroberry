"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
// Supports: .webm, .mp4, .mov, .avi, .mkv, .ogv
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

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    if (info.offset.y < -threshold) {
      navigate(1)
    } else if (info.offset.y > threshold) {
      navigate(-1)
    }
  }

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

  // Handle video playback when currentIndex changes
  useEffect(() => {
    images.forEach((item, index) => {
      const isVideo = item.type === "video" || isVideoFile(item.src)
      const video = videoRefs.current[index]
      
      if (isVideo && video) {
        if (index === currentIndex) {
          video.play().catch(() => {
            // Handle autoplay restrictions - videos may need user interaction
          })
        } else {
          video.pause()
          video.currentTime = 0 // Reset to start
        }
      }
    })
  }, [currentIndex])

  const getCardStyle = (index: number) => {
    const total = images.length
    let diff = index - currentIndex
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 }
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
  }

  const isVisible = (index: number) => {
    const total = images.length
    let diff = index - currentIndex
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return Math.abs(diff) <= 2
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden">

      {/* Card Stack */}
      <div className="relative flex h-[500px] w-[320px] items-center justify-center" style={{ perspective: "1200px" }}>
        {images.map((item, index) => {
          if (!isVisible(index)) return null
          const style = getCardStyle(index)
          const isCurrent = index === currentIndex
          const isVideo = item.type === "video" || isVideoFile(item.src)

          return (
            <motion.div
              key={item.id}
              className="absolute cursor-grab active:cursor-grabbing"
              animate={{
                y: style.y,
                scale: style.scale,
                opacity: style.opacity,
                rotateX: style.rotateX,
                zIndex: style.zIndex,
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
              onDragEnd={handleDragEnd}
              style={{
                transformStyle: "preserve-3d",
                zIndex: style.zIndex,
              }}
            >
              <div
                className="relative h-[420px] w-[280px] overflow-hidden rounded-3xl bg-card ring-1 ring-border/20"
                style={{
                  boxShadow: isCurrent
                    ? "0 25px 50px -12px hsl(var(--foreground) / 0.15), 0 0 0 1px hsl(var(--foreground) / 0.05)"
                    : "0 10px 30px -10px hsl(var(--foreground) / 0.1)",
                }}
              >
                {/* Card inner glow - uses foreground with low opacity */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-foreground/10 via-transparent to-transparent" />

                {isVideo ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el
                    }}
                    src={item.src}
                    className="absolute inset-0 h-full w-full object-cover"
                    loop
                    muted
                    playsInline
                    autoPlay={isCurrent}
                    preload="metadata"
                    draggable={false}
                  />
                ) : (
                  <Image
                    src={item.src || "/placeholder.svg"}
                    alt={item.alt}
                    fill
                    className="object-cover w-full h-full"
                    draggable={false}
                    priority={isCurrent}
                  />
                )}

                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            </motion.div>
          )
        })}
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
          />
        ))}
      </div>

      {/* Instruction hint */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronUp className="h-6 w-6" />
          </motion.div>
          <span className="text-xs font-medium tracking-widest uppercase">Contact STRO</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
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


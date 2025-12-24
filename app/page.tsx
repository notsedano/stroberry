"use client";

import { useState, useCallback, useMemo } from "react";
import { VerticalImageStack } from "@/components/ui/vertical-image-stack"
import LivingNebulaShader from "@/components/ui/living-nebula"
import { NebulaColorSettings } from "@/components/ui/nebula-color-settings"
import Image from "next/image"
import strologo from "@/assets/strologo.png"

// Convert hex to RGB [0-1] - memoized outside component
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.8, 0.2, 0.5];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
};

// Default colors constant
const DEFAULT_COLORS = {
  gasColor1: [0.8, 0.2, 0.5] as [number, number, number],
  gasColor2: [0.2, 0.3, 0.9] as [number, number, number],
  backgroundColor: [0.0, 0.0, 0.05] as [number, number, number],
};

export default function Home() {
  const [nebulaColors, setNebulaColors] = useState<{
    gasColor1: [number, number, number];
    gasColor2: [number, number, number];
    backgroundColor: [number, number, number];
  }>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_COLORS;
    }
    try {
      const saved = localStorage.getItem("nebula-colors");
      if (saved) {
        const colors = JSON.parse(saved);
        return {
          gasColor1: hexToRgb(colors.gasColor1),
          gasColor2: hexToRgb(colors.gasColor2),
          backgroundColor: colors.backgroundColor ? hexToRgb(colors.backgroundColor) : DEFAULT_COLORS.backgroundColor,
        };
      }
    } catch (e) {
      // Fallback to defaults if localStorage is corrupted
      console.warn("Failed to load nebula colors from localStorage", e);
    }
    return DEFAULT_COLORS;
  });

  // Memoize color change handler
  const handleColorsChange = useCallback((colors: {
    gasColor1: [number, number, number];
    gasColor2: [number, number, number];
    backgroundColor: [number, number, number];
  }) => {
    setNebulaColors(colors);
  }, []);

  return (
    <main className="min-h-screen w-full select-none" style={{ willChange: "contents" }}>
      {/* Living Nebula Background */}
      <LivingNebulaShader colors={nebulaColors} />
      
      {/* Color Settings */}
      <NebulaColorSettings onColorsChange={handleColorsChange} />
      
      {/* Fixed logo at top center */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 p-4" style={{ willChange: "transform" }}>
        <Image
          src={strologo}
          alt="Stro Logo"
          className="w-auto h-auto max-w-[162px] sm:max-w-[203px] md:max-w-[243px]"
          priority
          loading="eager"
        />
      </div>
      <VerticalImageStack />
    </main>
  )
}


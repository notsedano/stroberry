"use client";

import { useState, useEffect } from "react";
import { Palette, X } from "lucide-react";

type NebulaColors = {
  gasColor1: string; // Primary gas color (pink/magenta)
  gasColor2: string; // Secondary gas color (blue)
  backgroundColor: string; // Background/deep space color
};

const DEFAULT_COLORS: NebulaColors = {
  gasColor1: "#cc3366", // rgb(0.8, 0.2, 0.5) -> #cc3366
  gasColor2: "#3366e6", // rgb(0.2, 0.3, 0.9) -> #3366e6
  backgroundColor: "#00000d", // rgb(0.0, 0.0, 0.05) -> #00000d (very dark blue)
};

// Convert hex to RGB [0-1]
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0.8, 0.2, 0.5];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
};

// Convert RGB [0-1] to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export function NebulaColorSettings({
  onColorsChange,
}: {
  onColorsChange: (colors: { 
    gasColor1: [number, number, number]; 
    gasColor2: [number, number, number];
    backgroundColor: [number, number, number];
  }) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState<NebulaColors>(() => {
    if (typeof window === "undefined") return DEFAULT_COLORS;
    const saved = localStorage.getItem("nebula-colors");
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });

  useEffect(() => {
    const rgb1 = hexToRgb(colors.gasColor1);
    const rgb2 = hexToRgb(colors.gasColor2);
    const bgRgb = hexToRgb(colors.backgroundColor);
    onColorsChange({
      gasColor1: [rgb1[0], rgb1[1], rgb1[2]],
      gasColor2: [rgb2[0], rgb2[1], rgb2[2]],
      backgroundColor: [bgRgb[0], bgRgb[1], bgRgb[2]],
    });
    localStorage.setItem("nebula-colors", JSON.stringify(colors));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors]);

  const handleColorChange = (key: keyof NebulaColors, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
  };

  const resetColors = () => {
    setColors(DEFAULT_COLORS);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-200 shadow-lg"
        aria-label="Color Settings"
      >
        <Palette className="h-5 w-5" />
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/20 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium text-sm">Color Settings</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Primary Gas Color */}
            <div>
              <label className="block text-white/80 text-xs mb-2 font-medium">
                Primary Gas
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.gasColor1}
                  onChange={(e) => handleColorChange("gasColor1", e.target.value)}
                  className="h-10 w-20 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={colors.gasColor1}
                  onChange={(e) => handleColorChange("gasColor1", e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                  placeholder="#cc3366"
                />
              </div>
            </div>

            {/* Secondary Gas Color */}
            <div>
              <label className="block text-white/80 text-xs mb-2 font-medium">
                Secondary Gas
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.gasColor2}
                  onChange={(e) => handleColorChange("gasColor2", e.target.value)}
                  className="h-10 w-20 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={colors.gasColor2}
                  onChange={(e) => handleColorChange("gasColor2", e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                  placeholder="#3366e6"
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-white/80 text-xs mb-2 font-medium">
                Background
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colors.backgroundColor}
                  onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                  className="h-10 w-20 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={colors.backgroundColor}
                  onChange={(e) => handleColorChange("backgroundColor", e.target.value)}
                  className="flex-1 h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-white/30"
                  placeholder="#00000d"
                />
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetColors}
              className="w-full h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors border border-white/10"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}
    </>
  );
}


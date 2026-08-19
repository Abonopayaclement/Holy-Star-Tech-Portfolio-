"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

export interface ScreenshotItem {
  title?: string;
  subtitle?: string;
  aspect?: string;
  imagePath: string;
}

interface InterfaceGalleryProps {
  screenshots: ScreenshotItem[];
}

export function InterfaceGallery({ screenshots }: InterfaceGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const activeImage = selectedIndex !== null ? screenshots[selectedIndex] : null;

  const handleNext = useCallback(() => {
    if (selectedIndex === null || screenshots.length <= 1) return;
    setSelectedIndex((prev) => (prev! + 1) % screenshots.length);
  }, [selectedIndex, screenshots.length]);

  const handlePrev = useCallback(() => {
    if (selectedIndex === null || screenshots.length <= 1) return;
    setSelectedIndex((prev) => (prev! - 1 + screenshots.length) % screenshots.length);
  }, [selectedIndex, screenshots.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, handleNext, handlePrev]);

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md space-y-4">
      <h2 className="text-xl font-bold text-foreground border-b border-border/60 pb-3">
        Interface Gallery
      </h2>

      {/* Screenshot Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {screenshots.map((screen, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-accent/30 p-2.5 transition-all hover:border-indigo-500/60 hover:shadow-lg"
          >
            <div className="relative h-48 w-full overflow-hidden rounded-xl bg-black/40">
              <img
                src={screen.imagePath || "/logo.png"}
                alt={screen.title || `Interface screenshot ${idx + 1}`}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm border border-white/20">
                  <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>View Full Image</span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-indigo-500 transition-colors">
                  {screen.title || `Interface Screen ${idx + 1}`}
                </h4>
                {screen.subtitle && (
                  <p className="text-[11px] text-muted-foreground">{screen.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {activeImage && selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative flex max-h-[95vh] w-full max-w-5xl flex-col items-center justify-between rounded-3xl border border-white/10 bg-zinc-950/90 p-4 sm:p-6 shadow-2xl text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="flex w-full items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white">
                  {activeImage.title || "Interface Screenshot"}
                </h3>
                {activeImage.subtitle && (
                  <p className="text-xs text-white/70">{activeImage.subtitle}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {screenshots.length > 1 && (
                  <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/80">
                    {selectedIndex + 1} / {screenshots.length}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                  aria-label="Close image viewer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Main Image View Area */}
            <div className="relative my-4 flex h-[65vh] sm:h-[75vh] w-full items-center justify-center overflow-hidden">
              <img
                src={activeImage.imagePath || "/logo.png"}
                alt={activeImage.title || "Interface Screenshot"}
                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
              />

              {/* Navigation Arrows */}
              {screenshots.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:bg-black/90 hover:scale-105 transition-all shadow-lg min-h-[44px]"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:bg-black/90 hover:scale-105 transition-all shadow-lg min-h-[44px]"
                    aria-label="Next Image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Caption / Instructions */}
            <div className="flex w-full items-center justify-between border-t border-white/10 pt-3 text-[11px] font-mono text-white/60">
              <span>Use Left/Right arrows to navigate • ESC to close</span>
              <span>Full Resolution</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteConfig } from "@/config/site";

const profilePhotos = [
  {
    id: 1,
    src: "/uploads/images/12.jpeg",
    badge: "Software & Mobile Application Developer",
    caption: "Building Scalable Digital Solutions",
    cropPosition: "object-[center_10%]",
  },
  {
    id: 2,
    src: "/uploads/images/14.jpeg",
    badge: "Software Engineering & Hardware Tech",
    caption: "Integrating Software & Systems Engineering",
    cropPosition: "object-[center_10%]",
  },
  {
    id: 3,
    src: "/uploads/images/18.jpeg",
    badge: "Kumasi Technical University Scholar",
    caption: "HND Computer Science Tertiary Studies",
    cropPosition: "object-[center_8%]",
  },
  {
    id: 4,
    src: "/uploads/images/5.jpeg",
    badge: "Computer Hardware Engineering Specialist",
    caption: "Practical Diagnostics & Hardware Engineering",
    cropPosition: "object-[center_15%]",
  },
  {
    id: 5,
    src: "/uploads/images/13.jpeg",
    badge: "Software Architecture & Systems Design",
    caption: "Modern Technical Systems Architecture",
    cropPosition: "object-[center_10%]",
  },
  {
    id: 6,
    src: "/uploads/images/6.jpeg",
    badge: "KtU COMPSSA Community Leader",
    caption: "Campus Project Building & Leadership",
    cropPosition: "object-[center_10%]",
  },
  {
    id: 7,
    src: "/uploads/images/15.jpeg",
    badge: "Collaborative Software Engineering",
    caption: "Available for Projects & Engineering Collaboration",
    cropPosition: "object-[center_15%]",
  },
];

export function AboutProfileCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % profilePhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isHovered]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % profilePhotos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + profilePhotos.length) % profilePhotos.length);
  };

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-indigo-500/40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Photo Stage with 7-image smooth cross-fade */}
      <div className="relative h-[380px] sm:h-[440px] lg:h-[480px] w-full overflow-hidden bg-zinc-950">
        {profilePhotos.map((photo, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={photo.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              <img
                src={photo.src}
                alt={`${siteConfig.author} - ${photo.badge}`}
                className={`h-full w-full object-cover ${photo.cropPosition} transition-transform duration-700 group-hover:scale-105`}
              />
              {/* Subtle gradient overlay to ensure text contrast without obscuring faces */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            </div>
          );
        })}

        {/* Navigation Arrows (Visible on hover / touch) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex justify-between px-3 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous photo"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-white backdrop-blur-md transition-all hover:bg-indigo-600 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next photo"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-white backdrop-blur-md transition-all hover:bg-indigo-600 hover:scale-110 active:scale-95 min-h-[44px] min-w-[44px]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Badge & Details Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6 space-y-1.5 z-20">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-block rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 font-mono text-[10px] sm:text-xs font-bold text-emerald-400 backdrop-blur-md">
              {profilePhotos[currentIndex].badge}
            </span>
            <span className="font-mono text-[11px] font-semibold text-amber-400/90 backdrop-blur-xs">
              0{currentIndex + 1} / 0{profilePhotos.length}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm">
            {siteConfig.author}
          </h3>
          <p className="text-xs text-zinc-300 drop-shadow-xs">
            {profilePhotos[currentIndex].caption} — Bolgatanga, Upper East Region, Ghana
          </p>

          {/* Indicator Dots Bar */}
          <div className="flex items-center gap-1.5 pt-2">
            {profilePhotos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentIndex ? "w-6 bg-emerald-400" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

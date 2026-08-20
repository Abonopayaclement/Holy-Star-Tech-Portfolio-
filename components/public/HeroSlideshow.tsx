"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteConfig } from "@/config/site";

interface HeroSlideshowProps {
  authorName?: string;
}

const heroPhotos = [
  {
    src: "/uploads/images/18.jpeg",
    title: "Abonopaya Clement Ayebono",
    subtitle: "Software Engineer & Developer",
  },
  {
    src: "/uploads/images/12.jpeg",
    title: "COMPSSA Engineering Lead",
    subtitle: "Computer Science Association, KsTU",
  },
  {
    src: "/uploads/images/6.jpeg",
    title: "Web & Mobile App Developer",
    subtitle: "Bolgatanga, Upper East Region, Ghana",
  },
  {
    src: "/uploads/images/14.jpeg",
    title: "Full-Stack Software Engineering",
    subtitle: "Python • Java • JavaScript • Android",
  },
];

export function HeroSlideshow({ authorName }: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroPhotos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % heroPhotos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + heroPhotos.length) % heroPhotos.length);
  };

  const activePhoto = heroPhotos[currentIndex];

  return (
    <div className="w-full max-w-md lg:max-w-lg shrink-0">
      <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl backdrop-blur-md">
        {/* Photo Container */}
        <div className="relative h-[420px] w-full overflow-hidden bg-zinc-950">
          {heroPhotos.map((photo, idx) => (
            <div
              key={photo.src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
            >
              <img
                src={photo.src}
                alt={photo.title}
                className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>
          ))}

          {/* Navigation Controls */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Photo"
            className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Photo"
            className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-black/70"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicator Dots */}
          <div className="absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {heroPhotos.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-6 bg-amber-500" : "w-1.5 bg-white/50"
                  }`}
              />
            ))}
          </div>

          {/* Bottom Caption Overlay */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-5 space-y-1 bg-gradient-to-t from-black/90 to-transparent">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">
                {authorName || siteConfig.author}
              </h3>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                ● Available
              </span>
            </div>
            <p className="text-xs text-zinc-300 line-clamp-1">{activePhoto.subtitle}</p>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="p-4 space-y-2 border-t border-border/60 text-xs bg-card">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Engineering Focus:</span>
            <span className="font-semibold text-foreground">Web & Mobile Development</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Primary Stack:</span>
            <span className="font-mono font-semibold text-indigo-500">Python • Java • JS • Android</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";

const heroSlides = [
  {
    id: 1,
    image: "/uploads/images/18.jpeg",
    badge: "Software Engineer",
    title: "Software Engineer Building Practical Digital Solutions",
    description:
      "Developing reliable, scalable, and high-performance web & mobile applications for real-world impact.",
    cropPosition: "object-[center_8%]",
  },
  {
    id: 2,
    image: "/uploads/images/12.jpeg",
    badge: "Web & Mobile Lead",
    title: "Web & Mobile Application Developer",
    description:
      "Crafting modern web platforms and native Android mobile utilities with clean code architecture and seamless user experiences.",
    cropPosition: "object-[center_10%]",
  },
  {
    id: 3,
    image: "/uploads/images/6.jpeg",
    badge: "Computer Science Scholar",
    title: "Passionate Computer Science Student Creating Modern Software",
    description:
      "Blending practical computer hardware knowledge with software engineering at Kumasi Technical University.",
    cropPosition: "object-[center_10%]",
  },
];

export function HomeHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <section className="relative overflow-hidden pt-6 pb-12 md:pt-10 md:pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="group relative overflow-hidden rounded-3xl border border-indigo-500/30 shadow-2xl transition-all duration-500">
          {/* Background Images Container with Smooth Cross-Fade */}
          <div className="relative h-[520px] sm:h-[580px] lg:h-[640px] w-full overflow-hidden bg-slate-950">
            {heroSlides.map((slide, idx) => {
              const isActive = idx === currentSlide;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 z-0 pointer-events-none"
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className={`h-full w-full object-cover ${slide.cropPosition} transition-transform duration-700`}
                  />
                  {/* Professional 45-50% Dark Overlay + Vignette Gradient */}
                  <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[1px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
                </div>
              );
            })}

            {/* Synchronized Content Layer */}
            <div className="relative z-20 flex h-full flex-col justify-between p-6 sm:p-10 lg:p-14 text-white">
              {/* Center Synchronized Animated Text */}
              <div className="my-auto max-w-3xl space-y-6">
                {heroSlides.map((slide, idx) => {
                  if (idx !== currentSlide) return null;
                  return (
                    <div
                      key={slide.id}
                      className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out"
                    >
                      <div className="inline-block rounded-full bg-indigo-500/20 border border-indigo-500/40 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-indigo-300 backdrop-blur-md">
                        {slide.badge}
                      </div>

                      <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-[1.12] drop-shadow-md">
                        {slide.title}
                      </h1>

                      <p className="max-w-2xl text-base sm:text-lg text-zinc-200/90 leading-relaxed drop-shadow-xs">
                        {slide.description}
                      </p>
                    </div>
                  );
                })}

                {/* Hero Call To Actions & Integrated Author Name */}
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <div className="inline-flex items-center rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-3.5 text-xs font-mono font-bold text-amber-300 backdrop-blur-md min-h-[48px]">
                    <span>{siteConfig.author}</span>
                  </div>

                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3.5 text-xs font-semibold text-slate-950 shadow-xl transition-all hover:scale-105 min-h-[48px]"
                  >
                    <span>View Projects</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-6 py-3.5 text-xs font-semibold text-white backdrop-blur-md transition-all min-h-[48px]"
                  >
                    <Mail className="h-4 w-4 text-amber-400" />
                    <span>Get In Touch</span>
                  </Link>
                </div>
              </div>

              {/* Bottom Controls Row: Arrows & Slide Progress Indicators */}
              <div className="flex items-center justify-between border-t border-white/15 pt-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-amber-400">
                    0{currentSlide + 1} / 0{heroSlides.length}
                  </span>
                  <div className="flex gap-2">
                    {heroSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-2 rounded-full transition-all duration-500 ${
                          i === currentSlide ? "w-8 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous Slide"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next Slide"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 active:scale-95 min-h-[44px] min-w-[44px]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

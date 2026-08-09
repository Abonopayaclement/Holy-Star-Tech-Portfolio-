import * as React from "react";
import { Sparkles } from "lucide-react";

interface PageHeaderBannerProps {
  badge?: string;
  title: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  overlayOpacity?: string;
  cropPosition?: string;
  gradientClass?: string;
  align?: "left" | "center";
  size?: "default" | "compact";
  children?: React.ReactNode;
  className?: string;
}

export function PageHeaderBanner({
  badge,
  title,
  description,
  imageSrc,
  imageAlt = "Header background image",
  overlayOpacity = "bg-slate-950/70",
  cropPosition = "object-center",
  gradientClass,
  align = "center",
  size = "default",
  children,
  className = "",
}: PageHeaderBannerProps) {
  const isCenter = align === "center";
  const isCompact = size === "compact";
  const defaultGradient = "bg-gradient-to-br from-slate-950 via-indigo-950/80 to-slate-900";
  const activeGradient = gradientClass || defaultGradient;

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-indigo-500/30 shadow-xl transition-all duration-500 hover:border-indigo-500/50 ${className}`}
    >
      {/* Background Container: Photo OR Gradient */}
      {imageSrc ? (
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt}
            className={`h-full w-full object-cover ${cropPosition} transition-transform duration-700 group-hover:scale-105`}
          />
          {/* Dark Overlay */}
          <div className={`absolute inset-0 z-10 ${overlayOpacity} backdrop-blur-[2px]`} />
          {/* Subtle Gradient vignette for premium readability */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        </div>
      ) : (
        <div className={`absolute inset-0 z-0 ${activeGradient}`}>
          {/* Abstract Cyber Grid & Ambient Glow Accents */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-3xl opacity-80" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
        </div>
      )}

      {/* Content Layer */}
      <div
        className={`relative z-20 flex flex-col ${
          isCenter ? "items-center text-center" : "items-start text-left"
        } ${
          isCompact
            ? "py-7 px-5 sm:py-9 sm:px-8 lg:py-11 lg:px-10"
            : "py-8 px-6 sm:py-12 sm:px-10 lg:py-14 lg:px-12"
        }`}
      >
        {badge && (
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md mb-3 px-3.5 py-1 text-xs`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="font-mono font-semibold uppercase tracking-wider text-amber-400">
              {badge}
            </span>
          </div>
        )}

        <h1
          className={`font-extrabold tracking-tight text-white drop-shadow-md leading-[1.15] max-w-4xl text-2xl sm:text-3xl lg:text-4xl`}
        >
          {title}
        </h1>

        {description && (
          <p
            className={`max-w-2xl text-zinc-200/90 leading-relaxed drop-shadow-xs mt-3 text-xs sm:text-sm lg:text-base`}
          >
            {description}
          </p>
        )}

        {children && <div className="mt-5 w-full">{children}</div>}
      </div>
    </div>
  );
}

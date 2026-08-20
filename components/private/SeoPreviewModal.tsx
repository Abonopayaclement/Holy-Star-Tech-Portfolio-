"use client";

import React, { useState } from "react";
import {
  Search,
  X,
} from "lucide-react";
import { FaTwitter, FaFacebook } from "react-icons/fa";

interface SeoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  slug: string;
  image?: string;
  type?: "article" | "project";
}

export function SeoPreviewModal({
  isOpen,
  onClose,
  title,
  description,
  slug,
  image = "/logo.png",
  type = "article",
}: SeoPreviewModalProps) {
  const [activePreview, setActivePreview] = useState<"google" | "twitter" | "facebook">("google");

  if (!isOpen) return null;

  const baseUrl = "https://holystar.tech";
  const fullUrl = `${baseUrl}/${type === "article" ? "blog" : "projects"}/${slug || "preview-slug"}`;
  const displayTitle = title || "Untitled Page Title";
  const displayDesc =
    description ||
    "Add a compelling meta description to optimize search engine ranking and social sharing click-through rates.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-border/60 p-5 bg-accent/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 font-bold">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                SEO & Open Graph Live Preview
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time preview for search engines and social platforms
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* PREVIEW SWITCHER TABS */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-accent/30 p-3">
          <button
            type="button"
            onClick={() => setActivePreview("google")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activePreview === "google"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="h-3.5 w-3.5 text-blue-500" /> Google Search
          </button>

          <button
            type="button"
            onClick={() => setActivePreview("twitter")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activePreview === "twitter"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FaTwitter className="h-3.5 w-3.5 text-cyan-400" /> X (Twitter) Card
          </button>

          <button
            type="button"
            onClick={() => setActivePreview("facebook")}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activePreview === "facebook"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FaFacebook className="h-3.5 w-3.5 text-blue-600" /> Facebook OG
          </button>
        </div>

        {/* MODAL BODY PREVIEW AREA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. GOOGLE SEARCH SNIPPET */}
          {activePreview === "google" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Google SERP Snippet Preview
              </label>

              <div className="rounded-2xl border border-border/80 bg-background p-5 shadow-xs font-sans text-left space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                  <div className="h-4 w-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-500 font-bold">
                    H
                  </div>
                  <span className="text-xs text-foreground font-semibold">Holy Star Tech</span>
                  <span className="text-muted-foreground">› {type === "article" ? "blog" : "projects"}</span>
                </div>
                <h4 className="text-lg font-normal text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer truncate">
                  {displayTitle} | Holy Star Tech
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
                  {displayDesc}
                </p>
              </div>
            </div>
          )}

          {/* 2. TWITTER / X CARD */}
          {activePreview === "twitter" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Twitter Summary Large Image Card Preview
              </label>

              <div className="overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-md">
                <div className="h-44 w-full overflow-hidden bg-accent/40 relative">
                  <img
                    src={image}
                    alt={displayTitle}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white">
                    holystar.tech
                  </div>
                </div>
                <div className="p-4 space-y-1 bg-background">
                  <span className="text-[11px] font-mono uppercase text-muted-foreground">
                    holystar.tech
                  </span>
                  <h4 className="text-sm font-bold text-foreground line-clamp-1">
                    {displayTitle}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {displayDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. FACEBOOK / LINKEDIN OPEN GRAPH CARD */}
          {activePreview === "facebook" && (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Facebook / LinkedIn Open Graph Card
              </label>

              <div className="overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-md">
                <div className="h-44 w-full overflow-hidden bg-accent/40">
                  <img
                    src={image}
                    alt={displayTitle}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-1 bg-background border-t border-border/60">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    HOLYSTAR.TECH
                  </span>
                  <h4 className="text-sm font-bold text-foreground line-clamp-1">
                    {displayTitle}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {displayDesc}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* METADATA DIAGNOSTICS */}
          <div className="rounded-2xl border border-border/60 bg-accent/40 p-4 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Canonical Target URL:</span>
              <span className="text-indigo-500 truncate max-w-[280px]">{fullUrl}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Title Length:</span>
              <span className={displayTitle.length <= 60 ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                {displayTitle.length} / 60 chars (Optimal)
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Description Length:</span>
              <span className={displayDesc.length <= 160 ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                {displayDesc.length} / 160 chars (Optimal)
              </span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-end border-t border-border/60 p-4 bg-accent/20">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/60 bg-background px-5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            Close SEO Tool
          </button>
        </div>
      </div>
    </div>
  );
}

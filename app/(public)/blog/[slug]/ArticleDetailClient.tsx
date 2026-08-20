"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  FolderGit2,
  Share2,
} from "lucide-react";
import { PromotionKitModal } from "@/components/shared/PromotionKitModal";
import { EngagementSection } from "@/components/public/EngagementSection";
import { siteConfig } from "@/config/site";

export interface RelatedPost {
  id: string;
  slug: string;
  title: string;
  category?: string;
  date?: string;
}

export interface RelatedProject {
  id?: string;
  slug: string;
  title: string;
  categoryType: string;
  description: string;
}

interface ArticleDetailClientProps {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    readTime: string;
    date: string;
    fullUrl: string;
    heroImage: string | null;
    images: string[];
  };
  relatedPosts: RelatedPost[];
  relatedProjects: RelatedProject[];
}

export function ArticleDetailClient({
  post,
  relatedPosts,
  relatedProjects,
}: ArticleDetailClientProps) {
  const [promoKitOpen, setPromoKitOpen] = useState(false);

  return (
    <div className="relative overflow-hidden pt-10 pb-24">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* BACK NAVIGATION BAR & PROMOTION KIT TRIGGER */}
        <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[40px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to All Posts</span>
          </Link>

          <button
            type="button"
            onClick={() => setPromoKitOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all min-h-[40px]"
          >
            <Share2 className="h-4 w-4" />
            <span>Social Promotion Kit</span>
          </button>
        </div>

        {/* ARTICLE HEADER */}
        <div className="space-y-6 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-mono text-xs font-bold text-indigo-500">
              {post.category || "Architecture"}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {post.date}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15]">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>

          {/* AUTHOR BADGE & SOCIAL SHARE BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/40">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800 bg-white p-0.5 shadow-xs">
                <img src="/logo.png" alt="HST Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">{siteConfig.author}</p>
                <p className="text-[11px] text-muted-foreground">Software Engineer & Developer</p>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-muted-foreground hidden sm:inline">Share:</span>
              
              {/* WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + " - " + post.fullUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 px-2.5 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-semibold text-emerald-500 hover:bg-emerald-500/20 transition-all"
                title="Share to WhatsApp"
              >
                WhatsApp
              </a>

              {/* Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.fullUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 px-2.5 items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-[11px] font-semibold text-blue-500 hover:bg-blue-500/20 transition-all"
                title="Share to Facebook"
              >
                Facebook
              </a>

              {/* LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(post.fullUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 px-2.5 items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-[11px] font-semibold text-sky-500 hover:bg-sky-500/20 transition-all"
                title="Share to LinkedIn"
              >
                LinkedIn
              </a>

              {/* X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(post.fullUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 px-2.5 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2 text-[11px] font-semibold text-foreground hover:bg-accent transition-all"
                title="Share to X"
              >
                X
              </a>
            </div>
          </div>
        </div>

        {/* HERO IMAGE */}
        {post.heroImage && (
          <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl h-72 sm:h-96 w-full relative">
            <img
              src={post.heroImage}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* ARTICLE CONTENT WORKSPACE */}
        <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-10 shadow-lg backdrop-blur-md prose dark:prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        {/* ATTACHED MEDIA GALLERY */}
        {post.images && post.images.length > 1 && (
          <div className="space-y-4 rounded-3xl border border-border/80 bg-card p-6 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Post Media & Gallery
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {post.images.slice(1).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="h-32 overflow-hidden rounded-2xl border border-border/60 bg-zinc-100 dark:bg-zinc-900"
                >
                  <img
                    src={imgUrl}
                    alt={`Illustration ${idx + 1}`}
                    className="h-full w-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIKES & COMMENTS ENGAGEMENT SECTION */}
        <EngagementSection targetType="BLOG" slug={post.slug} itemTitle={post.title} />

        {/* -------------------------------------------------------- */}
        {/* RELATED CONTENT SECTION */}
        {/* -------------------------------------------------------- */}
        <div className="pt-12 border-t border-border/60 space-y-10">
          {/* RELATED ARTICLES */}
          {relatedPosts && relatedPosts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-foreground">Related Posts</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/blog/${rel.slug}`}
                    className="group rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:border-indigo-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                        {rel.category || "Architecture"}
                      </span>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-500 transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/40">
                      <span>{rel.date}</span>
                      <span className="text-indigo-500 font-semibold flex items-center gap-0.5">
                        Read <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* RELATED PROJECTS */}
          {relatedProjects && relatedProjects.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-foreground">Related Software Projects</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {relatedProjects.map((proj) => (
                  <Link
                    key={proj.id}
                    href={`/projects/${proj.slug}`}
                    className="group rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:border-indigo-500/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                        {proj.categoryType}
                      </span>
                      <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-500 transition-colors">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {proj.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-500 pt-2 border-t border-border/40">
                      <span>Explore Project Specs</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PROMOTION KIT MODAL */}
      <PromotionKitModal
        isOpen={promoKitOpen}
        onClose={() => setPromoKitOpen(false)}
        title={post.title}
        excerpt={post.excerpt}
        url={post.fullUrl}
        image={post.heroImage || undefined}
      />
    </div>
  );
}

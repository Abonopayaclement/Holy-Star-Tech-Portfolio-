"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { PageHeaderBanner } from "@/components/shared/PageHeaderBanner";
import { CardEngagement } from "@/components/public/CardEngagement";
import { BlogPostRecord } from "@/actions/blog";

export interface DisplayArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
  images?: string[];
  likesCount?: number;
  commentsCount?: number;
}

const ITEMS_PER_PAGE = 6;

interface BlogListClientProps {
  initialArticles: BlogPostRecord[];
}

export function BlogListClient({ initialArticles }: BlogListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  const mappedArticles: DisplayArticle[] = initialArticles.map((p) => ({
    id: p.id || p.slug,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    date: new Date(p.publishedAt || p.createdAt || Date.now()).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    readTime: p.readTime || "3 min read",
    category: p.category || "General",
    featured: p.featured,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    likesCount: p.likesCount ?? 0,
    commentsCount: p.commentsCount ?? 0,
  }));

  // Dynamically compute all unique categories present in the articles
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        mappedArticles
          .map((a) => a.category?.trim())
          .filter(Boolean)
      )
    ).sort();
    return ["All", ...unique];
  }, [mappedArticles]);

  // Filter articles by Search Query & Category
  const filteredArticles = mappedArticles.filter((article) => {
    const matchesCategory =
      selectedCategory === "All" || article.category === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="relative overflow-hidden pt-12 pb-24">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-amber-500/10 via-indigo-500/15 to-cyan-500/10 blur-3xl opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PageHeaderBanner
          badge="Development Journal"
          title="Software Engineering Blog"
          description="In-depth tutorials, system design breakdowns, and technical posts on full-stack web development."
          imageSrc="/uploads/images/30.jpeg"
          imageAlt="Software Engineering Blog"
          overlayOpacity="bg-slate-950/75"
          align="center"
          size="compact"
          cropPosition="object-[center_18%]"
        />

        {/* SEARCH BAR & CATEGORY PILLS CONTROL BAR */}
        <div className="mt-10 space-y-6">
          {/* SEARCH INPUT */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Instant search posts by title, category, or content..."
              className="w-full rounded-2xl border border-border/80 bg-background/90 pl-11 pr-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-indigo-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* CATEGORY FILTER PILLS */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all min-h-[38px] ${
                    isActive
                      ? "bg-foreground text-background shadow-md scale-105"
                      : "border border-border/60 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ARTICLES GRID */}
        {paginatedArticles.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-border/60 bg-card p-12 text-center text-muted-foreground space-y-3">
            <BookOpen className="mx-auto h-12 w-12 text-amber-500 opacity-80" />
            <h3 className="text-lg font-bold text-foreground">No Posts Found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search query or category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="mt-2 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedArticles.map((article) => {
              const firstImage =
                article.images && article.images.length > 0
                  ? article.images[0]
                  : null;

              return (
                <div
                  key={article.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-md transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="space-y-4">
                    {/* COVER / MEDIA PREVIEW */}
                    {firstImage && (
                      <div className="h-44 w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 relative">
                        <img
                          src={firstImage}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                        {article.category}
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {article.readTime}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-foreground group-hover:text-indigo-500 transition-colors line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 space-y-3">
                    {/* Instant engagement bar */}
                    <CardEngagement
                      targetType="BLOG"
                      slug={article.slug}
                      itemTitle={article.title}
                      initialLikes={article.likesCount}
                      initialComments={article.commentsCount}
                    />

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {article.date}
                      </span>
                      <Link
                        href={`/blog/${article.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                      >
                        <span>Read More</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION CONTROL BAR */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground disabled:opacity-40 hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-xs font-mono font-semibold text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background text-foreground disabled:opacity-40 hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

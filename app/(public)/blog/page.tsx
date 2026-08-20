"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  Search,
} from "lucide-react";
import { PageHeaderBanner } from "@/components/shared/PageHeaderBanner";
import { getBlogPosts, BlogPostRecord } from "@/actions/blog";
import { QuickCommentModal } from "@/components/public/QuickCommentModal";
import { getPublicEngagement, toggleLike } from "@/actions/engagement";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
  images?: string[];
}

const fallbackArticles: Article[] = [
  {
    id: "1",
    slug: "my-journey-into-software-engineering",
    title: "My Journey into Software Engineering",
    excerpt:
      "From computer hardware fundamentals to building full-stack web and mobile applications—reflections on learning Python, Java, JavaScript, React, and Android Studio.",
    date: "August 6, 2026",
    readTime: "3 min read",
    category: "Career & Growth",
    featured: true,
  },
  {
    id: "2",
    slug: "building-the-hostel-management-system",
    title: "Building the Hostel Management System",
    excerpt:
      "A technical walkthrough of designing a student hostel accommodation management system for room slot allocations, occupant records, and payment status checks.",
    date: "August 4, 2026",
    readTime: "3 min read",
    category: "Web Development",
    featured: true,
  },
  {
    id: "3",
    slug: "developing-the-compssa-management-system",
    title: "Developing the COMPSSA Management System",
    excerpt:
      "How I built a digital student management portal for Computer Science student association records, course document distribution, and departmental announcements.",
    date: "July 28, 2026",
    readTime: "3 min read",
    category: "Web Development",
    featured: true,
  },
  {
    id: "4",
    slug: "learning-react-and-nextjs",
    title: "Learning React and Next.js",
    excerpt:
      "Insights and practical takeaways from transitioning from vanilla JavaScript into component-driven React interfaces and Next.js App Router applications.",
    date: "July 20, 2026",
    readTime: "3 min read",
    category: "Web Development",
  },
  {
    id: "5",
    slug: "my-journey-learning-mobile-application-development",
    title: "My Journey Learning Mobile Application Development",
    excerpt:
      "Exploring native Android application development in Android Studio using Java, XML layouts, and network statistics APIs.",
    date: "July 12, 2026",
    readTime: "3 min read",
    category: "Mobile Development",
  },
];

const categories = ["All", "Career & Growth", "Web Development", "Mobile Development", "Learning & Notes"] as const;
const ITEMS_PER_PAGE = 6;

export default function BlogPage() {
  const [dbArticles, setDbArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function loadDbPosts() {
      try {
        const posts = await getBlogPosts();
        if (posts && posts.length > 0) {
          const mapped: Article[] = posts.map((p: BlogPostRecord) => ({
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
            category: p.category || "Development",
            featured: p.featured,
            images: Array.isArray(p.images) ? (p.images as string[]) : [],
          }));
          setDbArticles(mapped);
        }
      } catch (err) {
        console.error("Failed to load db blog posts:", err);
      }
    }
    loadDbPosts();
  }, []);

  const articlesToDisplay = dbArticles.length > 0 ? dbArticles : fallbackArticles;

  // Filter articles by Search Query & Category
  const filteredArticles = articlesToDisplay.filter((article) => {
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
          gradientClass="bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-900"
          align="center"
          size="compact"
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
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedArticles.map((article) => (
              <div
                key={article.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-md transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl"
              >
                <div className="space-y-4">
                  {/* COVER / MEDIA PREVIEW */}
                  {article.images && article.images.length > 0 ? (
                    <div className="h-44 w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 relative">
                      <img
                        src={article.images[0]}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                      {article.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground group-hover:text-indigo-500 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>

                {/* CARD ENGAGEMENT BAR (LIKES & COMMENTS) */}
                <div className="pt-4 mt-4 border-t border-border/60">
                  <BlogCardEngagement slug={article.slug} title={article.title} />
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 border-t border-border/40 mt-4">
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
            ))}
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

function getVisitorId(): string {
  if (typeof window === "undefined") return "anon_visitor";
  try {
    let vid = localStorage.getItem("ht_visitor_id");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
      localStorage.setItem("ht_visitor_id", vid);
    }
    return vid;
  } catch {
    return "v_" + Math.random().toString(36).substring(2, 11);
  }
}

function BlogCardEngagement({ slug, title }: { slug: string; title: string }) {
  const [likes, setLikes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  const loadEngagement = async () => {
    try {
      const vid = getVisitorId();
      const res = await getPublicEngagement("BLOG", slug, vid);
      setLikes(res.totalLikes);
      setCommentsCount(res.totalComments);
      setHasLiked(res.hasLiked);
    } catch (e) {
      console.error("Failed to load blog engagement:", e);
    }
  };

  useEffect(() => {
    loadEngagement();
  }, [slug]);

  const handleLike = async () => {
    const vid = getVisitorId();
    const newLikedState = !hasLiked;
    setHasLiked(newLikedState);
    setLikes((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    const res = await toggleLike({ targetType: "BLOG", slug, visitorId: vid });
    if (res.success) {
      await loadEngagement();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between font-mono text-xs">
        <button
          type="button"
          onClick={handleLike}
          aria-label="Like post"
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all active:scale-95 min-h-[34px] ${
            hasLiked
              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-500 font-bold"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 ${hasLiked ? "fill-emerald-500 text-emerald-500" : "text-emerald-500"}`} />
          <span>{likes} Likes</span>
        </button>

        <button
          type="button"
          onClick={() => setCommentModalOpen(true)}
          aria-label="Comment on post"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-95 min-h-[34px]"
        >
          <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
          <span>{commentsCount} Comments</span>
        </button>
      </div>

      <QuickCommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        targetType="BLOG"
        slug={slug}
        itemTitle={title}
        onSuccess={loadEngagement}
      />
    </>
  );
}

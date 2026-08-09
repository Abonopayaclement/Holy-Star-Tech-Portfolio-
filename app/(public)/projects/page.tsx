"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FolderGit2,
  Github,
  Heart,
  MessageSquare,
  Search,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { PageHeaderBanner } from "@/components/shared/PageHeaderBanner";
import { projectsData } from "@/constants/projects";
import { getProjects } from "@/actions/projects";
import { QuickCommentModal } from "@/components/public/QuickCommentModal";
import { getPublicEngagement, toggleLike } from "@/actions/engagement";

interface DisplayProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  categoryType: string;
  status?: string;
  featured?: boolean;
  featuredImage?: string | null;
  gradient?: string;
  techStack: string[];
  githubUrl?: string | null;
  liveUrl?: string | null;
  apkUrl?: string | null;
}

const categories = [
  "All",
  "Web Applications",
  "Academic Projects",
  "Mobile Applications",
  "AI Projects",
  "Business Projects",
] as const;

const ITEMS_PER_PAGE = 6;

export default function ProjectsPage() {
  const [dbProjects, setDbProjects] = useState<DisplayProject[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    async function loadDbProjects() {
      try {
        const data = await getProjects();
        if (data && data.length > 0) {
          const categoryNames: Record<string, string> = {
            MOBILE_APP: "Mobile Applications",
            ACADEMIC: "Academic Projects",
            AI_PROJECT: "AI Projects",
            BUSINESS: "Business Projects",
            OTHER: "Other Projects",
            WEB_APP: "Web Applications",
          };

          const mapped: DisplayProject[] = data.map((p: any) => {
            const catName = categoryNames[p.categoryType] || "Web Applications";

            return {
              id: p.id,
              slug: p.slug,
              title: p.title,
              description: p.description,
              category: catName,
              categoryType: p.categoryType,
              featured: p.featured,
              featuredImage: (p as any).featuredImage,
              gradient: p.gradient || "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
              techStack: Array.isArray(p.techStack) ? (p.techStack as string[]) : [],
              githubUrl: p.githubUrl,
              liveUrl: p.liveUrl,
              apkUrl: p.apkUrl,
              status: (p as any).status || "Completed",
            };
          });
          setDbProjects(mapped);
        }
      } catch (err) {
        console.error("Failed to load db projects:", err);
      }
    }
    loadDbProjects();
  }, []);

  const allProjects = dbProjects.length > 0 ? dbProjects : (projectsData as any);

  // Filter projects by Search Query & Category
  const filteredProjects = allProjects.filter((p: DisplayProject) => {
    const matchesCategory =
      activeCategory === "All" || p.category === activeCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.techStack.some((tech) => tech.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  // Pagination Math
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
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
          badge="Portfolio Showcase"
          title="Engineering Projects & Systems"
          description="Explore a curated showcase of web applications, mobile platforms, UI/UX systems, academic software, and technical solutions."
          gradientClass="bg-gradient-to-br from-slate-950 via-indigo-950/90 to-cyan-950/80"
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
              placeholder="Instant search by title, tech stack, or description..."
              className="w-full rounded-2xl border border-border/80 bg-background/90 pl-11 pr-4 py-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:border-indigo-500 focus:outline-hidden transition-colors"
            />
          </div>

          {/* CATEGORY FILTER PILLS */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
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

        {/* PROJECTS GRID */}
        {paginatedProjects.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-border/60 bg-card p-12 text-center text-muted-foreground space-y-3">
            <FolderGit2 className="mx-auto h-12 w-12 text-amber-500 opacity-80" />
            <h3 className="text-lg font-bold text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search query or category filter.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProjects.map((project: DisplayProject) => (
              <div
                key={project.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-md transition-all duration-300 hover:border-indigo-500/40 hover:shadow-xl"
              >
                <div className="space-y-4">
                  {/* COVER IMAGE */}
                  {project.featuredImage ? (
                    <div className="h-48 w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 relative">
                      <img
                        src={project.featuredImage}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                      <FolderGit2 className="h-12 w-12 text-indigo-500/60" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                        {project.category}
                      </span>
                      {project.status === "In Progress" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          In Progress
                        </span>
                      )}
                      {project.status === "Archived" && (
                        <span className="rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-zinc-500">
                          Archived
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-indigo-500 transition-colors">
                      {project.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* TECH BADGES */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.techStack.map((tech: string) => (
                      <span
                        key={tech}
                        className="rounded-md border border-border/60 bg-accent/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CARD ENGAGEMENT BAR (LIKES & COMMENTS) */}
                <div className="pt-4 mt-4 border-t border-border/60">
                  <ProjectCardEngagement slug={project.slug} title={project.title} />
                </div>

                {/* CARD ACTIONS */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40 mt-4">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                  >
                    <span>View Project</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>

                  <div className="flex items-center gap-2">
                    {project.categoryType === "MOBILE_APP" && project.apkUrl && (
                      <a
                        href={project.apkUrl}
                        download
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>APK</span>
                      </a>
                    )}

                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-all"
                        title="Live Demo"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}

                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent transition-all"
                        title="GitHub Repository"
                      >
                        <Github className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
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

function ProjectCardEngagement({ slug, title }: { slug: string; title: string }) {
  const [likes, setLikes] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  const loadEngagement = async () => {
    try {
      const vid = getVisitorId();
      const res = await getPublicEngagement("PROJECT", slug, vid);
      setLikes(res.totalLikes);
      setCommentsCount(res.totalComments);
      setHasLiked(res.hasLiked);
    } catch (e) {
      console.error("Failed to load project engagement:", e);
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

    const res = await toggleLike({ targetType: "PROJECT", slug, visitorId: vid });
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
          aria-label="Like project"
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
          aria-label="Comment on project"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all active:scale-95 min-h-[34px]"
        >
          <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
          <span>{commentsCount} Comments</span>
        </button>
      </div>

      <QuickCommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        targetType="PROJECT"
        slug={slug}
        itemTitle={title}
        onSuccess={loadEngagement}
      />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FolderGit2,
  Github,
  Search,
} from "lucide-react";
import { PageHeaderBanner } from "@/components/shared/PageHeaderBanner";
import { CardEngagement } from "@/components/public/CardEngagement";
import { ProjectWithEngagement } from "@/actions/projects";

export interface DisplayProject {
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
  likesCount?: number;
  commentsCount?: number;
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

const categoryNames: Record<string, string> = {
  MOBILE_APP: "Mobile Applications",
  ACADEMIC: "Academic Projects",
  AI_PROJECT: "AI Projects",
  BUSINESS: "Business Projects",
  OTHER: "Other Projects",
  WEB_APP: "Web Applications",
};

interface ProjectsListClientProps {
  initialProjects: ProjectWithEngagement[];
}

export function ProjectsListClient({ initialProjects }: ProjectsListClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  const mappedProjects: DisplayProject[] = initialProjects.map((p) => {
    const catName = categoryNames[p.categoryType] || "Web Applications";
    return {
      id: p.id || p.slug,
      slug: p.slug,
      title: p.title,
      description: p.description,
      category: catName,
      categoryType: p.categoryType,
      featured: p.featured,
      featuredImage: p.featuredImage,
      gradient: p.gradient || "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
      techStack: Array.isArray(p.techStack) ? (p.techStack as string[]) : [],
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
      apkUrl: p.apkUrl,
      status: p.status || "Completed",
      likesCount: p.likesCount ?? 0,
      commentsCount: p.commentsCount ?? 0,
    };
  });

  // Filter projects by Search Query & Category
  const filteredProjects = mappedProjects.filter((p: DisplayProject) => {
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
          imageSrc="/uploads/images/15.jpeg"
          imageAlt="Engineering Projects Showcase"
          overlayOpacity="bg-slate-950/75"
          align="center"
          size="compact"
          cropPosition="object-[center_18%]"
        />

        {/* SEARCH & FILTER CONTROLS */}
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-foreground text-background shadow-md"
                      : "bg-accent/40 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Search Input Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects, stack..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-full border border-border/80 bg-background/60 py-2 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 backdrop-blur-md focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* PROJECTS GRID DISPLAY */}
        {paginatedProjects.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 p-12 text-center">
            <FolderGit2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-lg font-bold text-foreground">No projects found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              We couldn&apos;t find any engineering projects matching &ldquo;{searchQuery}&rdquo; in {activeCategory}.
            </p>
            <button
              onClick={() => {
                setActiveCategory("All");
                setSearchQuery("");
                setCurrentPage(1);
              }}
              className="mt-4 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/80 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProjects.map((project) => (
              <div
                key={project.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-md transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* HERO PREVIEW IMAGE */}
                  {project.featuredImage ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted">
                      <img
                        src={project.featuredImage}
                        alt={project.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {project.status && (
                        <span className="absolute top-2.5 right-2.5 rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                          {project.status}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br ${project.gradient} flex items-center justify-center p-6 border border-white/5`}
                    >
                      <span className="text-3xl font-extrabold tracking-wider text-white/40 select-none">
                        {project.title.substring(0, 3).toUpperCase()}
                      </span>
                      {project.status && (
                        <span className="absolute top-2.5 right-2.5 rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                          {project.status}
                        </span>
                      )}
                    </div>
                  )}

                  {/* PROJECT CATEGORY & TITLE */}
                  <div>
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-500">
                      {project.category}
                    </span>
                    <h3 className="mt-1 text-lg font-bold text-foreground leading-snug group-hover:text-amber-500 transition-colors">
                      {project.title}
                    </h3>
                  </div>

                  {/* PROJECT DESCRIPTION */}
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>

                  {/* TECH STACK TAGS */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {project.techStack.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-border/60 bg-accent/40 px-2 py-0.5 text-[10px] font-mono font-medium text-foreground"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 4 && (
                      <span className="rounded-md bg-accent/30 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        +{project.techStack.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTTOM FOOTER: ENGAGEMENT & LINKS */}
                <div className="mt-6 pt-4 border-t border-border/60 space-y-3">
                  {/* Like & Comments Bar with instant server-prefetched counts */}
                  <CardEngagement
                    targetType="PROJECT"
                    slug={project.slug}
                    itemTitle={project.title}
                    initialLikes={project.likesCount}
                    initialComments={project.commentsCount}
                  />

                  {/* ACTION BUTTONS & LINKS */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          title="View Source Code on GitHub"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          title="Open Live Application"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {project.apkUrl && (
                        <a
                          href={project.apkUrl}
                          download
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2 py-1 text-[11px] font-semibold text-indigo-500 hover:bg-indigo-500/20 transition-all"
                          title="Download Android APK"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>APK</span>
                        </a>
                      )}
                    </div>

                    <Link
                      href={`/projects/${project.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:underline"
                    >
                      <span>View Project</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION NAVIGATION CONTROLS */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-mono text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-40 disabled:pointer-events-none"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

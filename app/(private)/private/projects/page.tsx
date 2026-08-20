"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Download,
  Edit3,
  EyeOff,
  FolderGit2,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import {
  getAllProjectsAdmin,
  toggleProjectPublishStatus,
  deleteProject,
} from "@/actions/projects";
import { getDashboardEngagementSummary } from "@/actions/engagement";
import { Heart, MessageSquare } from "lucide-react";

interface ProjectItem {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  categoryType: string;
  featured: boolean;
  published: boolean;
  techStack: unknown;
  apkUrl?: string | null;
  version?: string | null;
  updatedAt: string | Date;
}

export default function PrivateProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [engagementSummary, setEngagementSummary] = useState<
    Record<string, { likes: number; comments: number; totalComments?: number; publishedComments?: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getAllProjectsAdmin();
      setProjects(data as unknown as ProjectItem[]);
      const engagement = await getDashboardEngagementSummary();
      setEngagementSummary(engagement.projectStats);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleTogglePublish = async (
    id: string,
    currentPublished: boolean,
    title: string
  ) => {
    try {
      const res = await toggleProjectPublishStatus(id, !currentPublished);
      if (res.success) {
        toast.success(
          !currentPublished
            ? `"${title}" published live!`
            : `"${title}" unpublished and saved as draft.`
        );
        fetchProjects();
      } else {
        toast.error(res.error || "Failed to update project status.");
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete project "${title}"?`)) return;
    try {
      const res = await deleteProject(id);
      if (res.success) {
        toast.success("Project deleted successfully.");
        fetchProjects();
      } else {
        toast.error(res.error || "Failed to delete project.");
      }
    } catch {
      toast.error("Failed to delete project.");
    }
  };

  const filteredProjects = projects.filter((project) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "PUBLISHED") return project.published;
    if (activeFilter === "DRAFTS") return !project.published;
    return project.categoryType === activeFilter;
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "WEB_APP":
        return "Web App";
      case "MOBILE_APP":
        return "Mobile App";
      case "UI_UX":
        return "UI/UX";
      case "ACADEMIC":
        return "Academic";
      case "OTHER":
        return "Other";
      default:
        return cat;
    }
  };

  return (
    <AdminLayout title="Projects Management">
      <div className="space-y-6">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Portfolio Projects & Systems</h2>
            <p className="text-xs text-muted-foreground">
              Create, edit, feature, publish, and manage project showcases and mobile APKs.
            </p>
          </div>

          <Link
            href="/private/projects/new"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Add New Project
          </Link>
        </div>

        {/* FILTER CATEGORY PILLS */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-4">
          <button
            type="button"
            onClick={() => setActiveFilter("ALL")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === "ALL"
                ? "bg-foreground text-background shadow-xs"
                : "border border-border/60 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            All ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("PUBLISHED")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === "PUBLISHED"
                ? "bg-emerald-500 text-white shadow-xs"
                : "border border-border/60 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            Published ({projects.filter((p) => p.published).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("DRAFTS")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === "DRAFTS"
                ? "bg-pink-500 text-white shadow-xs"
                : "border border-border/60 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            Drafts ({projects.filter((p) => !p.published).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("MOBILE_APP")}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeFilter === "MOBILE_APP"
                ? "bg-indigo-600 text-white shadow-xs"
                : "border border-border/60 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            Mobile Apps
          </button>
        </div>

        {/* PROJECTS LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-background/80 p-12 text-center backdrop-blur-md space-y-4">
            <FolderGit2 className="mx-auto h-12 w-12 text-amber-500 opacity-80" />
            <h3 className="text-lg font-bold text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Get started by creating your first portfolio project entry.
            </p>
            <Link
              href="/private/projects/new"
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredProjects.map((project) => {
              const techList = Array.isArray(project.techStack)
                ? project.techStack
                : [];
              const formattedDate = new Date(project.updatedAt).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );

              return (
                <div
                  key={project.id}
                  className="rounded-3xl border border-border/60 bg-card text-card-foreground p-6 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {project.published ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                            ● Published
                          </span>
                        ) : (
                          <span className="rounded-full bg-pink-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-pink-400">
                            ○ Draft
                          </span>
                        )}
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-400">
                          {getCategoryLabel(project.categoryType)}
                        </span>
                        {project.featured && (
                          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                            Featured
                          </span>
                        )}
                        {(() => {
                          const stats = engagementSummary[project.id] || engagementSummary[project.slug] || { likes: 0, comments: 0, totalComments: 0 };
                          const commentCount = stats.totalComments ?? stats.comments ?? 0;
                          return (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-500 dark:text-emerald-400">
                              <Heart className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                              <span>{stats.likes}</span>
                              <span className="opacity-40">|</span>
                              <MessageSquare className="h-3 w-3 text-indigo-500" />
                              <span>{commentCount}</span>
                            </span>
                          );
                        })()}
                      </div>

                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formattedDate}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Tech Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {techList.slice(0, 5).map((tech: string) => (
                        <span
                          key={tech}
                          className="rounded-md border border-border/60 bg-accent/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Mobile APK indicator */}
                    {project.apkUrl && (
                      <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-indigo-400">
                        <Download className="h-3.5 w-3.5" />
                        <span>APK File Attached ({project.version || "v1.0"})</span>
                      </div>
                    )}
                  </div>

                  {/* ACTION BAR */}
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40 mt-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/private/projects/edit/${project.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3.5 py-2 text-xs font-semibold text-background hover:scale-105 transition-transform min-h-[38px]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePublish(
                            project.id,
                            project.published,
                            project.title
                          )
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                          project.published
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        {project.published ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" /> Unpublish
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" /> Publish
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(project.id, project.title)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive hover:text-white transition-colors min-h-[38px]"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

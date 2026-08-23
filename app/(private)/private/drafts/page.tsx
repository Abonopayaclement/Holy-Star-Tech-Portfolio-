"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Clock,
  Edit3,
  FileEdit,
  FolderGit2,
  ImageIcon,
  Plus,
  Send,
  Trash2,
  Layers,
  BookOpen,
  CheckCircle2,
  Eye,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import { BlogEditorModal } from "@/components/private/BlogEditorModal";
import {
  getDraftBlogPosts,
  togglePublishStatus,
  deleteBlogPost,
} from "@/actions/blog";
import {
  getDraftProjects,
  toggleProjectPublishStatus,
  deleteProject,
} from "@/actions/projects";

interface DraftPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  featured: boolean;
  published: boolean;
  images?: string[] | unknown;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface DraftProject {
  id: string;
  slug: string;
  title: string;
  tagline?: string;
  description: string;
  categoryType: string;
  status?: string;
  featured: boolean;
  published: boolean;
  featuredImage?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function PrivateDraftsPage() {
  const [activeTab, setActiveTab] = useState<"blogs" | "projects">("blogs");
  
  // Blog Drafts State
  const [blogDrafts, setBlogDrafts] = useState<DraftPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<DraftPost | null>(null);

  // Project Drafts State
  const [projectDrafts, setProjectDrafts] = useState<DraftProject[]>([]);
  const [projectLoading, setProjectLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchBlogDrafts = async () => {
    setBlogLoading(true);
    try {
      const data = await getDraftBlogPosts();
      setBlogDrafts(data as unknown as DraftPost[]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load blog drafts.");
    } finally {
      setBlogLoading(false);
    }
  };

  const fetchProjectDrafts = async () => {
    setProjectLoading(true);
    try {
      const data = await getDraftProjects();
      setProjectDrafts(data as unknown as DraftProject[]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load project drafts.");
    } finally {
      setProjectLoading(false);
    }
  };

  const loadAll = () => {
    fetchBlogDrafts();
    fetchProjectDrafts();
  };

  useEffect(() => {
    loadAll();
  }, []);

  // Blog Handlers
  const handlePublishBlog = async (id: string, title: string) => {
    setActionInProgress(id);
    const toastId = toast.loading(`Publishing "${title}" to live website...`, { id: "draft-pub" });
    try {
      const res = await togglePublishStatus(id, true);
      if (res.success) {
        toast.success(`"${title}" is now published and visible publicly!`, { id: "draft-pub" });
        fetchBlogDrafts();
      } else {
        toast.error(res.error || "Failed to publish article.", { id: "draft-pub" });
      }
    } catch {
      toast.error("Failed to publish article.", { id: "draft-pub" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteBlog = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete blog draft "${title}"? This cannot be undone.`)) return;
    setActionInProgress(id);
    try {
      const res = await deleteBlogPost(id);
      if (res.success) {
        toast.success("Blog draft deleted successfully.");
        fetchBlogDrafts();
      } else {
        toast.error(res.error || "Failed to delete blog draft.");
      }
    } catch {
      toast.error("Failed to delete blog draft.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Project Handlers
  const handlePublishProject = async (id: string, title: string) => {
    setActionInProgress(id);
    const toastId = toast.loading(`Publishing "${title}" to live portfolio...`, { id: "proj-pub" });
    try {
      const res = await toggleProjectPublishStatus(id, true);
      if (res.success) {
        toast.success(`"${title}" is now published and visible publicly!`, { id: "proj-pub" });
        fetchProjectDrafts();
      } else {
        toast.error(res.error || "Failed to publish project.", { id: "proj-pub" });
      }
    } catch {
      toast.error("Failed to publish project.", { id: "proj-pub" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete project draft "${title}"? This cannot be undone.`)) return;
    setActionInProgress(id);
    try {
      const res = await deleteProject(id);
      if (res.success) {
        toast.success("Project draft deleted successfully.");
        fetchProjectDrafts();
      } else {
        toast.error(res.error || "Failed to delete project draft.");
      }
    } catch {
      toast.error("Failed to delete project draft.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEditBlog = (post: DraftPost) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleCreateNewBlog = () => {
    setEditingPost(null);
    setIsEditorOpen(true);
  };

  return (
    <AdminLayout title="Draft Workspace">
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* HEADER HERO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-500">
              Unpublished Work in Progress
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Draft Management Workspace
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Review, edit, and publish unpublished blog articles and project drafts. Draft items are completely hidden from public visitors until you explicitly publish them.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadAll}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors min-h-[44px]"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            {activeTab === "blogs" ? (
              <button
                onClick={handleCreateNewBlog}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-md hover:opacity-90 transition-transform active:scale-95 min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>New Blog Draft</span>
              </button>
            ) : (
              <Link
                href="/private/projects/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-md hover:opacity-90 transition-transform active:scale-95 min-h-[44px]"
              >
                <Plus className="h-4 w-4" />
                <span>New Project Draft</span>
              </Link>
            )}
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-border/60 gap-4">
          <button
            onClick={() => setActiveTab("blogs")}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "blogs"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Blog Drafts</span>
            <span className="ml-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-xs font-mono font-bold">
              {blogDrafts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "projects"
                ? "border-amber-500 text-amber-500"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderGit2 className="h-4 w-4" />
            <span>Project Drafts</span>
            <span className="ml-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-xs font-mono font-bold">
              {projectDrafts.length}
            </span>
          </button>
        </div>

        {/* TAB CONTENT: BLOG DRAFTS */}
        {activeTab === "blogs" && (
          <div>
            {blogLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-3xl border border-border/40 bg-card/50 animate-pulse p-6"
                  />
                ))}
              </div>
            ) : blogDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-4">
                <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500">
                  <FileEdit className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">No Blog Drafts</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                    All your blog articles are currently published and live on the portfolio. Create a new draft anytime!
                  </p>
                </div>
                <button
                  onClick={handleCreateNewBlog}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-sm hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Blog Draft</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogDrafts.map((post) => {
                  const rawImgs = post.images;
                  const firstImg =
                    Array.isArray(rawImgs) && rawImgs.length > 0
                      ? (rawImgs[0] as string)
                      : null;

                  return (
                    <div
                      key={post.id}
                      className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md"
                    >
                      <div className="space-y-4">
                        {/* THUMBNAIL IF PRESENT */}
                        {firstImg ? (
                          <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-muted">
                            <img
                              src={firstImg}
                              alt={post.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2.5 right-2.5 rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                              DRAFT
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                              DRAFT
                            </span>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {post.readTime}
                            </span>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-500">
                            {post.category}
                          </span>
                          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>

                      <div className="pt-5 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {new Date(post.updatedAt || post.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditBlog(post)}
                            className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors min-h-[36px]"
                            title="Edit Draft"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            disabled={actionInProgress === post.id}
                            onClick={() => handlePublishBlog(post.id, post.title)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 min-h-[36px]"
                            title="Publish Immediately"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Publish</span>
                          </button>

                          <button
                            disabled={actionInProgress === post.id}
                            onClick={() => handleDeleteBlog(post.id, post.title)}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg border border-border/80 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-colors min-h-[36px] min-w-[36px]"
                            title="Delete Draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: PROJECT DRAFTS */}
        {activeTab === "projects" && (
          <div>
            {projectLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-48 rounded-3xl border border-border/40 bg-card/50 animate-pulse p-6"
                  />
                ))}
              </div>
            ) : projectDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 p-12 text-center space-y-4">
                <div className="rounded-2xl bg-amber-500/10 p-4 text-amber-500">
                  <FolderGit2 className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">No Project Drafts</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                    All your portfolio projects are currently published and live. Start a new project draft anytime!
                  </p>
                </div>
                <Link
                  href="/private/projects/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-sm hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Project Draft</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projectDrafts.map((proj) => (
                  <div
                    key={proj.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md"
                  >
                    <div className="space-y-4">
                      {/* THUMBNAIL IF PRESENT */}
                      {proj.featuredImage ? (
                        <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-muted">
                          <img
                            src={proj.featuredImage}
                            alt={proj.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2.5 right-2.5 rounded-full bg-slate-950/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-500/30">
                            DRAFT
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-mono font-bold">
                            DRAFT
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {proj.categoryType}
                          </span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-500">
                          {proj.categoryType}
                        </span>
                        <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                          {proj.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {proj.tagline || proj.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-5 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/private/projects/edit/${proj.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors min-h-[36px]"
                          title="Edit Project Draft"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-indigo-500" />
                          <span>Edit</span>
                        </Link>

                        <button
                          disabled={actionInProgress === proj.id}
                          onClick={() => handlePublishProject(proj.id, proj.title)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 min-h-[36px]"
                          title="Publish Project Live"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Publish</span>
                        </button>

                        <button
                          disabled={actionInProgress === proj.id}
                          onClick={() => handleDeleteProject(proj.id, proj.title)}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-border/80 text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-colors min-h-[36px] min-w-[36px]"
                          title="Delete Project Draft"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BLOG EDITOR MODAL */}
      <BlogEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={fetchBlogDrafts}
        initialData={
          editingPost
            ? {
                id: editingPost.id,
                title: editingPost.title,
                slug: editingPost.slug,
                excerpt: editingPost.excerpt,
                content: editingPost.content,
                category: editingPost.category,
                readTime: editingPost.readTime,
                featured: editingPost.featured,
                published: editingPost.published,
                images: Array.isArray(editingPost.images)
                  ? (editingPost.images as string[])
                  : [],
              }
            : null
        }
      />
    </AdminLayout>
  );
}

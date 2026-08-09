"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FolderGit2,
  Heart,
  HeartHandshake,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import {
  deleteComment,
  getAllEngagementAdmin,
  toggleCommentPublishStatus,
  clearAllLikesAndComments,
} from "@/actions/engagement";

export default function PrivateEngagementPage() {
  const [data, setData] = useState<{
    summary: {
      totalLikes: number;
      totalComments: number;
      publishedCommentsCount: number;
      pendingCommentsCount: number;
    };
    projects: {
      id: string;
      title: string;
      slug: string;
      likes: number;
      totalComments: number;
      publishedComments: number;
      pendingComments: number;
    }[];
    blogPosts: {
      id: string;
      title: string;
      slug: string;
      likes: number;
      totalComments: number;
      publishedComments: number;
      pendingComments: number;
    }[];
    comments: {
      id: string;
      targetType: "BLOG" | "PROJECT";
      authorName: string;
      content: string;
      published: boolean;
      createdAt: string;
      itemTitle: string;
      itemSlug: string;
    }[];
  }>({
    summary: {
      totalLikes: 0,
      totalComments: 0,
      publishedCommentsCount: 0,
      pendingCommentsCount: 0,
    },
    projects: [],
    blogPosts: [],
    comments: [],
  });

  const [loading, setLoading] = useState(true);
  const [targetFilter, setTargetFilter] = useState<"ALL" | "PROJECT" | "BLOG">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "PENDING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllEngagementAdmin();
      setData(res as any);
    } catch (error) {
      console.error("Failed to load engagement data:", error);
      toast.error("Failed to load engagement metrics.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllEngagement = async () => {
    if (confirm("Are you sure you want to clear all likes, comments, and engagement notifications? Everything will reset to 0.")) {
      setLoading(true);
      try {
        await clearAllLikesAndComments();
        toast.success("All likes, comments, and engagement reset to 0!");
        await loadData();
      } catch (err) {
        toast.error("Failed to reset engagement.");
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePublish = async (commentId: string, currentPublished: boolean) => {
    try {
      const res = await toggleCommentPublishStatus(commentId, !currentPublished);
      if (res.success) {
        toast.success(!currentPublished ? "Comment published live!" : "Comment unpublished.");
        loadData();
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("An error occurred.");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm("Are you sure you want to permanently delete this comment?")) {
      try {
        const res = await deleteComment(commentId);
        if (res.success) {
          toast.success("Comment deleted permanently.");
          loadData();
        } else {
          toast.error("Failed to delete comment.");
        }
      } catch {
        toast.error("An error occurred.");
      }
    }
  };

  // Filter Comments
  const filteredComments = data.comments.filter((c) => {
    const matchesTarget = targetFilter === "ALL" || c.targetType === targetFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && c.published) ||
      (statusFilter === "PENDING" && !c.published);

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.authorName.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      c.itemTitle.toLowerCase().includes(q);

    return matchesTarget && matchesStatus && matchesQuery;
  });

  return (
    <AdminLayout title="Portfolio Engagement Central">
      <div className="space-y-10">
        {/* HEADER SECTION & REFRESH / RESET */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-500">
              <HeartHandshake className="h-4 w-4" /> Central Engagement Control
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Visitor Feedback & Reaction Analytics
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Monitor project and blog likes, review visitor feedback, and moderate customer comments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleClearAllEngagement}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-500 shadow-sm transition-transform active:scale-95 hover:bg-rose-500/20 min-h-[44px]"
            >
              <Trash2 className="h-4 w-4" />
              <span>Reset Likes & Comments</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm transition-transform active:scale-95 hover:bg-accent/40 min-h-[44px]"
            >
              <RefreshCw className={`h-4 w-4 text-indigo-500 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Analytics</span>
            </button>
          </div>
        </div>

        {/* 1. OVERVIEW STAT CARDS */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Likes */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Likes
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Heart className="h-5 w-5 fill-emerald-500" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground font-mono">
              {data.summary.totalLikes}
            </div>
            <p className="text-[11px] text-muted-foreground">Appreciation across projects & posts</p>
          </div>

          {/* Total Comments */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Comments
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-foreground font-mono">
              {data.summary.totalComments}
            </div>
            <p className="text-[11px] text-muted-foreground">Every feedback entry submitted</p>
          </div>

          {/* Published Comments */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Published Reviews
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-500 font-mono">
              {data.summary.publishedCommentsCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Approved & visible publicly</p>
          </div>

          {/* Pending Comments */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Approval
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-500 font-mono">
              {data.summary.pendingCommentsCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Awaiting moderation approval</p>
          </div>
        </div>

        {/* 2. ENGAGEMENT BREAKDOWN GRID (PROJECTS & BLOG) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* PROJECT ENGAGEMENT LIST */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-bold text-foreground">Project Engagement</h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {data.projects.length} Projects
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {data.projects.length > 0 ? (
                data.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 text-xs"
                  >
                    <div className="space-y-0.5 max-w-xs">
                      <h4 className="font-bold text-foreground truncate">{proj.title}</h4>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        Slug: /{proj.slug}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-500 font-bold">
                        <Heart className="h-3 w-3 fill-emerald-500" />
                        {proj.likes}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-500 font-bold">
                        <MessageSquare className="h-3 w-3" />
                        {proj.totalComments} total
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                        👁 {proj.publishedComments}
                      </span>
                      {proj.pendingComments > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-500">
                          ⏳ {proj.pendingComments}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">No projects found.</div>
              )}
            </div>
          </div>

          {/* BLOG ENGAGEMENT LIST */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-bold text-foreground">Blog Articles Engagement</h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {data.blogPosts.length} Articles
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {data.blogPosts.length > 0 ? (
                data.blogPosts.map((blog) => (
                  <div
                    key={blog.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 text-xs"
                  >
                    <div className="space-y-0.5 max-w-xs">
                      <h4 className="font-bold text-foreground truncate">{blog.title}</h4>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        Slug: /{blog.slug}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-500 font-bold">
                        <Heart className="h-3 w-3 fill-emerald-500" />
                        {blog.likes}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-500 font-bold">
                        <MessageSquare className="h-3 w-3" />
                        {blog.totalComments} total
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                        👁 {blog.publishedComments}
                      </span>
                      {blog.pendingComments > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-500">
                          ⏳ {blog.pendingComments}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground">No articles found.</div>
              )}
            </div>
          </div>
        </div>

        {/* 3. CENTRAL COMMENTS MODERATION FEED */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-indigo-500" />
                <span>Central Comment Moderation Feed</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review visitor comments, approve public visibility, or purge inappropriate messages.
              </p>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search commenter, content, title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* FILTER CONTROLS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-background/50 p-3 rounded-2xl border border-border/60">
            {/* Target Filter Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Type:</span>
              <button
                type="button"
                onClick={() => setTargetFilter("ALL")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  targetFilter === "ALL"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({data.comments.length})
              </button>
              <button
                type="button"
                onClick={() => setTargetFilter("PROJECT")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  targetFilter === "PROJECT"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Projects
              </button>
              <button
                type="button"
                onClick={() => setTargetFilter("BLOG")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  targetFilter === "BLOG"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Blog Articles
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Status:</span>
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === "ALL"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PUBLISHED")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === "PUBLISHED"
                    ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Published ({data.summary.publishedCommentsCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === "PENDING"
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pending ({data.summary.pendingCommentsCount})
              </button>
            </div>
          </div>

          {/* COMMENTS LIST FEED */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center text-xs font-mono text-muted-foreground">
                Loading comment moderation feed...
              </div>
            ) : filteredComments.length > 0 ? (
              filteredComments.map((c) => (
                <div
                  key={c.id}
                  className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl border p-5 transition-all shadow-xs ${
                    c.published
                      ? "border-emerald-500/30 bg-card"
                      : "border-amber-500/40 bg-amber-500/5"
                  }`}
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-foreground text-sm">{c.authorName}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {new Date(c.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {/* Item Target Pill */}
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                        {c.targetType === "BLOG" ? "Blog" : "Project"}: {c.itemTitle}
                      </span>

                      {/* Publish Status Pill */}
                      {c.published ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                          ● Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-500">
                          ⏳ Pending Approval
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                      {c.content}
                    </p>
                  </div>

                  {/* MODERATION ACTION BUTTONS */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(c.id, c.published)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 min-h-[38px] ${
                        c.published
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      }`}
                    >
                      {c.published ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Unpublish</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Approve & Publish</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all min-h-[38px]"
                      title="Delete Comment Permanently"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-xs text-muted-foreground space-y-2">
                <MessageSquare className="mx-auto h-8 w-8 text-indigo-500 opacity-60" />
                <p className="font-semibold">No comments match the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

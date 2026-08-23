"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  EyeOff,
  Filter,
  FolderGit2,
  Heart,
  HeartHandshake,
  MessageSquare,
  RefreshCw,
  Reply,
  Save,
  Search,
  Trash2,
  X,
  MessageCircle,
  ThumbsUp,
  Layers,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import {
  deleteComment,
  getAllEngagementAdmin,
  toggleCommentPublishStatus,
  clearAllLikesAndComments,
  saveAdminReply,
} from "@/actions/engagement";

type TargetTab = "BLOG" | "PROJECT";
type PrimaryFilter = "ALL" | "LIKES" | "COMMENTS";
type CommentSubFilter = "ALL" | "PUBLISHED" | "PENDING" | "REPLIED" | "NOT_REPLIED";

type EngagementData = {
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
    adminReply?: string | null;
    adminReplyPublished?: boolean;
    createdAt: string;
    itemTitle: string;
    itemSlug: string;
  }[];
};

export default function PrivateEngagementPage() {
  const [data, setData] = useState<EngagementData>({
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

  // Requirement 1 & 3: Main section tab ("BLOG" or "PROJECT")
  const [activeTab, setActiveTab] = useState<TargetTab>("BLOG");

  // Requirement 1 & 3: Primary filter ("ALL" | "LIKES" | "COMMENTS") - default "ALL"
  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>("ALL");

  // Requirement 2 & 3: Comment-specific filter ("ALL" | "PUBLISHED" | "PENDING" | "REPLIED" | "NOT_REPLIED")
  const [commentSubFilter, setCommentSubFilter] = useState<CommentSubFilter>("ALL");

  const [searchQuery, setSearchQuery] = useState("");

  // Admin Reply inline editor state
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [publishReplyToggle, setPublishReplyToggle] = useState(true);
  const [isSavingReply, setIsSavingReply] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getAllEngagementAdmin();
      setData(res as unknown as EngagementData);
    } catch (error) {
      console.error("Failed to load engagement data:", error);
      toast.error("Failed to load engagement metrics.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllEngagement = async () => {
    if (
      confirm(
        "Are you sure you want to clear all likes, comments, and engagement notifications? Everything will reset to 0."
      )
    ) {
      setLoading(true);
      try {
        await clearAllLikesAndComments();
        toast.success("All likes, comments, and engagement reset to 0!");
        await loadData();
      } catch {
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

  const openReplyEditor = (c: EngagementData["comments"][number]) => {
    setReplyingCommentId(c.id);
    setReplyText(c.adminReply || "");
    setPublishReplyToggle(c.adminReplyPublished !== false);
  };

  const handleSaveReply = async (commentId: string) => {
    setIsSavingReply(true);
    try {
      const res = await saveAdminReply({
        commentId,
        reply: replyText,
        publishReply: publishReplyToggle,
      });

      if (res.success) {
        toast.success(res.message);
        setReplyingCommentId(null);
        setReplyText("");
        loadData();
      } else {
        toast.error(res.error || "Failed to save reply.");
      }
    } catch (err) {
      console.error("Save reply error:", err);
      toast.error("An error occurred while saving reply.");
    } finally {
      setIsSavingReply(false);
    }
  };

  // Separate data arrays by targetType (BLOG vs PROJECT)
  const activeItems = activeTab === "BLOG" ? data.blogPosts : data.projects;
  const activeComments = data.comments.filter((c) => c.targetType === activeTab);

  // LIKES FILTER: Only items with likes > 0
  const likedItems = activeItems.filter((item) => item.likes > 0).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.title.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
  });

  // COMMENTS FILTER: Comments for active tab filtered by sub-filters
  const filteredComments = activeComments.filter((c) => {
    // 1. Comment Sub-Filter
    if (commentSubFilter === "PUBLISHED" && !c.published) return false;
    if (commentSubFilter === "PENDING" && c.published) return false;
    if (commentSubFilter === "REPLIED" && (!c.adminReply || !c.adminReply.trim())) return false;
    if (commentSubFilter === "NOT_REPLIED" && Boolean(c.adminReply && c.adminReply.trim())) return false;

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = c.authorName.toLowerCase().includes(q);
      const matchesContent = c.content.toLowerCase().includes(q);
      const matchesItem = c.itemTitle.toLowerCase().includes(q);
      const matchesReply = Boolean(c.adminReply && c.adminReply.toLowerCase().includes(q));
      return matchesName || matchesContent || matchesItem || matchesReply;
    }

    return true;
  });

  // Calculate section summary stats
  const totalSectionLikes = activeItems.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const totalSectionComments = activeComments.length;
  const publishedSectionComments = activeComments.filter((c) => c.published).length;
  const pendingSectionComments = activeComments.filter((c) => !c.published).length;
  const repliedSectionComments = activeComments.filter((c) => Boolean(c.adminReply && c.adminReply.trim())).length;
  const unrepliedSectionComments = totalSectionComments - repliedSectionComments;

  return (
    <AdminLayout title="Portfolio Engagement Central">
      <div className="space-y-8 pb-12">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-500">
              <HeartHandshake className="h-4 w-4" /> Engagement Control Center
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Engagement & Moderation
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Filter visitor feedback, moderate comments, publish responses, and view like statistics.
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
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 1. MAIN TABS: BLOG & ARTICLE ENGAGEMENT vs PROJECT ENGAGEMENT */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("BLOG");
              setPrimaryFilter("ALL");
              setCommentSubFilter("ALL");
            }}
            className={`flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-xs font-bold transition-all min-h-[48px] ${
              activeTab === "BLOG"
                ? "bg-foreground text-background shadow-md scale-[1.02]"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Blog & Post Engagement</span>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-indigo-400">
              {data.blogPosts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("PROJECT");
              setPrimaryFilter("ALL");
              setCommentSubFilter("ALL");
            }}
            className={`flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-xs font-bold transition-all min-h-[48px] ${
              activeTab === "PROJECT"
                ? "bg-foreground text-background shadow-md scale-[1.02]"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <FolderGit2 className="h-4 w-4" />
            <span>Project Engagement</span>
            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-indigo-400">
              {data.projects.length}
            </span>
          </button>
        </div>

        {/* SECTION SUMMARY OVERVIEW BAR */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Total Likes</span>
              <Heart className="h-4 w-4 text-emerald-500 fill-emerald-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-foreground">{totalSectionLikes}</div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Total Comments</span>
              <MessageSquare className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-foreground">{totalSectionComments}</div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Published</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold font-mono text-emerald-400">{publishedSectionComments}</div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider">Pending</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-xl font-extrabold font-mono text-amber-500">{pendingSectionComments}</div>
          </div>
        </div>

        {/* 2. PRIMARY FILTER BAR: ALL | LIKES | COMMENTS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter View:</span>
            <div className="flex items-center gap-1.5 bg-background p-1 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => setPrimaryFilter("ALL")}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] ${
                  primaryFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setPrimaryFilter("LIKES")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] ${
                  primaryFilter === "LIKES"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>Likes</span>
              </button>

              <button
                type="button"
                onClick={() => setPrimaryFilter("COMMENTS")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all min-h-[38px] ${
                  primaryFilter === "COMMENTS"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>Comments</span>
              </button>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, commenter, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 3. COMMENT-SPECIFIC SUB-FILTERS (Only visible when Primary Filter === "COMMENTS") */}
        {primaryFilter === "COMMENTS" && (
          <div className="rounded-3xl border border-indigo-500/30 bg-indigo-500/5 p-5 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Comment Moderation Filters:
              </span>
              <span className="text-xs font-mono font-semibold text-muted-foreground">
                Showing {filteredComments.length} of {activeComments.length} comments
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCommentSubFilter("ALL")}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all min-h-[36px] ${
                  commentSubFilter === "ALL"
                    ? "bg-foreground text-background shadow-xs"
                    : "border border-border/80 bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                All Comments ({activeComments.length})
              </button>

              <button
                type="button"
                onClick={() => setCommentSubFilter("PUBLISHED")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all min-h-[36px] ${
                  commentSubFilter === "PUBLISHED"
                    ? "bg-emerald-500 text-slate-950 shadow-xs"
                    : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Published ({publishedSectionComments})</span>
              </button>

              <button
                type="button"
                onClick={() => setCommentSubFilter("PENDING")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all min-h-[36px] ${
                  commentSubFilter === "PENDING"
                    ? "bg-amber-500 text-slate-950 shadow-xs"
                    : "border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Pending / Unpublished ({pendingSectionComments})</span>
              </button>

              <button
                type="button"
                onClick={() => setCommentSubFilter("REPLIED")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all min-h-[36px] ${
                  commentSubFilter === "REPLIED"
                    ? "bg-indigo-500 text-white shadow-xs"
                    : "border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                }`}
              >
                <Reply className="h-3.5 w-3.5" />
                <span>Replied ({repliedSectionComments})</span>
              </button>

              <button
                type="button"
                onClick={() => setCommentSubFilter("NOT_REPLIED")}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all min-h-[36px] ${
                  commentSubFilter === "NOT_REPLIED"
                    ? "bg-slate-700 text-white shadow-xs"
                    : "border border-border/80 bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Not Replied ({unrepliedSectionComments})</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. MAIN CONTENT RENDERING BASED ON PRIMARY FILTER */}
        {loading ? (
          <div className="py-20 text-center text-xs font-mono text-muted-foreground">
            Loading engagement data...
          </div>
        ) : (
          <div className="space-y-6">
            {/* VIEW A: LIKES ONLY */}
            {primaryFilter === "LIKES" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Heart className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                    Items with Received Likes ({likedItems.length})
                  </h3>
                </div>

                {likedItems.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-card p-12 text-center text-xs text-muted-foreground">
                    No {activeTab === "BLOG" ? "blog articles" : "projects"} have received likes yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {likedItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-emerald-500/30 bg-card p-6 shadow-sm space-y-4 hover:border-emerald-500/60 transition-all"
                      >
                        <div className="space-y-1">
                          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                            {activeTab === "BLOG" ? "Blog Post" : "Project"}
                          </span>
                          <h4 className="text-base font-bold text-foreground">{item.title}</h4>
                          <p className="text-xs font-mono text-muted-foreground">Slug: /{item.slug}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/60 font-mono text-xs">
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-500 font-bold text-sm">
                            <Heart className="h-4 w-4 fill-emerald-500" />
                            {item.likes} {item.likes === 1 ? "Like" : "Likes"}
                          </span>

                          <span className="text-xs text-muted-foreground font-sans">
                            {item.totalComments} Comments
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW B: COMMENTS ONLY (WITH ALL SUB-FILTERS) */}
            {primaryFilter === "COMMENTS" && (
              <div className="space-y-4">
                {filteredComments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-card p-12 text-center text-xs text-muted-foreground">
                    No comments match the selected sub-filter ({commentSubFilter}).
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredComments.map((c) => (
                      <div
                        key={c.id}
                        className={`rounded-3xl border p-6 space-y-4 transition-all shadow-sm ${
                          c.published
                            ? "border-emerald-500/30 bg-card"
                            : "border-amber-500/40 bg-amber-500/5"
                        }`}
                      >
                        {/* ITEM TITLE HEADER */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                              {c.targetType === "BLOG" ? "Blog Post" : "Project"}
                            </span>
                            <span className="text-xs font-bold text-foreground">{c.itemTitle}</span>
                          </div>
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {new Date(c.createdAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* COMMENTER INFO & CONTENT */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-foreground text-sm">{c.authorName}</span>

                              {c.published ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                                  ● Published
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-500">
                                  ⏳ Pending Moderation
                                </span>
                              )}

                              {c.adminReply && c.adminReply.trim() ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-400">
                                  ✓ Replied
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 border border-slate-500/30 px-2.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                                  No Reply Yet
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line bg-accent/20 p-3 rounded-2xl border border-border/40">
                              {c.content}
                            </p>
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                            <button
                              type="button"
                              onClick={() => openReplyEditor(c)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition-all min-h-[38px]"
                            >
                              <Reply className="h-3.5 w-3.5" />
                              <span>{c.adminReply ? "Edit Reply" : "Reply"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTogglePublish(c.id, c.published)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all active:scale-95 min-h-[38px] ${
                                c.published
                                  ? "border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
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
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                        {/* DISPLAY EXISTING ADMIN REPLY */}
                        {c.adminReply && replyingCommentId !== c.id && (
                          <div className="ml-2 sm:ml-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                                <span>Official Admin Reply (Abonopaya Clement Ayebono)</span>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  c.adminReplyPublished
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                                }`}
                              >
                                {c.adminReplyPublished ? "Published Live" : "Draft Only"}
                              </span>
                            </div>
                            <p className="text-foreground leading-relaxed font-sans pt-1">
                              {c.adminReply}
                            </p>
                          </div>
                        )}

                        {/* INLINE ADMIN REPLY EDITOR */}
                        {replyingCommentId === c.id && (
                          <div className="ml-2 sm:ml-4 rounded-2xl border border-indigo-500/40 bg-indigo-500/5 p-4 space-y-3 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                                <Reply className="h-3.5 w-3.5" />
                                Write Admin Reply to {c.authorName}
                              </span>
                              <button
                                type="button"
                                onClick={() => setReplyingCommentId(null)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <textarea
                              rows={3}
                              placeholder="Type your response to this visitor comment..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              maxLength={1000}
                              className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />

                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
                                <input
                                  type="checkbox"
                                  checked={publishReplyToggle}
                                  onChange={(e) => setPublishReplyToggle(e.target.checked)}
                                  className="h-4 w-4 rounded border-border/80 accent-indigo-600 focus:ring-indigo-500"
                                />
                                <span>Publish Reply publicly underneath comment</span>
                              </label>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setReplyingCommentId(null)}
                                  className="rounded-xl border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-accent"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingReply}
                                  onClick={() => handleSaveReply(c.id)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md active:scale-95 disabled:opacity-50"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                  <span>{isSavingReply ? "Saving..." : "Save Reply"}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW C: ALL (OVERVIEW BREAKDOWN OF ITEMS AND RECENT COMMENTS) */}
            {primaryFilter === "ALL" && (
              <div className="space-y-8">
                {/* ITEMS LIST WITH STATS */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Layers className="h-4 w-4 text-indigo-500" />
                    {activeTab === "BLOG" ? "All Blog Posts Engagement" : "All Projects Engagement"} ({activeItems.length})
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {activeItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-4 hover:border-indigo-500/40 transition-all"
                      >
                        <div className="space-y-1">
                          <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                            {activeTab === "BLOG" ? "Post" : "Project"}
                          </span>
                          <h4 className="text-base font-bold text-foreground line-clamp-1">{item.title}</h4>
                          <p className="text-xs font-mono text-muted-foreground">/{item.slug}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 font-mono text-xs">
                          <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-500 font-bold">
                            <Heart className="h-3.5 w-3.5 fill-emerald-500" />
                            {item.likes} Likes
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-400 font-bold">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {item.totalComments} Comments
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RECENT COMMENTS PREVIEW */}
                <div className="space-y-4 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-indigo-500" />
                      Recent Comments ({activeComments.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPrimaryFilter("COMMENTS")}
                      className="text-xs font-semibold text-indigo-400 hover:underline"
                    >
                      View all comments & sub-filters →
                    </button>
                  </div>

                  {activeComments.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-xs text-muted-foreground">
                      No comments recorded yet for {activeTab === "BLOG" ? "blog articles" : "projects"}.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeComments.slice(0, 5).map((c) => (
                        <div
                          key={c.id}
                          className="rounded-2xl border border-border/80 bg-card p-4 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{c.authorName} on {c.itemTitle}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

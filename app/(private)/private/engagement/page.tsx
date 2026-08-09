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
  Reply,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import {
  deleteComment,
  getAllEngagementAdmin,
  toggleCommentPublishStatus,
  clearAllLikesAndComments,
  saveAdminReply,
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
      adminReply?: string | null;
      adminReplyPublished?: boolean;
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
  // Default tab is "BLOG" (Blog & Article Engagement)
  const [activeTab, setActiveTab] = useState<"BLOG" | "PROJECT">("BLOG");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "PENDING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Admin Reply inline edit state
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [publishReplyToggle, setPublishReplyToggle] = useState(true);
  const [isSavingReply, setIsSavingReply] = useState(false);

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

  // Reply handlers
  const openReplyEditor = (c: any) => {
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

  // Filter comments for active tab (BLOG or PROJECT)
  const tabComments = data.comments.filter((c) => c.targetType === activeTab);

  const filteredComments = tabComments.filter((c) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PUBLISHED" && c.published) ||
      (statusFilter === "PENDING" && !c.published);

    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.authorName.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      c.itemTitle.toLowerCase().includes(q) ||
      (c.adminReply && c.adminReply.toLowerCase().includes(q));

    return matchesStatus && matchesQuery;
  });

  const activeItemList = activeTab === "BLOG" ? data.blogPosts : data.projects;

  return (
    <AdminLayout title="Portfolio Engagement Central">
      <div className="space-y-8 pb-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-6 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-500">
              <HeartHandshake className="h-4 w-4" /> Engagement Analytics
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Visitor Engagement & Admin Replies
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Moderate visitor comments and reply to feedback across your projects and blog articles.
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

        {/* OVERVIEW STAT CARDS */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Likes
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Heart className="h-4 w-4 fill-emerald-500" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {data.summary.totalLikes}
            </div>
            <p className="text-[11px] text-muted-foreground">Combined likes across site</p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Comments
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {data.summary.totalComments}
            </div>
            <p className="text-[11px] text-muted-foreground">Every feedback comment submitted</p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Published Comments
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Eye className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-500 font-mono">
              {data.summary.publishedCommentsCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Approved and visible publicly</p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending Approval
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-500 font-mono">
              {data.summary.pendingCommentsCount}
            </div>
            <p className="text-[11px] text-muted-foreground">Awaiting moderation approval</p>
          </div>
        </div>

        {/* PRIMARY TAB NAVIGATION: BLOG vs PROJECT */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("BLOG")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all min-h-[44px] ${
              activeTab === "BLOG"
                ? "bg-foreground text-background shadow-md scale-[1.02]"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Blog & Article Engagement</span>
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-mono text-[11px] font-extrabold text-indigo-400">
              {data.blogPosts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("PROJECT")}
            className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition-all min-h-[44px] ${
              activeTab === "PROJECT"
                ? "bg-foreground text-background shadow-md scale-[1.02]"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <FolderGit2 className="h-4 w-4" />
            <span>Project Engagement</span>
            <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-mono text-[11px] font-extrabold text-indigo-400">
              {data.projects.length}
            </span>
          </button>
        </div>

        {/* ACTIVE TAB CONTENT */}
        <div className="space-y-8">
          {/* SEARCH & STATUS FILTERS BAR */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              {activeTab === "BLOG" ? (
                <BookOpen className="h-5 w-5 text-indigo-500" />
              ) : (
                <FolderGit2 className="h-5 w-5 text-indigo-500" />
              )}
              <h3 className="text-base font-bold text-foreground">
                {activeTab === "BLOG" ? "Blog & Article Engagement" : "Project Engagement"}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search comments or titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-background p-1 rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === "ALL"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("PUBLISHED")}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === "PUBLISHED"
                      ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("PENDING")}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    statusFilter === "PENDING"
                      ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>

          {/* ITEM-BY-ITEM ENGAGEMENT CARDS WITH ASSOCIATED COMMENTS */}
          {loading ? (
            <div className="py-16 text-center text-xs font-mono text-muted-foreground">
              Loading engagement metrics...
            </div>
          ) : activeItemList.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-12 text-center text-xs text-muted-foreground">
              No {activeTab === "BLOG" ? "blog articles" : "projects"} found.
            </div>
          ) : (
            <div className="space-y-6">
              {activeItemList.map((item) => {
                // Filter comments belonging to this specific item
                const itemComments = filteredComments.filter(
                  (c) => c.itemSlug === item.slug || c.itemTitle === item.title
                );

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-border/80 bg-card p-6 shadow-md space-y-4"
                  >
                    {/* ITEM HEADER & STATS */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                      <div className="space-y-1">
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                          {activeTab === "BLOG" ? "Blog Article" : "Software Project"}
                        </span>
                        <h4 className="text-base font-bold text-foreground">{item.title}</h4>
                        <p className="text-xs font-mono text-muted-foreground">Slug: /{item.slug}</p>
                      </div>

                      {/* STAT PILLS */}
                      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-500 font-bold">
                          <Heart className="h-3.5 w-3.5 fill-emerald-500" />
                          {item.likes} Likes
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-indigo-500 font-bold">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {item.totalComments} Total Comments
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
                          ● {item.publishedComments} Published
                        </span>

                        {item.pendingComments > 0 && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-500 font-bold">
                            ⏳ {item.pendingComments} Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ASSOCIATED COMMENTS LIST */}
                    <div className="space-y-3 pt-1">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Comments ({itemComments.length})
                      </h5>

                      {itemComments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/60 bg-accent/10 p-4 text-center text-xs text-muted-foreground">
                          No comments match current filter criteria for this {activeTab === "BLOG" ? "article" : "project"}.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {itemComments.map((c) => (
                            <div
                              key={c.id}
                              className={`rounded-2xl border p-4 space-y-3 transition-all shadow-xs ${
                                c.published
                                  ? "border-emerald-500/30 bg-background/90"
                                  : "border-amber-500/40 bg-amber-500/5"
                              }`}
                            >
                              {/* COMMENT TOP BAR */}
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-bold text-foreground text-sm">
                                      {c.authorName}
                                    </span>
                                    <span className="text-[11px] font-mono text-muted-foreground">
                                      {new Date(c.createdAt).toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>

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

                                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {c.content}
                                  </p>
                                </div>

                                {/* MODERATION & REPLY BUTTONS */}
                                <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end pt-1 md:pt-0">
                                  <button
                                    type="button"
                                    onClick={() => openReplyEditor(c)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20 active:scale-95 transition-all min-h-[36px]"
                                  >
                                    <Reply className="h-3.5 w-3.5" />
                                    <span>{c.adminReply ? "Edit Reply" : "Reply"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleTogglePublish(c.id, c.published)}
                                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 min-h-[36px] ${
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
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/20 active:scale-95 transition-all min-h-[36px]"
                                    title="Delete Comment"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>

                              {/* ADMIN REPLY DISPLAY & INLINE EDITOR */}
                              {c.adminReply && replyingCommentId !== c.id && (
                                <div className="ml-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 space-y-1 text-xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-indigo-500 font-bold">
                                      <Sparkles className="h-3.5 w-3.5" />
                                      <span>Admin Reply (Abonopaya Clement Ayebono)</span>
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                        c.adminReplyPublished
                                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                          : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                                      }`}
                                    >
                                      {c.adminReplyPublished ? "Published Live" : "Private Draft"}
                                    </span>
                                  </div>
                                  <p className="text-foreground leading-relaxed">
                                    {c.adminReply}
                                  </p>
                                </div>
                              )}

                              {/* EXPANDABLE INLINE REPLY EDITOR */}
                              {replyingCommentId === c.id && (
                                <div className="ml-4 rounded-2xl border border-indigo-500/40 bg-indigo-500/5 p-4 space-y-3 animate-in fade-in duration-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-indigo-500 flex items-center gap-1.5">
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
                                    placeholder="Type your official admin response here..."
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

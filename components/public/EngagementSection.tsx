"use client";

import React, { useEffect, useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { getPublicEngagement, toggleLike } from "@/actions/engagement";
import { SimpleAddCommentModal } from "@/components/public/SimpleAddCommentModal";

interface EngagementSectionProps {
  targetType: "BLOG" | "PROJECT";
  slug: string;
  itemTitle: string;
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

export function EngagementSection({ targetType, slug, itemTitle }: EngagementSectionProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [publishedComments, setPublishedComments] = useState<
    {
      id: string;
      authorName: string;
      content: string;
      createdAt: string;
      adminReply?: string | null;
      adminReplyPublished?: boolean;
    }[]
  >([]);

  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [commentModalOpen, setCommentModalOpen] = useState(false);

  const loadEngagement = async () => {
    try {
      const vid = getVisitorId();
      const stats = await getPublicEngagement(targetType, slug, vid);
      setLikesCount(stats.totalLikes);
      setTotalComments(stats.totalComments);
      setPublishedComments(stats.publishedComments || []);
      setHasLiked(stats.hasLiked);
    } catch (err) {
      console.error("Failed to load public engagement:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEngagement();
  }, [targetType, slug]);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    try {
      const visitorId = getVisitorId();
      const newLikedState = !hasLiked;
      setHasLiked(newLikedState);
      setLikesCount((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

      const res = await toggleLike({
        targetType,
        slug,
        visitorId,
      });

      if (res.success) {
        await loadEngagement();
        if (newLikedState) {
          toast.success(`Liked ${itemTitle}! ❤️`);
        }
      }
    } catch (error) {
      console.error("Like toggle error:", error);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="mt-16 pt-10 border-t border-border/60 space-y-10">
      {/* 1. ENGAGEMENT SUMMARY BAR & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-500">
            Community Reactions
          </div>
          <h3 className="text-xl font-bold text-foreground">{itemTitle}</h3>
          <div className="flex items-center gap-4 text-xs font-mono font-bold pt-1">
            <span className="inline-flex items-center gap-1.5 text-emerald-500">
              <Heart className="h-4 w-4 fill-emerald-500" />
              <span>{isLoading ? "..." : likesCount} Likes</span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="inline-flex items-center gap-1.5 text-indigo-500">
              <MessageSquare className="h-4 w-4" />
              <span>{isLoading ? "..." : totalComments} Comments</span>
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS (LIKE & COMMENT) */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleLike}
            disabled={isLiking}
            aria-label="Like this item"
            className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-xs font-semibold transition-all duration-300 active:scale-95 shadow-sm min-h-[44px] ${
              hasLiked
                ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-500 font-bold"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            <Heart
              className={`h-4 w-4 transition-transform duration-300 ${
                hasLiked ? "fill-emerald-500 text-emerald-500 scale-110" : "text-emerald-500"
              }`}
            />
            <span>{hasLiked ? "Liked" : "Like"}</span>
          </button>

          <button
            type="button"
            onClick={() => setCommentModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20 transition-all active:scale-95 shadow-sm min-h-[44px]"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Comment</span>
          </button>
        </div>
      </div>

      {/* 2. PUBLISHED COMMENTS LIST */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            <h4 className="text-lg font-bold text-foreground">Comments</h4>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Displaying {publishedComments.length} published comment{publishedComments.length !== 1 ? "s" : ""} (Max 15)
          </span>
        </div>

        {publishedComments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {publishedComments.map((review) => (
              <div
                key={review.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-md space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold font-mono">
                        {review.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-foreground truncate">{review.authorName}</span>
                    </div>

                    <Heart className="h-3.5 w-3.5 text-emerald-500 fill-emerald-500/20 shrink-0" />
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line font-sans">
                    &ldquo;{review.content}&rdquo;
                  </p>

                  {/* VISUALLY DISTINCT ADMIN REPLY UNDERNEATH */}
                  {review.adminReply && (
                    <div className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px]">
                        <span>Admin Reply</span>
                      </div>
                      <p className="text-foreground leading-relaxed text-xs">
                        &ldquo;{review.adminReply}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/40 text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                  <span>Verified Comment</span>
                  <span>{formatTimeAgo(review.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/40 p-8 text-center text-xs text-muted-foreground space-y-2">
            <MessageSquare className="mx-auto h-8 w-8 text-indigo-500/60" />
            <p className="font-semibold text-foreground">No published comments yet.</p>
            <p>Be the first to leave a comment! Your comment will appear after admin review.</p>
          </div>
        )}
      </div>

      {/* SIMPLE ADD COMMENT MODAL FOR DETAIL PAGES */}
      <SimpleAddCommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        targetType={targetType}
        slug={slug}
        itemTitle={itemTitle}
        onSuccess={loadEngagement}
      />
    </div>
  );
}

function formatTimeAgo(dateStr: string | Date) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

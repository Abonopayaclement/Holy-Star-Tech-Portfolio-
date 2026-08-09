"use client";

import React, { useEffect, useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { getPublicEngagement, toggleLike } from "@/actions/engagement";
import { QuickCommentModal } from "@/components/public/QuickCommentModal";

interface CardEngagementProps {
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

export function CardEngagement({ targetType, slug, itemTitle }: CardEngagementProps) {
  const [likesCount, setLikesCount] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
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
      setHasLiked(stats.hasLiked);
    } catch (err) {
      console.error("Failed to load card engagement:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEngagement();
  }, [targetType, slug]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-3 text-xs font-mono font-bold">
        {/* LIKE BUTTON */}
        <button
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          aria-label="Like item"
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-all active:scale-95 min-h-[34px] ${
            hasLiked
              ? "border-rose-500/40 bg-rose-500/10 text-rose-500 font-bold"
              : "border-border/60 bg-accent/30 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
          }`}
        >
          <Heart
            className={`h-3.5 w-3.5 ${
              hasLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground group-hover:text-rose-500"
            }`}
          />
          <span>{isLoading ? "..." : likesCount}</span>
        </button>

        {/* COMMENT BUTTON */}
        <button
          type="button"
          onClick={handleCommentClick}
          aria-label="Comment on item"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/60 bg-accent/30 px-3 py-1.5 text-xs text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-500 transition-all active:scale-95 min-h-[34px]"
        >
          <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
          <span>{isLoading ? "..." : totalComments}</span>
        </button>
      </div>

      <QuickCommentModal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        targetType={targetType}
        slug={slug}
        itemTitle={itemTitle}
        onSuccess={loadEngagement}
      />
    </>
  );
}

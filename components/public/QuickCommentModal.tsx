"use client";

import React, { useState } from "react";
import { MessageSquare, Send, ShieldCheck, User, X } from "lucide-react";
import { toast } from "sonner";
import { addComment } from "@/actions/engagement";

interface QuickCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "BLOG" | "PROJECT";
  slug: string;
  itemTitle: string;
  onSuccess?: () => void;
}

export function QuickCommentModal({
  isOpen,
  onClose,
  targetType,
  slug,
  itemTitle,
  onSuccess,
}: QuickCommentModalProps) {
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = authorName.trim();
    const cleanContent = content.trim();

    if (!cleanName) {
      toast.error("Please enter your name.");
      return;
    }
    if (!cleanContent) {
      toast.error("Please enter your comment.");
      return;
    }
    if (cleanName.length > 50) {
      toast.error("Name must be under 50 characters.");
      return;
    }
    if (cleanContent.length > 1000) {
      toast.error("Comment must be under 1000 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addComment({
        targetType,
        slug,
        authorName: cleanName,
        content: cleanContent,
      });

      if (res.success) {
        toast.success(
          res.message || "Comment submitted! It will appear publicly once approved by the admin."
        );
        setAuthorName("");
        setContent("");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to submit comment.");
      }
    } catch (err) {
      console.error("Quick comment error:", err);
      toast.error("An error occurred while submitting your comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg space-y-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-bold text-foreground">Post Feedback & Review</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/60 bg-background/80 p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* TARGET TITLE */}
        <div className="rounded-2xl border border-border/60 bg-accent/20 p-3 space-y-0.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-500 font-semibold">
            Commenting on:
          </span>
          <h4 className="text-xs font-bold text-foreground line-clamp-1">{itemTitle}</h4>
        </div>

        {/* NOTICE BADGE */}
        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Comments are reviewed by the portfolio owner before appearing publicly.</span>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="e.g. Michael Vance"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                maxLength={50}
                required
                className="w-full rounded-xl border border-border/80 bg-background py-2.5 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Comment / Review
            </label>
            <textarea
              rows={4}
              placeholder="Share your feedback, thoughts, or questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              required
              className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y min-h-[90px]"
            />
            <div className="flex justify-end text-[11px] font-mono text-muted-foreground">
              {content.length}/1000
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[42px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 min-h-[42px]"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Submit Comment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Send, ShieldCheck, User, X } from "lucide-react";
import { toast } from "sonner";
import { addComment, getPublicEngagement } from "@/actions/engagement";

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
  const [loadingComments, setLoadingComments] = useState(true);
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

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const stats = await getPublicEngagement(targetType, slug);
      setPublishedComments(stats.publishedComments || []);
    } catch (err) {
      console.error("Failed to load comments in modal:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, targetType, slug]);

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
        fetchComments();
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border/80 bg-card p-5 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 font-bold">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Comments & Feedback</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{itemTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border/60 bg-background/80 p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* SCROLLABLE BODY CONTENT */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
          {/* APPROVED COMMENTS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Approved Comments ({publishedComments.length})
              </h4>
            </div>

            {loadingComments ? (
              <div className="py-6 text-center text-xs font-mono text-muted-foreground">
                Loading comments...
              </div>
            ) : publishedComments.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {publishedComments.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-border/60 bg-accent/20 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 text-[11px] font-bold font-mono">
                          {review.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground">{review.authorName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed pl-8">
                      {review.content}
                    </p>

                    {/* ADMIN REPLY UNDERNEATH */}
                    {review.adminReply && (
                      <div className="ml-8 mt-2.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 space-y-1 text-xs">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-[11px]">
                          <span>Admin Reply</span>
                        </div>
                        <p className="text-foreground leading-relaxed text-xs">
                          &ldquo;{review.adminReply}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-accent/10 p-4 text-center text-xs text-muted-foreground">
                No approved comments yet. Be the first to leave feedback!
              </div>
            )}
          </div>

          {/* SUBMISSION FORM */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Comments are reviewed by the admin before appearing publicly.</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Name *
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
                    className="w-full rounded-xl border border-border/80 bg-background py-2 pl-10 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500 min-h-[40px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Comment *
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your thoughts, feedback, or review..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={1000}
                  required
                  className="w-full rounded-xl border border-border/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y min-h-[75px]"
                />
                <div className="flex justify-end text-[10px] font-mono text-muted-foreground">
                  {content.length}/1000
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border/80 bg-background px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent hover:text-foreground transition-colors min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-xs font-semibold text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 min-h-[40px]"
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
      </div>
    </div>
  );
}

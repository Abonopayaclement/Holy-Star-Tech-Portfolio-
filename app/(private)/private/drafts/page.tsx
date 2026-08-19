"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  Clock,
  Edit3,
  FileEdit,
  Globe,
  ImageIcon,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import { BlogEditorModal } from "@/components/private/BlogEditorModal";
import {
  getDraftBlogPosts,
  togglePublishStatus,
  deleteBlogPost,
} from "@/actions/blog";

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
  images?: any;
  videos?: any;
  createdAt: any;
  updatedAt: any;
}

export default function PrivateDraftsPage() {
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<DraftPost | null>(null);

  const fetchDrafts = async () => {
    setLoading(true);
    try {
      const data = await getDraftBlogPosts();
      setDrafts(data as any);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load drafts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handlePublish = async (id: string, title: string) => {
    try {
      const res = await togglePublishStatus(id, true);
      if (res.success) {
        toast.success(`"${title}" published to live website!`);
        fetchDrafts();
      } else {
        toast.error(res.error || "Failed to publish post.");
      }
    } catch (error) {
      toast.error("Failed to publish post.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete draft "${title}"?`)) return;
    try {
      const res = await deleteBlogPost(id);
      if (res.success) {
        toast.success("Draft deleted successfully.");
        fetchDrafts();
      } else {
        toast.error(res.error || "Failed to delete draft.");
      }
    } catch (error) {
      toast.error("Failed to delete draft.");
    }
  };

  const handleEdit = (post: DraftPost) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setIsEditorOpen(true);
  };

  return (
    <AdminLayout title="Drafts & Unpublished Posts">
      <div className="space-y-6">
        {/* TOP HEADER & ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Unpublished Blog Drafts</h2>
            <p className="text-xs text-muted-foreground">
              Review, edit, attach media, and publish saved blog drafts to the website.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Create Draft
          </button>
        </div>

        {/* DRAFTS LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">Loading draft posts...</p>
          </div>
        ) : drafts.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-background/80 p-12 text-center backdrop-blur-md space-y-4">
            <FileEdit className="mx-auto h-12 w-12 text-pink-500 opacity-80" />
            <h3 className="text-lg font-bold text-foreground">No Draft Posts Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              You currently have no unpublished drafts. Create a draft post to refine content before publishing live.
            </p>
            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              Create First Draft
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {drafts.map((draft) => {
              const imageList = Array.isArray(draft.images) ? draft.images : [];
              const videoList = Array.isArray(draft.videos) ? draft.videos : [];
              const formattedDate = new Date(draft.updatedAt).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              );

              return (
                <div
                  key={draft.id}
                  className="rounded-3xl border border-border/60 bg-background/90 p-6 backdrop-blur-md shadow-sm space-y-4 hover:border-pink-500/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-pink-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-pink-400">
                          Draft (Unpublished)
                        </span>
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-400">
                          {draft.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{draft.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-pink-400" />
                      <span>Last edited: {formattedDate}</span>
                    </div>
                  </div>

                  {/* CONTENT PREVIEW */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {draft.excerpt || draft.content}
                  </p>

                  {/* MEDIA FILE INDICATORS */}
                  {imageList.length > 0 && (
                    <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground font-mono">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-accent/30 px-2.5 py-1">
                        <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                        {imageList.length} Images attached
                      </span>
                    </div>
                  )}

                  {/* BUTTON ACTION BAR */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePublish(draft.id, draft.title)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background shadow-xs hover:scale-105 transition-transform min-h-[38px]"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Publish
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(draft)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-accent/40 px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors min-h-[38px]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Draft
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(draft.id, draft.title)}
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

      {/* REUSABLE BLOG EDITOR MODAL */}
      <BlogEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={fetchDrafts}
        initialData={editingPost as any}
      />
    </AdminLayout>
  );
}

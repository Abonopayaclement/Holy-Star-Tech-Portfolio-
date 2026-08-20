"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Clock,
  Edit3,
  EyeOff,
  ImageIcon,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import { BlogEditorModal } from "@/components/private/BlogEditorModal";
import {
  getAllBlogPostsAdmin,
  togglePublishStatus,
  deleteBlogPost,
} from "@/actions/blog";
import { getDashboardEngagementSummary } from "@/actions/engagement";
import { Heart, MessageSquare } from "lucide-react";

interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  readTime: string;
  featured: boolean;
  published: boolean;
  images?: unknown;
  videos?: unknown;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export default function PrivateBlogPage() {
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [engagementSummary, setEngagementSummary] = useState<
    Record<string, { likes: number; comments: number; totalComments?: number; publishedComments?: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "published" | "drafts">("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostItem | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const data = await getAllBlogPostsAdmin();
      setPosts(data as unknown as BlogPostItem[]);
      const engagement = await getDashboardEngagementSummary();
      setEngagementSummary(engagement.blogStats);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleTogglePublish = async (id: string, currentPublished: boolean, title: string) => {
    try {
      const res = await togglePublishStatus(id, !currentPublished);
      if (res.success) {
        toast.success(
          !currentPublished
            ? `"${title}" published to live website!`
            : `"${title}" unpublished and moved to Drafts.`
        );
        fetchPosts();
      } else {
        toast.error(res.error || "Failed to update publish status.");
      }
    } catch {
      toast.error("Failed to update publish status.");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete article "${title}"?`)) return;
    try {
      const res = await deleteBlogPost(id);
      if (res.success) {
        toast.success("Blog post deleted successfully.");
        fetchPosts();
      } else {
        toast.error(res.error || "Failed to delete blog post.");
      }
    } catch {
      toast.error("Failed to delete blog post.");
    }
  };

  const handleEdit = (post: BlogPostItem) => {
    setEditingPost(post);
    setIsEditorOpen(true);
  };

  const handleCreateNew = () => {
    setEditingPost(null);
    setIsEditorOpen(true);
  };

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "published") return post.published;
    if (activeFilter === "drafts") return !post.published;
    return true;
  });

  const publishedCount = posts.filter((p) => p.published).length;
  const draftsCount = posts.filter((p) => !p.published).length;

  return (
    <AdminLayout title="Blog Management">
      <div className="space-y-6">
        {/* TOP HEADER & ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Blog Posts & Drafts</h2>
            <p className="text-xs text-muted-foreground">
              Write, edit, manage attachments, publish, and unpublish blog posts.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105 min-h-[44px]"
          >
            <Plus className="h-4 w-4" />
            Create Post
          </button>
        </div>

        {/* TAB FILTER TOOLBAR */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-4">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-foreground text-background shadow-xs"
                : "border border-border/60 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            All Posts ({posts.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("published")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeFilter === "published"
                ? "bg-emerald-500 text-white shadow-xs"
                : "border border-border/60 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            Published ({publishedCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("drafts")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              activeFilter === "drafts"
                ? "bg-pink-500 text-white shadow-xs"
                : "border border-border/60 bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            Drafts ({draftsCount})
          </button>
        </div>

        {/* POSTS LIST */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">Loading blog posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-3xl border border-border/60 bg-background/80 p-12 text-center backdrop-blur-md space-y-4">
            <BookOpen className="mx-auto h-12 w-12 text-indigo-500 opacity-80" />
            <h3 className="text-lg font-bold text-foreground">No Posts Found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {activeFilter === "published"
                ? "No published blog posts currently exist."
                : activeFilter === "drafts"
                ? "No unpublished drafts found."
                : "Get started by creating your first technical blog post."}
            </p>
            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-400 hover:bg-indigo-500/20"
            >
              <Plus className="h-4 w-4" />
              Create Post
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredPosts.map((post) => {
              const imageList = Array.isArray(post.images) ? post.images : [];
              const formattedDate = new Date(post.updatedAt).toLocaleDateString(
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
                  key={post.id}
                  className="rounded-3xl border border-border/60 bg-card text-card-foreground p-6 shadow-sm space-y-4 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {post.published ? (
                          <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                            ● Published Live
                          </span>
                        ) : (
                          <span className="rounded-full bg-pink-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-pink-400">
                            ○ Draft
                          </span>
                        )}
                        <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-400">
                          {post.category}
                        </span>
                        {post.featured && (
                          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                            Featured
                          </span>
                        )}
                        {(() => {
                          const stats = engagementSummary[post.id] || engagementSummary[post.slug] || { likes: 0, comments: 0, totalComments: 0 };
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
                      <h3 className="text-lg font-bold text-foreground">{post.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {/* EXCERPT PREVIEW */}
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {post.excerpt || post.content}
                  </p>

                  {/* MEDIA FILE INDICATORS */}
                  {imageList.length > 0 && (
                    <div className="flex items-center gap-3 pt-2 text-xs text-muted-foreground font-mono">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-accent/30 px-2.5 py-1">
                        <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                        {imageList.length} Images
                      </span>
                    </div>
                  )}

                  {/* BUTTON ACTIONS */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(post)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:scale-105 transition-transform min-h-[38px]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit Article
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePublish(post.id, post.published, post.title)
                        }
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition-colors min-h-[38px] ${
                          post.published
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        {post.published ? (
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
                      onClick={() => handleDelete(post.id, post.title)}
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
        onSuccess={fetchPosts}
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
                images: Array.isArray(editingPost.images) ? (editingPost.images as string[]) : [],
              }
            : undefined
        }
      />
    </AdminLayout>
  );
}

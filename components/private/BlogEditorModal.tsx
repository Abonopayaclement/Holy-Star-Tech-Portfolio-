"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  X,
  Upload,
  Eye,
  Edit3,
  Send,
  Save,
  Loader2,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { createBlogPost, updateBlogPost, BlogPostInput } from "@/actions/blog";
import { deleteComment, getEngagementStats } from "@/actions/engagement";
import { SeoPreviewModal } from "@/components/private/SeoPreviewModal";
import { PromotionKitModal } from "@/components/shared/PromotionKitModal";
import { MessageSquare, Heart } from "lucide-react";

interface BlogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    readTime: string;
    featured: boolean;
    published: boolean;
    images?: string[];
  } | null;
}

export function BlogEditorModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: BlogEditorModalProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [category, setCategory] = useState(initialData?.category || "Architecture");
  const [readTime, setReadTime] = useState(initialData?.readTime || "5 min read");
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [images, setImages] = useState<string[]>(initialData?.images || []);

  const [activeTab, setActiveTab] = useState<"write" | "preview" | "comments">("write");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [seoModalOpen, setSeoModalOpen] = useState(false);
  const [promoKitOpen, setPromoKitOpen] = useState(false);

  const [commentsList, setCommentsList] = useState<Array<{ id: string; authorName: string; content: string; createdAt: string | Date; published?: boolean }>>([]);
  const [likesCount, setLikesCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadEngagement = async () => {
    if (initialData?.slug) {
      try {
        const stats = await getEngagementStats("BLOG", initialData.slug);
        setCommentsList(stats.commentsList);
        setLikesCount(stats.likesCount);
      } catch (err) {
        console.error("Failed to fetch comments for blog:", err);
      }
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      await deleteComment(commentId);
      toast.success("Comment deleted.");
      loadEngagement();
    }
  };

  React.useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title);
      setSlug(initialData.slug);
      setExcerpt(initialData.excerpt);
      setContent(initialData.content);
      setCategory(initialData.category || "Architecture");
      setReadTime(initialData.readTime || "5 min read");
      setFeatured(initialData.featured || false);
      setImages(initialData.images || []);
      loadEngagement();
    } else {
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setCategory("Architecture");
      setReadTime("5 min read");
      setFeatured(false);
      setImages([]);
      setCommentsList([]);
      setLikesCount(0);
    }
  }, [initialData, isOpen]);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      setSlug(generatedSlug);
    }
  };

  // Insert markdown formatting into textarea
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || "text";
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 50);
  };

  // Insert hyperlink prompt
  const insertHyperlink = () => {
    const url = prompt("Enter hyperlink URL (e.g. https://example.com):");
    if (!url) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || "Link Title";
    const replacement = `[${selectedText}](${url})`;
    const newContent =
      content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
  };

  // Handle direct file upload from phone or computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const toastId = toast.loading("Uploading file...", { id: "upload-status" });
    setIsUploading(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!data.success || !data.url) {
        throw new Error(data.error || "Failed to upload file.");
      }

      if (data.url) {
        if (data.fileType === "image") {
          setImages((prev: string[]) => [...prev, data.url]);
          // Append image markdown snippet to content
          setContent((prev) => prev + `\n\n![${data.fileName}](${data.url})\n`);
        } else if (data.fileType === "video") {
          setImages((prev: string[]) => [...prev, data.url]);
          // Append video HTML snippet to content
          setContent((prev) => prev + `\n\n<video src="${data.url}" controls class="w-full rounded-2xl my-4"></video>\n`);
        }
      }

      toast.success("File uploaded and attached to article successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to upload file.", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Submit Handler: publishNow boolean differentiates "Save as Draft" vs "Publish"
  const handleSubmit = async (publishNow: boolean) => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Please fill in Title, Slug, and Post Content.");
      return;
    }

    setIsSubmitting(true);
    const payload: BlogPostInput = {
      title,
      slug,
      excerpt: excerpt || title,
      content,
      category,
      readTime,
      featured,
      published: publishNow,
      images,
    };

    try {
      if (initialData?.id) {
        const res = await updateBlogPost(initialData.id, payload);
        if (res.success) {
          toast.success(
            publishNow
              ? "Blog post published immediately!"
              : "Draft post updated successfully!"
          );
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "Failed to update article.");
        }
      } else {
        const res = await createBlogPost(payload);
        if (res.success) {
          toast.success(
            publishNow
              ? "Blog post published to website!"
              : "Draft post saved successfully!"
          );
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "Failed to create article.");
        }
      }
    } catch {
      toast.error("An error occurred while saving post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-6">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-border/60 p-5 bg-accent/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 font-bold">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {initialData ? "Edit Blog Post" : "Create New Blog Post"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Rich Text Editor with Image Uploads & Mobile Support
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* MODAL BODY FORM */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TITLE & SLUG */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Post Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Architecting Scalable Web Systems"
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                URL Slug *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. architecting-scalable-web-systems"
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          {/* CATEGORY & FEATURED TOGGLE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              >
                <option value="Architecture">Architecture</option>
                <option value="Next.js">Next.js</option>
                <option value="Database">Database</option>
                <option value="TypeScript">TypeScript</option>
                <option value="DevOps">DevOps</option>
                <option value="AI Integration">AI Integration</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                />
                Mark as Featured Post
              </label>
            </div>
          </div>

          {/* EXCERPT */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Excerpt / Brief Summary
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary displayed on post lists..."
              className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden resize-none transition-colors"
            />
          </div>

          {/* RICH TEXT EDITOR TOOLBAR & TAB SELECTOR */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
              <div className="flex items-center gap-1 rounded-xl bg-accent/40 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "write"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" /> Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab === "preview"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </button>
                {initialData && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("comments")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      activeTab === "comments"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-500" /> Comments ({commentsList.length})
                  </button>
                )}
              </div>

              {/* UPLOAD FILE DIRECTLY FROM PHONE OR DESKTOP */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-all hover:bg-indigo-500/20 active:scale-95 disabled:opacity-50 min-h-[36px]"
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  <span>Upload Media (Photo/Video)</span>
                </button>
              </div>
            </div>

            {/* FORMATTING TOOLBAR BUTTONS */}
            {activeTab === "write" && (
              <div className="flex flex-wrap items-center gap-1 rounded-xl border border-border/80 bg-accent/30 p-1.5">
                <button
                  type="button"
                  onClick={() => insertFormatting("# ", "")}
                  title="Heading 1"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Heading1 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("## ", "")}
                  title="Heading 2"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Heading2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("### ", "")}
                  title="Heading 3"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Heading3 className="h-4 w-4" />
                </button>
                <div className="h-4 w-[1px] bg-border/60 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting("**", "**")}
                  title="Bold"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("*", "*")}
                  title="Italic"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("> ", "")}
                  title="Quote"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Quote className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("```\n", "\n```")}
                  title="Code Block"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <Code className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={insertHyperlink}
                  title="Link"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
                <div className="h-4 w-[1px] bg-border/60 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting("- ", "")}
                  title="Bullet List"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("1. ", "")}
                  title="Numbered List"
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* TAB CONTENT: WRITE / PREVIEW / COMMENTS */}
            {activeTab === "write" ? (
              <textarea
                ref={textareaRef}
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write article markdown content... You can upload photos/videos above or type markdown directly."
                className="w-full rounded-2xl border border-border/80 bg-background p-4 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden leading-relaxed resize-y transition-colors"
              />
            ) : activeTab === "preview" ? (
              /* PREVIEW TAB */
              <div className="min-h-[300px] w-full rounded-2xl border border-border/80 bg-background p-6 space-y-4 overflow-y-auto">
                <div className="border-b border-border/60 pb-3">
                  <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-500">
                    {category}
                  </span>
                  <h1 className="text-2xl font-bold text-foreground mt-2">{title || "Untitled Post"}</h1>
                  <p className="text-xs text-muted-foreground mt-1">{excerpt}</p>
                </div>
                <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {content || "No post content written yet..."}
                </div>
              </div>
            ) : (
              /* COMMENTS TAB */
              <div className="min-h-[300px] w-full rounded-2xl border border-border/80 bg-background p-6 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-500" />
                    <span>User Comments ({commentsList.length})</span>
                  </h3>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" /> {likesCount} Likes
                  </span>
                </div>

                {commentsList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">
                    No comments submitted for this blog article yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {commentsList.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-accent/20 p-3.5 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{c.authorName}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                            {!c.published && (
                              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                                Pending Approval
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground">{c.content}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                          title="Delete Comment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/60 p-5 bg-accent/30">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setSeoModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors min-h-[44px]"
            >
              <Search className="h-3.5 w-3.5 text-amber-500" />
              <span>SEO Preview</span>
            </button>

            <button
              type="button"
              onClick={() => setPromoKitOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors min-h-[44px]"
            >
              <Share2 className="h-3.5 w-3.5 text-indigo-500" />
              <span>Promo Kit</span>
            </button>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            {/* SAVE AS DRAFT */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition-transform active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>Save as Draft</span>
            </button>

            {/* PUBLISH NOW */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Publish Post</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEO PREVIEW MODAL */}
      <SeoPreviewModal
        isOpen={seoModalOpen}
        onClose={() => setSeoModalOpen(false)}
        title={title}
        description={excerpt}
        slug={slug}
        image={images[0]}
        type="article"
      />

      {/* PROMOTION KIT MODAL */}
      <PromotionKitModal
        isOpen={promoKitOpen}
        onClose={() => setPromoKitOpen(false)}
        title={title || "Untitled Post"}
        excerpt={excerpt}
        url={`https://holystar.tech/blog/${slug}`}
        image={images[0]}
      />
    </div>
  );
}

"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Download,
  ExternalLink,
  FolderGit2,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { createProject, updateProject, ProjectInput } from "@/actions/projects";
import { Heart, HeartHandshake, MessageSquare } from "lucide-react";

interface ProjectFormProps {
  initialData?: {
    id?: string;
    title: string;
    slug: string;
    tagline: string;
    description: string;
    fullDescription: string;
    systemArchitecture?: string | null;
    status?: string | null;
    classification?: string | null;
    categoryType: "WEB_APP" | "MOBILE_APP" | "UI_UX" | "ACADEMIC" | "OTHER";
    featured: boolean;
    published: boolean;
    featuredImage?: string | null;
    gradient?: string;
    techStack: string[];
    features: string[];
    screenshots: any[];
    githubUrl?: string | null;
    liveUrl?: string | null;
    apkUrl?: string | null;
    version?: string | null;
    androidVersion?: string | null;
    challenges: string[];
    solutions: string[];
    lessonsLearned: string[];
    futureImprovements?: string[];
  } | null;
}

export function ProjectForm({ initialData }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Basic Details
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [tagline, setTagline] = useState(initialData?.tagline || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [fullDescription, setFullDescription] = useState(
    initialData?.fullDescription || ""
  );
  const [systemArchitecture, setSystemArchitecture] = useState(
    (initialData as any)?.systemArchitecture || ""
  );
  const [classification, setClassification] = useState(
    (initialData as any)?.classification || "Personal Project"
  );
  const [status, setStatus] = useState(
    (initialData as any)?.status || "Completed"
  );
  const [categoryType, setCategoryType] = useState<
    "WEB_APP" | "MOBILE_APP" | "UI_UX" | "ACADEMIC" | "OTHER"
  >(initialData?.categoryType || "WEB_APP");
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [published, setPublished] = useState(initialData?.published ?? true);

  // URLs & Media
  const [featuredImage, setFeaturedImage] = useState<string>(
    initialData?.featuredImage || ""
  );
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || "");
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl || "");

  // Mobile App Specific
  const [apkUrl, setApkUrl] = useState(initialData?.apkUrl || "");
  const [version, setVersion] = useState(initialData?.version || "");
  const [androidVersion, setAndroidVersion] = useState(
    initialData?.androidVersion || ""
  );

  // Dynamic Lists & Tags
  const [techStack, setTechStack] = useState<string[]>(
    initialData?.techStack || []
  );
  const [techInput, setTechInput] = useState("");

  const [features, setFeatures] = useState<string[]>(
    initialData?.features || []
  );
  const [featureInput, setFeatureInput] = useState("");

  const [screenshots, setScreenshots] = useState<
    { title: string; subtitle: string; aspect: string; imagePath: string }[]
  >(initialData?.screenshots || []);

  const [challenges, setChallenges] = useState<string[]>(
    initialData?.challenges || []
  );
  const [challengeInput, setChallengeInput] = useState("");

  const [solutions, setSolutions] = useState<string[]>(
    initialData?.solutions || []
  );
  const [solutionInput, setSolutionInput] = useState("");

  const [lessonsLearned, setLessonsLearned] = useState<string[]>(
    initialData?.lessonsLearned || []
  );
  const [lessonInput, setLessonInput] = useState("");

  const [futureImprovements, setFutureImprovements] = useState<string[]>(
    (initialData as any)?.futureImprovements || []
  );
  const [futureInput, setFutureInput] = useState("");

  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const apkInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate slug
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

  // Helper file upload handler
  const uploadFile = async (
    file: File,
    fieldKey: string
  ): Promise<string | null> => {
    setUploadingField(fieldKey);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Upload failed");
      }
      return data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to upload file.");
      return null;
    } finally {
      setUploadingField(null);
    }
  };

  const handleFeaturedImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "featuredImage");
    if (url) {
      setFeaturedImage(url);
      toast.success("Featured hero image uploaded!");
    }
  };

  const handleScreenshotUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const url = await uploadFile(files[i], "screenshots");
      if (url) {
        setScreenshots((prev) => [
          ...prev,
          {
            title: files[i].name.replace(/\.[^/.]+$/, ""),
            subtitle: "System Interface Screen",
            aspect: "aspect-video",
            imagePath: url,
          },
        ]);
      }
    }
    toast.success("Screenshot(s) added to gallery!");
  };

  const handleApkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "apk");
    if (url) {
      setApkUrl(url);
      toast.success("Android APK file uploaded successfully!");
    }
  };

  // Tech Stack Handlers
  const addTech = () => {
    if (!techInput.trim()) return;
    if (!techStack.includes(techInput.trim())) {
      setTechStack([...techStack, techInput.trim()]);
    }
    setTechInput("");
  };

  const removeTech = (item: string) => {
    setTechStack(techStack.filter((t) => t !== item));
  };

  // Feature Handlers
  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFeatures([...features, featureInput.trim()]);
    setFeatureInput("");
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const removeChallenge = (index: number) => {
    setChallenges(challenges.filter((_, i) => i !== index));
  };

  const addChallenge = () => {
    if (!challengeInput.trim()) return;
    setChallenges([...challenges, challengeInput.trim()]);
    setChallengeInput("");
  };

  const removeSolution = (index: number) => {
    setSolutions(solutions.filter((_, i) => i !== index));
  };

  const addSolution = () => {
    if (!solutionInput.trim()) return;
    setSolutions([...solutions, solutionInput.trim()]);
    setSolutionInput("");
  };

  const removeLesson = (index: number) => {
    setLessonsLearned(lessonsLearned.filter((_, i) => i !== index));
  };

  const addLesson = () => {
    if (!lessonInput.trim()) return;
    setLessonsLearned([...lessonsLearned, lessonInput.trim()]);
    setLessonInput("");
  };

  const removeFuture = (index: number) => {
    setFutureImprovements(futureImprovements.filter((_, i) => i !== index));
  };

  const addFuture = () => {
    if (!futureInput.trim()) return;
    setFutureImprovements([...futureImprovements, futureInput.trim()]);
    setFutureInput("");
  };

  const handleSubmit = async (publishNow: boolean) => {
    if (!title.trim() || !slug.trim() || !description.trim()) {
      toast.error("Please fill in Title, Slug, and Short Summary.");
      return;
    }

    setIsSubmitting(true);
    const payload: ProjectInput = {
      title,
      slug,
      tagline: tagline || title,
      description,
      fullDescription: fullDescription || description,
      systemArchitecture: systemArchitecture || null,
      classification: classification || null,
      status: status || "Completed",
      categoryType,
      featured,
      published: publishNow,
      featuredImage: featuredImage || null,
      gradient: "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
      techStack,
      features,
      screenshots,
      githubUrl: githubUrl || null,
      liveUrl: liveUrl || null,
      apkUrl: apkUrl || null,
      version: version || null,
      androidVersion: androidVersion || null,
      challenges,
      solutions,
      lessonsLearned,
      futureImprovements,
    };

    try {
      if (initialData?.id) {
        const res = await updateProject(initialData.id, payload);
        if (res.success) {
          toast.success("Project updated successfully!");
          router.push("/private/projects");
        } else {
          toast.error(res.error || "Failed to update project.");
        }
      } else {
        const res = await createProject(payload);
        if (res.success) {
          toast.success(
            publishNow
              ? "Project created and published!"
              : "Draft project saved successfully!"
          );
          router.push("/private/projects");
        } else {
          toast.error(res.error || "Failed to create project.");
        }
      }
    } catch (error: any) {
      toast.error("An error occurred while saving project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/private/projects")}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {initialData ? "Edit Project" : "Create New Project"}
            </h2>
            <p className="text-xs text-muted-foreground">
              Configure project details, categories, media assets, and mobile APK settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all min-h-[44px]"
          >
            <Save className="h-4 w-4" /> Save as Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background shadow-md hover:scale-105 transition-transform min-h-[44px]"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish Project
          </button>
        </div>
      </div>

      {/* FORM BODY CARDS */}
      <div className="space-y-6">
        {/* CARD 1: CORE INFORMATION */}
        <div className="rounded-3xl border border-border/60 bg-card text-card-foreground p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
            <FolderGit2 className="h-5 w-5 text-indigo-500" /> General Project Details
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. Next.js Architecture Engine"
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
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
                placeholder="e.g. nextjs-architecture-engine"
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category *
              </label>
              <select
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value as any)}
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              >
                <option value="WEB_APP">Web Applications</option>
                <option value="MOBILE_APP">Mobile Applications</option>
                <option value="ACADEMIC">Academic Projects</option>
                <option value="UI_UX">UI/UX Designs</option>
                <option value="OTHER">Other Projects</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Classification
              </label>
              <input
                type="text"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                placeholder="e.g. Academic Project, Commercial Product, Personal Project"
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tagline / Short Subtitle
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. High-throughput distributed web framework"
              className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Short Summary *
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary displayed on project cards..."
              className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden resize-none transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Executive Summary & Full Overview *
            </label>
            <textarea
              rows={4}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Comprehensive executive summary, scope, and problem statement..."
              className="w-full rounded-xl border border-border/80 bg-background/90 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden resize-y transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              System Architecture & Engineering Information
            </label>
            <textarea
              rows={4}
              value={systemArchitecture}
              onChange={(e) => setSystemArchitecture(e.target.value)}
              placeholder="Detailed system architecture, design patterns, modular state management, and engineering approach..."
              className="w-full rounded-xl border border-border/80 bg-background/90 p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden resize-y transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
              />
              Feature on Homepage & Featured Section
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-foreground">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
              />
              Publish immediately on Public Projects Page
            </label>
          </div>
        </div>

        {/* CARD 2: MOBILE APPLICATION SETTINGS (CONDITIONAL) */}
        {categoryType === "MOBILE_APP" && (
          <div className="rounded-3xl border border-indigo-500/30 bg-card text-card-foreground p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-indigo-500 flex items-center gap-2 border-b border-border/60 pb-3">
              <Download className="h-5 w-5" /> Mobile Application Download & Specifications
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v1.4.2"
                  className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Android Version Supported
                </label>
                <input
                  type="text"
                  value={androidVersion}
                  onChange={(e) => setAndroidVersion(e.target.value)}
                  placeholder="e.g. Android 8.0 (Oreo) and above"
                  className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                />
              </div>
            </div>

            {/* APK FILE UPLOADER */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upload Android APK File
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={apkInputRef}
                  onChange={handleApkUpload}
                  accept=".apk"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => apkInputRef.current?.click()}
                  disabled={uploadingField === "apk"}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20 transition-all min-h-[44px]"
                >
                  {uploadingField === "apk" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Select APK from Computer or Phone
                </button>

                {apkUrl && (
                  <span className="truncate text-xs font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                    ✓ APK Uploaded: {apkUrl}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CARD 3: LINKS & URLS */}
        <div className="rounded-3xl border border-border/60 bg-card text-card-foreground p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
            <ExternalLink className="h-5 w-5 text-indigo-500" /> Links & Repository URLs
          </h3>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Live Demo URL (Optional)
              </label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://my-demo-app.com"
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>
          </div>
        </div>

        {/* CARD 4: MEDIA UPLOADS & INTERFACE GALLERY */}
        <div className="rounded-3xl border border-border/60 bg-card text-card-foreground p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
            <ImageIcon className="h-5 w-5 text-indigo-500" /> Interface Gallery Images
          </h3>

          {/* FEATURED IMAGE */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Featured Hero Image
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={featuredImageInputRef}
                onChange={handleFeaturedImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => featuredImageInputRef.current?.click()}
                disabled={uploadingField === "featuredImage"}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-500 hover:bg-indigo-500/20 transition-all min-h-[44px]"
              >
                {uploadingField === "featuredImage" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload Hero Image
              </button>

              {featuredImage && (
                <div className="h-16 w-28 overflow-hidden rounded-xl border border-border/60 bg-background relative">
                  <img
                    src={featuredImage}
                    alt="Featured preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SCREENSHOTS GALLERY */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Interface Gallery Images ({screenshots.length} uploaded)
              </label>
              <input
                type="file"
                ref={screenshotInputRef}
                onChange={handleScreenshotUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <button
                type="button"
                onClick={() => screenshotInputRef.current?.click()}
                disabled={uploadingField === "screenshots"}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-accent/40 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-all min-h-[36px]"
              >
                {uploadingField === "screenshots" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Add Gallery Images
              </button>
            </div>

            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {screenshots.map((s, idx) => (
                  <div
                    key={idx}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background p-2"
                  >
                    <div className="h-24 w-full overflow-hidden rounded-lg bg-black/40">
                      <img
                        src={s.imagePath}
                        alt={s.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="mt-2 text-xs font-bold text-foreground truncate">
                      {s.title}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setScreenshots(screenshots.filter((_, i) => i !== idx))
                      }
                      className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CARD 5: TECH STACK & FEATURES BUILDERS */}
        <div className="rounded-3xl border border-border/60 bg-card text-card-foreground p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
            <Code2 className="h-5 w-5 text-indigo-500" /> Technologies & Core Features
          </h3>

          {/* TECH STACK */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Technologies Used
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTech();
                  }
                }}
                placeholder="e.g. Next.js 15, TypeScript, Prisma (Press Enter)"
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={addTech}
                className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:scale-105 transition-transform min-h-[44px]"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-accent/40 px-3 py-1 text-xs font-mono text-foreground"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTech(tech)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* CORE FEATURES */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Core System Features
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFeature();
                  }
                }}
                placeholder="e.g. Type-safe Server Actions with Zod validation"
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={addFeature}
                className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:scale-105 transition-transform min-h-[44px]"
              >
                Add Feature
              </button>
            </div>

            <ul className="space-y-2 pt-2">
              {features.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-accent/20 px-3.5 py-2 text-xs text-foreground"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    {feat}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CARD 6: CHALLENGES, SOLUTIONS, LESSONS LEARNED & ROADMAP */}
        <div className="rounded-3xl border border-border/60 bg-card text-card-foreground p-6 sm:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-500" /> Engineering Analysis & Future Roadmap
          </h3>

          {/* CHALLENGES ENCOUNTERED */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Challenges Encountered
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChallenge();
                  }
                }}
                placeholder="e.g. Preventing double-booking race conditions..."
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={addChallenge}
                className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:scale-105 transition-transform min-h-[44px]"
              >
                Add Challenge
              </button>
            </div>

            <ul className="space-y-2 pt-2">
              {challenges.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-accent/20 px-3.5 py-2 text-xs text-foreground"
                >
                  <span>• {item}</span>
                  <button
                    type="button"
                    onClick={() => removeChallenge(idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ENGINEERED SOLUTIONS */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Engineered Solutions
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={solutionInput}
                onChange={(e) => setSolutionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSolution();
                  }
                }}
                placeholder="e.g. Implemented strict database transaction locks..."
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={addSolution}
                className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:scale-105 transition-transform min-h-[44px]"
              >
                Add Solution
              </button>
            </div>

            <ul className="space-y-2 pt-2">
              {solutions.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-accent/20 px-3.5 py-2 text-xs text-foreground"
                >
                  <span>• {item}</span>
                  <button
                    type="button"
                    onClick={() => removeSolution(idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* LESSONS LEARNED */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lessons Learned
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={lessonInput}
                onChange={(e) => setLessonInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLesson();
                  }
                }}
                placeholder="e.g. Automated validation prevents administrative booking errors..."
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={addLesson}
                className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:scale-105 transition-transform min-h-[44px]"
              >
                Add Lesson
              </button>
            </div>

            <ul className="space-y-2 pt-2">
              {lessonsLearned.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-accent/20 px-3.5 py-2 text-xs text-foreground"
                >
                  <span>✓ {item}</span>
                  <button
                    type="button"
                    onClick={() => removeLesson(idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* FUTURE ROADMAP / PLANNED ENHANCEMENTS */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Planned Enhancements & Future Roadmap
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={futureInput}
                onChange={(e) => setFutureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFuture();
                  }
                }}
                placeholder="e.g. Paystack payment gateway integration for online payments..."
                className="w-full rounded-xl border border-border/80 bg-background/90 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={addFuture}
                className="rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:scale-105 transition-transform min-h-[44px]"
              >
                Add Roadmap Item
              </button>
            </div>

            <ul className="space-y-2 pt-2">
              {futureImprovements.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-accent/20 px-3.5 py-2 text-xs text-foreground"
                >
                  <span>• {item}</span>
                  <button
                    type="button"
                    onClick={() => removeFuture(idx)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* CENTRAL ENGAGEMENT MODERATION NOTE */}
          {initialData?.slug && (
            <div className="flex items-center justify-between rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-xs mt-6">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold">
                <HeartHandshake className="h-4 w-4" />
                <span>Visitor Comments & Feedback Moderation</span>
              </div>
              <Link
                href="/private/engagement"
                className="inline-flex items-center gap-1 font-bold text-indigo-500 hover:underline"
              >
                <span>Manage on Engagement Page →</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

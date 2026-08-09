"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  Clock,
  Hammer,
  Image as ImageIcon,
  Loader2,
  Save,
  Upload,
} from "lucide-react";
import { AdminLayout } from "@/components/private/AdminLayout";
import { getActiveWork, updateActiveWork } from "@/actions/active-work";

export default function PrivateActiveProjectPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState<number>(75);
  const [status, setStatus] = useState<"Planning" | "In Progress" | "Testing" | "Completed">("In Progress");
  const [image, setImage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getActiveWork();
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setProgress(data.progress || 75);
          setStatus((data.status as any) || "In Progress");
          setImage(data.image || "");
        }
      } catch (err) {
        toast.error("Failed to load active project status.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a project title.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateActiveWork({
        title,
        description,
        progress,
        status,
        image,
      });

      if (res.success) {
        toast.success("Active project updated site-wide!");
      } else {
        toast.error(res.error || "Failed to update active project.");
      }
    } catch (err) {
      toast.error("Error saving active project.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast.loading("Uploading image...", { id: "img-upload" });
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.url) {
        setImage(data.url);
        toast.success("Image uploaded! Click Save to apply.", { id: "img-upload" });
      } else {
        toast.error("Upload failed.", { id: "img-upload" });
      }
    } catch (err) {
      toast.error("Error uploading image.", { id: "img-upload" });
    }
  };

  return (
    <AdminLayout title="Currently Working On">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" /> Active Project Tracker
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage the "Currently Working On" status card displayed on the public homepage.
            </p>
          </div>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background shadow-md hover:scale-105 transition-transform min-h-[44px]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Active Status
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-xs text-muted-foreground font-mono">Loading active project...</p>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/80 bg-card text-card-foreground p-6 sm:p-8 shadow-xl space-y-6">
            {/* PROJECT TITLE */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Enterprise Microservices Architecture & Real-Time Engine"
                className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Short Description & Goals
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe current architecture milestones and technical goals..."
                className="w-full rounded-xl border border-border/80 bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-indigo-500 focus:outline-hidden resize-y transition-colors"
              />
            </div>

            {/* PROGRESS PERCENTAGE SLIDER & STATUS SELECT */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Development Progress</span>
                  <span className="font-mono text-indigo-500 font-bold">{progress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 rounded-lg bg-accent accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Lifecycle Phase
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-xl border border-border/80 bg-background px-4 py-2.5 text-sm text-foreground focus:border-indigo-500 focus:outline-hidden transition-colors"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Testing">Testing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {/* FEATURED IMAGE UPLOADER */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Featured Cover Image
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all min-h-[44px]"
                >
                  <Upload className="h-4 w-4" /> Upload Cover Photo
                </button>

                {image && (
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-16 overflow-hidden rounded-lg border border-border bg-accent/40">
                      <img src={image} alt="Cover Preview" className="h-full w-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="text-xs text-destructive hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE PREVIEW CARD */}
            <div className="space-y-2 pt-4 border-t border-border/60">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Homepage Card Live Mockup
              </label>
              <div className="rounded-3xl border border-indigo-500/30 bg-background p-6 shadow-md space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Hammer className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
                      Currently Working On
                    </span>
                  </div>
                  <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-mono text-xs font-bold text-indigo-500">
                    ● {status}
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-foreground">{title || "Project Title Placeholder"}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {description || "Short description placeholder..."}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                    <span>Milestone Progress</span>
                    <span className="font-bold text-foreground">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

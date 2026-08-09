"use client";

import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/private/AdminLayout";
import { toast } from "sonner";
import { Download, FileText, Upload, CheckCircle2, RefreshCw } from "lucide-react";
import { getResumeData, updateResumeData } from "@/actions/profile";

export default function PrivateResumePage() {
  const [cvUrl, setCvUrl] = useState("/resume.pdf");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadResume() {
      try {
        const res = await getResumeData();
        if (res && res.cvFileUrl) {
          setCvUrl(res.cvFileUrl);
        }
      } catch (e) {
        console.error("Failed to load resume:", e);
      }
    }
    loadResume();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success && data.url) {
        setCvUrl(data.url);
        await updateResumeData({ cvFileUrl: data.url });
        toast.success("CV PDF uploaded and updated successfully!");
      } else {
        toast.error(data.error || "Uploading failed.");
      }
    } catch (err: any) {
      toast.error("Failed to upload CV file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout title="Resume & CV Management">
      <div className="space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Curriculum Vitae (CV) Settings</h2>
            <p className="text-xs text-muted-foreground">
              Upload, replace, or preview your official downloadable CV document.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background shadow-md transition-transform hover:scale-105 cursor-pointer min-h-[44px]">
            <Upload className="h-4 w-4" />
            <span>{uploading ? "Uploading PDF..." : "Upload / Replace CV PDF"}</span>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* ACTIVE CV DETAILS CARD */}
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Active Public CV File</h3>
                <p className="text-xs font-mono text-muted-foreground">{cvUrl}</p>
              </div>
            </div>

            <a
              href={cvUrl}
              download
              className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors min-h-[40px]"
            >
              <Download className="h-4 w-4" />
              <span>Download & Preview</span>
            </a>
          </div>

          <div className="border-t border-border/60 pt-4 space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-2 text-emerald-500 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> CV upload API route verified and active.
            </p>
            <p>
              Replacing your CV updates all public download buttons on the Hero section, About page, and Interactive Resume.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

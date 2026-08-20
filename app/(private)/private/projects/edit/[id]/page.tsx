"use client";

import React, { useState, useEffect, use } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/private/AdminLayout";
import { ProjectForm } from "@/components/private/ProjectForm";
import { getProjectById } from "@/actions/projects";

import { ProjectInput } from "@/actions/projects";

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function PrivateEditProjectPage({ params }: EditProjectPageProps) {
  const resolvedParams = use(params);
  const [project, setProject] = useState<(ProjectInput & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await getProjectById(resolvedParams.id);
        if (data) {
          setProject({
            id: data.id,
            title: data.title,
            slug: data.slug,
            tagline: data.tagline,
            description: data.description,
            fullDescription: data.fullDescription,
            categoryType: data.categoryType,
            featured: data.featured,
            published: data.published,
            featuredImage: data.featuredImage,
            gradient: data.gradient || "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
            techStack: Array.isArray(data.techStack) ? (data.techStack as string[]) : [],
            features: Array.isArray(data.features) ? (data.features as string[]) : [],
            screenshots: Array.isArray(data.screenshots) ? (data.screenshots as Array<{ title: string; subtitle: string; aspect: string; imagePath: string }>) : [],
            githubUrl: data.githubUrl,
            liveUrl: data.liveUrl,
            apkUrl: data.apkUrl,
            version: data.version,
            androidVersion: data.androidVersion,
            challenges: Array.isArray(data.challenges) ? (data.challenges as string[]) : [],
            solutions: Array.isArray(data.solutions) ? (data.solutions as string[]) : [],
            lessonsLearned: Array.isArray(data.lessonsLearned) ? (data.lessonsLearned as string[]) : [],
            futureImprovements: Array.isArray(data.futureImprovements) ? (data.futureImprovements as string[]) : [],
            systemArchitecture: data.systemArchitecture,
            status: data.status,
            classification: data.classification,
          });
        } else {
          toast.error("Project not found.");
        }
      } catch (err) {
        console.error("Failed to load project:", err);
        toast.error("Failed to load project details.");
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [resolvedParams.id]);

  return (
    <AdminLayout title="Edit Project">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="h-8 w-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Loading project data...</p>
        </div>
      ) : project ? (
        <ProjectForm initialData={project} />
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          Project not found or failed to load.
        </div>
      )}
    </AdminLayout>
  );
}

"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";
import { projectsData } from "@/constants/projects";

const projectSchema = z.object({
  title: z.string().min(2, "Title is required."),
  slug: z.string().min(2, "Slug is required."),
  tagline: z.string().min(5, "Tagline is required."),
  description: z.string().min(10, "Description is required."),
  fullDescription: z.string().min(15, "Full description is required."),
  categoryType: z.enum(["WEB_APP", "MOBILE_APP", "UI_UX", "ACADEMIC", "OTHER"]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  featuredImage: z.string().optional().nullable(),
  gradient: z.string().default("from-amber-500/20 via-indigo-600/20 to-cyan-500/20"),
  techStack: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  screenshots: z.array(z.any()).default([]),
  githubUrl: z.string().optional().nullable(),
  liveUrl: z.string().optional().nullable(),
  apkUrl: z.string().optional().nullable(),
  version: z.string().optional().nullable(),
  androidVersion: z.string().optional().nullable(),
  challenges: z.array(z.string()).default([]),
  solutions: z.array(z.string()).default([]),
  lessonsLearned: z.array(z.string()).default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;

async function seedDefaultProjectsIfEmpty() {
  try {
    const count = await prisma.project.count();
    if (count === 0) {
      for (const p of projectsData) {
        let validCategoryType: any = "WEB_APP";
        if (["WEB_APP", "MOBILE_APP", "UI_UX", "ACADEMIC", "OTHER"].includes(p.categoryType)) {
          validCategoryType = p.categoryType;
        }
        await prisma.project.create({
          data: {
            title: p.title,
            slug: p.slug,
            tagline: p.tagline,
            description: p.description,
            fullDescription: p.fullDescription,
            categoryType: validCategoryType,
            featured: p.featured,
            published: true,
            featuredImage: p.featuredImage || null,
            gradient: p.gradient,
            techStack: p.techStack,
            features: p.features,
            screenshots: p.screenshots,
            githubUrl: p.githubUrl || null,
            liveUrl: p.liveUrl || null,
            apkUrl: p.apkUrl || null,
            challenges: p.challenges,
            solutions: p.solutions,
            lessonsLearned: p.lessonsLearned,
          } as any,
        });
      }
    }
  } catch (err) {
    console.warn("Seed default projects error:", err);
  }
}

export async function getProjects() {
  try {
    await seedDefaultProjectsIfEmpty();
    const list = await prisma.project.findMany({
      where: { published: true } as any,
      orderBy: { order: "asc" },
    });
    if (list.length > 0) return list;
    return projectsData as any;
  } catch (error) {
    console.error("Failed to fetch published projects:", error);
    return projectsData as any;
  }
}

export async function getAllProjectsAdmin() {
  try {
    await seedDefaultProjectsIfEmpty();
    const list = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
    });
    if (list && list.length > 0) return list;
    return projectsData;
  } catch (error) {
    console.error("Failed to fetch admin projects:", error);
    return projectsData;
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    return await prisma.project.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error(`Failed to fetch project by slug ${slug}:`, error);
    return null;
  }
}

export async function getProjectById(id: string) {
  try {
    await requireAdminSession();
    return await prisma.project.findUnique({
      where: { id },
    });
  } catch (error) {
    console.error(`Failed to fetch project by id ${id}:`, error);
    return null;
  }
}

export async function createProject(input: ProjectInput) {
  try {
    await requireAdminSession();
    const validated = projectSchema.parse(input);

    const project = await prisma.project.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        tagline: validated.tagline,
        description: validated.description,
        fullDescription: validated.fullDescription,
        categoryType: validated.categoryType as any,
        featured: validated.featured,
        published: validated.published,
        featuredImage: validated.featuredImage || null,
        gradient: validated.gradient,
        techStack: validated.techStack,
        features: validated.features,
        screenshots: validated.screenshots,
        githubUrl: validated.githubUrl || null,
        liveUrl: validated.liveUrl || null,
        apkUrl: validated.apkUrl || null,
        version: validated.version || null,
        androidVersion: validated.androidVersion || null,
        challenges: validated.challenges,
        solutions: validated.solutions,
        lessonsLearned: validated.lessonsLearned,
      } as any,
    });

    revalidatePath("/projects");
    revalidatePath("/private/projects");
    revalidatePath("/");
    return { success: true, project };
  } catch (error: any) {
    console.error("Failed to create project:", error);
    return { success: false, error: error.message || "Failed to create project." };
  }
}

export async function updateProject(id: string, input: ProjectInput) {
  try {
    await requireAdminSession();
    const validated = projectSchema.parse(input);

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: validated.title,
        slug: validated.slug,
        tagline: validated.tagline,
        description: validated.description,
        fullDescription: validated.fullDescription,
        categoryType: validated.categoryType as any,
        featured: validated.featured,
        published: validated.published,
        featuredImage: validated.featuredImage || null,
        gradient: validated.gradient,
        techStack: validated.techStack,
        features: validated.features,
        screenshots: validated.screenshots,
        githubUrl: validated.githubUrl || null,
        liveUrl: validated.liveUrl || null,
        apkUrl: validated.apkUrl || null,
        version: validated.version || null,
        androidVersion: validated.androidVersion || null,
        challenges: validated.challenges,
        solutions: validated.solutions,
        lessonsLearned: validated.lessonsLearned,
      } as any,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${validated.slug}`);
    revalidatePath("/private/projects");
    revalidatePath("/");
    return { success: true, project };
  } catch (error: any) {
    console.error("Failed to update project:", error);
    return { success: false, error: error.message || "Failed to update project." };
  }
}

export async function toggleProjectPublishStatus(id: string, published: boolean) {
  try {
    await requireAdminSession();
    const project = await prisma.project.update({
      where: { id },
      data: { published } as any,
    });

    revalidatePath("/projects");
    revalidatePath("/private/projects");
    revalidatePath("/");
    return { success: true, project };
  } catch (error: any) {
    console.error("Failed to toggle project publish status:", error);
    return { success: false, error: error.message || "Failed to update project status." };
  }
}

export async function deleteProject(id: string) {
  try {
    await requireAdminSession();
    await prisma.project.delete({ where: { id } });

    revalidatePath("/projects");
    revalidatePath("/private/projects");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete project:", error);
    return { success: false, error: error.message || "Failed to delete project." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";
import { projectsData } from "@/constants/projects";

const projectSchema = z.object({
  id: z.string().optional(),
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
  futureImprovements: z.array(z.string()).default([]),
  systemArchitecture: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  classification: z.string().optional().nullable(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

async function seedDefaultProjectsIfEmpty() {
  try {
    const validSlugs = projectsData.map((p) => p.slug);
    const dbProjects = await prisma.project.findMany();

    if (dbProjects.length === 0) {
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
            futureImprovements: (p as any).futureImprovements || [],
          } as any,
        });
      }
    } else {
      // Remove any duplicate records with non-canonical slugs if count > 10
      const seenSlugs = new Set<string>();
      const idsToDelete: string[] = [];

      for (const p of dbProjects) {
        if (!validSlugs.includes(p.slug) || seenSlugs.has(p.slug)) {
          idsToDelete.push(p.id);
        } else {
          seenSlugs.add(p.slug);
        }
      }

      if (idsToDelete.length > 0) {
        await prisma.project.deleteMany({
          where: { id: { in: idsToDelete } },
        });
      }
    }
  } catch (err) {
    console.warn("Seed default projects error:", err);
  }
}

export async function getProjects(): Promise<ProjectInput[]> {
  try {
    await seedDefaultProjectsIfEmpty();
    const list = await prisma.project.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
    });
    if (list.length > 0) return list as unknown as ProjectInput[];
    return projectsData.map((p) => ({
      ...p,
      published: true,
      featured: p.featured ?? false,
      categoryType: p.categoryType as "WEB_APP" | "MOBILE_APP" | "UI_UX" | "ACADEMIC" | "OTHER",
      gradient: p.gradient || "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
    })) as ProjectInput[];
  } catch (error) {
    console.error("Failed to fetch published projects:", error);
    return projectsData.map((p) => ({
      ...p,
      published: true,
      featured: p.featured ?? false,
      categoryType: p.categoryType as "WEB_APP" | "MOBILE_APP" | "UI_UX" | "ACADEMIC" | "OTHER",
      gradient: p.gradient || "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
    })) as ProjectInput[];
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

export async function getDraftProjects(): Promise<any[]> {
  try {
    await requireAdminSession();
    return await prisma.project.findMany({
      where: { published: false },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch draft projects:", error);
    return [];
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    const project = await prisma.project.findUnique({
      where: { slug },
    });
    if (!project) return null;
    
    // If project is a draft, only allow authenticated admin to view it
    if (!project.published) {
      try {
        await requireAdminSession();
      } catch {
        return null;
      }
    }
    return project;
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
        futureImprovements: validated.futureImprovements,
        systemArchitecture: validated.systemArchitecture || null,
        status: validated.status || "Completed",
        classification: validated.classification || null,
      } as any,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${validated.slug}`);
    revalidatePath("/private/projects");
    revalidatePath("/private/drafts");
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
        futureImprovements: validated.futureImprovements,
        systemArchitecture: validated.systemArchitecture || null,
        status: validated.status || "Completed",
        classification: validated.classification || null,
      } as any,
    });

    revalidatePath("/projects");
    revalidatePath(`/projects/${validated.slug}`);
    revalidatePath("/private/projects");
    revalidatePath("/private/drafts");
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
    revalidatePath(`/projects/${project.slug}`);
    revalidatePath("/private/projects");
    revalidatePath("/private/drafts");
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
    const existing = await prisma.project.findUnique({ where: { id } });
    await prisma.project.delete({ where: { id } });

    revalidatePath("/projects");
    if (existing?.slug) {
      revalidatePath(`/projects/${existing.slug}`);
    }
    revalidatePath("/private/projects");
    revalidatePath("/private/drafts");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete project:", error);
    return { success: false, error: error.message || "Failed to delete project." };
  }
}

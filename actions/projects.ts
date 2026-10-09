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

      // Ensure all canonical projects exist and queueless-system is synced to enterprise showcase
      for (const p of projectsData) {
        const existing = dbProjects.find((dp) => dp.slug === p.slug);
        let validCategoryType: any = "WEB_APP";
        if (["WEB_APP", "MOBILE_APP", "UI_UX", "ACADEMIC", "OTHER"].includes(p.categoryType)) {
          validCategoryType = p.categoryType;
        }

        if (!existing) {
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
              version: p.version || null,
              classification: p.classification || null,
              challenges: p.challenges,
              solutions: p.solutions,
              lessonsLearned: p.lessonsLearned,
              futureImprovements: (p as any).futureImprovements || [],
              systemArchitecture: p.systemArchitecture || null,
            } as any,
          });
        } else if (p.slug === "queueless-system" && existing.classification !== "Commercial Product") {
          await prisma.project.update({
            where: { id: existing.id },
            data: {
              title: p.title,
              tagline: p.tagline,
              description: p.description,
              fullDescription: p.fullDescription,
              categoryType: validCategoryType,
              featured: p.featured,
              featuredImage: p.featuredImage || null,
              gradient: p.gradient,
              techStack: p.techStack,
              features: p.features,
              screenshots: p.screenshots,
              githubUrl: p.githubUrl || null,
              liveUrl: p.liveUrl || null,
              apkUrl: p.apkUrl || null,
              version: p.version || null,
              classification: p.classification || null,
              challenges: p.challenges,
              solutions: p.solutions,
              lessonsLearned: p.lessonsLearned,
              futureImprovements: (p as any).futureImprovements || [],
              systemArchitecture: p.systemArchitecture || null,
            } as any,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Seed default projects error:", err);
  }
}

export interface ProjectWithEngagement extends ProjectInput {
  likesCount?: number;
  commentsCount?: number;
}

export async function getProjects(): Promise<ProjectWithEngagement[]> {
  try {
    await seedDefaultProjectsIfEmpty();
    const list = await prisma.project.findMany({
      where: { published: true },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            likes: true,
            comments: { where: { published: true } },
          },
        },
      },
    });
    if (list.length > 0) {
      return list.map((p: any) => ({
        ...p,
        likesCount: p._count?.likes ?? 0,
        commentsCount: p._count?.comments ?? 0,
      })) as ProjectWithEngagement[];
    }
    return projectsData.map((p) => ({
      ...p,
      published: true,
      featured: p.featured ?? false,
      categoryType: p.categoryType as "WEB_APP" | "MOBILE_APP" | "UI_UX" | "ACADEMIC" | "OTHER",
      gradient: p.gradient || "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
      likesCount: 0,
      commentsCount: 0,
    })) as ProjectWithEngagement[];
  } catch (error) {
    console.error("Failed to fetch published projects:", error);
    return projectsData.map((p) => ({
      ...p,
      published: true,
      featured: p.featured ?? false,
      categoryType: p.categoryType as "WEB_APP" | "MOBILE_APP" | "UI_UX" | "ACADEMIC" | "OTHER",
      gradient: p.gradient || "from-amber-500/20 via-indigo-600/20 to-cyan-500/20",
      likesCount: 0,
      commentsCount: 0,
    })) as ProjectWithEngagement[];
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

async function ensureProjectColumnsAreLongText() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE \`Project\` MODIFY COLUMN \`tagline\` LONGTEXT NOT NULL;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE \`Project\` MODIFY COLUMN \`description\` LONGTEXT NOT NULL;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE \`Project\` MODIFY COLUMN \`fullDescription\` LONGTEXT NOT NULL;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE \`Project\` MODIFY COLUMN \`systemArchitecture\` LONGTEXT NULL;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE \`Project\` MODIFY COLUMN \`featuredImage\` LONGTEXT NULL;`);
  } catch {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`project\` MODIFY COLUMN \`tagline\` LONGTEXT NOT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE \`project\` MODIFY COLUMN \`description\` LONGTEXT NOT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE \`project\` MODIFY COLUMN \`fullDescription\` LONGTEXT NOT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE \`project\` MODIFY COLUMN \`systemArchitecture\` LONGTEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE \`project\` MODIFY COLUMN \`featuredImage\` LONGTEXT NULL;`);
    } catch {
      // Column may already be LONGTEXT
    }
  }
}

async function extractAndStoreDataUrls(rawText: string | null | undefined): Promise<string | null> {
  if (!rawText || !rawText.includes("data:image/")) return rawText || null;

  let text = rawText;
  const dataUrlRegex = /data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=\r\n]+)/g;
  const matches = [...text.matchAll(dataUrlRegex)];

  for (const match of matches) {
    const fullDataUrl = match[0];
    const mimeType = match[1];
    const base64Data = match[2].replace(/\s/g, "");

    const ext = mimeType.includes("png") ? ".png" : mimeType.includes("webp") ? ".webp" : ".jpg";
    const assetId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    try {
      await prisma.$executeRawUnsafe(
        "INSERT INTO `media_asset` (`id`, `filename`, `mimeType`, `size`, `data`, `createdAt`, `updatedAt`) VALUES (?, ?, ?, ?, ?, NOW(3), NOW(3))",
        assetId,
        `image${ext}`,
        mimeType,
        Math.round((base64Data.length * 3) / 4),
        base64Data
      );

      text = text.split(fullDataUrl).join(`/api/media/${assetId}${ext}`);
    } catch (e) {
      console.warn("Failed to extract project data URL:", e);
    }
  }

  return text;
}

export async function createProject(input: ProjectInput) {
  try {
    await requireAdminSession();
    await ensureProjectColumnsAreLongText();
    const validated = projectSchema.parse(input);

    const cleanDescription = (await extractAndStoreDataUrls(validated.description)) || validated.description;
    const cleanFullDescription = (await extractAndStoreDataUrls(validated.fullDescription)) || validated.fullDescription;
    const cleanTagline = (await extractAndStoreDataUrls(validated.tagline)) || validated.tagline;
    const cleanArch = await extractAndStoreDataUrls(validated.systemArchitecture);
    const cleanFeaturedImage = await extractAndStoreDataUrls(validated.featuredImage);

    // Sanitize screenshot image paths if any contain raw base64
    const cleanScreenshots = await Promise.all(
      (validated.screenshots || []).map(async (s: any) => {
        if (s && s.imagePath) {
          const cleanPath = await extractAndStoreDataUrls(s.imagePath);
          return { ...s, imagePath: cleanPath };
        }
        return s;
      })
    );

    const project = await prisma.project.create({
      data: {
        title: validated.title,
        slug: validated.slug,
        tagline: cleanTagline,
        description: cleanDescription,
        fullDescription: cleanFullDescription,
        categoryType: validated.categoryType as any,
        featured: validated.featured,
        published: validated.published,
        featuredImage: cleanFeaturedImage,
        gradient: validated.gradient,
        techStack: validated.techStack,
        features: validated.features,
        screenshots: cleanScreenshots,
        githubUrl: validated.githubUrl || null,
        liveUrl: validated.liveUrl || null,
        apkUrl: validated.apkUrl || null,
        version: validated.version || null,
        androidVersion: validated.androidVersion || null,
        challenges: validated.challenges,
        solutions: validated.solutions,
        lessonsLearned: validated.lessonsLearned,
        futureImprovements: validated.futureImprovements,
        systemArchitecture: cleanArch,
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
    await ensureProjectColumnsAreLongText();
    const validated = projectSchema.parse(input);

    const cleanDescription = (await extractAndStoreDataUrls(validated.description)) || validated.description;
    const cleanFullDescription = (await extractAndStoreDataUrls(validated.fullDescription)) || validated.fullDescription;
    const cleanTagline = (await extractAndStoreDataUrls(validated.tagline)) || validated.tagline;
    const cleanArch = await extractAndStoreDataUrls(validated.systemArchitecture);
    const cleanFeaturedImage = await extractAndStoreDataUrls(validated.featuredImage);

    // Sanitize screenshot image paths if any contain raw base64
    const cleanScreenshots = await Promise.all(
      (validated.screenshots || []).map(async (s: any) => {
        if (s && s.imagePath) {
          const cleanPath = await extractAndStoreDataUrls(s.imagePath);
          return { ...s, imagePath: cleanPath };
        }
        return s;
      })
    );

    const project = await prisma.project.update({
      where: { id },
      data: {
        title: validated.title,
        slug: validated.slug,
        tagline: cleanTagline,
        description: cleanDescription,
        fullDescription: cleanFullDescription,
        categoryType: validated.categoryType as any,
        featured: validated.featured,
        published: validated.published,
        featuredImage: cleanFeaturedImage,
        gradient: validated.gradient,
        techStack: validated.techStack,
        features: validated.features,
        screenshots: cleanScreenshots,
        githubUrl: validated.githubUrl || null,
        liveUrl: validated.liveUrl || null,
        apkUrl: validated.apkUrl || null,
        version: validated.version || null,
        androidVersion: validated.androidVersion || null,
        challenges: validated.challenges,
        solutions: validated.solutions,
        lessonsLearned: validated.lessonsLearned,
        futureImprovements: validated.futureImprovements,
        systemArchitecture: cleanArch,
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

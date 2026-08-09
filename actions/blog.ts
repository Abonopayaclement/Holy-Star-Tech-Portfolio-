"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";

const blogPostSchema = z.object({
  title: z.string().min(3, "Title is required."),
  slug: z.string().min(3, "Slug is required."),
  excerpt: z.string().min(5, "Excerpt is required."),
  content: z.string().min(10, "Content is required."),
  category: z.string().default("Architecture"),
  readTime: z.string().default("5 min read"),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  images: z.array(z.string()).optional().default([]),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

const defaultArticles = [
  {
    slug: "my-journey-into-software-engineering",
    title: "My Journey into Software Engineering",
    excerpt:
      "From computer hardware fundamentals to building full-stack web and mobile applications—reflections on learning Python, Java, JavaScript, React, and Android Studio.",
    content:
      "My interest in technology started with computer hardware troubleshooting at Bolgatanga Technical Institute. Understanding physical components, OS installations, and system memory provided a solid foundation when I transitioned into software engineering. Today, as an HND Computer Science student at Kumasi Technical University, I focus on web and mobile development using modern tools.",
    category: "Career & Growth",
    readTime: "3 min read",
    featured: true,
    published: true,
    images: ["/logo.png"],
  },
  {
    slug: "building-the-hostel-management-system",
    title: "Building the Hostel Management System",
    excerpt:
      "A technical walkthrough of designing a student hostel accommodation management system for room slot allocations, occupant records, and payment status checks.",
    content:
      "The Hostel Management System project was developed to solve room allocation challenges in campus student housing. Built using Python, Flask, HTML, CSS, and MySQL, the platform provides room capacity validation routines to prevent over-allocation and maintains structured payment records for administrators.",
    category: "Web Development",
    readTime: "3 min read",
    featured: true,
    published: true,
    images: ["/logo.png"],
  },
  {
    slug: "developing-the-compssa-management-system",
    title: "Developing the COMPSSA Management System",
    excerpt:
      "How I built a digital student management portal for Computer Science student association records, course document distribution, and departmental announcements.",
    content:
      "Developing the COMPSSA Management System involved analyzing association workflow procedures. Using JavaScript, React, Node.js, Express.js, and MySQL, I implemented role-based middleware to distinguish student executive controls from regular member access while providing centralized document downloads.",
    category: "Web Development",
    readTime: "3 min read",
    featured: true,
    published: true,
    images: ["/logo.png"],
  },
  {
    slug: "learning-react-and-nextjs",
    title: "Learning React and Next.js",
    excerpt:
      "Insights and practical takeaways from transitioning from vanilla JavaScript into component-driven React interfaces and Next.js App Router applications.",
    content:
      "Transitioning from vanilla JavaScript into component-driven React development opens up modular UI architecture. Learning JSX syntax, state hooks, and Next.js server actions allows building fast, dynamic web applications with clean code structure.",
    category: "Web Development",
    readTime: "3 min read",
    featured: false,
    published: true,
    images: ["/logo.png"],
  },
  {
    slug: "my-journey-learning-mobile-application-development",
    title: "My Journey Learning Mobile Application Development",
    excerpt:
      "Exploring native Android application development in Android Studio using Java, XML layouts, and network statistics APIs.",
    content:
      "Building native Android apps in Android Studio using Java and XML layouts provides direct access to mobile OS APIs. Designing clean interfaces for data usage monitoring and numeric calculators has deepened my understanding of mobile activity lifecycles.",
    category: "Mobile Development",
    readTime: "3 min read",
    featured: false,
    published: true,
    images: ["/logo.png"],
  },
];

async function seedDefaultBlogsIfEmpty() {
  try {
    const count = await prisma.blogPost.count();
    if (count === 0) {
      for (const a of defaultArticles) {
        await (prisma.blogPost as any).create({
          data: {
            title: a.title,
            slug: a.slug,
            excerpt: a.excerpt,
            content: a.content,
            category: a.category,
            readTime: a.readTime,
            featured: a.featured,
            published: a.published,
            publishedAt: new Date(),
            images: a.images,
          },
        });
      }
    }
  } catch (err) {
    console.warn("Seed default blog posts error:", err);
  }
}

export async function getBlogPosts() {
  try {
    await seedDefaultBlogsIfEmpty();
    const list = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    });
    if (list.length > 0) return list;
    return defaultArticles as any;
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return defaultArticles as any;
  }
}

export async function getAllBlogPostsAdmin() {
  try {
    await requireAdminSession();
    await seedDefaultBlogsIfEmpty();
    return await prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch admin blog posts:", error);
    return [];
  }
}

export async function getDraftBlogPosts() {
  try {
    await requireAdminSession();
    return await prisma.blogPost.findMany({
      where: { published: false },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch draft blog posts:", error);
    return [];
  }
}

export async function createBlogPost(input: BlogPostInput) {
  try {
    await requireAdminSession();
    const validated = blogPostSchema.parse(input);

    const post = await (prisma.blogPost as any).create({
      data: {
        title: validated.title,
        slug: validated.slug,
        excerpt: validated.excerpt,
        content: validated.content,
        category: validated.category,
        readTime: validated.readTime,
        featured: validated.featured,
        published: validated.published,
        publishedAt: validated.published ? new Date() : new Date(),
        images: validated.images,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/private/blog");
    revalidatePath("/private/drafts");
    revalidatePath("/");
    return { success: true, post };
  } catch (error: any) {
    console.error("Failed to create blog post:", error);
    return { success: false, error: error.message || "Failed to create article." };
  }
}

export async function updateBlogPost(id: string, input: BlogPostInput) {
  try {
    await requireAdminSession();
    const validated = blogPostSchema.parse(input);

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Blog post not found." };
    }

    const post = await (prisma.blogPost as any).update({
      where: { id },
      data: {
        title: validated.title,
        slug: validated.slug,
        excerpt: validated.excerpt,
        content: validated.content,
        category: validated.category,
        readTime: validated.readTime,
        featured: validated.featured,
        published: validated.published,
        publishedAt:
          validated.published && !existing.published
            ? new Date()
            : existing.publishedAt,
        images: validated.images,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/private/blog");
    revalidatePath("/private/drafts");
    revalidatePath("/");
    return { success: true, post };
  } catch (error: any) {
    console.error("Failed to update blog post:", error);
    return { success: false, error: error.message || "Failed to update article." };
  }
}

export async function togglePublishStatus(id: string, published: boolean) {
  try {
    await requireAdminSession();
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        published,
        publishedAt: published ? new Date() : undefined,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/private/blog");
    revalidatePath("/private/drafts");
    revalidatePath("/");
    return { success: true, post };
  } catch (error: any) {
    console.error("Failed to toggle publish status:", error);
    return { success: false, error: error.message || "Failed to change publication status." };
  }
}

export async function deleteBlogPost(id: string) {
  try {
    await requireAdminSession();
    await prisma.blogPost.delete({ where: { id } });

    revalidatePath("/blog");
    revalidatePath("/private/blog");
    revalidatePath("/private/drafts");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete blog post:", error);
    return { success: false, error: error.message || "Failed to delete post." };
  }
}

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  FolderGit2,
  Share2,
  Tag,
  UserCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { getProjects } from "@/actions/projects";
import { ArticleDetailClient } from "@/app/(public)/blog/[slug]/ArticleDetailClient";

interface ArticleSlugPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ArticleSlugPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const post = await (prisma as any).blogPost.findUnique({
    where: { slug: resolvedParams.slug },
  });

  if (!post) {
    return {
      title: "Post Not Found | Holy Star Tech",
      description: "The requested engineering post could not be found.",
    };
  }

  const url = `${siteConfig.url}/blog/${post.slug}`;
  const rawImages = (post as any).images;
  const images = Array.isArray(rawImages) && rawImages.length > 0
    ? [(rawImages as string[])[0]]
    : ["/logo.png"];

  return {
    title: `${post.title} | ${siteConfig.name}`,
    description: post.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      siteName: siteConfig.name,
      type: "article",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString(),
      authors: [siteConfig.author],
      images: images.map((img) => ({ url: img })),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images,
      creator: "@holystartech",
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticleSlugPageProps) {
  const resolvedParams = await params;
  const post = await (prisma as any).blogPost.findUnique({
    where: { slug: resolvedParams.slug },
  });

  if (!post) {
    notFound();
  }

  // Related Articles & Projects
  const [allPosts, allProjects] = await Promise.all([
    (prisma as any).blogPost.findMany({
      where: { published: true, id: { not: post.id } },
      take: 3,
      orderBy: { publishedAt: "desc" },
    }),
    getProjects(),
  ]);

  const relatedProjects = allProjects.slice(0, 2);

  const formattedDate = new Date(post.publishedAt || post.createdAt || Date.now()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const fullUrl = `${siteConfig.url}/blog/${post.slug}`;
  const rawImages = (post as any).images;
  const heroImage = Array.isArray(rawImages) && rawImages.length > 0
    ? (rawImages as string[])[0]
    : null;

  return (
    <ArticleDetailClient
      post={{
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category || "Architecture",
        readTime: post.readTime || "3 min read",
        date: formattedDate,
        fullUrl,
        heroImage,
        images: Array.isArray(rawImages) ? (rawImages as string[]) : [],
      }}
      relatedPosts={allPosts.map((p: any) => ({
        ...p,
        date: new Date(p.publishedAt || p.createdAt || Date.now()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      }))}
      relatedProjects={relatedProjects}
    />
  );
}

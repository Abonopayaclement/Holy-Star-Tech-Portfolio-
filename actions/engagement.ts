"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { projectsData } from "@/constants/projects";
import { requireAdminSession } from "@/lib/auth-guard";
import { createNotification } from "@/actions/notifications";

export interface AddCommentInput {
  targetType: "BLOG" | "PROJECT";
  slug: string;
  authorName: string;
  content: string;
}

export interface ToggleLikeInput {
  targetType: "BLOG" | "PROJECT";
  slug: string;
  visitorId: string;
}

// Basic HTML sanitization function to prevent XSS script injection
function sanitizeText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

function generateId(prefix: string): string {
  return prefix + "_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Auto-creation routine to ensure MySQL tables `like`, `comment`, and `notification` exist physically
async function ensureEngagementTablesExist() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`like\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`targetType\` VARCHAR(191) NOT NULL,
        \`blogId\` VARCHAR(191) NULL,
        \`projectId\` VARCHAR(191) NULL,
        \`visitorId\` VARCHAR(191) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`like_blogId_idx\` (\`blogId\`),
        INDEX \`like_projectId_idx\` (\`projectId\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`comment\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`targetType\` VARCHAR(191) NOT NULL,
        \`blogId\` VARCHAR(191) NULL,
        \`projectId\` VARCHAR(191) NULL,
        \`authorName\` VARCHAR(191) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`published\` TINYINT(1) NOT NULL DEFAULT 0,
        \`adminReply\` TEXT NULL,
        \`adminReplyPublished\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        INDEX \`comment_blogId_idx\` (\`blogId\`),
        INDEX \`comment_projectId_idx\` (\`projectId\`),
        INDEX \`comment_published_idx\` (\`published\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`comment\` ADD COLUMN \`adminReply\` TEXT NULL;
      `);
    } catch (_) {}

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE \`comment\` ADD COLUMN \`adminReplyPublished\` TINYINT(1) NOT NULL DEFAULT 0;
      `);
    } catch (_) {}

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`notification\` (
        \`id\` VARCHAR(191) NOT NULL,
        \`title\` VARCHAR(191) NOT NULL,
        \`message\` VARCHAR(191) NOT NULL,
        \`type\` VARCHAR(191) NOT NULL DEFAULT 'COMMENT',
        \`targetUrl\` VARCHAR(191) NULL,
        \`isRead\` TINYINT(1) NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.warn("Table auto-creation warning:", err);
  }
}

// Default Articles fallback reference
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

async function getOrCreateTargetItem(targetType: "BLOG" | "PROJECT", slug: string) {
  try {
    if (targetType === "BLOG") {
      let blog = await prisma.blogPost.findUnique({ where: { slug } });
      if (!blog) {
        const match = defaultArticles.find((a) => a.slug === slug);
        if (match) {
          blog = await prisma.blogPost.create({
            data: {
              title: match.title,
              slug: match.slug,
              excerpt: match.excerpt,
              content: match.content,
              category: match.category,
              readTime: match.readTime,
              featured: match.featured,
              published: match.published,
              publishedAt: new Date(),
              images: match.images,
            },
          });
        } else {
          blog = await prisma.blogPost.create({
            data: {
              title: slug.replace(/-/g, " "),
              slug,
              excerpt: "Article excerpt",
              content: "Article content",
              category: "Architecture",
              published: true,
            },
          });
        }
      }
      return { id: blog.id, title: blog.title };
    } else {
      let project = await prisma.project.findUnique({ where: { slug } });
      if (!project) {
        const match = projectsData.find((p) => p.slug === slug);
        if (match) {
          let validCategoryType: any = "WEB_APP";
          if (["WEB_APP", "MOBILE_APP", "UI_UX", "ACADEMIC", "OTHER"].includes(match.categoryType)) {
            validCategoryType = match.categoryType;
          }
          project = await prisma.project.create({
            data: {
              title: match.title,
              slug: match.slug,
              tagline: match.tagline,
              description: match.description,
              fullDescription: match.fullDescription,
              categoryType: validCategoryType,
              featured: match.featured,
              published: true,
              featuredImage: match.featuredImage || null,
              gradient: match.gradient,
              techStack: match.techStack,
              features: match.features,
              screenshots: match.screenshots,
              githubUrl: match.githubUrl || null,
              liveUrl: match.liveUrl || null,
              apkUrl: match.apkUrl || null,
              challenges: match.challenges,
              solutions: match.solutions,
              lessonsLearned: match.lessonsLearned,
            } as any,
          });
        } else {
          project = await prisma.project.create({
            data: {
              title: slug.replace(/-/g, " "),
              slug,
              tagline: "Project tagline",
              description: "Project description",
              fullDescription: "Full project description",
              categoryType: "WEB_APP" as any,
              published: true,
              techStack: [],
              features: [],
              screenshots: [],
              challenges: [],
              solutions: [],
              lessonsLearned: [],
            } as any,
          });
        }
      }
      return { id: project.id, title: project.title };
    }
  } catch (err) {
    console.error(`getOrCreateTargetItem error for ${targetType} / ${slug}:`, err);
    return { id: null, title: slug };
  }
}

export async function toggleLike({ targetType, slug, visitorId }: ToggleLikeInput) {
  try {
    await ensureEngagementTablesExist();
    const targetItem = await getOrCreateTargetItem(targetType, slug);
    const blogId = targetType === "BLOG" ? targetItem.id : null;
    const projectId = targetType === "PROJECT" ? targetItem.id : null;

    if (!blogId && !projectId) {
      throw new Error(`Unable to identify or create ${targetType} database record for slug ${slug}`);
    }

    const safeVisitorId = visitorId && visitorId.trim() !== "" ? visitorId.trim() : "anon_visitor";
    const p = prisma as any;

    if (p.like) {
      const existing = await p.like.findFirst({
        where: {
          targetType,
          ...(blogId ? { blogId } : {}),
          ...(projectId ? { projectId } : {}),
          visitorId: safeVisitorId,
        },
      });

      if (existing) {
        await p.like.delete({ where: { id: existing.id } });
      } else {
        await p.like.create({
          data: {
            targetType,
            blogId,
            projectId,
            visitorId: safeVisitorId,
          },
        });
        try {
          const itemTitle = targetItem.title || slug;
          await createNotification(
            `❤️ New Like on ${targetType === "BLOG" ? "Post" : "Project"}`,
            `Someone liked "${itemTitle}"`,
            "LIKE",
            "/private/engagement"
          );
        } catch (_) {}
      }
    } else {
      // BULLETPROOF RAW SQL FALLBACK FOR LIKE TOGGLE
      const existingLikes: any[] = await prisma.$queryRaw`
        SELECT id FROM \`like\`
        WHERE targetType = ${targetType}
          AND (${blogId} IS NULL OR blogId = ${blogId})
          AND (${projectId} IS NULL OR projectId = ${projectId})
          AND visitorId = ${safeVisitorId}
        LIMIT 1
      `;

      if (existingLikes && existingLikes.length > 0) {
        const existingId = existingLikes[0].id;
        await prisma.$executeRaw`DELETE FROM \`like\` WHERE id = ${existingId}`;
      } else {
        const newId = generateId("like");
        await prisma.$executeRaw`
          INSERT INTO \`like\` (id, targetType, blogId, projectId, visitorId, createdAt)
          VALUES (${newId}, ${targetType}, ${blogId}, ${projectId}, ${safeVisitorId}, NOW())
        `;
        try {
          const itemTitle = targetItem.title || slug;
          await createNotification(
            `❤️ New Like on ${targetType === "BLOG" ? "Post" : "Project"}`,
            `Someone liked "${itemTitle}"`,
            "LIKE",
            "/private/engagement"
          );
        } catch (_) {}
      }
    }

    revalidatePath(`/blog/${slug}`);
    revalidatePath("/blog");
    revalidatePath("/private/blog");
    revalidatePath(`/projects/${slug}`);
    revalidatePath("/projects");
    revalidatePath("/private/projects");
    revalidatePath("/private/engagement");
    revalidatePath("/private");

    return { success: true };
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return { success: false, error: String(error) };
  }
}

export async function addComment({ targetType, slug, authorName, content }: AddCommentInput) {
  try {
    await ensureEngagementTablesExist();
    const cleanName = sanitizeText(authorName);
    const cleanContent = sanitizeText(content);

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "Please enter your name (at least 2 characters)." };
    }
    if (!cleanContent || cleanContent.length < 3) {
      return { success: false, error: "Please enter a valid comment (at least 3 characters)." };
    }

    if (cleanName.length > 50) {
      return { success: false, error: "Name must be under 50 characters." };
    }
    if (cleanContent.length > 1000) {
      return { success: false, error: "Comment must be under 1000 characters." };
    }

    const targetItem = await getOrCreateTargetItem(targetType, slug);
    const blogId = targetType === "BLOG" ? targetItem.id : null;
    const projectId = targetType === "PROJECT" ? targetItem.id : null;
    const itemTitle = targetItem.title || slug;

    if (!blogId && !projectId) {
      throw new Error(`Unable to identify or create ${targetType} database record for slug ${slug}`);
    }

    const p = prisma as any;
    let newCommentId = generateId("cmt");

    if (p.comment) {
      const created = await p.comment.create({
        data: {
          targetType,
          blogId,
          projectId,
          authorName: cleanName,
          content: cleanContent,
          published: false,
        },
      });
      newCommentId = created.id;
    } else {
      // BULLETPROOF RAW SQL FALLBACK FOR COMMENT ADDITION
      await prisma.$executeRaw`
        INSERT INTO \`comment\` (id, targetType, blogId, projectId, authorName, content, published, createdAt)
        VALUES (${newCommentId}, ${targetType}, ${blogId}, ${projectId}, ${cleanName}, ${cleanContent}, false, NOW())
      `;
    }

    if (p.notification) {
      await p.notification.create({
        data: {
          title: `💬 Comment Pending Approval from ${cleanName}`,
          message: `${cleanName} commented on "${itemTitle}": "${cleanContent.slice(0, 80)}..."`,
          type: "COMMENT",
          targetUrl: "/private/engagement",
        },
      });
    } else {
      const notifId = generateId("notif");
      const notifMsg = `${cleanName} commented on "${itemTitle}": "${cleanContent.slice(0, 80)}..."`;
      await prisma.$executeRaw`
        INSERT INTO \`notification\` (id, title, message, type, targetUrl, isRead, createdAt)
        VALUES (${notifId}, ${`💬 Comment Pending Approval from ${cleanName}`}, ${notifMsg}, 'COMMENT', '/private/engagement', false, NOW())
      `;
    }

    revalidatePath(`/blog/${slug}`);
    revalidatePath("/blog");
    revalidatePath("/private/blog");
    revalidatePath(`/projects/${slug}`);
    revalidatePath("/projects");
    revalidatePath("/private/projects");
    revalidatePath("/private/engagement");
    revalidatePath("/private");

    return {
      success: true,
      pendingApproval: true,
      commentId: newCommentId,
      message: "Comment submitted successfully! It will appear publicly once approved by the admin.",
    };
  } catch (error) {
    console.error("Failed to add comment:", error);
    return { success: false, error: "Failed to submit comment. Please try again." };
  }
}

export async function getPublicEngagement(targetType: "BLOG" | "PROJECT", slug: string, visitorId?: string) {
  try {
    await ensureEngagementTablesExist();
    const targetItem = await getOrCreateTargetItem(targetType, slug);
    const blogId = targetType === "BLOG" ? targetItem.id : null;
    const projectId = targetType === "PROJECT" ? targetItem.id : null;

    let totalLikes = 0;
    let totalComments = 0;
    let publishedCommentsCount = 0;
    let publishedComments: any[] = [];
    let hasLiked = false;

    const safeVisitorId = visitorId && visitorId.trim() !== "" ? visitorId.trim() : null;
    const p = prisma as any;

    if (blogId || projectId) {
      if (p.like) {
        totalLikes = await p.like.count({
          where: {
            targetType,
            ...(blogId ? { blogId } : {}),
            ...(projectId ? { projectId } : {}),
          },
        });
      } else {
        // BULLETPROOF RAW SQL FALLBACK FOR LIKES COUNT
        const likesCountRes: any[] = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM \`like\`
          WHERE targetType = ${targetType}
            AND (${blogId} IS NULL OR blogId = ${blogId})
            AND (${projectId} IS NULL OR projectId = ${projectId})
        `;
        totalLikes = Number(likesCountRes[0]?.count || 0);
      }

      if (p.comment) {
        totalComments = await p.comment.count({
          where: {
            targetType,
            ...(blogId ? { blogId } : {}),
            ...(projectId ? { projectId } : {}),
          },
        });

        publishedCommentsCount = await p.comment.count({
          where: {
            targetType,
            ...(blogId ? { blogId } : {}),
            ...(projectId ? { projectId } : {}),
            published: true,
          },
        });

        publishedComments = await p.comment.findMany({
          where: {
            targetType,
            ...(blogId ? { blogId } : {}),
            ...(projectId ? { projectId } : {}),
            published: true,
          },
          orderBy: { createdAt: "desc" },
          take: 15,
        });
      } else {
        // BULLETPROOF RAW SQL FALLBACK FOR COMMENTS
        const commentsCountRes: any[] = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM \`comment\`
          WHERE targetType = ${targetType}
            AND (${blogId} IS NULL OR blogId = ${blogId})
            AND (${projectId} IS NULL OR projectId = ${projectId})
        `;
        totalComments = Number(commentsCountRes[0]?.count || 0);

        const pubCommentsCountRes: any[] = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM \`comment\`
          WHERE targetType = ${targetType}
            AND (${blogId} IS NULL OR blogId = ${blogId})
            AND (${projectId} IS NULL OR projectId = ${projectId})
            AND published = true
        `;
        publishedCommentsCount = Number(pubCommentsCountRes[0]?.count || 0);

        const pubCommentsList: any[] = await prisma.$queryRaw`
          SELECT id, authorName, content, adminReply, adminReplyPublished, createdAt FROM \`comment\`
          WHERE targetType = ${targetType}
            AND (${blogId} IS NULL OR blogId = ${blogId})
            AND (${projectId} IS NULL OR projectId = ${projectId})
            AND published = true
          ORDER BY createdAt DESC
          LIMIT 15
        `;
        publishedComments = pubCommentsList || [];
      }

      if (safeVisitorId) {
        if (p.like) {
          const userLike = await p.like.findFirst({
            where: {
              targetType,
              ...(blogId ? { blogId } : {}),
              ...(projectId ? { projectId } : {}),
              visitorId: safeVisitorId,
            },
          });
          if (userLike) hasLiked = true;
        } else {
          // BULLETPROOF RAW SQL FALLBACK FOR HASLIKED
          const userLikeRes: any[] = await prisma.$queryRaw`
            SELECT id FROM \`like\`
            WHERE targetType = ${targetType}
              AND (${blogId} IS NULL OR blogId = ${blogId})
              AND (${projectId} IS NULL OR projectId = ${projectId})
              AND visitorId = ${safeVisitorId}
            LIMIT 1
          `;
          if (userLikeRes && userLikeRes.length > 0) hasLiked = true;
        }
      }
    }

    return {
      totalLikes,
      totalComments,
      publishedCommentsCount,
      publishedComments: publishedComments.map((c: any) => {
        const isReplyPublished =
          c.adminReplyPublished === true ||
          c.adminReplyPublished === 1 ||
          String(c.adminReplyPublished) === "1" ||
          String(c.adminReplyPublished) === "true" ||
          (Buffer.isBuffer(c.adminReplyPublished) && c.adminReplyPublished[0] === 1);

        return {
          id: c.id,
          authorName: c.authorName,
          content: c.content,
          createdAt: c.createdAt,
          adminReply: isReplyPublished && c.adminReply && c.adminReply.trim() ? c.adminReply.trim() : null,
          adminReplyPublished: isReplyPublished,
        };
      }),
      hasLiked,
    };
  } catch (error) {
    console.error("Failed to get public engagement stats:", error);
    return {
      totalLikes: 0,
      totalComments: 0,
      publishedCommentsCount: 0,
      publishedComments: [],
      hasLiked: false,
    };
  }
}

export async function toggleCommentPublishStatus(commentId: string, published: boolean) {
  try {
    await requireAdminSession();
    await ensureEngagementTablesExist();
    const p = prisma as any;
    if (p.comment) {
      await p.comment.update({
        where: { id: commentId },
        data: { published },
      });
    } else {
      await prisma.$executeRaw`
        UPDATE \`comment\` SET published = ${published} WHERE id = ${commentId}
      `;
    }

    revalidatePath("/", "layout");
    revalidatePath("/blog");
    revalidatePath("/projects");
    revalidatePath("/whats-new");
    revalidatePath("/private/blog");
    revalidatePath("/private/projects");
    revalidatePath("/private/engagement");
    revalidatePath("/private");

    return { success: true };
  } catch (error) {
    console.error("Failed to update comment publish status:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteComment(commentId: string) {
  try {
    await requireAdminSession();
    await ensureEngagementTablesExist();
    const p = prisma as any;
    if (p.comment) {
      await p.comment.delete({
        where: { id: commentId },
      });
    } else {
      await prisma.$executeRaw`
        DELETE FROM \`comment\` WHERE id = ${commentId}
      `;
    }

    revalidatePath("/blog");
    revalidatePath("/projects");
    revalidatePath("/private/blog");
    revalidatePath("/private/projects");
    revalidatePath("/private/engagement");
    revalidatePath("/private");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete comment:", error);
    return { success: false, error: String(error) };
  }
}

export async function getAdminCommentsForTarget(targetType: "BLOG" | "PROJECT", slug: string) {
  try {
    await ensureEngagementTablesExist();
    const targetItem = await getOrCreateTargetItem(targetType, slug);
    const blogId = targetType === "BLOG" ? targetItem.id : null;
    const projectId = targetType === "PROJECT" ? targetItem.id : null;

    let commentsList: any[] = [];
    let likesCount = 0;
    const p = prisma as any;

    if (blogId || projectId) {
      if (p.like) {
        likesCount = await p.like.count({
          where: {
            targetType,
            ...(blogId ? { blogId } : {}),
            ...(projectId ? { projectId } : {}),
          },
        });
      } else {
        const res: any[] = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM \`like\`
          WHERE targetType = ${targetType}
            AND (${blogId} IS NULL OR blogId = ${blogId})
            AND (${projectId} IS NULL OR projectId = ${projectId})
        `;
        likesCount = Number(res[0]?.count || 0);
      }

      if (p.comment) {
        commentsList = await p.comment.findMany({
          where: {
            targetType,
            ...(blogId ? { blogId } : {}),
            ...(projectId ? { projectId } : {}),
          },
          orderBy: { createdAt: "desc" },
        });
      } else {
        commentsList = await prisma.$queryRaw`
          SELECT id, authorName, content, published, createdAt FROM \`comment\`
          WHERE targetType = ${targetType}
            AND (${blogId} IS NULL OR blogId = ${blogId})
            AND (${projectId} IS NULL OR projectId = ${projectId})
          ORDER BY createdAt DESC
        `;
      }
    }

    return {
      likesCount,
      comments: (commentsList || []).map((c: any) => ({
        id: c.id,
        authorName: c.authorName,
        content: c.content,
        published: Boolean(c.published),
        createdAt: c.createdAt,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch admin comments:", error);
    return { likesCount: 0, comments: [] };
  }
}

export async function getEngagementStats(targetType: "BLOG" | "PROJECT", slug: string) {
  const result = await getAdminCommentsForTarget(targetType, slug);
  return {
    likesCount: result.likesCount,
    commentsList: result.comments,
  };
}

export async function getDashboardEngagementSummary() {
  try {
    await ensureEngagementTablesExist();
    const blogStats: Record<string, { likes: number; totalComments: number; comments: number; publishedComments: number }> = {};
    const projectStats: Record<string, { likes: number; totalComments: number; comments: number; publishedComments: number }> = {};

    const dbProjects = await prisma.project.findMany({ select: { id: true, slug: true } });
    const dbBlogs = await prisma.blogPost.findMany({ select: { id: true, slug: true } });

    const projIdToSlug: Record<string, string> = {};
    dbProjects.forEach((p) => { projIdToSlug[p.id] = p.slug; });

    const blogIdToSlug: Record<string, string> = {};
    dbBlogs.forEach((b) => { blogIdToSlug[b.id] = b.slug; });

    const p = prisma as any;
    if (p.like && p.comment) {
      // Blog Likes
      const blogLikes = await p.like.groupBy({
        by: ["blogId"],
        where: { targetType: "BLOG" },
        _count: true,
      });

      // Blog Total Comments
      const blogTotalComments = await p.comment.groupBy({
        by: ["blogId"],
        where: { targetType: "BLOG" },
        _count: true,
      });

      // Blog Published Comments
      const blogPublishedComments = await p.comment.groupBy({
        by: ["blogId"],
        where: { targetType: "BLOG", published: true },
        _count: true,
      });

      blogLikes.forEach((item: any) => {
        if (item.blogId) {
          const entry = { likes: item._count, totalComments: 0, comments: 0, publishedComments: 0 };
          blogStats[item.blogId] = entry;
          if (blogIdToSlug[item.blogId]) blogStats[blogIdToSlug[item.blogId]] = entry;
        }
      });

      blogTotalComments.forEach((item: any) => {
        if (item.blogId) {
          const existing = blogStats[item.blogId] || { likes: 0, totalComments: 0, comments: 0, publishedComments: 0 };
          existing.totalComments = item._count;
          existing.comments = item._count;
          blogStats[item.blogId] = existing;
          if (blogIdToSlug[item.blogId]) blogStats[blogIdToSlug[item.blogId]] = existing;
        }
      });

      blogPublishedComments.forEach((item: any) => {
        if (item.blogId) {
          const existing = blogStats[item.blogId] || { likes: 0, totalComments: 0, comments: 0, publishedComments: 0 };
          existing.publishedComments = item._count;
          blogStats[item.blogId] = existing;
          if (blogIdToSlug[item.blogId]) blogStats[blogIdToSlug[item.blogId]] = existing;
        }
      });

      // Project Likes
      const projLikes = await p.like.groupBy({
        by: ["projectId"],
        where: { targetType: "PROJECT" },
        _count: true,
      });

      // Project Total Comments
      const projTotalComments = await p.comment.groupBy({
        by: ["projectId"],
        where: { targetType: "PROJECT" },
        _count: true,
      });

      // Project Published Comments
      const projPublishedComments = await p.comment.groupBy({
        by: ["projectId"],
        where: { targetType: "PROJECT", published: true },
        _count: true,
      });

      projLikes.forEach((item: any) => {
        if (item.projectId) {
          const entry = { likes: item._count, totalComments: 0, comments: 0, publishedComments: 0 };
          projectStats[item.projectId] = entry;
          if (projIdToSlug[item.projectId]) projectStats[projIdToSlug[item.projectId]] = entry;
        }
      });

      projTotalComments.forEach((item: any) => {
        if (item.projectId) {
          const existing = projectStats[item.projectId] || { likes: 0, totalComments: 0, comments: 0, publishedComments: 0 };
          existing.totalComments = item._count;
          existing.comments = item._count;
          projectStats[item.projectId] = existing;
          if (projIdToSlug[item.projectId]) projectStats[projIdToSlug[item.projectId]] = existing;
        }
      });

      projPublishedComments.forEach((item: any) => {
        if (item.projectId) {
          const existing = projectStats[item.projectId] || { likes: 0, totalComments: 0, comments: 0, publishedComments: 0 };
          existing.publishedComments = item._count;
          projectStats[item.projectId] = existing;
          if (projIdToSlug[item.projectId]) projectStats[projIdToSlug[item.projectId]] = existing;
        }
      });
    } else {
      // BULLETPROOF RAW SQL FALLBACK FOR SUMMARY
      const rawLikes: any[] = await prisma.$queryRaw`
        SELECT blogId, projectId, targetType, COUNT(*) as cnt FROM \`like\` GROUP BY blogId, projectId, targetType
      `;
      const rawComments: any[] = await prisma.$queryRaw`
        SELECT blogId, projectId, targetType, published, COUNT(*) as cnt FROM \`comment\` GROUP BY blogId, projectId, targetType, published
      `;

      rawLikes.forEach((item: any) => {
        const count = Number(item.cnt || 0);
        if (item.targetType === "BLOG" && item.blogId) {
          const entry = blogStats[item.blogId] || { likes: 0, totalComments: 0, comments: 0, publishedComments: 0 };
          entry.likes = count;
          blogStats[item.blogId] = entry;
          if (blogIdToSlug[item.blogId]) blogStats[blogIdToSlug[item.blogId]] = entry;
        } else if (item.targetType === "PROJECT" && item.projectId) {
          const entry = projectStats[item.projectId] || { likes: 0, totalComments: 0, comments: 0, publishedComments: 0 };
          entry.likes = count;
          projectStats[item.projectId] = entry;
          if (projIdToSlug[item.projectId]) projectStats[projIdToSlug[item.projectId]] = entry;
        }
      });

      rawComments.forEach((item: any) => {
        const count = Number(item.cnt || 0);
        const isPub = Boolean(item.published);
        if (item.targetType === "BLOG" && item.blogId) {
          const entry = blogStats[item.blogId] || { likes: 0, totalComments: 0, comments: 0, publishedComments: 0 };
          entry.totalComments += count;
          entry.comments += count;
          if (isPub) entry.publishedComments += count;
          blogStats[item.blogId] = entry;
          if (blogIdToSlug[item.blogId]) blogStats[blogIdToSlug[item.blogId]] = entry;
        } else if (item.targetType === "PROJECT" && item.projectId) {
          const entry = projectStats[item.projectId] || { likes: 0, totalComments: 0, comments: 0, publishedComments: 0 };
          entry.totalComments += count;
          entry.comments += count;
          if (isPub) entry.publishedComments += count;
          projectStats[item.projectId] = entry;
          if (projIdToSlug[item.projectId]) projectStats[projIdToSlug[item.projectId]] = entry;
        }
      });
    }

    return { blogStats, projectStats };
  } catch (error) {
    console.error("Failed to fetch dashboard engagement summary:", error);
    return { blogStats: {}, projectStats: {} };
  }
}

export async function getAllEngagementAdmin() {
  try {
    await ensureEngagementTablesExist();
    let totalLikes = 0;
    let totalComments = 0;
    let publishedCommentsCount = 0;
    let pendingCommentsCount = 0;
    const p = prisma as any;

    if (p.like) {
      totalLikes = await p.like.count();
    } else {
      const res: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`like\``;
      totalLikes = Number(res[0]?.count || 0);
    }

    if (p.comment) {
      totalComments = await p.comment.count();
      publishedCommentsCount = await p.comment.count({ where: { published: true } });
      pendingCommentsCount = await p.comment.count({ where: { published: false } });
    } else {
      const res1: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`comment\``;
      totalComments = Number(res1[0]?.count || 0);

      const res2: any[] = await prisma.$queryRaw`SELECT COUNT(*) as count FROM \`comment\` WHERE published = true`;
      publishedCommentsCount = Number(res2[0]?.count || 0);

      pendingCommentsCount = Math.max(0, totalComments - publishedCommentsCount);
    }

    let commentsList: any[] = [];
    if (p.comment) {
      const rawComments = await p.comment.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          blog: { select: { title: true, slug: true } },
          project: { select: { title: true, slug: true } },
        },
      });

      commentsList = rawComments.map((c: any) => ({
        id: c.id,
        targetType: c.targetType,
        authorName: c.authorName,
        content: c.content,
        published: c.published ?? false,
        adminReply: c.adminReply || null,
        adminReplyPublished: Boolean(c.adminReplyPublished),
        createdAt: c.createdAt,
        itemTitle: c.targetType === "BLOG" ? c.blog?.title || "Blog Post" : c.project?.title || "Project",
        itemSlug: c.targetType === "BLOG" ? c.blog?.slug || "" : c.project?.slug || "",
      }));
    } else {
      const rawComments: any[] = await prisma.$queryRaw`
        SELECT c.id, c.targetType, c.authorName, c.content, c.published, c.adminReply, c.adminReplyPublished, c.createdAt,
               p.title as projTitle, p.slug as projSlug,
               b.title as blogTitle, b.slug as blogSlug
        FROM \`comment\` c
        LEFT JOIN \`Project\` p ON c.projectId = p.id
        LEFT JOIN \`BlogPost\` b ON c.blogId = b.id
        ORDER BY c.createdAt DESC
      `;

      commentsList = (rawComments || []).map((c: any) => ({
        id: c.id,
        targetType: c.targetType,
        authorName: c.authorName,
        content: c.content,
        published: Boolean(c.published),
        adminReply: c.adminReply || null,
        adminReplyPublished: Boolean(c.adminReplyPublished),
        createdAt: c.createdAt,
        itemTitle: c.targetType === "BLOG" ? c.blogTitle || "Blog Post" : c.projTitle || "Project",
        itemSlug: c.targetType === "BLOG" ? c.blogSlug || "" : c.projSlug || "",
      }));
    }

    // Fetch projects breakdown
    const dbProjects = await prisma.project.findMany({
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    });

    // Fetch blog posts breakdown
    const dbBlogs = await prisma.blogPost.findMany({
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    });

    const { blogStats, projectStats } = await getDashboardEngagementSummary();

    const projectsList = dbProjects.map((p) => {
      const stats = projectStats[p.id] || projectStats[p.slug] || { likes: 0, totalComments: 0, publishedComments: 0 };
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        likes: stats.likes || 0,
        totalComments: stats.totalComments || stats.comments || 0,
        publishedComments: stats.publishedComments || 0,
        pendingComments: Math.max(0, (stats.totalComments || stats.comments || 0) - (stats.publishedComments || 0)),
      };
    });

    const blogList = dbBlogs.map((b) => {
      const stats = blogStats[b.id] || blogStats[b.slug] || { likes: 0, totalComments: 0, publishedComments: 0 };
      return {
        id: b.id,
        title: b.title,
        slug: b.slug,
        likes: stats.likes || 0,
        totalComments: stats.totalComments || stats.comments || 0,
        publishedComments: stats.publishedComments || 0,
        pendingComments: Math.max(0, (stats.totalComments || stats.comments || 0) - (stats.publishedComments || 0)),
      };
    });

    return {
      summary: {
        totalLikes,
        totalComments,
        publishedCommentsCount,
        pendingCommentsCount,
      },
      projects: projectsList,
      blogPosts: blogList,
      comments: commentsList,
    };
  } catch (error) {
    console.error("Failed to fetch admin engagement data:", error);
    return {
      summary: { totalLikes: 0, totalComments: 0, publishedCommentsCount: 0, pendingCommentsCount: 0 },
      projects: [],
      blogPosts: [],
      comments: [],
    };
  }
}

export async function clearAllLikesAndComments() {
  try {
    await requireAdminSession();
    await ensureEngagementTablesExist();
    const p = prisma as any;
    if (p.like) await p.like.deleteMany({});
    else await prisma.$executeRaw`DELETE FROM \`like\``;

    if (p.comment) await p.comment.deleteMany({});
    else await prisma.$executeRaw`DELETE FROM \`comment\``;

    if (p.notification) await p.notification.deleteMany({});
    else await prisma.$executeRaw`DELETE FROM \`notification\``;

    revalidatePath("/blog");
    revalidatePath("/projects");
    revalidatePath("/private");
    revalidatePath("/private/blog");
    revalidatePath("/private/projects");
    revalidatePath("/private/engagement");

    return { success: true };
  } catch (error) {
    console.error("Failed to clear likes and comments:", error);
    return { success: false, error: String(error) };
  }
}

export interface SaveAdminReplyInput {
  commentId: string;
  reply: string;
  publishReply?: boolean;
}

export async function saveAdminReply(input: SaveAdminReplyInput) {
  try {
    await requireAdminSession();
    await ensureEngagementTablesExist();

    const { commentId, reply, publishReply = true } = input;
    if (!commentId) {
      return { success: false, error: "Comment ID is required." };
    }

    const cleanReply = reply ? sanitizeText(reply.trim()) : "";
    const isPub = Boolean(publishReply && cleanReply);

    const p = prisma as any;
    if (p.comment) {
      await p.comment.update({
        where: { id: commentId },
        data: {
          adminReply: cleanReply || null,
          adminReplyPublished: isPub,
        },
      });
    } else {
      await prisma.$executeRawUnsafe(
        "UPDATE `comment` SET `adminReply` = ?, `adminReplyPublished` = ? WHERE `id` = ?",
        cleanReply || null,
        isPub ? 1 : 0,
        commentId
      );
    }

    revalidatePath("/", "layout");
    revalidatePath("/blog");
    revalidatePath("/projects");
    revalidatePath("/whats-new");
    revalidatePath("/private/engagement");

    return {
      success: true,
      message: isPub ? "Admin reply published!" : "Admin reply draft saved.",
    };
  } catch (error) {
    console.error("Failed to save admin reply:", error);
    return { success: false, error: "Failed to save admin reply." };
  }
}

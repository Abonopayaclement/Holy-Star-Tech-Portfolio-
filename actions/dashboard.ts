"use server";

import { prisma } from "@/lib/prisma";
import { projectsData } from "@/constants/projects";

export async function getDashboardMetrics() {
  try {
    // 1. Projects Metrics
    let totalProjects = 0;
    let featuredProjects = 0;
    try {
      totalProjects = await prisma.project.count();
      featuredProjects = await prisma.project.count({ where: { featured: true } });
    } catch {
      totalProjects = projectsData.length;
      featuredProjects = projectsData.filter((p) => p.featured).length;
    }
    if (totalProjects === 0) {
      totalProjects = projectsData.length;
      featuredProjects = projectsData.filter((p) => p.featured).length;
    }

    // 2. Blog Metrics
    let totalPosts = 0;
    let publishedPosts = 0;
    try {
      totalPosts = await prisma.blogPost.count();
      publishedPosts = await prisma.blogPost.count({ where: { published: true } });
    } catch {
      totalPosts = 4;
      publishedPosts = 4;
    }
    if (totalPosts === 0) {
      totalPosts = 4;
      publishedPosts = 4;
    }

    // 3. Visitors Analytics Metrics
    let totalVisitors = 0;
    let todayVisitors = 0;
    try {
      const { getVisitorAnalytics } = await import("@/actions/analytics");
      const analytics = await getVisitorAnalytics();
      if (analytics) {
        totalVisitors = analytics.totalVisitors;
        todayVisitors = analytics.todayVisitors;
      }
    } catch (err) {
      console.error("Visitors metric error:", err);
    }

    // 4. Messages Metrics
    let totalMessages = 0;
    let unreadMessages = 0;
    try {
      totalMessages = await prisma.contactMessage.count();
      unreadMessages = await prisma.contactMessage.count({ where: { isRead: false } });
    } catch (err) {
      console.error("Contact message metric error:", err);
    }

    return {
      projects: {
        total: totalProjects,
        featured: featuredProjects,
      },
      blog: {
        total: totalPosts,
        published: publishedPosts,
      },
      visitors: {
        total: totalVisitors,
        today: todayVisitors,
      },
      messages: {
        total: totalMessages,
        unread: unreadMessages,
      },
    };
  } catch (error) {
    console.error("Failed to load dashboard metrics:", error);
    return {
      projects: { total: projectsData.length, featured: 3 },
      blog: { total: 4, published: 4 },
      visitors: { total: 0, today: 0 },
      messages: { total: 0, unread: 0 },
    };
  }
}

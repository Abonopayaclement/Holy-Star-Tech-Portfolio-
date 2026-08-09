"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ActiveWorkData {
  title: string;
  description: string;
  progress: number;
  status: "Planning" | "In Progress" | "Testing" | "Completed";
  image?: string;
}

export async function getActiveWork() {
  try {
    const active = await (prisma as any).aboutInfo.findFirst();
    // Use json storage or memory fallback for active work item
    if (active && (active as any).philosophy) {
      try {
        const parsed = JSON.parse((active as any).philosophy);
        if (parsed && parsed.activeWorkTitle) {
          return {
            title: parsed.activeWorkTitle,
            description: parsed.activeWorkDesc,
            progress: parsed.activeWorkProgress || 85,
            status: parsed.activeWorkStatus || "In Progress",
            image: parsed.activeWorkImage || "/logo.png",
          };
        }
      } catch (e) {
        // Fallback default active project
      }
    }

    return {
      title: "Enterprise Microservices Architecture & Real-Time Analytics Platform",
      description:
        "Building a distributed high-throughput event processing engine with Next.js 15, Go services, and MySQL connection pooling.",
      progress: 85,
      status: "In Progress" as const,
      image: "/logo.png",
    };
  } catch (error) {
    console.error("Failed to fetch active work:", error);
    return {
      title: "Enterprise Microservices Architecture & Real-Time Analytics Platform",
      description:
        "Building a distributed high-throughput event processing engine with Next.js 15, Go services, and MySQL connection pooling.",
      progress: 85,
      status: "In Progress" as const,
      image: "/logo.png",
    };
  }
}

export async function updateActiveWork(data: ActiveWorkData) {
  try {
    const existing = await (prisma as any).aboutInfo.findFirst();
    const payload = JSON.stringify({
      activeWorkTitle: data.title,
      activeWorkDesc: data.description,
      activeWorkProgress: Number(data.progress),
      activeWorkStatus: data.status,
      activeWorkImage: data.image || "/logo.png",
    });

    if (existing) {
      await (prisma as any).aboutInfo.update({
        where: { id: existing.id },
        data: { philosophy: payload },
      });
    } else {
      await (prisma as any).aboutInfo.create({
        data: {
          authorName: "Abonopaya Clement Ayebono",
          headline: "Software Architect & Systems Engineer",
          bio: "Passionate software engineer.",
          philosophy: payload,
          location: "Greater Accra, Ghana",
          email: "ayebonoclement@gmail.com",
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/private");
    revalidatePath("/private/active-project");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update active work:", error);
    return { success: false, error: error.message || "Failed to update active project." };
  }
}

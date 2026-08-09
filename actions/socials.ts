"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";

export async function getSocialLinks() {
  try {
    return await prisma.socialLink.findMany({
      orderBy: { order: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch social links:", error);
    return [];
  }
}

export async function upsertSocialLink(data: {
  platform: string;
  url: string;
  order?: number;
}) {
  await requireAdminSession();

  const link = await prisma.socialLink.upsert({
    where: { platform: data.platform },
    update: { url: data.url, order: data.order ?? 0 },
    create: { platform: data.platform, url: data.url, order: data.order ?? 0 },
  });

  revalidatePath("/");
  return { success: true, link };
}

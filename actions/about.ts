"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";

export async function getAboutInfo() {
  try {
    return await prisma.aboutInfo.findFirst();
  } catch (error) {
    console.error("Failed to fetch about info:", error);
    return null;
  }
}

export async function updateAboutInfo(data: {
  authorName: string;
  headline: string;
  bio: string;
  philosophy: string;
  location: string;
  email: string;
}) {
  await requireAdminSession();

  const existing = await prisma.aboutInfo.findFirst();
  let result;

  if (existing) {
    result = await prisma.aboutInfo.update({
      where: { id: existing.id },
      data,
    });
  } else {
    result = await prisma.aboutInfo.create({
      data,
    });
  }

  revalidatePath("/about");
  revalidatePath("/");
  return { success: true, about: result };
}

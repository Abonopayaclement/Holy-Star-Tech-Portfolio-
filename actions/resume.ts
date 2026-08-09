"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";

export async function getResumeData() {
  try {
    return await prisma.resumeData.findFirst();
  } catch (error) {
    console.error("Failed to fetch resume data:", error);
    return null;
  }
}

export async function updateResumeData(data: {
  cvFileUrl?: string;
  summary: string;
  experienceJson: any;
  educationJson: any;
  certsJson: any;
}) {
  await requireAdminSession();

  const existing = await prisma.resumeData.findFirst();
  let result;

  if (existing) {
    result = await prisma.resumeData.update({
      where: { id: existing.id },
      data,
    });
  } else {
    result = await prisma.resumeData.create({
      data,
    });
  }

  revalidatePath("/resume");
  return { success: true, resume: result };
}

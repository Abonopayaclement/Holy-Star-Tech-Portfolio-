"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-guard";

const contactMsgSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email("Invalid email address."),
  subject: z.string().min(3, "Subject is required."),
  message: z.string().min(10, "Message must be at least 10 characters long."),
});

export type ContactMessageInput = z.infer<typeof contactMsgSchema>;

export async function submitContactMessage(input: ContactMessageInput) {
  const validated = contactMsgSchema.parse(input);

  const message = await prisma.contactMessage.create({
    data: validated,
  });

  revalidatePath("/private/messages");
  revalidatePath("/private");

  return { success: true, messageId: message.id };
}

export async function getContactMessages() {
  await requireAdminSession();
  return await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function markMessageRead(id: string) {
  await requireAdminSession();
  await prisma.contactMessage.update({
    where: { id },
    data: { isRead: true },
  });
  return { success: true };
}

export async function deleteContactMessage(id: string) {
  await requireAdminSession();
  await prisma.contactMessage.delete({ where: { id } });
  return { success: true };
}

export async function clearAllContactMessages() {
  await requireAdminSession();
  await prisma.contactMessage.deleteMany({});
  revalidatePath("/private/messages");
  revalidatePath("/private");
  return { success: true };
}

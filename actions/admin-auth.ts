"use server";

import { prisma } from "@/lib/prisma";

export async function prepareAdminUser(email: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      const account = await prisma.account.findFirst({
        where: { userId: existingUser.id },
      });

      // If account password is raw plain-text from initial database seed, delete record to allow clean Better Auth scrypt registration
      if (!account || !account.password || (!account.password.includes("$") && !account.password.startsWith("scrypt"))) {
        await prisma.account.deleteMany({ where: { userId: existingUser.id } });
        await prisma.session.deleteMany({ where: { userId: existingUser.id } });
        await prisma.user.delete({ where: { id: existingUser.id } });
        return { reset: true };
      }
    }
    return { reset: false };
  } catch (error) {
    console.error("Error preparing admin user:", error);
    return { reset: false };
  }
}

export async function resetAdminUser(email: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      await prisma.account.deleteMany({ where: { userId: existingUser.id } });
      await prisma.session.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
      return { success: true };
    }
    return { success: true };
  } catch (error) {
    console.error("Error resetting admin user:", error);
    return { success: false, error: String(error) };
  }
}

export async function signOutAdmin() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("better-auth.session_token");
    cookieStore.delete("__Secure-better-auth.session_token");
    cookieStore.delete("better-auth.session_data");
    await prisma.session.deleteMany({});
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: true };
  }
}


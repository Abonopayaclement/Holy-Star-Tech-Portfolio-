import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getAdminSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Administrator session required.");
  }
  return session;
}

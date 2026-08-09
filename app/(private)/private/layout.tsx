import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/private";

  const session = await getAdminSession();
  const isAuthenticated = Boolean(session && session.user);

  const isLoginPage = pathname === "/private/login";

  // Flow Rule 1: Unauthenticated visitors trying to access dashboard routes -> Redirect to Login
  if (!isAuthenticated && !isLoginPage) {
    redirect(`/private/login?from=${encodeURIComponent(pathname)}`);
  }

  // Flow Rule 2: Authenticated admins visiting login page -> Redirect to Dashboard
  if (isAuthenticated && isLoginPage) {
    redirect("/private");
  }

  return <>{children}</>;
}

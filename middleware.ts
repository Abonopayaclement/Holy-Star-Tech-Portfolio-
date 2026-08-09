import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward x-pathname header to Request headers so Server Components (layout.tsx) can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Redirect legacy /dashboard or /admin requests to /private
  if (pathname === "/dashboard" || pathname === "/admin") {
    return NextResponse.redirect(new URL("/private", request.url));
  }

  // Private administration route protection (/private, /private/*)
  const isPrivateArea = pathname.startsWith("/private");
  const isPrivateLoginPage = pathname === "/private/login";

  if (isPrivateArea && !isPrivateLoginPage) {
    // Check for Better Auth session token cookie
    const sessionToken =
      request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value ||
      request.cookies.get("better_auth_session")?.value;

    if (!sessionToken) {
      const loginUrl = new URL("/private/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

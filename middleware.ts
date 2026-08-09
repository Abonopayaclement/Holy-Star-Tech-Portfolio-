import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward x-pathname header to Request headers so Server Components (layout.tsx) can read it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const isPrivateArea =
    pathname.startsWith("/private") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin");

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

    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/private", request.url));
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set no-cache header for private routes to prevent browser back button cache bypass
  if (isPrivateArea) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

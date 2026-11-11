import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Allow public auth endpoints
  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const user = verifySessionToken(sessionToken);

  // 3. If accessing /login
  if (pathname === "/login") {
    if (user) {
      // Already logged in, redirect to destination or home
      const destination = request.nextUrl.searchParams.get("from") || "/";
      const redirectUrl = new URL(destination.startsWith("/") ? destination : "/", request.url);
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  // 4. If accessing protected routes without valid session
  if (!user) {
    // If it's an API route, return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: "অননুমোদিত অ্যাক্সেস। অনুগ্রহ করে লগইন করুন।",
          authenticated: false,
        },
        { status: 401 }
      );
    }

    // For web page routes, redirect to /login with 'from' parameter
    const loginUrl = new URL("/login", request.url);
    const targetPath = pathname + search;
    if (targetPath && targetPath !== "/") {
      loginUrl.searchParams.set("from", targetPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 5. User is authenticated, attach user email in request header for downstream components
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-email", user.email);
  if (user.name) {
    requestHeaders.set("x-user-name", encodeURIComponent(user.name));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - fonts (custom local fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|fonts).*)",
  ],
};

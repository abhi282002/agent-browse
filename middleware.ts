import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Next.js Edge Middleware for Route Protection
 * - Public routes: / (Landing), /api/trpc/*, static assets
 * - Protected routes: /workflow, /workflow/*
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Enforce session check on protected studio routes
  if (pathname.startsWith("/workflow")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      const redirectUrl = new URL("/", request.url);
      redirectUrl.searchParams.set("auth", "signin");
      redirectUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/workflow/:path*"],
};

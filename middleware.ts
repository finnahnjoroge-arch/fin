import NextAuth from "next-auth";
import type { NextFetchEvent, NextMiddleware, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

const nextAuthMiddleware: NextMiddleware = auth(
  () => undefined,
) as unknown as NextMiddleware;

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  try {
    return (await nextAuthMiddleware(request, event)) ?? NextResponse.next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    // Avoid hard crashes on public admin routes; fail secure otherwise.
    const pathname = request.nextUrl.pathname;
    if (pathname === "/admin/login" || pathname === "/api/admin/setup") {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

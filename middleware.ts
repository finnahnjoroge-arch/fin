import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getTokenFromCookie(req: NextRequest): string | null {
  const token = req.cookies.get("authjs.session-token")?.value
    || req.cookies.get("__Secure-authjs.session-token")?.value
    || req.cookies.get("next-auth.session-token")?.value
    || req.cookies.get("__Secure-next-auth.session-token")?.value;
  return token || null;
}

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isLoginPage = nextUrl.pathname === "/admin/login";
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");

  if (!isAdminRoute || isApiAuthRoute) {
    return NextResponse.next();
  }

  const token = getTokenFromCookie(req);
  const isLoggedIn = !!token;

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

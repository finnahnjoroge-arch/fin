import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isAdminRoute =
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/admin");

  const isPublic =
    pathname === "/admin/login" ||
    pathname === "/api/admin/setup";

  if (isAdminRoute && !isPublic && !req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};

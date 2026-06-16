import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic =
        nextUrl.pathname === "/admin/login" ||
        nextUrl.pathname === "/api/admin/setup";
      if (isPublic) return true;
      const isAdminApi = nextUrl.pathname.startsWith("/api/admin");
      const isAdminPage = nextUrl.pathname.startsWith("/admin");
      if (isAdminApi && !isLoggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (isAdminPage && !isLoggedIn) return false;
      return true;
    },
  },
  providers: [],
};

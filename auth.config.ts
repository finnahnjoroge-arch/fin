import type { NextAuthConfig } from "next-auth";

// Edge-compatible config — no Node.js imports allowed here
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute =
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/api/admin");
      const isPublic =
        nextUrl.pathname === "/admin/login" ||
        nextUrl.pathname === "/api/admin/setup";

      if (isPublic) return true;
      if (isAdminRoute) return isLoggedIn;
      return true;
    },
  },
  providers: [], // Providers added in auth.ts, not here
};

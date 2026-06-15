import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "./lib/mongodb";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const db = await connectDB();
        const email = credentials.email.trim().toLowerCase();
        const user = await db.collection('users').findOne({ email });
        
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        if (!isValid) return null;

        return {
          id: (user as any)._id.toString(),
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token) {
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/login",
  },
});

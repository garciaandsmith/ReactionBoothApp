import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) return null;

      // Block paused and pending-approval accounts
      if (user.status === "paused" || user.status === "pending") return null;

      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string; plan?: string; role?: string }).id = token.sub;
        (session.user as { id?: string; plan?: string; role?: string }).plan =
          (token.plan as string) || "free";
        (session.user as { id?: string; plan?: string; role?: string }).role =
          (token.role as string) || "user";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { plan: true, role: true, status: true },
        });
        token.plan = dbUser?.plan || "free";
        token.role = dbUser?.role || "user";
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

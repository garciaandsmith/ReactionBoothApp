import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

const smtpConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_HOST !== "smtp.example.com" &&
  process.env.SMTP_USER
);

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

      // Block paused accounts
      if (user.status === "paused") return null;

      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];

if (smtpConfigured) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const EmailProvider = require("next-auth/providers/email").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { sendMagicLinkEmail } = require("./email");
  providers.push(
    EmailProvider({
      sendVerificationRequest: async ({
        identifier: email,
        url,
      }: {
        identifier: string;
        url: string;
      }) => {
        await sendMagicLinkEmail(email, url);
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
    verifyRequest: "/auth/verify",
  },
};

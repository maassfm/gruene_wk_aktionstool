import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { teams: { select: { teamId: true } } },
        });

        if (!user || !user.active) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          teamIds: user.teams.map((t) => t.teamId),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.teamIds = user.teamIds;
        token.lastChecked = Date.now();
      }

      // Alle 5 Minuten User-Status aus DB prüfen (SEC-04)
      const CHECK_INTERVAL = 5 * 60 * 1000; // 5 Minuten
      if (Date.now() - ((token.lastChecked as number) ?? 0) > CHECK_INTERVAL) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: { active: true },
        });
        if (!dbUser || !dbUser.active) {
          return null; // Session invalidiert — deaktivierter oder gelöschter Nutzer
        }
        token.lastChecked = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.teamIds = (token.teamIds as string[]) ?? [];
      }
      return session;
    },
  },
});

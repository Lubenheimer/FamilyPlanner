import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM ?? "FamilyPlanner <noreply@example.com>",
    }),
  ],
  session: {
    strategy: "database",
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async session({ session, user }) {
      // Familiendaten ergänzen
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: {
          id: true,
          familyId: true,
          role: true,
          color: true,
          name: true,
        },
      });
      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.familyId = dbUser.familyId ?? undefined;
        session.user.role = dbUser.role;
        session.user.color = dbUser.color;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
});

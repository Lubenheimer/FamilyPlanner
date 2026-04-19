import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      familyId?: string;
      role: "parent" | "child";
      color: string;
    } & DefaultSession["user"];
  }
}

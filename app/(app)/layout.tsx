import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/layout/app-nav";
import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!session.user.familyId) redirect("/onboarding");

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav user={session.user} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {children}
      </main>
    </div>
  );
}

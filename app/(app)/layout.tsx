"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFamilyStore, useIsSetup } from "@/lib/stores/family-store";
import { AppNav } from "@/components/layout/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isSetup = useIsSetup();
  const currentMemberId = useFamilyStore((s) => s.currentMemberId);
  const members = useFamilyStore((s) => s.members);
  const currentMember = members.find((m) => m.id === currentMemberId) ?? null;

  useEffect(() => {
    if (!isSetup) router.replace("/onboarding");
    else if (!currentMemberId) router.replace("/login");
  }, [isSetup, currentMemberId, router]);

  if (!currentMember) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <AppNav member={currentMember} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {children}
      </main>
    </div>
  );
}

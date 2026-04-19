"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsSetup, useFamilyStore } from "@/lib/stores/family-store";

export default function RootPage() {
  const router = useRouter();
  const isSetup = useIsSetup();
  const currentMemberId = useFamilyStore((s) => s.currentMemberId);

  useEffect(() => {
    // GitHub Pages SPA-Redirect: ?p=/pfad wiederherstellen
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get("p");
    if (redirectPath) {
      router.replace(redirectPath);
      return;
    }

    // Normale Routing-Logik
    if (!isSetup) {
      router.replace("/onboarding");
    } else if (!currentMemberId) {
      router.replace("/login");
    } else {
      router.replace("/week");
    }
  }, [isSetup, currentMemberId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-4xl animate-pulse">🏠</div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useIsSetup } from "@/lib/stores/family-store";
import { useEffect } from "react";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  const router = useRouter();
  const isSetup = useIsSetup();

  useEffect(() => {
    if (isSetup) router.replace("/login");
  }, [isSetup, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🏠</div>
          <h1 className="text-2xl font-bold tracking-tight">FamilyPlanner</h1>
          <p className="text-sm text-muted-foreground">
            Willkommen! Richtet euren Familienplaner ein.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}

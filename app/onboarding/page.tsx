import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.familyId) redirect("/week");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🏠</div>
          <h1 className="text-2xl font-bold tracking-tight">
            Willkommen, {session.user.name ?? session.user.email}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Leg jetzt eure Familie an, um loszulegen.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}

import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/week");

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">🏠</div>
        <h1 className="text-2xl font-bold tracking-tight">FamilyPlanner</h1>
        <p className="text-sm text-muted-foreground">
          Euer gemeinsamer Familienkalender
        </p>
      </div>
      <LoginForm />
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useFamilyStore, useIsSetup } from "@/lib/stores/family-store";
import { useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const isSetup = useIsSetup();
  const { members, setCurrentMember, familyName } = useFamilyStore();

  useEffect(() => {
    if (!isSetup) router.replace("/onboarding");
  }, [isSetup, router]);

  const handleSelect = (id: string) => {
    setCurrentMember(id);
    router.push("/week");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-2">
          <div className="text-5xl">🏠</div>
          <h1 className="text-2xl font-bold tracking-tight">{familyName}</h1>
          <p className="text-sm text-muted-foreground">Wer bist du?</p>
        </div>

        <div className="grid gap-3">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelect(member.id)}
              className="flex items-center gap-4 rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              style={{ borderColor: member.color }}
            >
              <Avatar className="h-12 w-12 text-white text-lg font-bold" style={{ backgroundColor: member.color }}>
                <AvatarFallback style={{ backgroundColor: member.color, color: "white" }}>
                  {member.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{member.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {member.role === "parent" ? "Elternteil" : "Kind"}
                </p>
              </div>
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => router.push("/settings/family")}
        >
          Familie verwalten
        </Button>
      </div>
    </main>
  );
}

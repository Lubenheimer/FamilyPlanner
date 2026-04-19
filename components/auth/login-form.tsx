"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await signIn("resend", {
        email: data.email,
        redirect: false,
        callbackUrl: "/week",
      });

      if (result?.error) {
        toast.error("Fehler beim Senden des Links. Bitte versuche es erneut.");
      } else {
        window.location.href = "/login/verify";
      }
    } catch {
      toast.error("Etwas ist schiefgelaufen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Anmelde-Link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              placeholder="familie@beispiel.de"
              autoComplete="email"
              disabled={loading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Wird gesendet…" : "Link senden"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

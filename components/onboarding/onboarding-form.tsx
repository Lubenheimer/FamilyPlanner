"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFamilyStore } from "@/lib/stores/family-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const COLORS = [
  { hex: "#6366f1", label: "Indigo" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#10b981", label: "Grün" },
  { hex: "#3b82f6", label: "Blau" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#14b8a6", label: "Teal" },
];

const schema = z.object({
  familyName: z.string().min(1, "Bitte einen Familiennamen eingeben").max(100),
  parentName: z.string().min(1, "Bitte deinen Namen eingeben").max(100),
  parentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  children: z
    .array(z.object({
      name: z.string().min(1, "Name fehlt").max(100),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }))
    .max(8),
});

type FormData = z.infer<typeof schema>;

export function OnboardingForm() {
  const router = useRouter();
  const { setupFamily, setCurrentMember } = useFamilyStore();

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { parentColor: COLORS[0].hex, children: [] },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "children" });
  const parentColor = watch("parentColor");
  const childColors = watch("children").map((c) => c.color);
  const usedColors = [parentColor, ...childColors];

  const onSubmit = (data: FormData) => {
    const members = [
      { name: data.parentName, role: "parent" as const, color: data.parentColor },
      ...data.children.map((c) => ({ name: c.name, role: "child" as const, color: c.color })),
    ];

    setupFamily(data.familyName, members);
    toast.success(`Willkommen, Familie ${data.familyName}! 🎉`);
    router.push("/login");
  };

  const addChildField = () => {
    const nextColor = COLORS.find((c) => !usedColors.includes(c.hex))?.hex ?? COLORS[1].hex;
    append({ name: "", color: nextColor });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Familie */}
      <Card>
        <CardHeader><CardTitle className="text-base">Eure Familie</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="familyName">Familienname</Label>
            <Input id="familyName" placeholder='z.B. "Familie Müller"' {...register("familyName")} />
            {errors.familyName && <p className="text-sm text-destructive">{errors.familyName.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Elternteil */}
      <Card>
        <CardHeader><CardTitle className="text-base">Dein Profil</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="parentName">Dein Name</Label>
            <Input id="parentName" placeholder="z.B. Marco" {...register("parentName")} />
            {errors.parentName && <p className="text-sm text-destructive">{errors.parentName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Deine Farbe</Label>
            <ColorPicker value={parentColor} onChange={(c) => setValue("parentColor", c)} disabledColors={childColors} />
          </div>
        </CardContent>
      </Card>

      {/* Kinder */}
      <Card>
        <CardHeader><CardTitle className="text-base">Kinder <span className="font-normal text-muted-foreground text-sm">(optional)</span></CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, i) => (
            <div key={field.id} className="space-y-3 border rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kind {i + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>Entfernen</Button>
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input placeholder="z.B. Lena" {...register(`children.${i}.name`)} />
                {errors.children?.[i]?.name && <p className="text-sm text-destructive">{errors.children[i]?.name?.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Farbe</Label>
                <ColorPicker
                  value={watch(`children.${i}.color`)}
                  onChange={(c) => setValue(`children.${i}.color`, c)}
                  disabledColors={[parentColor, ...childColors.filter((_, j) => j !== i)]}
                />
              </div>
            </div>
          ))}
          {fields.length < 6 && (
            <Button type="button" variant="outline" className="w-full" onClick={addChildField}>
              + Kind hinzufügen
            </Button>
          )}
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        Familie anlegen & starten 🚀
      </Button>
    </form>
  );
}

function ColorPicker({ value, onChange, disabledColors = [] }: {
  value: string;
  onChange: (c: string) => void;
  disabledColors?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((color) => {
        const disabled = disabledColors.includes(color.hex);
        const selected = value === color.hex;
        return (
          <button
            key={color.hex}
            type="button"
            disabled={disabled}
            onClick={() => onChange(color.hex)}
            className="relative w-9 h-9 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: color.hex, outline: selected ? `3px solid ${color.hex}` : "none", outlineOffset: "2px" }}
            title={color.label}
          >
            {selected && (
              <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

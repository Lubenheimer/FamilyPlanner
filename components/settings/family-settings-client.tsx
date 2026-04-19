"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFamilyStore, type FamilyMember } from "@/lib/stores/family-store";
import { useWeatherStore } from "@/lib/stores/weather-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { wmoIcon } from "@/lib/weather";

const COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#f97316", "#14b8a6",
];

const memberSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const familySchema = z.object({ name: z.string().min(1).max(100) });

const addChildSchema = z.object({
  name: z.string().min(1, "Name fehlt").max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

type MemberFormData = z.infer<typeof memberSchema>;
type FamilyFormData = z.infer<typeof familySchema>;
type AddChildFormData = z.infer<typeof addChildSchema>;

export function FamilySettingsClient() {
  const { familyName, members, updateFamilyName, addMember, updateMember, removeMember } = useFamilyStore();
  const { city, locationName, daily, loading: weatherLoading, error: weatherError, setLocation } = useWeatherStore();
  const [addChildOpen, setAddChildOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState(city);

  const familyForm = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    values: { name: familyName },
  });

  const addChildForm = useForm<AddChildFormData>({
    resolver: zodResolver(addChildSchema),
    defaultValues: { name: "", color: COLORS.find((c) => !members.some((m) => m.color === c)) ?? COLORS[0] },
  });

  const onFamilySubmit = (data: FamilyFormData) => {
    updateFamilyName(data.name);
    toast.success("Familienname gespeichert");
  };

  const onAddChild = (data: AddChildFormData) => {
    addMember({ name: data.name, role: "child", color: data.color });
    addChildForm.reset();
    setAddChildOpen(false);
    toast.success(`${data.name} hinzugefügt 🎉`);
  };

  const onRemove = (member: FamilyMember) => {
    if (!confirm(`${member.name} wirklich aus der Familie entfernen?`)) return;
    removeMember(member.id);
    toast.success(`${member.name} entfernt`);
  };

  const handleSetCity = async () => {
    if (!cityInput.trim()) return;
    const ok = await setLocation(cityInput.trim());
    if (ok) toast.success(`Wetter-Standort: ${locationName || cityInput}`);
    else toast.error(weatherError ?? "Standort nicht gefunden");
  };

  // Heute-Wetter für Vorschau
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayWeather = daily.find((d) => d.date === todayStr);

  return (
    <div className="space-y-6">
      {/* Familienname */}
      <Card>
        <CardHeader><CardTitle className="text-base">Familienname</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={familyForm.handleSubmit(onFamilySubmit)} className="flex gap-2">
            <Input {...familyForm.register("name")} placeholder="Familienname" className="flex-1" />
            <Button type="submit">Speichern</Button>
          </form>
        </CardContent>
      </Card>

      {/* Wetter-Standort */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wetter-Standort</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="z.B. München"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetCity()}
              className="flex-1"
            />
            <Button onClick={handleSetCity} disabled={weatherLoading}>
              {weatherLoading ? "Lädt…" : "Speichern"}
            </Button>
          </div>
          {weatherError && (
            <p className="text-sm text-destructive">{weatherError}</p>
          )}
          {todayWeather && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-base">{wmoIcon(todayWeather.weatherCode)}</span>
              <span>
                {locationName} · heute {todayWeather.tempMax}° / {todayWeather.tempMin}°
              </span>
            </div>
          )}
          {!city && (
            <p className="text-xs text-muted-foreground">
              Gib deinen Wohnort ein, um Wetter-Icons im Kalender zu sehen.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mitglieder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Familienmitglieder</CardTitle>
          <Dialog open={addChildOpen} onOpenChange={setAddChildOpen}>
            <DialogTrigger>
              <Button size="sm" variant="outline" type="button">+ Kind hinzufügen</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Kind hinzufügen</DialogTitle></DialogHeader>
              <form onSubmit={addChildForm.handleSubmit(onAddChild)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input placeholder="z.B. Lena" {...addChildForm.register("name")} />
                  {addChildForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{addChildForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Farbe</Label>
                  <ColorPicker
                    value={addChildForm.watch("color")}
                    onChange={(c) => addChildForm.setValue("color", c)}
                    disabledColors={members.map((m) => m.color)}
                  />
                </div>
                <Button type="submit" className="w-full">Hinzufügen</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.map((member, idx) => (
            <div key={member.id}>
              {idx > 0 && <Separator className="mb-3" />}
              <MemberRow
                member={member}
                isEditing={editingId === member.id}
                onEdit={() => setEditingId(editingId === member.id ? null : member.id)}
                onSave={(data) => { updateMember(member.id, data); setEditingId(null); toast.success("Gespeichert"); }}
                onRemove={() => onRemove(member)}
                usedColors={members.filter((m) => m.id !== member.id).map((m) => m.color)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRow({ member, isEditing, onEdit, onSave, onRemove, usedColors }: {
  member: FamilyMember;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: MemberFormData) => void;
  onRemove: () => void;
  usedColors: string[];
}) {
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    values: { name: member.name, color: member.color },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback style={{ backgroundColor: member.color }} className="text-white text-sm font-semibold">
            {member.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{member.name}</p>
        </div>
        <Badge variant={member.role === "parent" ? "default" : "secondary"}>
          {member.role === "parent" ? "Elternteil" : "Kind"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          {isEditing ? "Abbrechen" : "Bearbeiten"}
        </Button>
      </div>

      {isEditing && (
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-3 pl-12">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Farbe</Label>
            <ColorPicker
              value={form.watch("color")}
              onChange={(c) => form.setValue("color", c)}
              disabledColors={usedColors}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Speichern</Button>
            {member.role === "child" && (
              <Button type="button" variant="destructive" size="sm" onClick={onRemove}>Entfernen</Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function ColorPicker({ value, onChange, disabledColors = [] }: {
  value: string; onChange: (c: string) => void; disabledColors?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLORS.map((c) => (
        <button
          key={c} type="button"
          disabled={disabledColors.includes(c)}
          onClick={() => onChange(c)}
          className="relative w-8 h-8 rounded-full disabled:opacity-30"
          style={{ backgroundColor: c, outline: value === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
        >
          {value === c && <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>}
        </button>
      ))}
    </div>
  );
}

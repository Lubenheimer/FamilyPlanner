"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTRPC } from "@/lib/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#f97316", "#14b8a6",
];

const memberSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const familySchema = z.object({
  name: z.string().min(1).max(100),
});

const addChildSchema = z.object({
  name: z.string().min(1, "Name fehlt").max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

type MemberFormData = z.infer<typeof memberSchema>;
type FamilyFormData = z.infer<typeof familySchema>;
type AddChildFormData = z.infer<typeof addChildSchema>;

export function FamilySettingsClient() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: family } = useQuery(trpc.family.get.queryOptions());
  const { data: members = [] } = useQuery(trpc.family.members.queryOptions());

  const { mutateAsync: updateFamily } = useMutation({
    ...trpc.family.update.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(trpc.family.get.queryFilter()),
  });

  const { mutateAsync: updateMember } = useMutation({
    ...trpc.user.updateMember.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(trpc.family.members.queryFilter()),
  });

  const { mutateAsync: removeMember } = useMutation({
    ...trpc.family.removeMember.mutationOptions(),
    onSuccess: () => qc.invalidateQueries(trpc.family.members.queryFilter()),
  });

  const { mutateAsync: addChild } = useMutation({
    ...trpc.user.addChild.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.family.members.queryFilter());
      setAddChildOpen(false);
    },
  });

  const [addChildOpen, setAddChildOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const familyForm = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    values: { name: family?.name ?? "" },
  });

  const addChildForm = useForm<AddChildFormData>({
    resolver: zodResolver(addChildSchema),
    defaultValues: { color: COLORS[0] },
  });

  const onFamilySubmit = async (data: FamilyFormData) => {
    try {
      await updateFamily(data);
      toast.success("Familienname gespeichert");
    } catch {
      toast.error("Fehler beim Speichern");
    }
  };

  const onAddChild = async (data: AddChildFormData) => {
    try {
      await addChild(data);
      addChildForm.reset({ color: COLORS[0] });
      toast.success(`${data.name} hinzugefügt`);
    } catch {
      toast.error("Fehler beim Hinzufügen");
    }
  };

  const onRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`${name} wirklich aus der Familie entfernen?`)) return;
    try {
      await removeMember({ userId });
      toast.success(`${name} entfernt`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fehler";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Familienname */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Familienname</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={familyForm.handleSubmit(onFamilySubmit)}
            className="flex gap-2"
          >
            <Input
              {...familyForm.register("name")}
              placeholder="Familienname"
              className="flex-1"
            />
            <Button type="submit" disabled={familyForm.formState.isSubmitting}>
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mitglieder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Familienmitglieder</CardTitle>
          <Dialog open={addChildOpen} onOpenChange={setAddChildOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" />}>
              + Kind hinzufügen
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kind hinzufügen</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={addChildForm.handleSubmit(onAddChild)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    placeholder="z.B. Lena"
                    {...addChildForm.register("name")}
                  />
                  {addChildForm.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {addChildForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Farbe</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => {
                      const used = members.some((m) => m.color === c);
                      return (
                        <button
                          key={c}
                          type="button"
                          disabled={used}
                          onClick={() => addChildForm.setValue("color", c)}
                          className="w-8 h-8 rounded-full disabled:opacity-30 relative"
                          style={{ backgroundColor: c }}
                        >
                          {addChildForm.watch("color") === c && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addChildForm.formState.isSubmitting}
                >
                  Hinzufügen
                </Button>
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
                isEditing={editingMemberId === member.id}
                onEdit={() =>
                  setEditingMemberId(
                    editingMemberId === member.id ? null : member.id
                  )
                }
                onSave={async (data) => {
                  await updateMember({ userId: member.id, ...data });
                  setEditingMemberId(null);
                  toast.success("Gespeichert");
                }}
                onRemove={() => onRemoveMember(member.id, member.name)}
                usedColors={members
                  .filter((m) => m.id !== member.id)
                  .map((m) => m.color)}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function MemberRow({
  member,
  isEditing,
  onEdit,
  onSave,
  onRemove,
  usedColors,
}: {
  member: { id: string; name: string; email: string | null; role: string; color: string };
  isEditing: boolean;
  onEdit: () => void;
  onSave: (data: MemberFormData) => Promise<void>;
  onRemove: () => void;
  usedColors: string[];
}) {
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    values: { name: member.name, color: member.color },
  });

  const initials = member.name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback
            style={{ backgroundColor: member.color }}
            className="text-white text-sm font-semibold"
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{member.name}</p>
          {member.email && (
            <p className="text-xs text-muted-foreground truncate">
              {member.email}
            </p>
          )}
        </div>
        <Badge variant={member.role === "parent" ? "default" : "secondary"}>
          {member.role === "parent" ? "Elternteil" : "Kind"}
        </Badge>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          {isEditing ? "Abbrechen" : "Bearbeiten"}
        </Button>
      </div>

      {isEditing && (
        <form
          onSubmit={form.handleSubmit(onSave)}
          className="space-y-3 pl-12"
        >
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...form.register("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>Farbe</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => {
                const disabled = usedColors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={disabled}
                    onClick={() => form.setValue("color", c)}
                    className="w-8 h-8 rounded-full disabled:opacity-30 relative"
                    style={{ backgroundColor: c }}
                  >
                    {form.watch("color") === c && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
              Speichern
            </Button>
            {member.role === "child" && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onRemove}
              >
                Entfernen
              </Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

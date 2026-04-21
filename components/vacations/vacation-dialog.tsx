"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useVacationStore, type Vacation, type VacationStatus } from "@/lib/stores/vacation-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Titel erforderlich"),
  destination: z.string().min(1, "Reiseziel erforderlich"),
  startDate: z.string().min(1, "Startdatum erforderlich"),
  endDate: z.string().min(1, "Enddatum erforderlich"),
  status: z.enum(["idea", "booked", "done"] as const),
  budgetStr: z.string().optional(),
  notes: z.string().optional(),
  participants: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

const STATUS_OPTIONS: { value: VacationStatus; label: string }[] = [
  { value: "idea",   label: "💡 Idee" },
  { value: "booked", label: "✅ Gebucht" },
  { value: "done",   label: "🏁 Abgeschlossen" },
];

interface VacationDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingVacation?: Vacation;
}

export function VacationDialog({ open, onOpenChange, editingVacation }: VacationDialogProps) {
  const { addVacation, updateVacation } = useVacationStore();
  const { members } = useFamilyStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      destination: "",
      startDate: "",
      endDate: "",
      status: "idea",
      budgetStr: "",
      notes: "",
      participants: members.map((m) => m.id), // standardmäßig alle
    },
  });

  const participants = watch("participants");

  // Beim Bearbeiten Formular befüllen
  useEffect(() => {
    if (editingVacation) {
      reset({
        title: editingVacation.title,
        destination: editingVacation.destination,
        startDate: editingVacation.startDate,
        endDate: editingVacation.endDate,
        status: editingVacation.status,
        budgetStr: editingVacation.budget?.toString() ?? "",
        notes: editingVacation.notes ?? "",
        participants: editingVacation.participants,
      });
    } else {
      reset({
        title: "",
        destination: "",
        startDate: "",
        endDate: "",
        status: "idea",
        budgetStr: "",
        notes: "",
        participants: members.map((m) => m.id),
      });
    }
  }, [editingVacation, open, reset, members]);

  const toggleParticipant = (memberId: string) => {
    const current = participants ?? [];
    if (current.includes(memberId)) {
      setValue("participants", current.filter((id) => id !== memberId));
    } else {
      setValue("participants", [...current, memberId]);
    }
  };

  const onSubmit = (data: FormData) => {
    const budget = data.budgetStr ? parseFloat(data.budgetStr) : undefined;

    const payload = {
      title: data.title,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      budget: !isNaN(budget ?? NaN) ? budget : undefined,
      notes: data.notes || undefined,
      participants: data.participants,
    };

    if (editingVacation) {
      updateVacation(editingVacation.id, payload);
      toast.success("Urlaub aktualisiert");
    } else {
      addVacation(payload);
      toast.success("Urlaub hinzugefügt 🌍");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingVacation ? "Urlaub bearbeiten" : "Neuer Urlaub"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Titel */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Titel *</Label>
            <Input id="title" placeholder="Sommerurlaub 2025…" {...register("title")} />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Reiseziel */}
          <div className="space-y-1.5">
            <Label htmlFor="destination">Reiseziel *</Label>
            <Input id="destination" placeholder="Mallorca, Spanien" {...register("destination")} />
            {errors.destination && (
              <p className="text-xs text-destructive">{errors.destination.message}</p>
            )}
          </div>

          {/* Zeitraum */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Abreise *</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-xs text-destructive">{errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">Rückkehr *</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-xs text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Status + Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register("status")}
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-ring"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budgetStr">Budget (€)</Label>
              <Input
                id="budgetStr"
                type="number"
                min="0"
                step="1"
                placeholder="2000"
                {...register("budgetStr")}
              />
            </div>
          </div>

          {/* Teilnehmer */}
          <div className="space-y-2">
            <Label>Teilnehmer</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const isSelected = (participants ?? []).includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleParticipant(member.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm border transition-all ${
                      isSelected
                        ? "border-transparent text-white"
                        : "border-muted-foreground/30 text-muted-foreground bg-white"
                    }`}
                    style={isSelected ? { backgroundColor: member.color } : {}}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback
                        style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.3)" : member.color }}
                        className="text-white text-[9px] font-bold"
                      >
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {member.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notizen */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              placeholder="Hotel, Ideen, To-Dos…"
              rows={3}
              {...register("notes")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingVacation ? "Speichern" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

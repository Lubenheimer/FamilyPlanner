"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEventStore } from "@/lib/stores/event-store";
import { useFamilyStore, useCurrentMember } from "@/lib/stores/family-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { toDatetimeLocal, fromDatetimeLocal } from "@/lib/date-utils";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Titel fehlt"),
  location: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  allDay: z.boolean(),
  attendeeIds: z.array(z.string()),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: Date | null;
  eventId: string | null;
}

export function EventDialog({ open, onOpenChange, initialDate, eventId }: EventDialogProps) {
  const { events, addEvent, updateEvent, deleteEvent } = useEventStore();
  const { members } = useFamilyStore();
  const currentMember = useCurrentMember();

  const existing = eventId ? events.find((e) => e.id === eventId) : null;
  const isEdit = !!existing;

  const defaultStart = initialDate ?? new Date();
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      location: "",
      startsAt: toDatetimeLocal(defaultStart),
      endsAt: toDatetimeLocal(defaultEnd),
      allDay: false,
      attendeeIds: currentMember ? [currentMember.id] : [],
      notes: "",
    },
  });

  // Formular füllen wenn Edit-Modus
  useEffect(() => {
    if (existing) {
      reset({
        title: existing.title,
        location: existing.location ?? "",
        startsAt: toDatetimeLocal(new Date(existing.startsAt)),
        endsAt: toDatetimeLocal(new Date(existing.endsAt)),
        allDay: existing.allDay,
        attendeeIds: existing.attendeeIds,
        notes: existing.description ?? "",
      });
    } else {
      const start = initialDate ?? new Date();
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      reset({
        title: "",
        location: "",
        startsAt: toDatetimeLocal(start),
        endsAt: toDatetimeLocal(end),
        allDay: false,
        attendeeIds: currentMember ? [currentMember.id] : [],
        notes: "",
      });
    }
  }, [existing, initialDate, currentMember, reset]);

  const attendeeIds = watch("attendeeIds");
  const allDay = watch("allDay");

  const toggleAttendee = (id: string) => {
    if (attendeeIds.includes(id)) {
      setValue("attendeeIds", attendeeIds.filter((a) => a !== id));
    } else {
      setValue("attendeeIds", [...attendeeIds, id]);
    }
  };

  const onSubmit = (data: FormData) => {
    if (!currentMember) return;
    const payload = {
      title: data.title,
      description: data.notes,
      location: data.location,
      startsAt: fromDatetimeLocal(data.startsAt).toISOString(),
      endsAt: fromDatetimeLocal(data.endsAt).toISOString(),
      allDay: data.allDay,
      attendeeIds: data.attendeeIds,
      source: "local" as const,
      createdBy: currentMember.id,
    };

    if (isEdit && existing) {
      updateEvent(existing.id, payload);
      toast.success("Termin aktualisiert");
    } else {
      addEvent(payload);
      toast.success("Termin gespeichert");
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (existing) {
      deleteEvent(existing.id);
      toast.success("Termin gelöscht");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Termin bearbeiten" : "Neuer Termin"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Titel */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Titel *</Label>
            <Input id="title" placeholder="Was ist geplant?" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Ort */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Ort</Label>
            <Input id="location" placeholder="Wo?" {...register("location")} />
          </div>

          {/* Ganztägig */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="allDay" {...register("allDay")} className="h-4 w-4 rounded border" />
            <Label htmlFor="allDay" className="cursor-pointer">Ganztägig</Label>
          </div>

          {/* Von / Bis */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startsAt">Von</Label>
                <Input id="startsAt" type="datetime-local" {...register("startsAt")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endsAt">Bis</Label>
                <Input id="endsAt" type="datetime-local" {...register("endsAt")} />
              </div>
            </div>
          )}
          {allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startsAt">Von</Label>
                <Input id="startsAt" type="date" {...register("startsAt")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endsAt">Bis</Label>
                <Input id="endsAt" type="date" {...register("endsAt")} />
              </div>
            </div>
          )}

          {/* Teilnehmer */}
          <div className="space-y-1.5">
            <Label>Wer ist dabei?</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const active = attendeeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleAttendee(member.id)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border-2 transition-all"
                    style={{
                      borderColor: member.color,
                      backgroundColor: active ? member.color : "transparent",
                      color: active ? "white" : member.color,
                    }}
                  >
                    {member.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notizen */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notizen</Label>
            <Input id="notes" placeholder="Weitere Infos..." {...register("notes")} />
          </div>

          <DialogFooter className="gap-2">
            {isEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
            <Button type="submit">{isEdit ? "Speichern" : "Erstellen"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RotateCcw } from "lucide-react";
import { toDatetimeLocal, fromDatetimeLocal, formatDate } from "@/lib/date-utils";
import { serializeRRule, describeRRule, type RRule, type RRuleFreq } from "@/lib/rrule";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DE_DAYS = [
  { label: "Mo", value: 1 },
  { label: "Di", value: 2 },
  { label: "Mi", value: 3 },
  { label: "Do", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
  { label: "So", value: 0 },
];

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

  // RRULE State
  const [recurrence, setRecurrence] = useState<"none" | RRuleFreq>("none");
  const [rruleInterval, setRruleInterval] = useState(1);
  const [byDay, setByDay] = useState<number[]>([]);
  const [rruleUntil, setRruleUntil] = useState("");

  const existing = eventId ? events.find((e) => e.id === eventId) : null;
  const isEdit = !!existing;

  const defaultStart = initialDate ?? new Date();
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultEnd.getHours() + 1);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", location: "", notes: "",
      startsAt: toDatetimeLocal(defaultStart),
      endsAt: toDatetimeLocal(defaultEnd),
      allDay: false,
      attendeeIds: currentMember ? [currentMember.id] : [],
    },
  });

  useEffect(() => {
    if (open) {
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
        if (existing.rrule) {
          const r = JSON.parse(existing.rrule) as RRule;
          setRecurrence(r.freq);
          setRruleInterval(r.interval ?? 1);
          setByDay(r.byDay ?? []);
          setRruleUntil(r.until ?? "");
        } else {
          setRecurrence("none");
          setByDay([]);
          setRruleUntil("");
        }
      } else {
        const start = initialDate ?? new Date();
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        reset({
          title: "", location: "", notes: "",
          startsAt: toDatetimeLocal(start),
          endsAt: toDatetimeLocal(end),
          allDay: false,
          attendeeIds: currentMember ? [currentMember.id] : [],
        });
        setRecurrence("none");
        setByDay([]);
        setRruleUntil("");
      }
    }
  }, [open, existing, initialDate, currentMember, reset]);

  const attendeeIds = watch("attendeeIds");
  const allDay = watch("allDay");
  const startsAt = watch("startsAt");

  // Enddatum nicht vor Startdatum
  useEffect(() => {
    const start = fromDatetimeLocal(startsAt);
    const end   = fromDatetimeLocal(watch("endsAt"));
    if (end <= start) {
      const newEnd = new Date(start);
      newEnd.setHours(newEnd.getHours() + 1);
      setValue("endsAt", toDatetimeLocal(newEnd));
    }
  }, [startsAt]);

  const toggleAttendee = (id: string) => {
    if (attendeeIds.includes(id)) {
      setValue("attendeeIds", attendeeIds.filter((a) => a !== id));
    } else {
      setValue("attendeeIds", [...attendeeIds, id]);
    }
  };

  const toggleByDay = (d: number) => {
    setByDay((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const buildRRule = (): string | undefined => {
    if (recurrence === "none") return undefined;
    const rule: RRule = { freq: recurrence, interval: rruleInterval };
    if (recurrence === "weekly" && byDay.length > 0) rule.byDay = byDay;
    if (rruleUntil) rule.until = rruleUntil;
    return serializeRRule(rule);
  };

  const rrulePreview = recurrence !== "none"
    ? describeRRule({ freq: recurrence, interval: rruleInterval, byDay: byDay.length > 0 ? byDay : undefined, until: rruleUntil || undefined })
    : null;

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
      rrule: buildRRule(),
      source: "local" as const,
      createdBy: currentMember.id,
    };

    if (isEdit && existing) {
      updateEvent(existing.id, payload);
      toast.success("Termin aktualisiert");
    } else {
      addEvent(payload);
      toast.success(payload.rrule ? "Wiederkehrender Termin gespeichert" : "Termin gespeichert");
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!existing) return;
    deleteEvent(existing.id);
    toast.success("Termin gelöscht");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Termin bearbeiten" : "Neuer Termin"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Titel */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Titel *</Label>
            <Input id="title" placeholder="Was ist geplant?" autoFocus {...register("title")} />
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
            <Label htmlFor="allDay" className="cursor-pointer font-normal">Ganztägig</Label>
          </div>

          {/* Von / Bis */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Von</Label>
              <Input type={allDay ? "date" : "datetime-local"} {...register("startsAt")} />
            </div>
            <div className="space-y-1.5">
              <Label>Bis</Label>
              <Input type={allDay ? "date" : "datetime-local"} {...register("endsAt")} />
            </div>
          </div>

          {/* Wiederholung */}
          <div className="space-y-2">
            <Label>Wiederholung</Label>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as "none" | RRuleFreq)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein</SelectItem>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
                <SelectItem value="yearly">Jährlich</SelectItem>
              </SelectContent>
            </Select>

            {recurrence !== "none" && (
              <div className="rounded-lg border p-3 space-y-3 bg-muted/30">
                {/* Interval */}
                <div className="flex items-center gap-2">
                  <Label className="shrink-0 text-xs">Alle</Label>
                  <Input
                    type="number" min={1} max={99}
                    className="w-16 h-8 text-sm"
                    value={rruleInterval}
                    onChange={(e) => setRruleInterval(Number(e.target.value))}
                  />
                  <span className="text-xs text-muted-foreground">
                    {recurrence === "daily" && (rruleInterval === 1 ? "Tag" : "Tage")}
                    {recurrence === "weekly" && (rruleInterval === 1 ? "Woche" : "Wochen")}
                    {recurrence === "monthly" && (rruleInterval === 1 ? "Monat" : "Monate")}
                    {recurrence === "yearly" && (rruleInterval === 1 ? "Jahr" : "Jahre")}
                  </span>
                </div>

                {/* Wochentage */}
                {recurrence === "weekly" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">An welchen Tagen?</Label>
                    <div className="flex gap-1.5">
                      {DE_DAYS.map(({ label, value }) => (
                        <button
                          key={value} type="button"
                          onClick={() => toggleByDay(value)}
                          className={cn(
                            "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                            byDay.includes(value)
                              ? "bg-indigo-600 text-white"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enddatum */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Endet am (optional)</Label>
                  <Input
                    type="date" className="h-8 text-sm"
                    value={rruleUntil}
                    onChange={(e) => setRruleUntil(e.target.value)}
                  />
                </div>

                {/* Vorschau */}
                {rrulePreview && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 rounded px-2 py-1">
                    <RotateCcw className="h-3 w-3 shrink-0" />
                    {rrulePreview}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Teilnehmer */}
          <div className="space-y-1.5">
            <Label>Wer ist dabei?</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => {
                const active = attendeeIds.includes(member.id);
                return (
                  <button
                    key={member.id} type="button"
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

          <DialogFooter className="gap-2 pt-2">
            {isEdit && (
              <Button type="button" variant="destructive" size="icon" onClick={handleDelete}>
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

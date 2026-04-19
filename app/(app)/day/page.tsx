"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useEventStore } from "@/lib/stores/event-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { EventDialog } from "@/components/calendar/event-dialog";
import { CalendarViewToggle } from "@/components/calendar/view-toggle";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { addDays, formatDate, isToday, isSameDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const HOUR_START = 6;
const HOUR_END   = 23;
const HOURS      = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const SLOT_H     = 64;

// useSearchParams muss in einer eigenen Komponente mit Suspense gekapselt sein
function DayView() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  const [day, setDay] = useState<Date>(() =>
    dateParam ? new Date(dateParam) : new Date()
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { getEventsInRange } = useEventStore();
  const { members } = useFamilyStore();

  const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(day); dayEnd.setHours(23, 59, 59);
  const dayEvents = getEventsInRange(dayStart, dayEnd).filter((e) =>
    isSameDay(new Date(e.startsAt), day)
  );

  const allDay = dayEvents.filter((e) => e.allDay);
  const timed  = dayEvents.filter((e) => !e.allDay).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  const getMemberColor = (id: string) =>
    members.find((m) => m.id === id)?.color ?? "#6366f1";

  const today = isToday(day);

  const openNew = (hour?: number) => {
    const d = new Date(day);
    d.setHours(hour ?? 9, 0, 0, 0);
    setSelectedDate(d);
    setEditingEventId(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDay((d) => addDays(d, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDay(new Date())}>Heute</Button>
          <Button variant="outline" size="icon" onClick={() => setDay((d) => addDays(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className={cn("text-base font-semibold ml-1", today && "text-indigo-700")}>
            {formatDate(day, "EEEE, dd. MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <CalendarViewToggle current="day" />
          <Button onClick={() => openNew()} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Termin
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {/* Ganztägig */}
        {allDay.length > 0 && (
          <div className="border-b p-2 space-y-1">
            <p className="text-xs text-muted-foreground font-medium px-1">Ganztägig</p>
            {allDay.map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setEditingEventId(e.id.split("_")[0]);
                  setSelectedDate(null);
                  setDialogOpen(true);
                }}
                className="w-full text-left rounded-md px-3 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: getMemberColor(e.createdBy) }}
              >
                {e.title}
              </button>
            ))}
          </div>
        )}

        {/* Stunden-Body */}
        <div className="relative" style={{ height: HOURS.length * SLOT_H }}>
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex items-start border-t border-muted/50 cursor-pointer hover:bg-muted/20 transition-colors"
              style={{ top: (h - HOUR_START) * SLOT_H, height: SLOT_H }}
              onClick={() => openNew(h)}
            >
              <span className="text-[10px] text-muted-foreground w-12 text-right pr-2 pt-1 shrink-0 tabular-nums">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {/* Events */}
          {timed.map((event) => {
            const start  = new Date(event.startsAt);
            const end    = new Date(event.endsAt);
            const startH = Math.max(start.getHours() + start.getMinutes() / 60, HOUR_START);
            const endH   = Math.min(end.getHours() + end.getMinutes() / 60, HOUR_END);
            const top    = (startH - HOUR_START) * SLOT_H;
            const height = Math.max((endH - startH) * SLOT_H, 24);
            const color  = getMemberColor(event.createdBy);
            const attendeeNames = event.attendeeIds
              .map((id) => members.find((m) => m.id === id)?.name)
              .filter(Boolean);

            return (
              <button
                key={event.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingEventId(event.id.split("_")[0]);
                  setSelectedDate(null);
                  setDialogOpen(true);
                }}
                className="absolute rounded-lg text-white text-left px-3 py-2 shadow-sm hover:brightness-110 transition-all"
                style={{ top: top + 1, height: height - 2, left: 52, right: 8, backgroundColor: color }}
              >
                <p className="text-sm font-semibold leading-tight truncate">{event.title}</p>
                <p className="text-xs opacity-80 mt-0.5">
                  {formatDate(start, "HH:mm")} – {formatDate(end, "HH:mm")}
                  {event.location && ` · ${event.location}`}
                </p>
                {attendeeNames.length > 0 && (
                  <p className="text-xs opacity-70 mt-0.5 truncate">{attendeeNames.join(", ")}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={selectedDate}
        eventId={editingEventId}
      />
    </div>
  );
}

// Suspense-Wrapper — Pflicht für useSearchParams im Static Export
export default function DayPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-muted-foreground text-sm">Lade Tagesansicht…</div>
      </div>
    }>
      <DayView />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useEventStore } from "@/lib/stores/event-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { WeekGrid } from "@/components/calendar/week-grid";
import { EventDialog } from "@/components/calendar/event-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { startOfWeek, addWeeks, subWeeks, addDays, formatDate } from "@/lib/date-utils";

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { events } = useEventStore();
  const { members } = useFamilyStore();

  const weekEnd = addDays(weekStart, 6);
  const weekEvents = events.filter((e) => {
    const start = new Date(e.startsAt);
    const end = new Date(e.endsAt);
    return start <= weekEnd && end >= weekStart;
  });

  const handlePrev = () => setWeekStart((d) => subWeeks(d, 1));
  const handleNext = () => setWeekStart((d) => addWeeks(d, 1));
  const handleToday = () => setWeekStart(startOfWeek(new Date()));

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingEventId(null);
    setDialogOpen(true);
  };

  const handleEventClick = (id: string) => {
    setEditingEventId(id);
    setSelectedDate(null);
    setDialogOpen(true);
  };

  const weekLabel = `${formatDate(weekStart, "dd. MMM")} – ${formatDate(weekEnd, "dd. MMM yyyy")}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>Heute</Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold ml-1">{weekLabel}</h2>
        </div>
        <Button
          onClick={() => { setSelectedDate(new Date()); setEditingEventId(null); setDialogOpen(true); }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Termin
        </Button>
      </div>

      {/* Kalender Grid */}
      <WeekGrid
        weekStart={weekStart}
        events={weekEvents}
        members={members}
        onDayClick={handleDayClick}
        onEventClick={handleEventClick}
      />

      {/* Termin Dialog */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={selectedDate}
        eventId={editingEventId}
      />
    </div>
  );
}

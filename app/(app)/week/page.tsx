"use client";

import { useState } from "react";
import { useEventStore } from "@/lib/stores/event-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { WeekGrid } from "@/components/calendar/week-grid";
import { EventDialog } from "@/components/calendar/event-dialog";
import { CalendarViewToggle } from "@/components/calendar/view-toggle";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { startOfWeek, addWeeks, subWeeks, addDays, formatDate } from "@/lib/date-utils";

export default function WeekPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { getEventsInRange } = useEventStore();
  const { members } = useFamilyStore();

  const weekEnd = addDays(weekStart, 6);
  weekEnd.setHours(23, 59, 59);
  const weekEvents = getEventsInRange(weekStart, weekEnd);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart((d) => subWeeks(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Heute
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart((d) => addWeeks(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold ml-1">{weekLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <CalendarViewToggle current="week" />
          <Button onClick={() => { setSelectedDate(new Date()); setEditingEventId(null); setDialogOpen(true); }} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Termin
          </Button>
        </div>
      </div>

      <WeekGrid
        weekStart={weekStart}
        events={weekEvents}
        members={members}
        onDayClick={handleDayClick}
        onEventClick={handleEventClick}
      />

      <EventDialog
        open={dialogOpen} onOpenChange={setDialogOpen}
        initialDate={selectedDate} eventId={editingEventId}
      />
    </div>
  );
}

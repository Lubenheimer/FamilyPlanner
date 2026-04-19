"use client";

import { useState, useEffect } from "react";
import { useEventStore } from "@/lib/stores/event-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { useWeatherStore } from "@/lib/stores/weather-store";
import { MonthGrid } from "@/components/calendar/month-grid";
import { EventDialog } from "@/components/calendar/event-dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatDate } from "@/lib/date-utils";

export default function MonthPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-basiert
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { getEventsInRange } = useEventStore();
  const { members } = useFamilyStore();
  const { dailyMap, refresh } = useWeatherStore();

  useEffect(() => { refresh(); }, [refresh]);

  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0, 23, 59, 59);
  const monthEvents = getEventsInRange(monthStart, monthEnd);

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); };

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

  const label = formatDate(new Date(year, month, 1), "MMMM yyyy");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToday}>Heute</Button>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          <h2 className="text-base font-semibold ml-1 capitalize">{label}</h2>
        </div>
        <Button onClick={() => { setSelectedDate(new Date()); setEditingEventId(null); setDialogOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Termin
        </Button>
      </div>

      <MonthGrid
        year={year} month={month}
        events={monthEvents} members={members}
        onDayClick={handleDayClick}
        onEventClick={handleEventClick}
        weather={dailyMap()}
      />

      <EventDialog
        open={dialogOpen} onOpenChange={setDialogOpen}
        initialDate={selectedDate} eventId={editingEventId}
      />
    </div>
  );
}

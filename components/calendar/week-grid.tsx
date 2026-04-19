"use client";

import type { CalendarEvent } from "@/lib/stores/event-store";
import type { FamilyMember } from "@/lib/stores/family-store";
import { getWeekDays, formatDate, isToday, isSameDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface WeekGridProps {
  weekStart: Date;
  events: CalendarEvent[];
  members: FamilyMember[];
  onDayClick: (date: Date) => void;
  onEventClick: (id: string) => void;
}

export function WeekGrid({ weekStart, events, members, onDayClick, onEventClick }: WeekGridProps) {
  const days = getWeekDays(weekStart);

  const getEventsForDay = (day: Date) =>
    events
      .filter((e) => isSameDay(new Date(e.startsAt), day))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const getMemberColor = (event: CalendarEvent) => {
    if (event.colorOverride) return event.colorOverride;
    const creator = members.find((m) => m.id === event.createdBy);
    return creator?.color ?? "#6366f1";
  };

  return (
    <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
      {/* Tag-Header */}
      <div className="grid grid-cols-7 border-b">
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className="py-2 text-center border-r last:border-r-0"
            >
              <p className="text-xs text-muted-foreground">{formatDate(day, "EEE")}</p>
              <button
                onClick={() => onDayClick(day)}
                className={cn(
                  "mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors hover:bg-muted",
                  today && "bg-indigo-600 text-white hover:bg-indigo-700"
                )}
              >
                {day.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      {/* Tages-Spalten mit Events */}
      <div className="grid grid-cols-7 min-h-[480px]">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "border-r last:border-r-0 p-1.5 space-y-1 cursor-pointer transition-colors hover:bg-muted/30",
                today && "bg-indigo-50/40"
              )}
            >
              {dayEvents.map((event) => {
                const color = getMemberColor(event);
                const startTime = formatDate(new Date(event.startsAt), "HH:mm");
                return (
                  <button
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(event.id); }}
                    className="w-full text-left rounded-md px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: color }}
                  >
                    <span className="opacity-80 text-[10px]">{event.allDay ? "ganztägig" : startTime}</span>
                    <p className="truncate leading-tight mt-0.5">{event.title}</p>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

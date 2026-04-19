"use client";

import type { CalendarEvent } from "@/lib/stores/event-store";
import type { FamilyMember } from "@/lib/stores/family-store";
import { isSameDay, isToday, formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { DailyWeather } from "@/lib/weather";
import { wmoIcon } from "@/lib/weather";

const DE_WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

interface MonthGridProps {
  year: number;
  month: number; // 0-basiert
  events: CalendarEvent[];
  members: FamilyMember[];
  onDayClick: (date: Date) => void;
  onEventClick: (id: string) => void;
  weather?: Record<string, DailyWeather>;
}

export function MonthGrid({ year, month, events, members, onDayClick, onEventClick, weather = {} }: MonthGridProps) {
  // Alle Tage im Sicht-Raster aufbauen (Mo–So, mit Vor-/Nachmonats-Tagen)
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);

  // Wochentag des 1. (0=So → wir wollen Mo=0)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells  = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: Date[] = Array.from({ length: totalCells }, (_, i) => {
    const d = new Date(firstDay);
    d.setDate(1 - startOffset + i);
    return d;
  });

  const getMemberColor = (event: CalendarEvent) => {
    if (event.colorOverride) return event.colorOverride;
    return members.find((m) => m.id === event.createdBy)?.color ?? "#6366f1";
  };

  const getEventsForDay = (day: Date) =>
    events
      .filter((e) => isSameDay(new Date(e.startsAt), day))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const MAX_VISIBLE = 3;

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Wochen-Header */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {DE_WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Tages-Zellen */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === month;
          const today = isToday(day);
          const dayEvents = getEventsForDay(day);
          const overflow = dayEvents.length - MAX_VISIBLE;
          const isLastRow = idx >= cells.length - 7;
          const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const w = weather[dateStr];

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-[100px] p-1.5 border-b border-r last:border-r-0 cursor-pointer transition-colors hover:bg-muted/20",
                !isLastRow && "border-b",
                isLastRow && "border-b-0",
                (idx + 1) % 7 === 0 && "border-r-0",
                !isCurrentMonth && "bg-muted/10",
                today && "bg-indigo-50/40",
              )}
            >
              {/* Tag-Nummer + Wetter */}
              <div className="flex items-center justify-between mb-1 px-0.5">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium shrink-0",
                    today && "bg-indigo-600 text-white",
                    !today && isCurrentMonth && "text-foreground",
                    !today && !isCurrentMonth && "text-muted-foreground/50",
                  )}
                >
                  {day.getDate()}
                </span>
                {w && isCurrentMonth && (
                  <span className="text-sm leading-none" title={`${w.tempMax}° / ${w.tempMin}°`}>
                    {wmoIcon(w.weatherCode)}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="space-y-0.5">
                {dayEvents.slice(0, MAX_VISIBLE).map((event) => {
                  const color = getMemberColor(event);
                  const time = event.allDay ? null : formatDate(new Date(event.startsAt), "HH:mm");
                  return (
                    <button
                      key={event.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event.id.split("_")[0]); }}
                      className="w-full text-left rounded px-1.5 py-0.5 text-xs font-medium text-white truncate hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: color }}
                    >
                      {time && <span className="opacity-75 mr-1">{time}</span>}
                      {event.title}
                    </button>
                  );
                })}
                {overflow > 0 && (
                  <p className="text-[10px] text-muted-foreground pl-1 font-medium">
                    +{overflow} weitere
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

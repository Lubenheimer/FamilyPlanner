"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { CalendarEvent } from "@/lib/stores/event-store";
import { useEventStore } from "@/lib/stores/event-store";
import type { FamilyMember } from "@/lib/stores/family-store";
import { getWeekDays, formatDate, isToday, isSameDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { DailyWeather } from "@/lib/weather";
import { WeatherIcon } from "@/components/weather/weather-icon";

const HOUR_START = 6;   // ab 06:00
const HOUR_END   = 23;  // bis 23:00
const HOURS      = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const SLOT_HEIGHT = 56; // px pro Stunde

interface WeekGridProps {
  weekStart: Date;
  events: CalendarEvent[];
  members: FamilyMember[];
  onDayClick: (date: Date) => void;
  onEventClick: (id: string) => void;
  weather?: Record<string, DailyWeather>;
}

export function WeekGrid({ weekStart, events, members, onDayClick, onEventClick, weather = {} }: WeekGridProps) {
  const days = getWeekDays(weekStart);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [nowOffset, setNowOffset] = useState<number | null>(null);
  const { updateEvent } = useEventStore();

  // Drag state
  const dragging = useRef<{ eventId: string; offsetY: number; duration: number } | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ dayIndex: number; hour: number } | null>(null);

  // Jetzt-Linie berechnen & auto-scroll
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (h >= HOUR_START && h < HOUR_END) {
        setNowOffset(((h - HOUR_START) + m / 60) * SLOT_HEIGHT);
      } else {
        setNowOffset(null);
      }
    };
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  // Beim ersten Render auf 08:00 scrollen
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - HOUR_START) * SLOT_HEIGHT;
    }
  }, []);

  const getMemberColor = (event: CalendarEvent) => {
    if (event.colorOverride) return event.colorOverride;
    const m = members.find((m) => m.id === event.createdBy);
    return m?.color ?? "#6366f1";
  };

  // Drag Handlers
  const handleDragStart = useCallback((e: React.DragEvent, event: CalendarEvent) => {
    // Offset innerhalb des Events (wie weit vom Top wurde geklickt)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const duration = new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime();
    dragging.current = { eventId: event.id, offsetY, duration };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", event.id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (!bodyRef.current) return;
    const rect = bodyRef.current.getBoundingClientRect();
    const relY = e.clientY - rect.top + (bodyRef.current.scrollTop || 0) - (dragging.current?.offsetY ?? 0);
    const hour = Math.max(HOUR_START, Math.min(HOUR_END - 1,
      Math.floor(relY / SLOT_HEIGHT) + HOUR_START
    ));
    setDragOverInfo({ dayIndex, hour });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, day: Date) => {
    e.preventDefault();
    if (!dragging.current || !bodyRef.current) return;
    const rect = bodyRef.current.getBoundingClientRect();
    const relY = e.clientY - rect.top + (bodyRef.current.scrollTop || 0) - dragging.current.offsetY;
    const totalMinutes = Math.round((relY / SLOT_HEIGHT) * 60);
    const snapMinutes = Math.round(totalMinutes / 15) * 15; // 15-Min-Snapping
    const newHour = Math.max(HOUR_START * 60, Math.min((HOUR_END - 1) * 60, (HOUR_START * 60) + snapMinutes));

    const newStart = new Date(day);
    newStart.setHours(Math.floor(newHour / 60), newHour % 60, 0, 0);
    const newEnd = new Date(newStart.getTime() + dragging.current.duration);

    // echte Event-ID (ohne RRULE-Suffix)
    const realId = dragging.current.eventId.split("_")[0];
    updateEvent(realId, {
      startsAt: newStart.toISOString(),
      endsAt: newEnd.toISOString(),
    });

    dragging.current = null;
    setDragOverInfo(null);
  }, [updateEvent]);

  const allDayEvents = events.filter((e) => e.allDay);
  const timedEvents  = events.filter((e) => !e.allDay);

  // Events pro Tag mit Überlappungs-Berechnung für Spaltenbreite
  const getTimedEventsForDay = (day: Date) =>
    timedEvents.filter((e) => isSameDay(new Date(e.startsAt), day));

  /** Berechnet top + height in px aus Zeitstempel */
  const eventStyle = (event: CalendarEvent) => {
    const start = new Date(event.startsAt);
    const end   = new Date(event.endsAt);
    const startH = Math.max(start.getHours() + start.getMinutes() / 60, HOUR_START);
    const endH   = Math.min(end.getHours()   + end.getMinutes()   / 60, HOUR_END);
    const top    = (startH - HOUR_START) * SLOT_HEIGHT;
    const height = Math.max((endH - startH) * SLOT_HEIGHT, 20);
    return { top, height };
  };

  /** Spalten bei überlappenden Events */
  const layoutEvents = (dayEvents: CalendarEvent[]) => {
    const sorted = [...dayEvents].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    );
    const columns: CalendarEvent[][] = [];

    for (const event of sorted) {
      const start = new Date(event.startsAt).getTime();
      const end   = new Date(event.endsAt).getTime();
      let placed  = false;

      for (const col of columns) {
        const last = col[col.length - 1];
        if (new Date(last.endsAt).getTime() <= start) {
          col.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) columns.push([event]);
    }

    // Jedes Event bekommt: colIndex, colCount
    const layout = new Map<string, { colIndex: number; colCount: number }>();
    columns.forEach((col, ci) =>
      col.forEach((e) => layout.set(e.id, { colIndex: ci, colCount: columns.length }))
    );
    return { sorted, layout };
  };

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden flex flex-col">
      {/* ── Ganztägige Events ── */}
      {allDayEvents.length > 0 && (
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b">
          <div className="border-r" />
          {days.map((day) => {
            const dayAllDay = allDayEvents.filter((e) => isSameDay(new Date(e.startsAt), day));
            return (
              <div key={day.toISOString()} className="border-r last:border-r-0 p-1 min-h-[28px] space-y-0.5">
                {dayAllDay.map((e) => (
                  <button
                    key={e.id}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick(e.id.split("_")[0]); }}
                    className="w-full text-left rounded px-1.5 py-0.5 text-xs font-medium text-white truncate flex items-center gap-1"
                    style={{ backgroundColor: getMemberColor(e) }}
                  >
                    <span className="truncate">{e.title}</span>
                    {e.rrule && <span className="opacity-70 shrink-0">↻</span>}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tages-Header ── */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b sticky top-0 bg-white z-10">
        <div className="border-r" />
        {days.map((day) => {
          const today = isToday(day);
          const dateStr = formatDate(day, "yyyy-MM-dd");
          const w = weather[dateStr];
          return (
            <div key={day.toISOString()} className="py-2 text-center border-r last:border-r-0">
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
              {w && (
                <WeatherIcon
                  code={w.weatherCode}
                  tempMax={w.tempMax}
                  tempMin={w.tempMin}
                  size="sm"
                  className="mt-1 mx-auto"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Scrollbarer Zeit-Body ── */}
      <div
        ref={(el) => { (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el; (bodyRef as React.MutableRefObject<HTMLDivElement | null>).current = el; }}
        className="overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 280px)", minHeight: 400 }}
      >
        <div className="grid grid-cols-[48px_repeat(7,1fr)]" style={{ height: HOURS.length * SLOT_HEIGHT }}>
          {/* Stunden-Labels links */}
          <div className="border-r relative">
            {HOURS.map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: (h - HOUR_START) * SLOT_HEIGHT - 8 }}
              >
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Tages-Spalten */}
          {days.map((day, dayIndex) => {
            const { sorted, layout } = layoutEvents(getTimedEventsForDay(day));
            const today = isToday(day);
            const isDragTarget = dragOverInfo?.dayIndex === dayIndex;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "border-r last:border-r-0 relative cursor-pointer",
                  today && "bg-indigo-50/30",
                  isDragTarget && "bg-indigo-50/60"
                )}
                onClick={() => onDayClick(day)}
                onDragOver={(e) => handleDragOver(e, dayIndex)}
                onDrop={(e) => handleDrop(e, day)}
                onDragLeave={() => setDragOverInfo(null)}
              >
                {/* Stunden-Linien */}
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-muted/50"
                    style={{ top: (h - HOUR_START) * SLOT_HEIGHT }}
                  />
                ))}

                {/* Jetzt-Linie */}
                {today && nowOffset !== null && (
                  <div
                    className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                    style={{ top: nowOffset }}
                  >
                    <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shrink-0" />
                    <div className="flex-1 h-px bg-red-500" />
                  </div>
                )}

                {/* Events */}
                {sorted.map((event) => {
                  const { top, height } = eventStyle(event);
                  const { colIndex, colCount } = layout.get(event.id) ?? { colIndex: 0, colCount: 1 };
                  const widthPct  = 100 / colCount;
                  const leftPct   = colIndex * widthPct;
                  const color     = getMemberColor(event);
                  const startTime = formatDate(new Date(event.startsAt), "HH:mm");
                  const endTime   = formatDate(new Date(event.endsAt), "HH:mm");
                  const short     = height < 36;

                  return (
                    <button
                      key={event.id}
                      draggable={!event.rrule} // Wiederkehrende nicht draggable
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={(e) => { e.stopPropagation(); onEventClick(event.id.split("_")[0]); }}
                      className="absolute rounded-md text-white text-left overflow-hidden px-1.5 py-0.5 shadow-sm hover:brightness-110 transition-all z-10"
                      style={{
                        top: top + 1,
                        height: height - 2,
                        left:  `calc(${leftPct}% + 1px)`,
                        width: `calc(${widthPct}% - 2px)`,
                        backgroundColor: color,
                      }}
                    >
                      {short ? (
                        <p className="text-[10px] font-medium truncate leading-tight">
                          {startTime} {event.title}
                          {event.rrule && <span className="opacity-70 ml-0.5">↻</span>}
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-[10px] opacity-80 leading-tight">{startTime}–{endTime}</p>
                            {event.rrule && <span className="text-[10px] opacity-70 shrink-0">↻</span>}
                          </div>
                          <p className="text-xs font-semibold truncate leading-tight">{event.title}</p>
                          {event.location && (
                            <p className="text-[10px] opacity-70 truncate">{event.location}</p>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

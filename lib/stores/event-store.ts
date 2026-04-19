import { create } from "zustand";
import { persist } from "zustand/middleware";
import { expandRecurring } from "@/lib/rrule";

export type EventSource = "local" | "google" | "outlook";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;   // ISO-String (UTC)
  endsAt: string;     // ISO-String (UTC)
  allDay: boolean;
  rrule?: string;     // serialisiertes RRule-Objekt
  colorOverride?: string;
  attendeeIds: string[];
  source: EventSource;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface EventState {
  events: CalendarEvent[];

  addEvent: (e: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => CalendarEvent;
  updateEvent: (id: string, data: Partial<Omit<CalendarEvent, "id" | "createdAt">>) => void;
  deleteEvent: (id: string) => void;

  /** Gibt alle (ggf. expandierten) Events im Zeitraum zurück */
  getEventsInRange: (from: Date, to: Date) => CalendarEvent[];
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      events: [],

      addEvent: (event) => {
        const now = new Date().toISOString();
        const newEvent: CalendarEvent = {
          ...event,
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ events: [...s.events, newEvent] }));
        return newEvent;
      },

      updateEvent: (id, data) =>
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id
              ? { ...e, ...data, updatedAt: new Date().toISOString() }
              : e
          ),
        })),

      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      getEventsInRange: (from, to) => {
        const all = get().events;
        const result: CalendarEvent[] = [];

        for (const event of all) {
          if (event.rrule) {
            // Wiederkehrende Events expandieren
            const expanded = expandRecurring(event, from, to);
            result.push(...expanded);
          } else {
            const start = new Date(event.startsAt);
            const end = new Date(event.endsAt);
            if (start <= to && end >= from) {
              result.push(event);
            }
          }
        }

        return result.sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        );
      },
    }),
    { name: "family-planner:events" }
  )
);

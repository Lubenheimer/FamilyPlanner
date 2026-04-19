import { create } from "zustand";
import { persist } from "zustand/middleware";

export type EventSource = "local" | "google" | "outlook";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string; // ISO-String
  endsAt: string;   // ISO-String
  allDay: boolean;
  rrule?: string;
  colorOverride?: string;
  attendeeIds: string[]; // FamilyMember IDs
  source: EventSource;
  createdBy: string; // FamilyMember ID
  createdAt: string;
  updatedAt: string;
}

interface EventState {
  events: CalendarEvent[];

  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">) => CalendarEvent;
  updateEvent: (id: string, data: Partial<Omit<CalendarEvent, "id" | "createdAt">>) => void;
  deleteEvent: (id: string) => void;

  // Hilfsfunktion: Events in einem Zeitraum
  getEventsInRange: (from: string, to: string) => CalendarEvent[];
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

      updateEvent: (id, data) => {
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id
              ? { ...e, ...data, updatedAt: new Date().toISOString() }
              : e
          ),
        }));
      },

      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      getEventsInRange: (from, to) => {
        const start = new Date(from);
        const end = new Date(to);
        return get().events.filter((e) => {
          const eStart = new Date(e.startsAt);
          const eEnd = new Date(e.endsAt);
          return eStart <= end && eEnd >= start;
        });
      },
    }),
    { name: "family-planner:events" }
  )
);

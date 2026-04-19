import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TripStatus = "idea" | "planned" | "done";

export interface TripRating {
  memberId: string;
  stars: number; // 1–5
  wouldRepeat: boolean;
}

export interface TripEntry {
  id: string;
  date: string;
  text?: string;
  cost?: number;
  ratings: TripRating[];
  photos: string[]; // Base64 oder Object-URLs
}

export interface Trip {
  id: string;
  status: TripStatus;
  title: string;
  description?: string;
  location?: string;
  plannedDate?: string;
  estCost?: number;
  tags: string[];
  season?: string;
  indoorOutdoor?: "indoor" | "outdoor" | "both";
  votes: Record<string, number>; // memberId → 1
  entries: TripEntry[];
  createdBy: string;
  createdAt: string;
}

interface TripState {
  trips: Trip[];

  addTrip: (trip: Omit<Trip, "id" | "votes" | "entries" | "createdAt">) => Trip;
  updateTrip: (id: string, data: Partial<Omit<Trip, "id" | "createdAt">>) => void;
  deleteTrip: (id: string) => void;
  vote: (tripId: string, memberId: string) => void;
  unvote: (tripId: string, memberId: string) => void;
  addEntry: (tripId: string, entry: Omit<TripEntry, "id">) => void;
  updateEntry: (tripId: string, entryId: string, data: Partial<Omit<TripEntry, "id">>) => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      trips: [],

      addTrip: (trip) => {
        const newTrip: Trip = {
          ...trip,
          id: crypto.randomUUID(),
          votes: {},
          entries: [],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ trips: [...s.trips, newTrip] }));
        return newTrip;
      },

      updateTrip: (id, data) =>
        set((s) => ({
          trips: s.trips.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      deleteTrip: (id) =>
        set((s) => ({ trips: s.trips.filter((t) => t.id !== id) })),

      vote: (tripId, memberId) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? { ...t, votes: { ...t.votes, [memberId]: 1 } }
              : t
          ),
        })),

      unvote: (tripId, memberId) =>
        set((s) => ({
          trips: s.trips.map((t) => {
            if (t.id !== tripId) return t;
            const { [memberId]: _, ...rest } = t.votes;
            return { ...t, votes: rest };
          }),
        })),

      addEntry: (tripId, entry) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  status: "done" as TripStatus,
                  entries: [
                    ...t.entries,
                    { ...entry, id: crypto.randomUUID() },
                  ],
                }
              : t
          ),
        })),

      updateEntry: (tripId, entryId, data) =>
        set((s) => ({
          trips: s.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  entries: t.entries.map((e) =>
                    e.id === entryId ? { ...e, ...data } : e
                  ),
                }
              : t
          ),
        })),
    }),
    { name: "family-planner:trips" }
  )
);

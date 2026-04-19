import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishStatus = "open" | "reserved" | "gifted";

export interface Wish {
  id: string;
  childId: string; // FamilyMember ID
  title: string;
  url?: string;
  imageUrl?: string;
  price?: number;
  priority: number;
  category?: string; // "Geburtstag" | "Weihnachten" | "spontan"
  status: WishStatus;
  reservedBy?: string; // Name (kein Account nötig)
  createdAt: string;
}

interface WishState {
  wishes: Wish[];

  addWish: (wish: Omit<Wish, "id" | "createdAt">) => Wish;
  updateWish: (id: string, data: Partial<Omit<Wish, "id" | "createdAt">>) => void;
  deleteWish: (id: string) => void;
  reserve: (id: string, reservedBy: string) => void;
  markGifted: (id: string) => void;
  getWishesForChild: (childId: string) => Wish[];
}

export const useWishStore = create<WishState>()(
  persist(
    (set, get) => ({
      wishes: [],

      addWish: (wish) => {
        const newWish: Wish = {
          ...wish,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ wishes: [...s.wishes, newWish] }));
        return newWish;
      },

      updateWish: (id, data) =>
        set((s) => ({
          wishes: s.wishes.map((w) => (w.id === id ? { ...w, ...data } : w)),
        })),

      deleteWish: (id) =>
        set((s) => ({ wishes: s.wishes.filter((w) => w.id !== id) })),

      reserve: (id, reservedBy) =>
        set((s) => ({
          wishes: s.wishes.map((w) =>
            w.id === id ? { ...w, status: "reserved", reservedBy } : w
          ),
        })),

      markGifted: (id) =>
        set((s) => ({
          wishes: s.wishes.map((w) =>
            w.id === id ? { ...w, status: "gifted" } : w
          ),
        })),

      getWishesForChild: (childId) =>
        get().wishes.filter((w) => w.childId === childId),
    }),
    { name: "family-planner:wishes" }
  )
);

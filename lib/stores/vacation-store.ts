import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VacationStatus = "idea" | "booked" | "done";

export interface PackingItem {
  id: string;
  name: string;
  category: string; // z.B. "Kleidung", "Dokumente", "Technik"
  done: boolean;
  assignedTo?: string; // memberId
}

export interface DayPlan {
  id: string;
  date: string; // YYYY-MM-DD
  title?: string;
  activities: string;
  notes?: string;
}

export interface Vacation {
  id: string;
  title: string;
  destination: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  participants: string[]; // memberIds
  budget?: number;
  status: VacationStatus;
  notes?: string;
  packingItems: PackingItem[];
  dayPlans: DayPlan[];
  createdAt: string;
}

interface VacationState {
  vacations: Vacation[];

  addVacation: (v: Omit<Vacation, "id" | "packingItems" | "dayPlans" | "createdAt">) => Vacation;
  updateVacation: (id: string, data: Partial<Omit<Vacation, "id" | "createdAt">>) => void;
  deleteVacation: (id: string) => void;

  // Packliste
  addPackingItem: (vacationId: string, item: Omit<PackingItem, "id">) => void;
  togglePackingItem: (vacationId: string, itemId: string) => void;
  deletePackingItem: (vacationId: string, itemId: string) => void;
  addPackingTemplate: (vacationId: string, template: "strand" | "ski" | "stadt") => void;

  // Tagesplanung
  addDayPlan: (vacationId: string, plan: Omit<DayPlan, "id">) => void;
  updateDayPlan: (vacationId: string, planId: string, data: Partial<Omit<DayPlan, "id">>) => void;
  deleteDayPlan: (vacationId: string, planId: string) => void;
}

const PACKING_TEMPLATES: Record<string, Omit<PackingItem, "id">[]> = {
  strand: [
    { name: "Reisepass / Ausweis", category: "Dokumente", done: false },
    { name: "Tickets & Buchungsbestätigungen", category: "Dokumente", done: false },
    { name: "Krankenversicherungskarte", category: "Dokumente", done: false },
    { name: "Badebekleidung", category: "Kleidung", done: false },
    { name: "Sonnencreme", category: "Pflege", done: false },
    { name: "Sonnenhut / Cap", category: "Kleidung", done: false },
    { name: "Sonnenbrille", category: "Kleidung", done: false },
    { name: "Strandtuch", category: "Strand", done: false },
    { name: "Flipflops", category: "Kleidung", done: false },
    { name: "Snorkeling-Set", category: "Strand", done: false },
    { name: "Ladekabel", category: "Technik", done: false },
    { name: "Handy", category: "Technik", done: false },
    { name: "Kamera", category: "Technik", done: false },
  ],
  ski: [
    { name: "Reisepass / Ausweis", category: "Dokumente", done: false },
    { name: "Tickets & Buchungsbestätigungen", category: "Dokumente", done: false },
    { name: "Skipass", category: "Dokumente", done: false },
    { name: "Skijacke", category: "Kleidung", done: false },
    { name: "Skihose", category: "Kleidung", done: false },
    { name: "Skiunterwäsche", category: "Kleidung", done: false },
    { name: "Handschuhe", category: "Kleidung", done: false },
    { name: "Skihelm", category: "Kleidung", done: false },
    { name: "Skibrille", category: "Kleidung", done: false },
    { name: "Skischuhe", category: "Kleidung", done: false },
    { name: "Sonnencreme (LSF 50+)", category: "Pflege", done: false },
    { name: "Lippenbalsam", category: "Pflege", done: false },
    { name: "Ladekabel", category: "Technik", done: false },
  ],
  stadt: [
    { name: "Reisepass / Ausweis", category: "Dokumente", done: false },
    { name: "Tickets & Buchungsbestätigungen", category: "Dokumente", done: false },
    { name: "Krankenversicherungskarte", category: "Dokumente", done: false },
    { name: "Bequeme Schuhe", category: "Kleidung", done: false },
    { name: "Regenjacke", category: "Kleidung", done: false },
    { name: "Stadtführer / Reiseführer", category: "Sonstiges", done: false },
    { name: "Rucksack für Tagesausflüge", category: "Sonstiges", done: false },
    { name: "Handy", category: "Technik", done: false },
    { name: "Ladekabel", category: "Technik", done: false },
    { name: "Powerbank", category: "Technik", done: false },
    { name: "Kamera", category: "Technik", done: false },
  ],
};

export const useVacationStore = create<VacationState>()(
  persist(
    (set, get) => ({
      vacations: [],

      addVacation: (v) => {
        const newVacation: Vacation = {
          ...v,
          id: crypto.randomUUID(),
          packingItems: [],
          dayPlans: [],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ vacations: [...s.vacations, newVacation] }));
        return newVacation;
      },

      updateVacation: (id, data) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === id ? { ...v, ...data } : v
          ),
        })),

      deleteVacation: (id) =>
        set((s) => ({ vacations: s.vacations.filter((v) => v.id !== id) })),

      addPackingItem: (vacationId, item) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? {
                  ...v,
                  packingItems: [
                    ...v.packingItems,
                    { ...item, id: crypto.randomUUID() },
                  ],
                }
              : v
          ),
        })),

      togglePackingItem: (vacationId, itemId) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? {
                  ...v,
                  packingItems: v.packingItems.map((p) =>
                    p.id === itemId ? { ...p, done: !p.done } : p
                  ),
                }
              : v
          ),
        })),

      deletePackingItem: (vacationId, itemId) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? {
                  ...v,
                  packingItems: v.packingItems.filter((p) => p.id !== itemId),
                }
              : v
          ),
        })),

      addPackingTemplate: (vacationId, template) => {
        const items = PACKING_TEMPLATES[template] ?? [];
        const vacation = get().vacations.find((v) => v.id === vacationId);
        if (!vacation) return;

        // Nur Items hinzufügen, die noch nicht vorhanden sind
        const existing = new Set(vacation.packingItems.map((p) => p.name.toLowerCase()));
        const newItems = items
          .filter((item) => !existing.has(item.name.toLowerCase()))
          .map((item) => ({ ...item, id: crypto.randomUUID() }));

        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? { ...v, packingItems: [...v.packingItems, ...newItems] }
              : v
          ),
        }));
      },

      addDayPlan: (vacationId, plan) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? {
                  ...v,
                  dayPlans: [
                    ...v.dayPlans,
                    { ...plan, id: crypto.randomUUID() },
                  ],
                }
              : v
          ),
        })),

      updateDayPlan: (vacationId, planId, data) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? {
                  ...v,
                  dayPlans: v.dayPlans.map((d) =>
                    d.id === planId ? { ...d, ...data } : d
                  ),
                }
              : v
          ),
        })),

      deleteDayPlan: (vacationId, planId) =>
        set((s) => ({
          vacations: s.vacations.map((v) =>
            v.id === vacationId
              ? {
                  ...v,
                  dayPlans: v.dayPlans.filter((d) => d.id !== planId),
                }
              : v
          ),
        })),
    }),
    { name: "family-planner:vacations" }
  )
);

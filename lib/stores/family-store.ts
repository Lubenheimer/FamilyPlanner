import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MemberRole = "parent" | "child";

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  color: string;
  birthdate?: string; // ISO-String
  avatar?: string;
}

export interface FamilyState {
  familyName: string;
  members: FamilyMember[];
  currentMemberId: string | null; // wer ist gerade aktiv (statt Auth)

  // Actions
  setupFamily: (familyName: string, members: Omit<FamilyMember, "id">[]) => void;
  updateFamilyName: (name: string) => void;
  addMember: (member: Omit<FamilyMember, "id">) => void;
  updateMember: (id: string, data: Partial<Omit<FamilyMember, "id">>) => void;
  removeMember: (id: string) => void;
  setCurrentMember: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  familyName: "",
  members: [],
  currentMemberId: null,
};

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      ...initialState,

      setupFamily: (familyName, members) =>
        set({
          familyName,
          members: members.map((m) => ({
            ...m,
            id: crypto.randomUUID(),
          })),
        }),

      updateFamilyName: (name) => set({ familyName: name }),

      addMember: (member) =>
        set((s) => ({
          members: [...s.members, { ...member, id: crypto.randomUUID() }],
        })),

      updateMember: (id, data) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === id ? { ...m, ...data } : m)),
        })),

      removeMember: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          currentMemberId:
            s.currentMemberId === id ? null : s.currentMemberId,
        })),

      setCurrentMember: (id) => set({ currentMemberId: id }),

      reset: () => set(initialState),
    }),
    { name: "family-planner:family" }
  )
);

// Selektoren
export const useCurrentMember = () => {
  const { members, currentMemberId } = useFamilyStore();
  return members.find((m) => m.id === currentMemberId) ?? null;
};

export const useIsSetup = () => {
  const { familyName, members } = useFamilyStore();
  return familyName !== "" && members.length > 0;
};

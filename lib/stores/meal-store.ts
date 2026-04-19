import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MealSlot = "breakfast" | "lunch" | "dinner";

export interface Recipe {
  id: string;
  title: string;
  url?: string;
  imageUrl?: string;
  timeMinutes?: number;
  category?: string;
  instructions?: string;
  ingredients: { name: string; qty?: number; unit?: string }[];
  createdAt: string;
}

export interface Meal {
  id: string;
  date: string; // YYYY-MM-DD
  slot: MealSlot;
  recipeId?: string;
  note?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  qty?: number;
  unit?: string;
  done: boolean;
  fromMealId?: string;
}

interface MealState {
  recipes: Recipe[];
  meals: Meal[];
  shoppingItems: ShoppingItem[];

  // Rezepte
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt">) => Recipe;
  updateRecipe: (id: string, data: Partial<Omit<Recipe, "id" | "createdAt">>) => void;
  deleteRecipe: (id: string) => void;

  // Mahlzeiten
  setMeal: (meal: Omit<Meal, "id">) => void;
  clearMeal: (date: string, slot: MealSlot) => void;
  getMealsForWeek: (weekStart: string) => Meal[];

  // Einkaufsliste
  addShoppingItem: (item: Omit<ShoppingItem, "id">) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;
  generateShoppingList: (weekStart: string) => void;
  clearDoneItems: () => void;
}

export const useMealStore = create<MealState>()(
  persist(
    (set, get) => ({
      recipes: [],
      meals: [],
      shoppingItems: [],

      addRecipe: (recipe) => {
        const newRecipe: Recipe = {
          ...recipe,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ recipes: [...s.recipes, newRecipe] }));
        return newRecipe;
      },

      updateRecipe: (id, data) =>
        set((s) => ({
          recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),

      deleteRecipe: (id) =>
        set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),

      setMeal: (meal) =>
        set((s) => {
          const filtered = s.meals.filter(
            (m) => !(m.date === meal.date && m.slot === meal.slot)
          );
          return {
            meals: [...filtered, { ...meal, id: crypto.randomUUID() }],
          };
        }),

      clearMeal: (date, slot) =>
        set((s) => ({
          meals: s.meals.filter((m) => !(m.date === date && m.slot === slot)),
        })),

      getMealsForWeek: (weekStart) => {
        const start = new Date(weekStart);
        const end = new Date(weekStart);
        end.setDate(end.getDate() + 7);
        return get().meals.filter((m) => {
          const d = new Date(m.date);
          return d >= start && d < end;
        });
      },

      addShoppingItem: (item) =>
        set((s) => ({
          shoppingItems: [
            ...s.shoppingItems,
            { ...item, id: crypto.randomUUID() },
          ],
        })),

      toggleShoppingItem: (id) =>
        set((s) => ({
          shoppingItems: s.shoppingItems.map((i) =>
            i.id === id ? { ...i, done: !i.done } : i
          ),
        })),

      deleteShoppingItem: (id) =>
        set((s) => ({
          shoppingItems: s.shoppingItems.filter((i) => i.id !== id),
        })),

      generateShoppingList: (weekStart) => {
        const { meals, recipes } = get();
        const weekMeals = get().getMealsForWeek(weekStart);
        const items: Omit<ShoppingItem, "id">[] = [];

        for (const meal of weekMeals) {
          if (!meal.recipeId) continue;
          const recipe = recipes.find((r) => r.id === meal.recipeId);
          if (!recipe) continue;
          for (const ing of recipe.ingredients) {
            items.push({
              name: ing.name,
              qty: ing.qty,
              unit: ing.unit,
              done: false,
              fromMealId: meal.id,
            });
          }
        }

        set((s) => ({
          shoppingItems: [
            ...s.shoppingItems.filter((i) => !i.fromMealId),
            ...items.map((i) => ({ ...i, id: crypto.randomUUID() })),
          ],
        }));
      },

      clearDoneItems: () =>
        set((s) => ({
          shoppingItems: s.shoppingItems.filter((i) => !i.done),
        })),
    }),
    { name: "family-planner:meals" }
  )
);

"use client";

import { useMealStore, type MealSlot } from "@/lib/stores/meal-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner"];
const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "🌅 Frühstück",
  lunch: "🍽 Mittag",
  dinner: "🍴 Abendessen",
};

interface MealPlanProps {
  weekStart: string; // YYYY-MM-DD
  onMealClick: (date: string, slot: MealSlot) => void;
  onDeleteMeal: (date: string, slot: MealSlot) => void;
}

export function MealPlan({ weekStart, onMealClick, onDeleteMeal }: MealPlanProps) {
  const { meals, recipes } = useMealStore();
  const weekMeals = useMealStore((s) => s.getMealsForWeek(weekStart));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const getMeal = (date: string, slot: MealSlot) =>
    weekMeals.find((m) => m.date === date && m.slot === slot);

  const getRecipeName = (recipeId?: string) =>
    recipes.find((r) => r.id === recipeId)?.title || "?";

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-[120px_repeat(7,1fr)] sticky top-0 bg-muted/40 border-b">
        <div className="border-r p-2" />
        {days.map((date, idx) => (
          <div key={date} className="p-2 text-center border-r last:border-r-0">
            <p className="text-xs font-semibold">{DAYS[idx]}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(date).toLocaleDateString("de-DE", { day: "numeric", month: "numeric" })}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[120px_repeat(7,1fr)]">
        {SLOTS.map((slot) => (
          <div key={slot} className="flex flex-col">
            {/* Slot-Label */}
            <div className="border-b border-r p-2 bg-muted/20 text-xs font-medium h-[60px] flex items-center justify-center text-center">
              {SLOT_LABELS[slot]}
            </div>

            {/* Tage */}
            {days.map((date) => {
              const meal = getMeal(date, slot);
              return (
                <div
                  key={`${date}-${slot}`}
                  className="border-b border-r last:border-r-0 p-2 min-h-[60px] flex items-center justify-center"
                >
                  {meal && meal.recipeId ? (
                    <button
                      onClick={() => onMealClick(date, slot)}
                      className="w-full text-left text-xs bg-indigo-50 border border-indigo-200 rounded-lg p-1.5 hover:bg-indigo-100 transition-colors group"
                    >
                      <p className="font-medium truncate leading-tight">
                        {getRecipeName(meal.recipeId)}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMeal(date, slot);
                        }}
                        className="hidden group-hover:block absolute top-0.5 right-0.5"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                    </button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0"
                      onClick={() => onMealClick(date, slot)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

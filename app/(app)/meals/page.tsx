"use client";

import { useState } from "react";
import { useMealStore, type MealSlot } from "@/lib/stores/meal-store";
import { startOfWeek, addWeeks, subWeeks, formatDate } from "@/lib/date-utils";
import { MealPlan } from "@/components/meals/meal-plan";
import { RecipeDialog } from "@/components/meals/recipe-dialog";
import { RecipeBrowser } from "@/components/meals/recipe-browser";
import { ShoppingList } from "@/components/meals/shopping-list";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export default function MealsPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{ date: string; slot: MealSlot } | null>(null);

  const { setMeal, clearMeal, generateShoppingList } = useMealStore();

  const handleMealClick = (date: string, slot: MealSlot) => {
    setSelectedMeal({ date, slot });
    setBrowserOpen(true);
  };

  const handleSelectRecipe = (recipeId: string) => {
    if (!selectedMeal) return;
    setMeal({
      date: selectedMeal.date,
      slot: selectedMeal.slot,
      recipeId,
    });
    toast.success("Mahlzeit hinzugefügt");
  };

  const handleGenerateList = () => {
    generateShoppingList(weekStart.toISOString().slice(0, 10));
    toast.success("Einkaufsliste erstellt");
    setShoppingListOpen(true);
  };

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const label = `${formatDate(weekStart, "dd. MMM")} – ${formatDate(weekEnd, "dd. MMM yyyy")}`;

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => setWeekStart(subWeeks(weekStart, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Heute
          </Button>
          <Button size="icon" variant="outline" onClick={() => setWeekStart(addWeeks(weekStart, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-semibold ml-2">{label}</h2>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerateList} variant="outline" size="sm" className="gap-1.5">
            <ShoppingCart className="h-4 w-4" /> Liste
          </Button>
          <Button onClick={() => setRecipeDialogOpen(true)} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Rezept
          </Button>
        </div>
      </div>

      {/* Wochenplan */}
      <MealPlan
        weekStart={weekStart.toISOString().slice(0, 10)}
        onMealClick={handleMealClick}
        onDeleteMeal={(date, slot) => {
          clearMeal(date, slot);
          toast.success("Mahlzeit gelöscht");
        }}
      />

      {/* Dialoge */}
      <RecipeDialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen} />

      {selectedMeal && (
        <RecipeBrowser
          open={browserOpen}
          onOpenChange={setBrowserOpen}
          date={selectedMeal.date}
          slot={selectedMeal.slot}
          onSelect={handleSelectRecipe}
        />
      )}

      <ShoppingList open={shoppingListOpen} onOpenChange={setShoppingListOpen} />
    </div>
  );
}

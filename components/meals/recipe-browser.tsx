"use client";

import { useState, useMemo } from "react";
import { useMealStore, type MealSlot } from "@/lib/stores/meal-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface RecipeBrowserProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  date: string;
  slot: MealSlot;
  onSelect: (recipeId: string) => void;
}

export function RecipeBrowser({
  open,
  onOpenChange,
  date,
  slot,
  onSelect,
}: RecipeBrowserProps) {
  const { recipes } = useMealStore();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return recipes;
    const q = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q)),
    );
  }, [recipes, search]);

  const handleSelect = (recipeId: string) => {
    onSelect(recipeId);
    onOpenChange(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Rezept auswählen</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Keine Rezepte gefunden</p>
              <p className="text-xs">Erstelle erst ein Rezept in der Rezeptsammlung</p>
            </div>
          ) : (
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {filtered.map((recipe) => (
                <button
                  key={recipe.id}
                  onClick={() => handleSelect(recipe.id)}
                  className="text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{recipe.title}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                        {recipe.timeMinutes && <span>⏱ {recipe.timeMinutes} min</span>}
                        {recipe.category && <span>📂 {recipe.category}</span>}
                      </div>
                      {recipe.ingredients.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1 truncate">
                          {recipe.ingredients.map((i) => i.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

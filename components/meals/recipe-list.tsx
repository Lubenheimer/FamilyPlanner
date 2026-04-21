"use client";

import { useState, useMemo } from "react";
import { useMealStore, type Recipe } from "@/lib/stores/meal-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RecipeDialog } from "./recipe-dialog";
import { Search, Plus, Pencil, Trash2, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface RecipeListProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function RecipeList({ open, onOpenChange }: RecipeListProps) {
  const { recipes, deleteRecipe } = useMealStore();
  const [search, setSearch] = useState("");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | undefined>();
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return recipes;
    const q = search.toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [recipes, search]);

  const handleDelete = (recipe: Recipe) => {
    if (!confirm(`"${recipe.title}" wirklich löschen?`)) return;
    deleteRecipe(recipe.id);
    toast.success("Rezept gelöscht");
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setRecipeDialogOpen(true);
  };

  const handleNew = () => {
    setEditingRecipe(undefined);
    setRecipeDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle>Rezepte ({recipes.length})</DialogTitle>
              <Button size="sm" onClick={handleNew} className="gap-1.5">
                <Plus className="h-4 w-4" /> Neues Rezept
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Suche */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rezept, Kategorie oder Zutat suchen…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>

            {/* Liste */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <span className="text-4xl">🍽️</span>
                <div>
                  <p className="font-semibold text-sm">
                    {search ? "Keine Rezepte gefunden" : "Noch keine Rezepte"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {search
                      ? "Anderen Suchbegriff versuchen"
                      : "Erstelle dein erstes Rezept"}
                  </p>
                </div>
                {!search && (
                  <Button size="sm" onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-1" /> Rezept erstellen
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="rounded-xl border bg-white p-3 space-y-2 hover:border-muted-foreground/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{recipe.title}</p>
                          {recipe.category && (
                            <Badge variant="secondary" className="text-xs">
                              {recipe.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {recipe.timeMinutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {recipe.timeMinutes} min
                            </span>
                          )}
                          {recipe.ingredients.length > 0 && (
                            <span>
                              {recipe.ingredients.length} Zutaten
                            </span>
                          )}
                        </div>
                        {recipe.ingredients.length > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">
                            {recipe.ingredients.map((i) => i.name).join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Bild-Vorschau */}
                      {recipe.imageUrl && (
                        <div className="h-14 w-14 rounded-lg overflow-hidden border shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Aktionen */}
                    <div className="flex items-center gap-2 pt-1 border-t">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(recipe)}
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" /> Bearbeiten
                      </Button>
                      {recipe.url && (
                        <a
                          href={recipe.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" /> Rezeptlink
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(recipe)}
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive ml-auto"
                      >
                        <Trash2 className="h-3 w-3" /> Löschen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RecipeDialog
        open={recipeDialogOpen}
        onOpenChange={setRecipeDialogOpen}
        recipe={editingRecipe}
      />
    </>
  );
}

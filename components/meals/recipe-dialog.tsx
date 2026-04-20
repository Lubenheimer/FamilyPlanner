"use client";

import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMealStore, type Recipe } from "@/lib/stores/meal-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Titel fehlt"),
  url: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  timeMinutesStr: z.string().optional(),
  category: z.string().optional(),
  instructions: z.string().optional(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, "Zutat fehlt"),
      qtyStr: z.string().optional(),
      unit: z.string().optional(),
    }),
  ),
});

type FormData = z.infer<typeof schema>;

interface RecipeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recipe?: Recipe | null;
}

export function RecipeDialog({ open, onOpenChange, recipe }: RecipeDialogProps) {
  const { addRecipe, updateRecipe } = useMealStore();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      ingredients: [{ name: "", qtyStr: "", unit: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  useEffect(() => {
    if (recipe && open) {
      form.reset({
        title: recipe.title,
        url: recipe.url ?? "",
        imageUrl: recipe.imageUrl ?? "",
        timeMinutesStr: recipe.timeMinutes ? String(recipe.timeMinutes) : "",
        category: recipe.category ?? "",
        instructions: recipe.instructions ?? "",
        ingredients: recipe.ingredients.length > 0
          ? recipe.ingredients.map((i) => ({ ...i, qtyStr: i.qty ? String(i.qty) : "" }))
          : [{ name: "", qtyStr: "", unit: "" }],
      });
    } else if (open) {
      form.reset({
        title: "",
        ingredients: [{ name: "", qtyStr: "", unit: "" }],
      });
    }
  }, [recipe, open, form]);

  const onSubmit = (data: FormData) => {
    const timeMinutes = data.timeMinutesStr ? parseFloat(data.timeMinutesStr) : undefined;
    const ingredients = data.ingredients.map((ing) => ({
      name: ing.name,
      qty: ing.qtyStr ? parseFloat(ing.qtyStr) : undefined,
      unit: ing.unit || undefined,
    }));

    const payload = {
      title: data.title,
      url: data.url || undefined,
      imageUrl: data.imageUrl || undefined,
      timeMinutes,
      category: data.category || undefined,
      instructions: data.instructions || undefined,
      ingredients,
    };

    if (recipe) {
      updateRecipe(recipe.id, payload);
      toast.success("Rezept aktualisiert");
    } else {
      addRecipe(payload);
      toast.success("Rezept hinzugefügt 👨‍🍳");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? "Rezept bearbeiten" : "Neues Rezept"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Titel *</Label>
              <Input placeholder="Spaghetti Carbonara" {...form.register("title")} />
            </div>
            <div className="space-y-1.5">
              <Label>Zeit (Min)</Label>
              <Input type="number" min="0" placeholder="30" {...form.register("timeMinutesStr")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input placeholder="https://..." {...form.register("url")} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategorie</Label>
              <Input placeholder="Pasta, Gemüse..." {...form.register("category")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Anleitung</Label>
            <Textarea placeholder="Schrittweise Anleitung..." {...form.register("instructions")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Zutaten</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ name: "", qtyStr: "", unit: "" })}
              >
                + Zutat
              </Button>
            </div>

            <div className="space-y-2 bg-muted/30 p-2 rounded-lg">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-end">
                  <Input
                    placeholder="z.B. Eier"
                    className="flex-1"
                    {...form.register(`ingredients.${idx}.name`)}
                  />
                  <Input
                    placeholder="Menge"
                    type="number"
                    step="0.1"
                    className="w-16"
                    {...form.register(`ingredients.${idx}.qtyStr`)}
                  />
                  <Input
                    placeholder="Einheit"
                    className="w-20"
                    {...form.register(`ingredients.${idx}.unit`)}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {recipe ? "Speichern" : "Hinzufügen"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

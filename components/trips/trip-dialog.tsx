"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTripStore, type Trip } from "@/lib/stores/trip-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const TAGS = ["Natur", "Stadt", "Strand", "Museum", "Sport", "Wandern", "Kultur", "Essen"];
const SEASONS = ["Frühling", "Sommer", "Herbst", "Winter", "Ganzjährig"];

const schema = z.object({
  title: z.string().min(1, "Titel fehlt").max(120),
  description: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  status: z.enum(["idea", "planned", "done"]),
  estCostStr: z.string().optional(), // string im Formular, wird beim Submit zu number
  plannedDate: z.string().optional(),
  season: z.string().optional(),
  indoorOutdoor: z.enum(["indoor", "outdoor", "both"]).optional(),
  tags: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

interface TripDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingTrip?: Trip | null;
}

export function TripDialog({ open, onOpenChange, editingTrip }: TripDialogProps) {
  const { addTrip, updateTrip } = useTripStore();
  const { currentMemberId } = useFamilyStore();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      status: "idea",
      tags: [],
      estCostStr: "",
      plannedDate: "",
      season: "",
      indoorOutdoor: "both",
    },
  });

  useEffect(() => {
    if (editingTrip) {
      form.reset({
        title: editingTrip.title,
        description: editingTrip.description ?? "",
        location: editingTrip.location ?? "",
        status: editingTrip.status,
        estCostStr: editingTrip.estCost !== undefined ? String(editingTrip.estCost) : "",
        plannedDate: editingTrip.plannedDate ?? "",
        season: editingTrip.season ?? "",
        indoorOutdoor: editingTrip.indoorOutdoor ?? "both",
        tags: editingTrip.tags,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        location: "",
        status: "idea",
        tags: [],
        estCostStr: "",
        plannedDate: "",
        season: "",
        indoorOutdoor: "both",
      });
    }
  }, [editingTrip, open, form]);

  const onSubmit = (data: FormData) => {
    const { estCostStr, ...rest } = data;
    const estCost = estCostStr ? parseFloat(estCostStr) : undefined;

    if (editingTrip) {
      updateTrip(editingTrip.id, { ...rest, estCost });
      toast.success("Ausflug aktualisiert");
    } else {
      addTrip({ ...rest, estCost, createdBy: currentMemberId ?? "" });
      toast.success("Ausflug hinzugefügt 🗺️");
    }
    onOpenChange(false);
  };

  const tags = form.watch("tags");
  const toggleTag = (tag: string) => {
    form.setValue(
      "tags",
      tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTrip ? "Ausflug bearbeiten" : "Neuer Ausflug"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Titel */}
          <div className="space-y-1.5">
            <Label>Titel *</Label>
            <Input placeholder="z.B. Zoo Leipzig" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Beschreibung */}
          <div className="space-y-1.5">
            <Label>Beschreibung</Label>
            <Textarea
              placeholder="Was erwartet uns dort? Warum wollen wir hin?"
              {...form.register("description")}
            />
          </div>

          {/* Ort */}
          <div className="space-y-1.5">
            <Label>Ort</Label>
            <Input placeholder="z.B. Leipzig, Sachsen" {...form.register("location")} />
          </div>

          {/* Status + Datum */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <select
                {...form.register("status")}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus:border-ring"
              >
                <option value="idea">💡 Idee</option>
                <option value="planned">📅 Geplant</option>
                <option value="done">✅ Erlebt</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Geplantes Datum</Label>
              <Input type="date" {...form.register("plannedDate")} />
            </div>
          </div>

          {/* Kosten + Indoor/Outdoor */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Geschätzte Kosten (€)</Label>
              <Input type="number" min="0" step="1" placeholder="50" {...form.register("estCostStr")} />
            </div>
            <div className="space-y-1.5">
              <Label>Indoor / Outdoor</Label>
              <select
                {...form.register("indoorOutdoor")}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus:border-ring"
              >
                <option value="outdoor">🌳 Outdoor</option>
                <option value="indoor">🏠 Indoor</option>
                <option value="both">🔄 Beides</option>
              </select>
            </div>
          </div>

          {/* Jahreszeit */}
          <div className="space-y-1.5">
            <Label>Beste Jahreszeit</Label>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => form.setValue("season", form.watch("season") === s ? "" : s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    form.watch("season") === s
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-indigo-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    tags.includes(tag)
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-indigo-400"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {editingTrip ? "Speichern" : "Hinzufügen"}
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

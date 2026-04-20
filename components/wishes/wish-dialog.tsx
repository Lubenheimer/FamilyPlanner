"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWishStore, type Wish } from "@/lib/stores/wish-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Titel fehlt"),
  url: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  priceStr: z.string().optional(),
  priorityStr: z.string(),
  category: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface WishDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  childId: string;
  wish?: Wish | null;
}

export function WishDialog({ open, onOpenChange, childId, wish }: WishDialogProps) {
  const { addWish, updateWish } = useWishStore();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      priorityStr: "3",
    },
  });

  useEffect(() => {
    if (wish && open) {
      form.reset({
        title: wish.title,
        url: wish.url ?? "",
        imageUrl: wish.imageUrl ?? "",
        priceStr: wish.price ? String(wish.price) : "",
        priorityStr: String(wish.priority),
        category: wish.category ?? "",
      });
    } else if (open) {
      form.reset({ title: "", priorityStr: "3" });
    }
  }, [wish, open, form]);

  const onSubmit = (data: FormData) => {
    const price = data.priceStr ? parseFloat(data.priceStr) : undefined;
    const priority = parseInt(data.priorityStr, 10);

    const payload = {
      title: data.title,
      url: data.url || undefined,
      imageUrl: data.imageUrl || undefined,
      price,
      priority,
      category: data.category || undefined,
      status: wish?.status ?? "open",
      childId,
    } as const;

    if (wish) {
      updateWish(wish.id, payload);
      toast.success("Wunsch aktualisiert");
    } else {
      addWish(payload);
      toast.success("Wunsch hinzugefügt 🎁");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{wish ? "Wunsch bearbeiten" : "Neuer Wunsch"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Titel *</Label>
            <Input placeholder="z.B. Fahrrad" {...form.register("title")} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Preis (€)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" {...form.register("priceStr")} />
            </div>
            <div className="space-y-1.5">
              <Label>Priorität</Label>
              <select
                {...form.register("priorityStr")}
                className="w-full rounded-lg border border-input bg-white px-3 py-1.5 text-sm outline-none focus:border-ring"
              >
                <option value="1">⭐ Sehr wichtig</option>
                <option value="2">⭐⭐ Wichtig</option>
                <option value="3">⭐⭐⭐ Mittelmäßig</option>
                <option value="4">⭐⭐⭐⭐ Nice-to-have</option>
                <option value="5">⭐⭐⭐⭐⭐ Nur wenn</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <Input placeholder="z.B. Geburtstag, Weihnachten" {...form.register("category")} />
          </div>

          <div className="space-y-1.5">
            <Label>URL (z.B. Produktseite)</Label>
            <Input placeholder="https://..." {...form.register("url")} />
          </div>

          <div className="space-y-1.5">
            <Label>Bild-URL</Label>
            <Input placeholder="https://..." {...form.register("imageUrl")} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              {wish ? "Speichern" : "Hinzufügen"}
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

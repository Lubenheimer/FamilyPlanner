"use client";

import { useRef, useState } from "react";
import { useTripStore, type TripEntry } from "@/lib/stores/trip-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Star, X } from "lucide-react";
import { toast } from "sonner";

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: string;
  entry?: TripEntry | null; // null = neue Eintraag
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="focus:outline-none"
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              s <= value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function JournalEntryDialog({ open, onOpenChange, tripId }: JournalEntryDialogProps) {
  const { addEntry } = useTripStore();
  const { members } = useFamilyStore();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [text, setText] = useState("");
  const [cost, setCost] = useState("");
  const [ratings, setRatings] = useState<Record<string, { stars: number; wouldRepeat: boolean }>>(
    () => Object.fromEntries(members.map((m) => [m.id, { stars: 0, wouldRepeat: true }])),
  );
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPhotos((prev) => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = () => {
    const entryRatings = members
      .map((m) => ({
        memberId: m.id,
        stars: ratings[m.id]?.stars ?? 0,
        wouldRepeat: ratings[m.id]?.wouldRepeat ?? true,
      }))
      .filter((r) => r.stars > 0);

    addEntry(tripId, {
      date,
      text: text || undefined,
      cost: cost ? parseFloat(cost) : undefined,
      ratings: entryRatings,
      photos,
    });

    toast.success("Journal-Eintrag gespeichert 📝");
    onOpenChange(false);
    // reset
    setText("");
    setCost("");
    setPhotos([]);
    setRatings(Object.fromEntries(members.map((m) => [m.id, { stars: 0, wouldRepeat: true }])));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Journal-Eintrag</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Datum + Kosten */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Datum</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Ausgaben (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>

          {/* Freitext */}
          <div className="space-y-1.5">
            <Label>Erlebnisbericht</Label>
            <Textarea
              placeholder="Was war besonders schön? Was ist passiert?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Bewertungen */}
          <div className="space-y-3">
            <Label>Bewertungen</Label>
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarFallback
                    style={{ backgroundColor: m.color }}
                    className="text-white text-xs font-bold"
                  >
                    {m.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium w-20 shrink-0">{m.name}</span>
                <StarRating
                  value={ratings[m.id]?.stars ?? 0}
                  onChange={(v) =>
                    setRatings((prev) => ({
                      ...prev,
                      [m.id]: { ...prev[m.id], stars: v },
                    }))
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setRatings((prev) => ({
                      ...prev,
                      [m.id]: { ...prev[m.id], wouldRepeat: !prev[m.id]?.wouldRepeat },
                    }))
                  }
                  className={`ml-auto text-xs rounded-full px-2 py-0.5 border transition-colors ${
                    ratings[m.id]?.wouldRepeat
                      ? "bg-green-50 text-green-700 border-green-300"
                      : "text-muted-foreground border-muted-foreground/30"
                  }`}
                >
                  Wieder?
                </button>
              </div>
            ))}
          </div>

          {/* Fotos */}
          <div className="space-y-2">
            <Label>Fotos</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((src, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-0.5 right-0.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-indigo-400 hover:text-indigo-500 transition-colors"
              >
                <Camera className="h-5 w-5" />
                <span className="text-[10px] mt-1">Foto</span>
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePhotos(e.target.files)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" onClick={handleSubmit} className="flex-1">
              Eintrag speichern
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

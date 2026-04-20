"use client";

import { useState } from "react";
import { useWishStore } from "@/lib/stores/wish-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { WishCard } from "@/components/wishes/wish-card";
import { WishDialog } from "@/components/wishes/wish-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function WishesPage() {
  const { members } = useFamilyStore();
  const { getWishesForChild, deleteWish, reserve, markGifted } = useWishStore();

  const [selectedChildId, setSelectedChildId] = useState(() => {
    const children = members.filter((m) => m.role === "child");
    return children[0]?.id ?? "";
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const children = members.filter((m) => m.role === "child");
  const selectedChild = members.find((m) => m.id === selectedChildId);
  const wishes = selectedChildId ? getWishesForChild(selectedChildId) : [];

  const handleReserve = (wishId: string, name: string) => {
    reserve(wishId, name);
    toast.success(`${name} hat den Wunsch reserviert`);
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Wunschzettel</h1>
        {selectedChildId && (
          <Button onClick={() => setDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Wunsch
          </Button>
        )}
      </div>

      {/* Kind-Auswahl */}
      {children.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium border-2 transition-all ${
                selectedChildId === child.id
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-muted-foreground/30 text-muted-foreground hover:border-indigo-300"
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Keine Kinder definiert</p>
          <p className="text-xs">Füge Kinder in den Familieneinstellungen hinzu</p>
        </div>
      )}

      {/* Wunschliste */}
      {selectedChildId ? (
        wishes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <span className="text-5xl">🎁</span>
            <p className="font-semibold text-sm">Keine Wünsche yet</p>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Wunsch hinzufügen
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wishes.map((wish) => (
              <WishCard
                key={wish.id}
                wish={wish}
                isParentView
                onEdit={() => {
                  /* Open edit dialog */
                }}
                onDelete={() => {
                  deleteWish(wish.id);
                  toast.success("Wunsch gelöscht");
                }}
                onReserve={(name) => handleReserve(wish.id, name)}
                onUnreserve={() => {
                  reserve(wish.id, "");
                  toast.success("Reservierung aufgehoben");
                }}
                onMarkGifted={() => {
                  markGifted(wish.id);
                  toast.success("Als gekauft markiert");
                }}
              />
            ))}
          </div>
        )
      ) : null}

      {/* Dialog */}
      {selectedChildId && (
        <WishDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          childId={selectedChildId}
        />
      )}
    </div>
  );
}

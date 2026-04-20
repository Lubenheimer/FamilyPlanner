"use client";

import { useMealStore } from "@/lib/stores/meal-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShoppingListProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ShoppingList({ open, onOpenChange }: ShoppingListProps) {
  const { shoppingItems, toggleShoppingItem, deleteShoppingItem, addShoppingItem, clearDoneItems } =
    useMealStore();
  const [newItem, setNewItem] = useState("");

  const activeItems = shoppingItems.filter((i) => !i.done);
  const doneItems = shoppingItems.filter((i) => i.done);

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    addShoppingItem({
      name: newItem,
      done: false,
    });
    setNewItem("");
    toast.success("Artikel hinzugefügt");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Einkaufsliste</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Neuer Artikel */}
          <div className="flex gap-2">
            <Input
              placeholder="Artikel hinzufügen..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
            />
            <Button size="sm" onClick={handleAddItem}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Offene Artikel */}
          {activeItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Noch zu kaufen ({activeItems.length})
              </p>
              <div className="space-y-1">
                {activeItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Checkbox
                      checked={false}
                      onChange={() => toggleShoppingItem(item.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.name}</p>
                      {(item.qty || item.unit) && (
                        <p className="text-xs text-muted-foreground">
                          {item.qty} {item.unit}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteShoppingItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gekaufte Artikel */}
          {doneItems.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Gekauft ({doneItems.length})
              </p>
              <div className="space-y-1">
                {doneItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group opacity-50"
                  >
                    <Checkbox
                      checked={true}
                      onChange={() => toggleShoppingItem(item.id)}
                    />
                    <p className="text-sm truncate line-through">{item.name}</p>
                    <button
                      onClick={() => deleteShoppingItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={clearDoneItems}
                className="w-full text-xs"
              >
                Gekaufte löschen
              </Button>
            </div>
          )}

          {shoppingItems.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">
              Einkaufsliste leer
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

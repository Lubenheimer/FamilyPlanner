"use client";

import type { Wish } from "@/lib/stores/wish-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Euro, ExternalLink, Pencil, Trash2 } from "lucide-react";

interface WishCardProps {
  wish: Wish;
  isParentView?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReserve?: (name: string) => void;
  onUnreserve?: () => void;
  onMarkGifted?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  reserved: "Reserviert",
  gifted: "Gekauft ✅",
};

const PRIORITY_STARS: Record<number, string> = {
  1: "⭐",
  2: "⭐⭐",
  3: "⭐⭐⭐",
  4: "⭐⭐⭐⭐",
  5: "⭐⭐⭐⭐⭐",
};

export function WishCard({
  wish,
  isParentView = false,
  onEdit,
  onDelete,
  onReserve,
  onUnreserve,
  onMarkGifted,
}: WishCardProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {wish.imageUrl && (
        <div className="h-40 w-full bg-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wish.imageUrl} alt={wish.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm leading-snug truncate">{wish.title}</h3>

        <div className="flex items-center gap-2 flex-wrap">
          {wish.price !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Euro className="h-3 w-3" /> {wish.price.toFixed(2)} €
            </span>
          )}
          {wish.category && <Badge variant="outline" className="text-[10px]">{wish.category}</Badge>}
          <span className="text-[10px] text-muted-foreground">{PRIORITY_STARS[wish.priority]}</span>
        </div>

        {isParentView && (
          <div className="flex items-center justify-between pt-2 border-t">
            <Badge
              variant={wish.status === "gifted" ? "default" : wish.status === "reserved" ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {STATUS_LABEL[wish.status]}
            </Badge>
            {wish.status === "reserved" && wish.reservedBy && (
              <span className="text-xs text-muted-foreground">({wish.reservedBy})</span>
            )}
          </div>
        )}

        {isParentView && (
          <div className="flex gap-1.5 pt-1">
            {wish.url && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => window.open(wish.url, "_blank")}
                className="flex-1 h-7"
              >
                <ExternalLink className="h-3 w-3 mr-1" /> Link
              </Button>
            )}
            {wish.status !== "gifted" && (
              <>
                {wish.status === "reserved" && wish.reservedBy ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onUnreserve}
                    className="flex-1 h-7 text-xs"
                  >
                    Freigeben
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      const name = prompt("Dein Name:");
                      if (name) onReserve?.(name);
                    }}
                    className="flex-1 h-7"
                  >
                    Reservieren
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onMarkGifted}
                  className="flex-1 h-7"
                >
                  Gekauft
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-7 px-2"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-7 px-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

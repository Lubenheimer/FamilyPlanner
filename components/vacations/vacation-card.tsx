"use client";

import { type Vacation, type VacationStatus } from "@/lib/stores/vacation-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarDays, MapPin, Euro, Package } from "lucide-react";

const STATUS_LABEL: Record<VacationStatus, string> = {
  idea:   "💡 Idee",
  booked: "✅ Gebucht",
  done:   "🏁 Abgeschlossen",
};

const STATUS_COLOR: Record<VacationStatus, string> = {
  idea:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  booked: "bg-green-50 text-green-700 border-green-200",
  done:   "bg-slate-50 text-slate-600 border-slate-200",
};

interface VacationCardProps {
  vacation: Vacation;
  onClick: () => void;
}

export function VacationCard({ vacation, onClick }: VacationCardProps) {
  const { members } = useFamilyStore();

  const nights = Math.max(
    0,
    Math.round(
      (new Date(vacation.endDate).getTime() - new Date(vacation.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const packedCount = vacation.packingItems.filter((p) => p.done).length;
  const totalPacking = vacation.packingItems.length;

  const participantMembers = vacation.participants
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{vacation.title}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{vacation.destination}</span>
          </p>
        </div>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_COLOR[vacation.status]}`}
        >
          {STATUS_LABEL[vacation.status]}
        </span>
      </div>

      {/* Reisezeitraum */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>
          {new Date(vacation.startDate).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "short",
          })}
          {" – "}
          {new Date(vacation.endDate).toLocaleDateString("de-DE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
        <span className="text-muted-foreground/60">· {nights} Nächte</span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Teilnehmer Avatare */}
        <div className="flex -space-x-1">
          {participantMembers.map((m) =>
            m ? (
              <Avatar key={m.id} className="h-6 w-6 border-2 border-white">
                <AvatarFallback
                  style={{ backgroundColor: m.color }}
                  className="text-white text-[9px] font-bold"
                >
                  {m.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ) : null
          )}
        </div>

        {/* Budget + Packliste */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {vacation.budget !== undefined && (
            <span className="flex items-center gap-0.5">
              <Euro className="h-3 w-3" />
              {vacation.budget.toLocaleString("de-DE")}
            </span>
          )}
          {totalPacking > 0 && (
            <span className="flex items-center gap-0.5">
              <Package className="h-3 w-3" />
              {packedCount}/{totalPacking}
            </span>
          )}
        </div>
      </div>

      {/* Notizen-Vorschau */}
      {vacation.notes && (
        <p className="text-xs text-muted-foreground line-clamp-1 border-t pt-2">
          {vacation.notes}
        </p>
      )}
    </button>
  );
}

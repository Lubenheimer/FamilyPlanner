"use client";

import type { Trip } from "@/lib/stores/trip-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Euro, CalendarDays, Star, ThumbsUp } from "lucide-react";
import { TripWeatherBadge } from "@/components/weather/trip-weather-badge";

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
}

const IO_ICON: Record<string, string> = {
  indoor: "🏠",
  outdoor: "🌳",
  both: "🔄",
};

export function TripCard({ trip, onClick }: TripCardProps) {
  const { members } = useFamilyStore();

  const totalVotes = Object.keys(trip.votes).length;

  // Durchschnittliche Sterne aus allen Bewertungen aller Einträge
  const allStars = trip.entries.flatMap((e) => e.ratings.map((r) => r.stars));
  const avgStars =
    allStars.length > 0 ? allStars.reduce((a, b) => a + b, 0) / allStars.length : null;

  const voters = Object.keys(trip.votes)
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean);

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-4 space-y-3 group"
    >
      {/* Titel-Zeile */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-snug group-hover:text-indigo-700 transition-colors">
          {trip.title}
        </h3>
        {trip.indoorOutdoor && (
          <span className="text-base shrink-0">{IO_ICON[trip.indoorOutdoor]}</span>
        )}
      </div>

      {/* Meta-Infos */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {trip.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {trip.location}
          </span>
        )}
        {trip.estCost !== undefined && (
          <span className="flex items-center gap-1">
            <Euro className="h-3 w-3" /> ~{trip.estCost} €
          </span>
        )}
        {trip.plannedDate && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {new Date(trip.plannedDate).toLocaleDateString("de-DE")}
          </span>
        )}
        {trip.plannedDate && (
          <TripWeatherBadge
            plannedDate={trip.plannedDate}
            location={trip.location}
            variant="compact"
          />
        )}
        {avgStars !== null && (
          <span className="flex items-center gap-1 text-amber-500">
            <Star className="h-3 w-3 fill-amber-400" />
            {avgStars.toFixed(1)}
          </span>
        )}
      </div>

      {/* Tags */}
      {(trip.tags.length > 0 || trip.season) && (
        <div className="flex flex-wrap gap-1.5">
          {trip.season && (
            <Badge variant="secondary" className="text-[10px] px-2 py-0">
              {trip.season}
            </Badge>
          )}
          {trip.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-[10px] px-2 py-0">
              {t}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: Votes + Journal-Zähler */}
      {(totalVotes > 0 || trip.entries.length > 0) && (
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            {totalVotes > 0 && (
              <>
                <ThumbsUp className="h-3 w-3 text-indigo-500" />
                <div className="flex -space-x-1">
                  {voters.map((m) =>
                    m ? (
                      <Avatar key={m.id} className="h-5 w-5 border border-white">
                        <AvatarFallback
                          style={{ backgroundColor: m.color }}
                          className="text-white text-[8px] font-bold"
                        >
                          {m.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : null,
                  )}
                </div>
              </>
            )}
          </div>
          {trip.entries.length > 0 && (
            <span className="text-xs text-muted-foreground">
              📝 {trip.entries.length} Eintrag{trip.entries.length > 1 ? "träge" : ""}
            </span>
          )}
        </div>
      )}
    </button>
  );
}

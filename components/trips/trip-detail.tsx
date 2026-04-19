"use client";

import { useState } from "react";
import { useTripStore, type Trip } from "@/lib/stores/trip-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { JournalEntryDialog } from "./journal-entry-dialog";
import { TripDialog } from "./trip-dialog";
import {
  MapPin, Euro, CalendarDays, Star, Pencil, Trash2, Plus, ThumbsUp,
} from "lucide-react";
import { TripWeatherBadge } from "@/components/weather/trip-weather-badge";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  idea: "💡 Idee",
  planned: "📅 Geplant",
  done: "✅ Erlebt",
};

const IO_LABEL: Record<string, string> = {
  indoor: "🏠 Indoor",
  outdoor: "🌳 Outdoor",
  both: "🔄 Beides",
};

interface TripDetailProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted: () => void;
}

function StarRow({ stars }: { stars: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`}
        />
      ))}
    </span>
  );
}

export function TripDetail({ trip, open, onOpenChange, onDeleted }: TripDetailProps) {
  const { vote, unvote, deleteTrip } = useTripStore();
  const { members, currentMemberId } = useFamilyStore();
  const [journalOpen, setJournalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const hasVoted = !!trip.votes[currentMemberId ?? ""];
  const totalVotes = Object.keys(trip.votes).length;

  const getMember = (id: string) => members.find((m) => m.id === id);

  const handleVote = () => {
    if (!currentMemberId) return;
    if (hasVoted) unvote(trip.id, currentMemberId);
    else vote(trip.id, currentMemberId);
  };

  const handleDelete = () => {
    if (!confirm(`"${trip.title}" wirklich löschen?`)) return;
    deleteTrip(trip.id);
    toast.success("Ausflug gelöscht");
    onOpenChange(false);
    onDeleted();
  };

  // Durchschnittliche Sterne über alle Einträge und Bewertungen
  const allRatings = trip.entries.flatMap((e) => e.ratings.map((r) => r.stars));
  const avgStars =
    allRatings.length > 0
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
      : null;

  const totalCost = trip.entries.reduce((sum, e) => sum + (e.cost ?? 0), 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2 pr-6">
              <div className="space-y-1">
                <DialogTitle className="text-lg">{trip.title}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{STATUS_LABEL[trip.status]}</Badge>
                  {trip.indoorOutdoor && (
                    <Badge variant="outline">{IO_LABEL[trip.indoorOutdoor]}</Badge>
                  )}
                  {trip.season && <Badge variant="outline">{trip.season}</Badge>}
                  {trip.tags.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {trip.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {trip.location}
                </span>
              )}
              {trip.plannedDate && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(trip.plannedDate).toLocaleDateString("de-DE")}
                </span>
              )}
              {trip.estCost !== undefined && (
                <span className="flex items-center gap-1">
                  <Euro className="h-3.5 w-3.5" /> ~{trip.estCost} €
                </span>
              )}
              {avgStars !== null && (
                <span className="flex items-center gap-1.5">
                  <StarRow stars={Math.round(avgStars)} />
                  <span>{avgStars.toFixed(1)}</span>
                </span>
              )}
            </div>

            {trip.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{trip.description}</p>
            )}

            {/* Wetter-Vorhersage für das Ausflugsdatum */}
            {trip.plannedDate && (
              <TripWeatherBadge
                plannedDate={trip.plannedDate}
                location={trip.location}
                variant="full"
              />
            )}

            {/* Votes */}
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant={hasVoted ? "default" : "outline"}
                onClick={handleVote}
                className="gap-1.5"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                {hasVoted ? "Abgestimmt" : "Abstimmen"}
                {totalVotes > 0 && (
                  <span className="ml-1 font-bold">{totalVotes}</span>
                )}
              </Button>
              {/* Wer hat abgestimmt */}
              <div className="flex -space-x-1">
                {Object.keys(trip.votes).map((mid) => {
                  const m = getMember(mid);
                  return m ? (
                    <Avatar key={mid} className="h-6 w-6 border-2 border-white">
                      <AvatarFallback
                        style={{ backgroundColor: m.color }}
                        className="text-white text-[9px] font-bold"
                      >
                        {m.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null;
                })}
              </div>
            </div>

            <Separator />

            {/* Journal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  Journal {trip.entries.length > 0 && `(${trip.entries.length})`}
                </h3>
                <Button size="sm" variant="outline" onClick={() => setJournalOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Eintrag
                </Button>
              </div>

              {trip.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Noch kein Journal-Eintrag — nach dem Ausflug hier festhalten was ihr erlebt habt!
                </p>
              ) : (
                <div className="space-y-4">
                  {[...trip.entries]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((entry) => (
                      <div key={entry.id} className="rounded-xl border bg-muted/20 p-3 space-y-3">
                        {/* Datum + Kosten */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium">
                            {new Date(entry.date).toLocaleDateString("de-DE", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </span>
                          {entry.cost !== undefined && (
                            <span className="flex items-center gap-1">
                              <Euro className="h-3 w-3" /> {entry.cost.toFixed(2)} €
                            </span>
                          )}
                        </div>

                        {/* Text */}
                        {entry.text && (
                          <p className="text-sm leading-relaxed">{entry.text}</p>
                        )}

                        {/* Fotos */}
                        {entry.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.photos.map((src, i) => (
                              <div
                                key={i}
                                className="h-20 w-20 rounded-lg overflow-hidden border"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={src}
                                  alt=""
                                  className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(src, "_blank")}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Bewertungen */}
                        {entry.ratings.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {entry.ratings.map((r) => {
                              const m = getMember(r.memberId);
                              return m ? (
                                <div key={r.memberId} className="flex items-center gap-1.5">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback
                                      style={{ backgroundColor: m.color }}
                                      className="text-white text-[9px] font-bold"
                                    >
                                      {m.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <StarRow stars={r.stars} />
                                  {r.wouldRepeat && (
                                    <span className="text-[10px] text-green-600 font-medium">↩</span>
                                  )}
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                  {/* Gesamt-Ausgaben */}
                  {totalCost > 0 && (
                    <p className="text-xs text-muted-foreground text-right">
                      Gesamt: <span className="font-semibold">{totalCost.toFixed(2)} €</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Aktionen */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" /> Bearbeiten
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="gap-1.5 text-destructive hover:text-destructive ml-auto"
              >
                <Trash2 className="h-3.5 w-3.5" /> Löschen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <JournalEntryDialog
        open={journalOpen}
        onOpenChange={setJournalOpen}
        tripId={trip.id}
      />
      <TripDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editingTrip={trip}
      />
    </>
  );
}

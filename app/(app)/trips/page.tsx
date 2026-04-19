"use client";

import { useState, useMemo } from "react";
import { useTripStore, type Trip, type TripStatus } from "@/lib/stores/trip-store";
import { TripCard } from "@/components/trips/trip-card";
import { TripDialog } from "@/components/trips/trip-dialog";
import { TripDetail } from "@/components/trips/trip-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

const TABS: { status: TripStatus | "all"; label: string }[] = [
  { status: "idea",    label: "💡 Ideen" },
  { status: "planned", label: "📅 Geplant" },
  { status: "done",    label: "✅ Erlebt" },
];

const SORT_OPTIONS = [
  { value: "votes",   label: "Beliebtheit" },
  { value: "date",    label: "Datum" },
  { value: "title",   label: "Name" },
  { value: "cost",    label: "Kosten" },
];

export default function TripsPage() {
  const { trips } = useTripStore();

  const [activeTab, setActiveTab] = useState<TripStatus>("idea");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("votes");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const filtered = useMemo(() => {
    let list = trips.filter((t) => t.status === activeTab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.location?.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          t.description?.toLowerCase().includes(q),
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "votes") return Object.keys(b.votes).length - Object.keys(a.votes).length;
      if (sortBy === "date")  return (a.plannedDate ?? "").localeCompare(b.plannedDate ?? "");
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "cost")  return (a.estCost ?? 0) - (b.estCost ?? 0);
      return 0;
    });
  }, [trips, activeTab, search, sortBy]);

  // Zähler für Tabs
  const counts = useMemo(
    () => ({
      idea:    trips.filter((t) => t.status === "idea").length,
      planned: trips.filter((t) => t.status === "planned").length,
      done:    trips.filter((t) => t.status === "done").length,
    }),
    [trips],
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Ausflüge</h1>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Ausflug
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
        {TABS.map(({ status, label }) => (
          <button
            key={status}
            onClick={() => setActiveTab(status as TripStatus)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === status
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {counts[status as TripStatus] > 0 && (
              <span className="ml-1.5 text-xs opacity-60">
                {counts[status as TripStatus]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Suche + Sortierung */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-input bg-white px-3 py-1.5 text-sm outline-none focus:border-ring shrink-0"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <span className="text-5xl">
            {activeTab === "idea" ? "💡" : activeTab === "planned" ? "🗺️" : "📸"}
          </span>
          <div>
            <p className="font-semibold text-sm">
              {search
                ? "Keine Treffer"
                : activeTab === "idea"
                ? "Noch keine Ideen"
                : activeTab === "planned"
                ? "Keine geplanten Ausflüge"
                : "Noch keine Erlebnisse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search
                ? "Andere Suchbegriffe versuchen"
                : activeTab === "idea"
                ? "Füge Ausflugsziele auf eurer Wunschliste hinzu"
                : activeTab === "planned"
                ? "Plane deinen nächsten Ausflug"
                : "Nach dem Ausflug hier Fotos und Bewertungen eintragen"}
            </p>
          </div>
          {!search && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Ausflug hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => setSelectedTrip(trip)}
            />
          ))}
        </div>
      )}

      {/* Dialoge */}
      <TripDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {selectedTrip && (
        <TripDetail
          trip={selectedTrip}
          open={!!selectedTrip}
          onOpenChange={(v) => { if (!v) setSelectedTrip(null); }}
          onDeleted={() => setSelectedTrip(null)}
        />
      )}
    </div>
  );
}

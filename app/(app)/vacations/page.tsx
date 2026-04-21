"use client";

import { useState, useMemo } from "react";
import { useVacationStore, type Vacation, type VacationStatus } from "@/lib/stores/vacation-store";
import { VacationCard } from "@/components/vacations/vacation-card";
import { VacationDialog } from "@/components/vacations/vacation-dialog";
import { VacationDetail } from "@/components/vacations/vacation-detail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

const TABS: { status: VacationStatus; label: string }[] = [
  { status: "idea",   label: "💡 Ideen" },
  { status: "booked", label: "✅ Gebucht" },
  { status: "done",   label: "🏁 Erlebt" },
];

export default function VacationsPage() {
  const { vacations } = useVacationStore();

  const [activeTab, setActiveTab] = useState<VacationStatus>("idea");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState<Vacation | null>(null);

  const filtered = useMemo(() => {
    let list = vacations.filter((v) => v.status === activeTab);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.destination.toLowerCase().includes(q) ||
          v.notes?.toLowerCase().includes(q)
      );
    }

    return [...list].sort(
      (a, b) => a.startDate.localeCompare(b.startDate)
    );
  }, [vacations, activeTab, search]);

  const counts = useMemo(
    () => ({
      idea:   vacations.filter((v) => v.status === "idea").length,
      booked: vacations.filter((v) => v.status === "booked").length,
      done:   vacations.filter((v) => v.status === "done").length,
    }),
    [vacations]
  );

  const EMPTY_MSG: Record<VacationStatus, { icon: string; title: string; sub: string }> = {
    idea:   { icon: "💡", title: "Noch keine Urlaubsideen", sub: "Sammle Reiseziele und plant gemeinsam den nächsten Urlaub" },
    booked: { icon: "🎫", title: "Kein gebuchter Urlaub", sub: "Sobald ihr etwas gebucht habt, erscheint es hier" },
    done:   { icon: "📸", title: "Noch keine Reisen abgeschlossen", sub: "Eure Urlaubserinnerungen erscheinen hier" },
  };

  const empty = EMPTY_MSG[activeTab];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Urlaub</h1>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Urlaub
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
        {TABS.map(({ status, label }) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeTab === status
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {counts[status] > 0 && (
              <span className="ml-1.5 text-xs opacity-60">{counts[status]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Suche */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Urlaub oder Reiseziel suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Karten-Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <span className="text-5xl">{empty.icon}</span>
          <div>
            <p className="font-semibold text-sm">{search ? "Keine Treffer" : empty.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "Anderen Suchbegriff versuchen" : empty.sub}
            </p>
          </div>
          {!search && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Urlaub hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vacation) => (
            <VacationCard
              key={vacation.id}
              vacation={vacation}
              onClick={() => setSelectedVacation(vacation)}
            />
          ))}
        </div>
      )}

      {/* Dialoge */}
      <VacationDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {selectedVacation && (
        <VacationDetail
          vacation={selectedVacation}
          open={!!selectedVacation}
          onOpenChange={(v) => { if (!v) setSelectedVacation(null); }}
          onDeleted={() => setSelectedVacation(null)}
        />
      )}
    </div>
  );
}

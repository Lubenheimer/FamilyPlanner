"use client";

import { useState } from "react";
import { useVacationStore, type Vacation } from "@/lib/stores/vacation-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { VacationDialog } from "./vacation-dialog";
import {
  MapPin, CalendarDays, Euro, Pencil, Trash2, Plus, Package,
  CheckSquare, Square, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_LABEL: Record<string, string> = {
  idea:   "💡 Idee",
  booked: "✅ Gebucht",
  done:   "🏁 Abgeschlossen",
};

const PACKING_CATEGORIES = ["Kleidung", "Dokumente", "Technik", "Pflege", "Strand", "Sonstiges"];

interface VacationDetailProps {
  vacation: Vacation;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted: () => void;
}

export function VacationDetail({ vacation, open, onOpenChange, onDeleted }: VacationDetailProps) {
  const {
    deleteVacation,
    addPackingItem,
    togglePackingItem,
    deletePackingItem,
    addPackingTemplate,
    addDayPlan,
    updateDayPlan,
    deleteDayPlan,
  } = useVacationStore();
  const { members } = useFamilyStore();

  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "packing" | "days">("info");

  // Packliste
  const [newPackName, setNewPackName] = useState("");
  const [newPackCategory, setNewPackCategory] = useState("Sonstiges");

  // Tagesplanung
  const [newDayDate, setNewDayDate] = useState("");
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayActivities, setNewDayActivities] = useState("");
  const [editingDayId, setEditingDayId] = useState<string | null>(null);

  const getMember = (id: string) => members.find((m) => m.id === id);

  const nights = Math.max(
    0,
    Math.round(
      (new Date(vacation.endDate).getTime() - new Date(vacation.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const handleDelete = () => {
    if (!confirm(`"${vacation.title}" wirklich löschen?`)) return;
    deleteVacation(vacation.id);
    toast.success("Urlaub gelöscht");
    onOpenChange(false);
    onDeleted();
  };

  const handleAddPackingItem = () => {
    if (!newPackName.trim()) return;
    addPackingItem(vacation.id, {
      name: newPackName.trim(),
      category: newPackCategory,
      done: false,
    });
    setNewPackName("");
  };

  const handleAddDayPlan = () => {
    if (!newDayDate || !newDayActivities.trim()) return;
    addDayPlan(vacation.id, {
      date: newDayDate,
      title: newDayTitle || undefined,
      activities: newDayActivities.trim(),
    });
    setNewDayDate("");
    setNewDayTitle("");
    setNewDayActivities("");
    toast.success("Tag hinzugefügt");
  };

  // Packliste nach Kategorien gruppieren
  const packingByCategory = vacation.packingItems.reduce(
    (acc, item) => {
      const cat = item.category || "Sonstiges";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, typeof vacation.packingItems>
  );

  const sortedDayPlans = [...vacation.dayPlans].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const packedCount = vacation.packingItems.filter((p) => p.done).length;
  const totalPacking = vacation.packingItems.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2 pr-6">
              <div className="space-y-1">
                <DialogTitle className="text-lg">{vacation.title}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{STATUS_LABEL[vacation.status]}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {vacation.destination}
                  </span>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
            {(["info", "packing", "days"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  activeTab === tab
                    ? "bg-white shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "info" && "ℹ️ Info"}
                {tab === "packing" && `🎒 Packliste${totalPacking > 0 ? ` (${packedCount}/${totalPacking})` : ""}`}
                {tab === "days" && `📅 Tage${vacation.dayPlans.length > 0 ? ` (${vacation.dayPlans.length})` : ""}`}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Zeitraum */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(vacation.startDate).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                  {" – "}
                  {new Date(vacation.endDate).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
                  {" "}· {nights} Nächte
                </span>
                {vacation.budget !== undefined && (
                  <span className="flex items-center gap-1">
                    <Euro className="h-3.5 w-3.5" />
                    Budget: {vacation.budget.toLocaleString("de-DE")} €
                  </span>
                )}
              </div>

              {/* Teilnehmer */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Teilnehmer</p>
                <div className="flex flex-wrap gap-2">
                  {vacation.participants.map((id) => {
                    const m = getMember(id);
                    return m ? (
                      <div key={id} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-white" style={{ backgroundColor: m.color }}>
                        <Avatar className="h-4 w-4">
                          <AvatarFallback style={{ backgroundColor: "rgba(255,255,255,0.25)" }} className="text-white text-[8px] font-bold">
                            {m.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {m.name}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* Notizen */}
              {vacation.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Notizen</p>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {vacation.notes}
                  </p>
                </div>
              )}

              <Separator />

              {/* Aktionen */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
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
          )}

          {/* Tab: Packliste */}
          {activeTab === "packing" && (
            <div className="space-y-4">
              {/* Vorlagen */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Vorlage laden</p>
                <div className="flex flex-wrap gap-2">
                  {(["strand", "ski", "stadt"] as const).map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        addPackingTemplate(vacation.id, t);
                        toast.success(`Vorlage "${t}" geladen`);
                      }}
                      className="text-xs"
                    >
                      {t === "strand" && "🏖️ Strand"}
                      {t === "ski" && "⛷️ Ski"}
                      {t === "stadt" && "🏙️ Städtetrip"}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Neues Item */}
              <div className="flex gap-2">
                <select
                  value={newPackCategory}
                  onChange={(e) => setNewPackCategory(e.target.value)}
                  className="rounded-lg border border-input bg-white px-2 py-1.5 text-xs outline-none shrink-0"
                >
                  {PACKING_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Input
                  placeholder="Item hinzufügen…"
                  value={newPackName}
                  onChange={(e) => setNewPackName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPackingItem()}
                  className="text-sm"
                />
                <Button size="sm" onClick={handleAddPackingItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Fortschritt */}
              {totalPacking > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Eingepackt</span>
                    <span>{packedCount} / {totalPacking}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${(packedCount / totalPacking) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Packliste nach Kategorie */}
              {Object.keys(packingByCategory).length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Noch keine Items. Lade eine Vorlage oder füge eigene hinzu.
                </p>
              ) : (
                <div className="space-y-4 max-h-[340px] overflow-y-auto">
                  {Object.entries(packingByCategory).map(([category, items]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {category}
                      </p>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 group">
                            <button
                              onClick={() => togglePackingItem(vacation.id, item.id)}
                              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {item.done
                                ? <CheckSquare className="h-4 w-4 text-green-600" />
                                : <Square className="h-4 w-4" />}
                            </button>
                            <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                              {item.name}
                            </span>
                            <button
                              onClick={() => deletePackingItem(vacation.id, item.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Tagesplanung */}
          {activeTab === "days" && (
            <div className="space-y-4">
              {/* Neuen Tag hinzufügen */}
              <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
                <p className="text-xs font-semibold">Tag hinzufügen</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Datum</Label>
                    <Input
                      type="date"
                      value={newDayDate}
                      onChange={(e) => setNewDayDate(e.target.value)}
                      min={vacation.startDate}
                      max={vacation.endDate}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Titel (optional)</Label>
                    <Input
                      placeholder="Anreisetag…"
                      value={newDayTitle}
                      onChange={(e) => setNewDayTitle(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Aktivitäten / Plan *</Label>
                  <Textarea
                    placeholder="Strand, Ausflug nach…"
                    value={newDayActivities}
                    onChange={(e) => setNewDayActivities(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button size="sm" onClick={handleAddDayPlan} disabled={!newDayDate || !newDayActivities.trim()}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Hinzufügen
                </Button>
              </div>

              {/* Tagespläne */}
              {sortedDayPlans.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Noch keine Tagespläne. Füge oben einen Tag hinzu.
                </p>
              ) : (
                <div className="space-y-3 max-h-[340px] overflow-y-auto">
                  {sortedDayPlans.map((plan) => (
                    <div key={plan.id} className="rounded-xl border bg-white p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            {new Date(plan.date).toLocaleDateString("de-DE", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}
                          </p>
                          {plan.title && <p className="text-sm font-medium">{plan.title}</p>}
                        </div>
                        <button
                          onClick={() => {
                            if (!confirm("Tag löschen?")) return;
                            deleteDayPlan(vacation.id, plan.id);
                          }}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {editingDayId === plan.id ? (
                        <EditDayForm
                          plan={plan}
                          onSave={(data) => {
                            updateDayPlan(vacation.id, plan.id, data);
                            setEditingDayId(null);
                            toast.success("Tag aktualisiert");
                          }}
                          onCancel={() => setEditingDayId(null)}
                        />
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.activities}</p>
                          <button
                            onClick={() => setEditingDayId(plan.id)}
                            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" /> Bearbeiten
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VacationDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        editingVacation={vacation}
      />
    </>
  );
}

function EditDayForm({
  plan,
  onSave,
  onCancel,
}: {
  plan: { title?: string; activities: string; notes?: string };
  onSave: (data: { title?: string; activities: string; notes?: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(plan.title ?? "");
  const [activities, setActivities] = useState(plan.activities);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-sm"
      />
      <Textarea
        value={activities}
        onChange={(e) => setActivities(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({ title: title || undefined, activities })}>
          Speichern
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}

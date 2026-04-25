# FamilyPlanner — Features

## Vision
Ein zentraler Ort, an dem eine vierköpfige Familie Wochen plant, Ausflüge dokumentiert, Wünsche sammelt und externe Kalender bündelt. Mobile-first (PWA), mit Wochen-Dashboard für Tablet/Desktop.

## Kern-Prinzipien
- **Ein Familien-Space** mit mehreren Usern (Eltern + Kinder), Rollen und Farben
- **Mobile-first**, offline-fähig, installierbar (PWA)
- **Bidirektionale Integration** mit externen Kalendern
- **DSGVO-konform**, Daten verschlüsselt, eigenes Hosting möglich

---

## Implementierungsstand

### ✅ Phase 0 — Fundament (lokal-first)
- Familien-Space anlegen (Onboarding-Flow)
- Benutzerverwaltung (Eltern/Kinder) mit Rollen & Farben
- Individuelle Farbe pro Familienmitglied
- Familien-Einstellungen (Mitglieder bearbeiten, hinzufügen, entfernen)
- Aktives Mitglied wechseln (Login-Seite, kein echtes Auth)
- Mehrsprachigkeit: Deutsch
- **Offen:** Echtes Auth (Magic Link, Kind-Modus), Backend/Sync zwischen Geräten

### ✅ Phase 1 — Wochenplaner & Termine
- **Wochenansicht** mit Stunden-Grid (06:00–23:00), Jetzt-Linie
- **Monatsansicht** und **Tagesansicht**
- **Termine CRUD:** Titel, Ort, Notizen, Von–Bis, Ganztägig, Teilnehmer, Farbe pro Person
- **Drag & Drop** in der Wochenansicht (15-Min-Snapping, Spaltenüberlappungs-Layout)
- **Wiederkehrende Termine:** Täglich / Wöchentlich (Wochentag-Auswahl, Interval) / Monatlich / Jährlich
  - Korrekte Expansion mit Limit (1825 Vorkommen = 5 Jahre täglich)
  - Visueller Indikator (↻) in Wochen- und Monatsansicht
  - Lösch-/Bearbeitungshinweis: Änderungen gelten für alle Vorkommen
- **Offen:** Erinnerungen (Web Push), Schnell-Erfassung per Sprache, Anhänge

### ✅ Phase 3 — Wetter-Integration
- Wetter-Icons in Wochen- und Monatsansicht (bis 14 Tage, Open-Meteo)
- Stundengenaue Prognose auf der Tagesansicht
- Termin-/Ausflug-Ortsbezug → Wetter am Zielort
- DWD BrightSky-Fallback (Deutschland)

### ✅ Phase 4 — Ausflüge: Backlog + Journal
- **Backlog / Bucket List:** Titel, Beschreibung, Ort, Kosten, Dauer, Jahreszeit-Tags, Indoor/Outdoor
- **Prio-Stimmen** pro Familienmitglied, Sortierung nach Beliebtheit
- **Filter & Suche** mit Sortierung (Votes, Datum, Name, Kosten)
- **Journal nach dem Ausflug:** Fotos (Base64), Freitext, Bewertung 1–5 ⭐ pro Person, Würden-wir-wiederholen-Flag, Ausgaben
- **Wetter-Vorschau** am geplanten Ausflugsdatum und -ort
- Status-Flow: Idee → Geplant → Erlebt

### ✅ Phase 5 — Essensplanung
- **Wochenplan** für Frühstück/Mittag/Abend (7-Tage-Grid)
- Wochennavigation (vor/zurück/heute)
- **Rezepte-Bibliothek:** Titel, Zutaten (Menge/Einheit), Zeitaufwand, Kategorie, URL, Bild, Anleitung
- **Rezeptverwaltung-Dialog:** Suche, Bearbeiten, Löschen, Rezeptlink
- **Automatische Einkaufsliste:** Zutaten-Aggregation über die Woche, Abhaken, Löschen
- **Offen:** Drag & Drop Rezept → Wochentag, Rezept-Import aus URLs

### ✅ Phase 6 — Wunschzettel
- Pro Kind eigener Wunschzettel
- Einträge mit Bild-URL, Weblink, Preis, Priorität (1–5 ⭐), Kategorien
- **Eltern-Sicht:** Status offen / reserviert (von wem) / gekauft — unsichtbar fürs Kind
- Reservieren (Name eingeben), Als gekauft markieren, Bearbeiten, Löschen
- **Offen:** Share-Link für Großeltern (read-only), URL-Metadata-Scraping

### ✅ Phase 7 — Urlaubsplanung
- **Urlaub-Entität:** Titel, Reiseziel, Zeitraum, Teilnehmer, Budget, Status (Idee/Gebucht/Abgeschlossen), Notizen
- **Status-Tabs:** 💡 Ideen / ✅ Gebucht / 🏁 Erlebt mit Suche
- **Karten-Ansicht:** Nächte-Berechnung, Teilnehmer-Avatare, Fortschrittsbalken Packliste
- **Detail-Dialog (3 Tabs):**
  - **Info:** Zeitraum, Budget, Teilnehmer, Notizen, Bearbeiten/Löschen
  - **Packliste:** Vorlagen (🏖️ Strand / ⛷️ Ski / 🏙️ Städtetrip), eigene Items, Kategorien (Kleidung, Dokumente, Technik…), Fortschrittsbalken
  - **Tagesplanung:** Tage mit Datum + Titel + Aktivitäten, inline bearbeiten/löschen

---

## Feature-Übersicht (nach Phasen) — Roadmap

### Phase 2 — Kalender-Integration *(braucht Backend/OAuth)*
- Google Calendar (OAuth, mehrere Kalender pro User)
- Outlook / Microsoft 365 (Graph API)
- Zwei-Wege-Sync optional konfigurierbar
- Live-Updates via Webhooks

### Phase 5 — Essensplanung (Reste)
- Drag & Drop Rezept → Wochentag
- Rezept-Import aus URLs (Schema.org-Parser, z.B. Chefkoch) *(braucht Server)*
- „Was war letzte Woche?" zur Abwechslung

### Phase 6 — Wunschzettel (Reste)
- Share-Link für Großeltern/Paten (read-only, Reservierung möglich) *(braucht Backend)*
- URL-Import mit automatischem Metadata-Scraping (Bild, Titel, Preis)

### Phase 8 — Nice-to-haves (offen)
- **Aufgaben/Chores** pro Kind mit Belohnungs-/Taschengeld-Tracker
- **Geburtstags- & Jahrestag-Tracker** mit Vorlauf-Erinnerungen
- **Arzt-/Impftermine** + Dokumenten-Archiv pro Kind
- **Haushaltsbuch light**: Ausgaben aus Ausflügen/Urlauben aggregiert
- **Familien-Pinnwand**: kurze Nachrichten, Bilder, Tageshighlights
- **Jahresrückblick** automatisch generiert
- **Dark Mode** & Familien-Themes
- **iCal-Export** (read-only) für externe Tools

### Phase 0 Backend *(große strategische Entscheidung)*
- Supabase (PostgreSQL + Auth + Realtime) oder Self-Hosting
- Sync zwischen Geräten (iPhone Mama, Tablet Familie, etc.)
- Echtes Auth: Magic Link für Eltern, Tablet-Modus für Kinder
- Daten-Backup & Export

---

## Datenspeicherung (aktuell)

Alle Daten liegen im **localStorage** des Browsers (Zustand + persist-Middleware):

| Store | Key |
|---|---|
| Familie / Mitglieder | `family-planner:family` |
| Kalender-Events | `family-planner:events` |
| Ausflüge | `family-planner:trips` |
| Essensplanung & Rezepte | `family-planner:meals` |
| Wunschzettel | `family-planner:wishes` |
| Urlaubsplanung | `family-planner:vacations` |
| Wetter-Cache | `family-planner:weather` |

⚠️ Kein Sync zwischen Geräten — jedes Gerät hat seinen eigenen Datenstand.

---

## Querschnitts-Features
- **Suche** über alle Entitäten
- **Benachrichtigungs-Center** (Push, E-Mail, In-App) — geplant
- **Export** der eigenen Daten (JSON/PDF) — geplant
- **Accessibility** (Tastatur, Screenreader) — geplant

---

## Out of Scope (bewusst nicht enthalten, zumindest vorerst)
- Chat/Messenger (WhatsApp reicht)
- Video-Call-Integration
- Social-Feed-Funktionen nach außen
- Volle Finanzbuchhaltung

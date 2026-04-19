# FamilyPlanner — Features

## Vision
Ein zentraler Ort, an dem eine vierköpfige Familie Wochen plant, Ausflüge dokumentiert, Wünsche sammelt und externe Kalender bündelt. Mobile-first (PWA), mit Wochen-Dashboard für Tablet/Desktop.

## Kern-Prinzipien
- **Ein Familien-Space** mit mehreren Usern (Eltern + Kinder), Rollen und Farben
- **Mobile-first**, offline-fähig, installierbar (PWA)
- **Bidirektionale Integration** mit externen Kalendern
- **DSGVO-konform**, Daten verschlüsselt, eigenes Hosting möglich

---

## Feature-Übersicht (nach Phasen)

### Phase 0 — Fundament
- Familien-Space anlegen
- Benutzerverwaltung (Eltern/Kinder) mit Rollen & Rechten
- Individuelle Farbe pro Familienmitglied
- Auth (E-Mail + Magic Link), Kinder-Modus ohne Passwort auf Familien-Tablet
- Mehrsprachigkeit (DE zuerst)

### Phase 1 — Wochenplaner & Termine (MVP)
- **Wochenansicht** mit Spalten pro Person oder gemeinsam
- **Monatsansicht** und **Tagesansicht**
- **Termine CRUD**
  - Titel, Ort, Notizen
  - Von–bis, Dauer, ganztägig
  - Teilnehmer (wer ist dabei)
  - Farbe pro Person automatisch
  - Anhänge (Bilder, PDFs)
- **Wiederkehrende Termine** (täglich, wöchentlich, monatlich, jährlich, Ausnahmen einzeln anpassbar)
- **Erinnerungen** via Web Push und/oder E-Mail, mehrere Vorlaufzeiten
- **Schnell-Erfassung** per natürlichsprachlicher Eingabe („Morgen 15 Uhr Zahnarzt Lea")
- **Drag & Drop** zum Verschieben

### Phase 2 — Kalender-Integration
- **Google Calendar** (OAuth, mehrere Kalender pro User auswählbar)
- **Outlook / Microsoft 365** (Graph API, privat + geschäftlich)
- **Zwei-Wege-Sync** optional pro Kalender konfigurierbar
- **Read-only Kalender** klar gekennzeichnet (Quelle sichtbar)
- **Konfliktlösung** mit Audit-Log
- **Live-Updates** via Webhooks, Fallback Polling

### Phase 3 — Wetter-Integration
- Wetter-Icons in Wochen-/Monatsansicht (bis 14 Tage)
- **Stundengenaue Prognose** am Termintag
- **Termin-/Ausflug-Ortsbezug** → Wetter am Zielort
- Unwetterwarnungen (wenn Provider unterstützt)
- Provider: Open-Meteo oder BrightSky (DWD)

### Phase 4 — Ausflüge: Backlog + Journal
- **Backlog / Bucket List**
  - Titel, Beschreibung, Ort (mit Karte)
  - Geschätzte Kosten, Dauer, Jahreszeit-Tags
  - Indoor/Outdoor, Mit-/Ohne-Kinder
  - Prio-Stimmen pro Familienmitglied
  - Filter & Suche
- **Planung** aus Backlog → Termin mit Wetter-Check
- **Packlisten-Vorlagen** (Wandern, Zoo, Schwimmbad …)
- **Journal nach dem Ausflug**
  - Fotos
  - Freitext
  - Bewertung 1–5 ⭐ pro Person
  - „Würden wir wiederholen?"-Flag
  - Erfasste Ausgaben
- **Rückblicke**: Timeline, Karten-Ansicht, „Was haben wir letzten Sommer gemacht?"

### Phase 5 — Essensplanung
- **Wochenplan** für Frühstück/Mittag/Abend
- **Rezepte-Bibliothek**
  - Zutaten, Mengen, Zeitaufwand, Kategorie
  - Bild, Notizen, Favoriten
- **Drag & Drop** Rezept → Wochentag
- **Automatische Einkaufsliste** (Zutaten-Aggregation über die Woche)
- **Rezept-Import** aus URLs (Schema.org-Parser, z. B. Chefkoch)
- „Was war letzte Woche?" zur Abwechslung

### Phase 6 — Wunschzettel
- Pro Kind eigener Wunschzettel
- Einträge mit Bild, URL, Preis, Priorität
- Kategorien (Geburtstag, Weihnachten, spontan)
- **Eltern-Sicht** mit Status: offen / reserviert (von wem) / gekauft — unsichtbar fürs Kind
- **Share-Link** für Großeltern/Paten (read-only, Reservierung möglich, kein Account)
- **URL-Import** mit automatischem Metadata-Scraping (Bild, Titel, Preis)

### Phase 7 — Urlaubsplanung
- **Urlaub-Entität**: Zeitraum, Ziel, Teilnehmer, Budget, Status (Idee → gebucht → abgeschlossen)
- **Packlisten** mit Vorlagen (Strand, Ski, Städtetrip)
- **Reise-Dokumente**: PDF-Upload (Bordkarten, Hotelbestätigungen)
- **Tagesplan** pro Urlaubstag, verknüpft mit Ausflug-Journal
- **Schulferien-Overlay** nach Bundesland
- Länder-Infos (Zeitzone, Währung, Notrufnummer)

### Phase 8 — Nice-to-haves (laufend)
- **Aufgaben/Chores** pro Kind mit Belohnungs-/Taschengeld-Tracker
- **Geburtstags- & Jahrestag-Tracker** mit Vorlauf-Erinnerungen
- **Arzt-/Impftermine** + Dokumenten-Archiv pro Kind
- **Haushaltsbuch light**: Ausgaben aus Ausflügen/Urlauben aggregiert
- **Familien-Pinnwand**: kurze Nachrichten, Bilder, Tageshighlights
- **Jahresrückblick** automatisch generiert
- **Assistenz-Shortcuts** (Siri/Google Assistant): Termin per Sprache
- **Wallet-Passes** für Urlaubsdokumente
- **iCal-Export** des Familienkalenders (read-only) für externe Tools
- **Dark Mode** & Familien-Themes

---

## Querschnitts-Features
- **Suche** über alle Entitäten
- **Benachrichtigungs-Center** (Push, E-Mail, In-App)
- **Audit-Log** (wer hat was geändert)
- **Export** der eigenen Daten (JSON/PDF)
- **Backup & Restore**
- **Accessibility** (Tastatur, Screenreader)

---

## Out of Scope (bewusst nicht enthalten, zumindest vorerst)
- Chat/Messenger (WhatsApp reicht)
- Video-Call-Integration
- Social-Feed-Funktionen nach außen
- Volle Finanzbuchhaltung

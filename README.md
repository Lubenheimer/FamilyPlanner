# FamilyPlanner

Euer gemeinsamer Familienplaner — Kalender, Ausflüge, Essen, Wünsche und mehr.

## Tech-Stack

- **Next.js 15** (App Router, RSC, TypeScript strict)
- **Auth.js v5** — Magic Link via Resend (kein Passwort nötig)
- **Drizzle ORM** auf PostgreSQL (Supabase)
- **tRPC v11** + TanStack Query — typsichere API
- **shadcn/ui** (Base UI) + Tailwind v4

## Lokale Entwicklung

### Voraussetzungen

- Node.js 20+
- PostgreSQL-Datenbank (Supabase kostenlos: https://supabase.com)
- Resend-Account für Magic-Link-E-Mails (https://resend.com)

### Setup

1. **Abhängigkeiten installieren**

   ```bash
   npm install
   ```

2. **Umgebungsvariablen anlegen**

   ```bash
   cp .env.example .env.local
   ```

   Dann `.env.local` mit deinen Werten befüllen (DB-URL, Auth-Secret, Resend-Key).

3. **Datenbank-Schema anlegen**

   ```bash
   # Schema direkt pushen (Entwicklung):
   npm run db:push

   # Oder Migrations generieren und anwenden:
   npm run db:generate
   npm run db:migrate
   ```

4. **Dev-Server starten**

   ```bash
   npm run dev
   ```

   App läuft auf http://localhost:3000

5. **Optional: Drizzle Studio** (DB-Browser im Browser)

   ```bash
   npm run db:studio
   ```

### Erster Start

1. http://localhost:3000 öffnen → du wirst zu `/login` weitergeleitet
2. E-Mail-Adresse eingeben → Magic Link per Mail
3. Link klicken → Onboarding: Familie & Mitglieder anlegen
4. Du landest im Wochenplaner (`/week`)

## Scripts

| Script | Beschreibung |
|---|---|
| `npm run dev` | Dev-Server starten |
| `npm run build` | Produktions-Build |
| `npm run lint` | ESLint |
| `npm test` | Vitest Unit-Tests |
| `npm run db:push` | Schema direkt auf DB pushen |
| `npm run db:generate` | Migrations generieren |
| `npm run db:migrate` | Migrations anwenden |
| `npm run db:studio` | Drizzle Studio öffnen |

## Projektstruktur

```
app/
  (auth)/login        # Login & Magic-Link-Verify
  (app)/              # Geschützte App-Bereiche (benötigt Auth + Familie)
    week/             # Wochenansicht (Phase 1)
    month/            # Monatsansicht (Phase 1)
    settings/family/  # Familienmitglieder verwalten
  api/
    trpc/[trpc]/      # tRPC Endpunkt
    auth/[...nextauth]/ # Auth.js Handler
components/
  auth/               # Login-Formular
  onboarding/         # Familien-Setup
  layout/             # App-Navigation
  settings/           # Familien-Einstellungen
  ui/                 # shadcn/ui Komponenten
lib/
  db/                 # Drizzle Client + vollständiges Schema
  auth/               # Auth.js Konfiguration + Type-Augmentation
  trpc/               # tRPC Router + Client-Konfiguration
```

## Entwicklungs-Phasen

Siehe [Features.md](./Features.md) für den vollständigen Feature-Plan und [techspec.md](./techspec.md) für die technische Spezifikation.

- [x] **Phase 0** — Fundament (Auth, Familie, User-Verwaltung) ← *aktuell*
- [ ] **Phase 1** — Wochenplaner & Termine
- [ ] **Phase 2** — Google/Outlook-Kalender-Sync
- [ ] **Phase 3** — Wetter-Integration
- [ ] **Phase 4** — Ausflüge & Journal
- [ ] **Phase 5** — Essensplanung
- [ ] **Phase 6** — Wunschzettel
- [ ] **Phase 7** — Urlaubsplanung

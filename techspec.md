# FamilyPlanner — Technische Spezifikation

## 1. Architektur-Überblick

```
┌────────────────────────────────────────────────────────┐
│                  Client (PWA)                          │
│   Next.js 15 App Router · React · Tailwind · shadcn    │
│   TanStack Query · Zustand · Service Worker (offline)  │
└─────────────┬──────────────────────────────────────────┘
              │ tRPC (typsicher) / REST für Webhooks
┌─────────────▼──────────────────────────────────────────┐
│                 Backend (Next.js)                      │
│   Route Handlers · tRPC Router · Auth.js · Drizzle     │
│   Jobs: Cron (Vercel), Queue (Upstash Qstash)          │
└──┬──────────────┬──────────────┬──────────────┬────────┘
   │              │              │              │
   ▼              ▼              ▼              ▼
Postgres     Object Storage  Google / MS    Open-Meteo /
(Supabase)   (Supabase/R2)   Graph APIs     BrightSky
```

- **Monorepo** mit einer Next.js-App (kein Turborepo nötig am Anfang).
- **Deployment**: Vercel (App) + Supabase (DB/Storage/Auth-Fallback).
- **PWA**: installierbar, Offline-Cache via next-pwa / Serwist.

---

## 2. Tech-Stack (final)

| Layer | Wahl | Alternative |
|---|---|---|
| Framework | Next.js 15 (App Router, RSC) | Remix |
| Sprache | TypeScript (strict) | — |
| UI | Tailwind + shadcn/ui + Radix Primitives | Mantine |
| State | TanStack Query + Zustand | Redux Toolkit |
| API | tRPC v11 | Hono + REST |
| Forms | React Hook Form + Zod | — |
| DB | PostgreSQL 16 (Supabase) | Neon |
| ORM | Drizzle ORM | Prisma |
| Auth | Auth.js v5 + Magic Link | Clerk |
| Storage | Supabase Storage | Cloudflare R2 |
| Jobs/Cron | Vercel Cron + Upstash QStash | Trigger.dev |
| Push | Web Push API (VAPID) | Firebase Cloud Messaging |
| Mail | Resend | Postmark |
| Logging | Axiom oder Logtail | Better Stack |
| Error | Sentry | — |
| Testing | Vitest, Playwright | Jest, Cypress |

---

## 3. Datenmodell (Drizzle-Schema, vereinfacht)

```ts
families        (id, name, createdAt)
users           (id, familyId, name, email, role: 'parent'|'child',
                 color, birthdate, avatar, pushSubscription)
sessions        (…Auth.js standard…)

events          (id, familyId, title, description, location, geo,
                 startsAt, endsAt, allDay, rrule, exdates jsonb,
                 colorOverride, source: 'local'|'google'|'outlook',
                 externalId, externalEtag, calendarLinkId,
                 createdBy, updatedAt)
event_attendees (eventId, userId, status: 'yes'|'no'|'maybe')
event_reminders (eventId, userId, offsetMinutes, channel: 'push'|'email')

calendar_links  (id, userId, provider: 'google'|'microsoft',
                 accessTokenEnc, refreshTokenEnc, expiresAt,
                 calendarId, syncToken, channelId, channelExpiry,
                 syncDirection: 'read'|'write'|'both',
                 writeBackCalendarId, lastSyncAt)

trips           (id, familyId, status: 'idea'|'planned'|'done',
                 title, description, location, geo, plannedDate,
                 estCost, tags text[], season, indoorOutdoor,
                 createdBy)
trip_votes      (tripId, userId, weight)
trip_entries    (id, tripId, date, text, cost, ratingByUser jsonb,
                 repeat: bool, photos text[])

vacations       (id, familyId, from, to, destination, geo, budget,
                 status: 'idea'|'booked'|'done')
vacation_docs   (id, vacationId, filename, url, type)
vacation_days   (id, vacationId, date, plan text, tripEntryId?)

meals           (id, familyId, date, slot: 'breakfast'|'lunch'|'dinner',
                 recipeId?, note)
recipes         (id, familyId, title, url, imageUrl, timeMinutes,
                 category, instructions)
recipe_items    (id, recipeId, name, qty, unit)
shopping_items  (id, familyId, name, qty, unit, done, fromMealId?,
                 fromRecipeItemId?)

wishes          (id, childId, title, url, imageUrl, price, priority,
                 category, status: 'open'|'reserved'|'gifted',
                 reservedBy text, visibleToChild bool default true)
wish_share_links(id, childId, token, expiresAt)

weather_cache   (id, geohash, date, provider, payload jsonb, fetchedAt)

notifications   (id, userId, title, body, dataJson, channel,
                 sentAt, readAt)

audit_log       (id, familyId, userId, entity, entityId, action,
                 diff jsonb, at)
```

Indizes u. a. auf `(familyId, startsAt)`, `(userId, expiresAt)` für Tokens, `(geohash, date)`.

---

## 4. Sicherheit & Privacy

- **TLS everywhere**, HSTS aktiv.
- **Row-Level-Security** auf Postgres: Zugriff nur auf eigene `familyId`.
- **Token-Verschlüsselung** (Kalender OAuth) mit AES-256-GCM; Key im Secret-Store (Vercel/Supabase Secrets).
- **Auth**: Magic Link (keine Passwörter), Session-Cookies `HttpOnly`, `SameSite=Lax`.
- **Kinder-Accounts**: per E-Mail eines Elternteils angelegt, optional „Familien-Tablet-Modus" mit eingeschränkter Session.
- **CSP** strikt, CSRF-Token auf Mutationen.
- **DSGVO**: Daten-Export (JSON + PDF), Recht auf Löschung vollständig implementiert, Hosting in EU (Vercel FRA + Supabase EU-Region).
- **Audit-Log** für alle Mutationen.
- **Backups**: tägliche Supabase-Backups, zusätzlich wöchentlicher Off-Site-Dump (verschlüsselt).

---

## 5. Kalender-Integrationen

### 5.1 Google Calendar
- OAuth 2.0, Scope `https://www.googleapis.com/auth/calendar.events`.
- **Initial Sync**: `events.list` mit `singleEvents=true` bei Bedarf oder Serien belassen (RRULE) → wir behalten Serien, expandieren clientseitig.
- **Incremental Sync**: `syncToken` persistieren; bei `410 Gone` Full-Resync.
- **Push Notifications** (Watch Channel) → Webhook `/api/webhooks/google`; Channels laufen max. 7 Tage, täglicher Cron erneuert.
- **Write-Back**: eigene Termine → ein dedizierter Kalender „FamilyPlanner" (damit wir bei Löschung eigener Termine keine fremden treffen).

### 5.2 Microsoft Graph (Outlook / M365)
- OAuth 2.0, Scope `Calendars.ReadWrite`, `offline_access`.
- **Delta Query** (`/me/calendarView/delta`) für Inkremente.
- **Subscriptions** auf `/me/events`, Webhook `/api/webhooks/microsoft`, Erneuerung alle ≤ 3 Tage (Cron).
- Für **private Konten** und **Org-Konten** separate App-Registrierungen/Multi-Tenant-Konfiguration testen.

### 5.3 Konfliktauflösung
- Beim Sync: Vergleich `externalEtag`; lokaler Änderungsvorsprung wird behalten, externe Änderung nur ins Audit-Log.
- Bei Konflikt → UI-Badge „Konflikt", User entscheidet.
- **Idempotenz** über `(provider, externalId)`-Unique-Constraint.

### 5.4 Zeitzone/RRULE
- Alles in UTC speichern, mit `tzid` pro Event (IANA).
- RRULE nach RFC 5545 (Library: `rrule` oder `tzdata` + eigene Expansion).

---

## 6. Wetter-Integration

- **Open-Meteo** (kein Key) als Default, **BrightSky** (DWD) für DE-Qualität.
- **Caching**: `(geohash5, date, provider)` mit TTL 30 min für aktuelle Tage, 6 h für >2 Tage.
- **Geocoding** via Open-Meteo Geocoder oder Nominatim (OSM), mit respektvollem Rate-Limit.
- Wetter nur laden, wenn Termin/Ausflug einen Ort hat.

---

## 7. API / tRPC Struktur (Auszug)

```
appRouter
├── family.create / invite / removeMember
├── user.me / update / setPushSubscription
├── event.list(range, userIds?) / create / update / delete / expand
├── calendar.link(provider) / unlink / list / sync
├── trip.backlog.list / create / vote / plan(fromBacklogId, date)
├── trip.journal.upsert / addPhotos / rate
├── vacation.create / update / upload / dayPlan
├── meal.week.get(weekStart) / setSlot / autoShoppingList
├── recipe.list / create / importFromUrl
├── wish.list(childId) / create / reserve(token, reservedBy)
├── weather.forPoint(geo, range)
├── notification.list / markRead
└── webhook handlers live under /api/webhooks/* (REST, signed)
```

---

## 8. Frontend-Struktur

```
app/
  (auth)/login
  (app)/
    week/           # Hauptansicht
    month/
    day/[date]
    trips/
      backlog/
      planned/
      journal/[id]
    meals/
      week/
      recipes/
    wishes/
      [childId]
    vacations/[id]
    settings/
      integrations/
      family/
  api/
    trpc/[trpc]/
    webhooks/google/
    webhooks/microsoft/
    cron/refresh-subscriptions/
    share/wishes/[token]/
components/
  calendar/ (WeekGrid, EventPill, RRuleEditor)
  trips/, meals/, wishes/, weather/, ui/ (shadcn)
lib/
  calendar/ (google, microsoft, rrule, merge)
  weather/
  auth/
  db/ (schema, client)
  push/
```

- **State**: Server-State in TanStack Query, UI-State in Zustand.
- **Optimistic Updates** für Event-Drag&Drop.
- **Virtual Scroll** in der Wochenansicht bei vielen Events.

---

## 9. Background Jobs

| Job | Frequenz | Aufgabe |
|---|---|---|
| `refreshCalendarChannels` | alle 12 h | Google Watch + MS Subscriptions erneuern |
| `pollFallbackSync` | alle 15 min | Für Links ohne aktives Webhook |
| `sendReminders` | jede Minute | Fällige Erinnerungen pushen |
| `weatherPrefetch` | stündlich | Für heute + morgen aller Events mit Ort |
| `auditRetention` | wöchentlich | Alte Audit-Logs archivieren |
| `backupOffsite` | wöchentlich | Verschlüsselter Dump in externen Bucket |

Umsetzung: Vercel Cron für kleine Jobs, Upstash QStash für Task-Queues (Retry, Dead-Letter).

---

## 10. Push-Benachrichtigungen

- **Web Push** mit VAPID-Keys, ServiceWorker `sw.js` empfängt Payloads.
- Pro User `pushSubscription` in DB (mehrere Geräte möglich → eigene Tabelle).
- Fallback auf E-Mail, wenn Push in 30 s nicht zugestellt (Akzeptanz-Receipt).

---

## 11. Offline-Strategie

- **Stale-while-revalidate** Cache für letzte 8 Wochen Events.
- **Mutation Queue** im IndexedDB: Änderungen offline → beim Reconnect syncen.
- Klarer **Offline-Indikator** im UI.

---

## 12. Qualität & DevEx

- **CI**: GitHub Actions → typecheck, lint, unit, e2e smoke, preview-deploy.
- **Testing**
  - Unit: Vitest für Lib (RRULE-Expansion, Zutaten-Aggregation, Konfliktlogik).
  - Component: Playwright Component Tests.
  - E2E: Playwright gegen Preview-Env.
- **Feature Flags** via einfacher DB-Tabelle `feature_flags(familyId, key, enabled)`.
- **Error Tracking**: Sentry, Release Health.
- **Performance Budget**: LCP < 2 s auf Mobile 4G, JS < 200 kB initial.

---

## 13. Umgebungen

| Env | Zweck | DB |
|---|---|---|
| `dev` (lokal) | Entwicklung | Docker Postgres oder Supabase Branch |
| `preview` | PR-Deploys | Supabase Branching |
| `prod` | Familienbetrieb | Supabase Free/Pro, Region EU-Central |

Secrets via Vercel Project + Supabase Vault.

---

## 14. Meilensteine & Aufwand (Schätzung, nebenberuflich)

| Phase | Kalenderwochen |
|---|---|
| 0 Fundament | 1–2 |
| 1 Termine + MVP | 2–3 |
| 2 Kalender-Sync | 2 |
| 3 Wetter | < 1 |
| 4 Ausflüge | 2–3 |
| 5 Essen | 1–2 |
| 6 Wünsche | ~1 |
| 7 Urlaub | 2 |
| 8 Extras | laufend |

**Gesamt bis "vollwertig nutzbar"**: ~10–14 Wochen.

---

## 15. Offene Punkte / Entscheidungen
- Soll der FamilyPlanner als Schreibziel **eigenen** Kalender in Google/Outlook anlegen oder in den Haupt­kalender schreiben? (Empfehlung: eigener Kalender.)
- Kinder-Login mit Magic Link an Eltern-E-Mail oder reiner Tablet-Modus?
- Hosting: Vercel + Supabase gemanagt **oder** Self-Hosting (Coolify/Hetzner) für volle Datenhoheit?
- Rezept-Import rechtlich: Caching nur der eigenen Nutzung, keine Weitergabe.

/**
 * Minimaler RRULE-Expander für die häufigsten Familien-Muster.
 * Unterstützt: DAILY, WEEKLY (BYDAY), MONTHLY, YEARLY
 * Speicherformat: vereinfachtes Objekt, kein RFC-String-Parsing nötig.
 */

export type RRuleFreq = "daily" | "weekly" | "monthly" | "yearly";

export interface RRule {
  freq: RRuleFreq;
  interval?: number;          // Standard 1
  byDay?: number[];           // 0=So,1=Mo,...,6=Sa (nur bei weekly)
  until?: string;             // ISO-Date-String YYYY-MM-DD
  count?: number;             // max. Wiederholungen
}

/** Serialisiert eine RRule zu einem kompakten JSON-String (für den Store) */
export function serializeRRule(r: RRule): string {
  return JSON.stringify(r);
}

export function parseRRule(s: string): RRule {
  return JSON.parse(s) as RRule;
}

/**
 * Generiert alle Vorkommen einer RRule als Datum-Array.
 * Bricht ab wenn until überschritten ODER maxCount erreicht.
 */
function* generateOccurrences(
  start: Date,
  rule: RRule,
  maxCount: number,
  until: Date | null
): Generator<{ date: Date; index: number }> {
  const interval = rule.interval ?? 1;
  let index = 0;

  switch (rule.freq) {
    case "daily": {
      for (let i = 0; index < maxCount; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i * interval);
        if (until && d > until) return;
        yield { date: d, index };
        index++;
      }
      break;
    }

    case "weekly": {
      if (rule.byDay && rule.byDay.length > 0) {
        /**
         * Korrekte weekly+byDay-Logik mit Interval-Unterstützung:
         * Wir arbeiten in "Wochen-Blöcken". Innerhalb jedes Blocks
         * werden alle byDay-Tage erzeugt. Dann springen wir `interval`
         * Wochen weiter zum nächsten Block.
         *
         * Der erste Block beginnt an der ISO-Woche des Starttermins.
         * Tage im ersten Block, die vor dem Startdatum liegen, werden
         * übersprungen.
         */
        const startDow = start.getDay(); // 0=So … 6=Sa

        // Wochenbeginn (Sonntag-basiert) des Starttermins
        const weekOrigin = new Date(start);
        weekOrigin.setDate(start.getDate() - startDow);
        weekOrigin.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());

        // byDay aufsteigend sortieren (So=0 … Sa=6)
        const sortedDays = [...rule.byDay].sort((a, b) => a - b);

        let weekBlock = 0;
        outer: while (index < maxCount) {
          for (const dow of sortedDays) {
            if (index >= maxCount) break outer;

            const d = new Date(weekOrigin);
            d.setDate(weekOrigin.getDate() + weekBlock * 7 * interval + dow);

            // Erste Woche: Tage vor Startdatum überspringen
            if (d < start) continue;

            if (until && d > until) return;
            yield { date: d, index };
            index++;
          }
          weekBlock++;
        }
      } else {
        for (let i = 0; index < maxCount; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i * 7 * interval);
          if (until && d > until) return;
          yield { date: d, index };
          index++;
        }
      }
      break;
    }

    case "monthly": {
      for (let i = 0; index < maxCount; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i * interval);
        if (until && d > until) return;
        yield { date: d, index };
        index++;
      }
      break;
    }

    case "yearly": {
      for (let i = 0; index < maxCount; i++) {
        const d = new Date(start);
        d.setFullYear(d.getFullYear() + i * interval);
        if (until && d > until) return;
        yield { date: d, index };
        index++;
      }
      break;
    }
  }
}

/**
 * Expandiert ein wiederkehrendes Event in Einzeltermine innerhalb [rangeStart, rangeEnd].
 * Gibt virtuelle Kopien zurück (gleiche id + Suffix, verschobene Zeiten).
 */
export function expandRecurring<T extends {
  id: string;
  startsAt: string;
  endsAt: string;
  rrule?: string;
}>(event: T, rangeStart: Date, rangeEnd: Date): T[] {
  if (!event.rrule) return [event];

  const rule = parseRRule(event.rrule);
  const origStart = new Date(event.startsAt);
  const origEnd   = new Date(event.endsAt);
  const duration  = origEnd.getTime() - origStart.getTime();

  // until-Datum inklusive (bis Tagesende)
  const until = rule.until ? new Date(rule.until + "T23:59:59") : null;

  // Sicherheitslimit: ohne explizites count maximal 1825 Vorkommen (5 Jahre täglich)
  const maxCount = rule.count ?? 1825;

  const results: T[] = [];

  for (const { date, index } of generateOccurrences(origStart, rule, maxCount, until)) {
    // Sobald Vorkommen nach rangeEnd beginnt → fertig
    if (date > rangeEnd) break;

    const occEnd = new Date(date.getTime() + duration);
    // Nur ausgeben wenn das Vorkommen den Bereich [rangeStart, rangeEnd] überlappt
    if (occEnd >= rangeStart) {
      results.push({
        ...event,
        id: `${event.id}_${index}`,
        startsAt: date.toISOString(),
        endsAt:   occEnd.toISOString(),
      });
    }
  }

  return results;
}

/** Menschenlesbare Beschreibung einer RRule auf Deutsch */
export function describeRRule(r: RRule): string {
  const DE_DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  const interval = r.interval ?? 1;

  switch (r.freq) {
    case "daily":
      return interval === 1 ? "Täglich" : `Alle ${interval} Tage`;
    case "weekly": {
      const days = r.byDay?.map((d) => DE_DAYS[d]).join(", ");
      const base = interval === 1 ? "Wöchentlich" : `Alle ${interval} Wochen`;
      return days ? `${base} (${days})` : base;
    }
    case "monthly":
      return interval === 1 ? "Monatlich" : `Alle ${interval} Monate`;
    case "yearly":
      return "Jährlich";
    default:
      return "Wiederkehrend";
  }
}

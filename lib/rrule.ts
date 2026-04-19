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
  const origEnd = new Date(event.endsAt);
  const duration = origEnd.getTime() - origStart.getTime();
  const interval = rule.interval ?? 1;
  const until = rule.until ? new Date(rule.until) : null;
  const maxCount = rule.count ?? 365;

  const results: T[] = [];
  let current = new Date(origStart);
  let count = 0;

  while (count < maxCount) {
    // Abbruchbedingungen
    if (until && current > until) break;
    if (current > rangeEnd) break;

    // Nur ausgeben wenn im Bereich
    const currentEnd = new Date(current.getTime() + duration);
    if (currentEnd >= rangeStart) {
      results.push({
        ...event,
        id: `${event.id}_${count}`,
        startsAt: current.toISOString(),
        endsAt: currentEnd.toISOString(),
      });
    }

    // Nächsten Termin berechnen
    const next = new Date(current);
    switch (rule.freq) {
      case "daily":
        next.setDate(next.getDate() + interval);
        break;
      case "weekly":
        if (rule.byDay && rule.byDay.length > 0) {
          // Nächsten passenden Wochentag finden
          let found = false;
          for (let d = 1; d <= 7; d++) {
            const candidate = new Date(next);
            candidate.setDate(candidate.getDate() + d);
            if (rule.byDay.includes(candidate.getDay())) {
              next.setDate(next.getDate() + d);
              found = true;
              break;
            }
          }
          if (!found) next.setDate(next.getDate() + 7 * interval);
        } else {
          next.setDate(next.getDate() + 7 * interval);
        }
        break;
      case "monthly":
        next.setMonth(next.getMonth() + interval);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + interval);
        break;
    }

    if (next <= current) break; // Endlosschleife-Schutz
    current = next;
    count++;
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

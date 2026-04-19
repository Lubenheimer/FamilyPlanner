const DE_DAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const DE_DAYS_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const DE_MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const DE_MONTHS_LONG = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day); // Woche beginnt Montag
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function addWeeks(date: Date, n: number): Date {
  return addDays(date, n * 7);
}

export function subWeeks(date: Date, n: number): Date {
  return addDays(date, -n * 7);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function formatDate(date: Date, pattern: string): string {
  return pattern
    .replace("yyyy", String(date.getFullYear()))
    .replace("yy", String(date.getFullYear()).slice(-2))
    .replace("MMMM", DE_MONTHS_LONG[date.getMonth()])
    .replace("MMM", DE_MONTHS[date.getMonth()])
    .replace("MM", String(date.getMonth() + 1).padStart(2, "0"))
    .replace("dd", String(date.getDate()).padStart(2, "0"))
    .replace("d", String(date.getDate()))
    .replace("EEEE", DE_DAYS_LONG[date.getDay()])
    .replace("EEE", DE_DAYS[date.getDay()])
    .replace("HH", String(date.getHours()).padStart(2, "0"))
    .replace("mm", String(date.getMinutes()).padStart(2, "0"));
}

export function toDatetimeLocal(date: Date): string {
  return formatDate(date, "yyyy-MM-ddTHH:mm").replace("T", "T");
}

export function fromDatetimeLocal(s: string): Date {
  return new Date(s);
}

/** Gibt die 7 Tage einer Woche zurück (Mo–So) */
export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

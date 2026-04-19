"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type CalendarView = "week" | "month" | "day";

const VIEWS: { value: CalendarView; label: string; href: string }[] = [
  { value: "day",   label: "Tag",    href: "/day" },
  { value: "week",  label: "Woche",  href: "/week" },
  { value: "month", label: "Monat",  href: "/month" },
];

export function CalendarViewToggle({ current }: { current: CalendarView }) {
  return (
    <div className="flex rounded-lg border overflow-hidden text-sm">
      {VIEWS.map(({ value, label, href }) => (
        <Link
          key={value}
          href={href}
          className={cn(
            "px-3 py-1.5 font-medium transition-colors",
            current === value
              ? "bg-indigo-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

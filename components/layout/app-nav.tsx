"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FamilyMember } from "@/lib/stores/family-store";
import { useFamilyStore } from "@/lib/stores/family-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Utensils, MapPin, Gift, Plane, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/week",      label: "Kalender", icon: Calendar },
  { href: "/meals",     label: "Essen",    icon: Utensils },
  { href: "/trips",     label: "Ausflüge", icon: MapPin },
  { href: "/wishes",    label: "Wünsche",  icon: Gift },
  { href: "/vacations", label: "Urlaub",   icon: Plane },
];

export function AppNav({ member }: { member: FamilyMember }) {
  const pathname = usePathname();
  const router = useRouter();
  const { familyName, setCurrentMember } = useFamilyStore();

  const handleSwitch = () => {
    setCurrentMember(null);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/week" className="flex items-center gap-2 font-bold text-base">
          🏠 <span className="hidden sm:inline">{familyName}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Avatar Dropdown — Base UI: kein asChild, Trigger direkt */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-9 w-9 cursor-pointer">
              <AvatarFallback
                style={{ backgroundColor: member.color, color: "white" }}
                className="text-sm font-bold"
              >
                {member.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="font-semibold">{member.name}</p>
              <p className="text-xs text-muted-foreground">
                {member.role === "parent" ? "Elternteil" : "Kind"}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/family")}>
              <Settings className="mr-2 h-4 w-4" /> Einstellungen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSwitch}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" /> Wechseln
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="flex md:hidden border-t bg-white">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
              pathname.startsWith(href) ? "text-indigo-700" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

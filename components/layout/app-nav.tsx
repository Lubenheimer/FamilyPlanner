"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/week", label: "Woche" },
  { href: "/month", label: "Monat" },
  { href: "/settings/family", label: "Einstellungen" },
];

interface AppNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    color: string;
  };
}

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();

  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/week" className="font-bold text-lg flex items-center gap-2">
            <span>🏠</span>
            <span className="hidden sm:inline">FamilyPlanner</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="sm" className="gap-2" />
            }
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback
                style={{ backgroundColor: user.color }}
                className="text-white text-xs font-semibold"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm">{user.name ?? user.email}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings/family" />}>
              Familieneinstellungen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

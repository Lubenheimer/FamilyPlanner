import type { ReactNode } from "react";

// Auth-Seiten (Login) brauchen kein AppLayout
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

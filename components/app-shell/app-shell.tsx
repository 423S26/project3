"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { SessionExpiryGuard } from "@/components/auth/session-expiry-guard";

interface AppShellProps {
  children: React.ReactNode;
}

/** Pages that should render WITHOUT the navigation shell */
const AUTH_PATHS = ["/login", "/register"];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Check browser-side session expiry (Remember me) */}
      <SessionExpiryGuard />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="container mx-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

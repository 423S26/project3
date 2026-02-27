/**
 * AppShell - Top-level layout wrapper rendered by RootLayout.
 *
 * Provides the responsive navigation chrome around every page:
 * - On large screens (lg+): a fixed 256px sidebar on the left.
 * - On smaller screens: a collapsible mobile navigation drawer.
 *
 * The main content area is offset to the right of the sidebar on desktop
 * (via `lg:pl-64`) and uses a centered container with responsive padding.
 *
 * @see {@link Sidebar}   for the desktop navigation panel
 * @see {@link MobileNav} for the mobile header + slide-out drawer
 */

"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { SessionExpiryGuard } from "@/components/auth/session-expiry-guard";

/** Props accepted by the AppShell component. */
interface AppShellProps {
  /** Page content rendered by the current Next.js route. */
  children: React.ReactNode;
}

/** Pages that should render WITHOUT the navigation shell */
const AUTH_PATHS = ["/login", "/register", "/landing"];

/**
 * Renders the application shell: sidebar, mobile nav, and the main content area.
 *
 * @param children - The active route's page component.
 */
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

      {/* Desktop Sidebar - visible only at lg breakpoint and above */}
      <Sidebar />

      {/* Mobile Navigation - visible only below lg breakpoint */}
      <MobileNav />

      {/* Main Content - left-padded on desktop to clear the fixed sidebar */}
      <main className="lg:pl-64">
        <div className="container mx-auto p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

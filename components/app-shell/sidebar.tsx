/**
 * Sidebar - Fixed desktop navigation panel (visible at the lg breakpoint and above).
 *
 * Renders the Anchor logo, role-specific navigation, and user menu.
 * - Athletes: standard tab navigation + dashboard
 * - Psychologists: caseload athlete list + dashboard link
 * Hidden on mobile via `hidden lg:flex`; on small screens the MobileNav
 * component provides an equivalent slide-out drawer instead.
 */

"use client";

import {
  Home,
  MessageSquare,
  Brain,
  Activity,
  ClipboardList,
  Settings,
  Anchor,
  Users,
} from "lucide-react";
import { NavLink } from "./nav-link";
import { UserMenu } from "@/components/auth/user-menu";
import { CaseloadList } from "@/components/psychologist/caseload-list";
import { useSession } from "@/components/auth/session-provider";

/**
 * Athlete navigation items.
 */
const athleteNavItems = [
  { href: "/", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
  { href: "/sessions", label: "Sessions", icon: <MessageSquare className="h-5 w-5" /> },
  { href: "/psychological-state", label: "Psychological State", icon: <Brain className="h-5 w-5" /> },
  { href: "/physical-state", label: "Physical State", icon: <Activity className="h-5 w-5" /> },
  { href: "/assessments", label: "Assessments", icon: <ClipboardList className="h-5 w-5" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

/**
 * Psychologist navigation items.
 */
const psychologistNavItems = [
  { href: "/psychologist", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
  { href: "/psychologist/athletes", label: "Athletes", icon: <Users className="h-5 w-5" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

/** Desktop sidebar with logo, nav links, and user menu. */
export function Sidebar() {
  const { user, loading } = useSession();
  const isPsychologist = user?.role === "PSYCHOLOGIST";
  const navItems = isPsychologist ? psychologistNavItems : athleteNavItems;

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-card lg:flex">
      {/* Logo / brand mark */}
      <div className="flex h-16 items-center justify-center gap-2 border-b px-6">
        <Anchor className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Anchor</span>
      </div>

      {/* Psychologist: Caseload List | Athlete: Nothing here */}
      {!loading && isPsychologist && (
        <div className="border-b">
          <CaseloadList />
        </div>
      )}

      {/* Primary navigation links - wait for session so role-specific tabs don't flash */}
      <nav className="flex-1 space-y-1 p-4">
        {loading ? (
          <div className="rounded-lg px-3 py-2 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          navItems.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon}>
              {item.label}
            </NavLink>
          ))
        )}
      </nav>

      {/* Footer - user menu */}
      <div className="border-t p-4">
        <UserMenu />
      </div>
    </aside>
  );
}

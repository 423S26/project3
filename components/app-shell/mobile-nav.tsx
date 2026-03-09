/**
 * MobileNav - Responsive navigation for small screens (below the lg breakpoint).
 *
 * Role-aware navigation:
 * - Athletes: standard tab navigation
 * - Psychologists: caseload list + dashboard link
 *
 * Consists of three pieces:
 *   1. A sticky header bar with the Anchor logo and a hamburger/close toggle.
 *   2. A semi-transparent backdrop overlay that closes the drawer on tap.
 *   3. A slide-out navigation panel (same 256px width as the desktop sidebar)
 *      that animates in from the left via CSS transform.
 */

"use client";

import { useState } from "react";
import {
  Home,
  MessageSquare,
  Brain,
  Activity,
  ClipboardList,
  Anchor,
  Users,
  Mail,
  Menu,
  X,
  CalendarDays,
} from "lucide-react";
import { NavLink } from "./nav-link";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { UnreadBadge } from "@/components/messages/unread-badge";
import { useSession } from "@/components/auth/session-provider";

/**
 * Athlete navigation items.
 */
const athleteNavItems = [
  { href: "/", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
  { href: "/messages", label: "Messages", icon: <Mail className="h-5 w-5" /> },
  { href: "/sessions", label: "Sessions", icon: <MessageSquare className="h-5 w-5" /> },
  { href: "/psychological-state", label: "Psychological State", icon: <Brain className="h-5 w-5" /> },
  { href: "/physical-state", label: "Physical State", icon: <Activity className="h-5 w-5" /> },
  { href: "/assessments", label: "Assessments", icon: <ClipboardList className="h-5 w-5" /> },
];

/**
 * Psychologist navigation items.
 */
const psychologistNavItems = [
  { href: "/psychologist", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
  { href: "/messages", label: "Messages", icon: <Mail className="h-5 w-5" /> },
  { href: "/psychologist/athletes", label: "Athletes", icon: <Users className="h-5 w-5" /> },
  { href: "/psychologist/sessions", label: "Sessions", icon: <CalendarDays className="h-5 w-5" /> },
];

/** Mobile header bar + slide-out navigation drawer. Hidden on lg+ screens. */
export function MobileNav() {
  const { user, loading } = useSession();
  const isPsychologist = user?.role === "PSYCHOLOGIST";
  const navItems = isPsychologist ? psychologistNavItems : athleteNavItems;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Sticky header with logo and hamburger toggle (visible < lg only) */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Anchor className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Anchor</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {/* Backdrop overlay - closes the drawer when tapped */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out navigation panel (translates in from the left) */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-lg transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-center gap-2 border-b px-6">
          <Anchor className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Anchor</span>
        </div>
        
        <div className="space-y-1 p-4">
          {loading ? (
            <div className="rounded-lg px-3 py-2 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                className="w-full"
              >
                <span onClick={() => setIsOpen(false)}>{item.label}</span>
                {item.href === "/messages" && <UnreadBadge />}
              </NavLink>
            ))
          )}
        </div>
        <div className="border-t p-4">
          <UserMenu />
        </div>
      </nav>
    </>
  );
}

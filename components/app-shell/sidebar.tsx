/**
 * Sidebar - Fixed desktop navigation panel (visible at the lg breakpoint and above).
 *
 * Renders the Anchor logo, the primary navigation links, and a sprint footer.
 * Hidden on mobile via `hidden lg:flex`; on small screens the MobileNav
 * component provides an equivalent slide-out drawer instead.
 *
 * NOTE: `navItems` is defined locally here (and duplicated in mobile-nav.tsx).
 * If the navigation structure changes, both arrays must be updated in sync.
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
} from "lucide-react";
import { NavLink } from "./nav-link";
import { UserMenu } from "@/components/auth/user-menu";
import { AthleteSwitcher } from "@/components/auth/athlete-switcher";

/**
 * Navigation items rendered in the sidebar.
 * Each entry maps a route (`href`) to a human-readable label and Lucide icon.
 */
const navItems = [
  { href: "/", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
  { href: "/sessions", label: "Sessions", icon: <MessageSquare className="h-5 w-5" /> },
  { href: "/psychological-state", label: "Psychological State", icon: <Brain className="h-5 w-5" /> },
  { href: "/physical-state", label: "Physical State", icon: <Activity className="h-5 w-5" /> },
  { href: "/assessments", label: "Assessments", icon: <ClipboardList className="h-5 w-5" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

/** Desktop sidebar with logo, nav links, and sprint footer. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-card lg:flex">
      {/* Logo / brand mark */}
      <div className="flex h-16 items-center justify-center gap-2 border-b px-6">
        <Anchor className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Anchor</span>
      </div>

      {/* Athlete Switcher (psychologist only) */}
      <div className="border-b px-4 py-3">
        <AthleteSwitcher />
      </div>

      {/* Primary navigation links */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer - displays the current sprint / course identifier */}
      <div className="border-t p-4">
        <UserMenu />
      </div>
    </aside>
  );
}

"use client";

import {
  Home,
  Calendar,
  Heart,
  DollarSign,
  Settings,
  Anchor,
} from "lucide-react";
import { NavLink } from "./nav-link";

const navItems = [
  { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { href: "/schedule", label: "Schedule", icon: <Calendar className="h-5 w-5" /> },
  { href: "/health", label: "Health", icon: <Heart className="h-5 w-5" /> },
  { href: "/finance", label: "Finance", icon: <DollarSign className="h-5 w-5" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-card lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Anchor className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Anchor</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground">
          Sprint 1 - ESOF 423
        </p>
      </div>
    </aside>
  );
}

"use client";

import { useState } from "react";
import {
  Home,
  Calendar,
  Heart,
  DollarSign,
  Settings,
  Anchor,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "./nav-link";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: <Home className="h-5 w-5" /> },
  { href: "/schedule", label: "Schedule", icon: <Calendar className="h-5 w-5" /> },
  { href: "/health", label: "Health", icon: <Heart className="h-5 w-5" /> },
  { href: "/finance", label: "Finance", icon: <DollarSign className="h-5 w-5" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
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

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Navigation Panel */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card shadow-lg transition-transform duration-200 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Anchor className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Anchor</span>
        </div>
        <div className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              className="w-full"
            >
              <span onClick={() => setIsOpen(false)}>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}

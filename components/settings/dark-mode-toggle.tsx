"use client";

import { useTheme } from "@/components/theme-provider";
import { Sun, Moon } from "lucide-react";

export function DarkModeToggle() {
  const { dark, toggleDark } = useTheme();

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Dark Mode</p>
        <p className="text-sm text-muted-foreground">
          Toggle dark theme for the app
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        onClick={toggleDark}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          dark ? "bg-primary" : "bg-input"
        }`}
      >
        <span
          className={`pointer-events-none flex h-5 w-5 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-transform ${
            dark ? "translate-x-5" : "translate-x-0.5"
          }`}
        >
          {dark ? (
            <Moon className="h-3 w-3 text-primary" />
          ) : (
            <Sun className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
      </button>
    </div>
  );
}

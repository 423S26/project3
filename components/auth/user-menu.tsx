"use client";

import { useState } from "react";
import { useSession } from "./session-provider";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export function UserMenu() {
  const { user, supabase } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const roleLabel = user.role === "PSYCHOLOGIST" ? "Psychologist" : "Athlete";

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      // Full page redirect so server sees cleared cookies and nav doesn't flicker
      window.location.href = "/login";
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        <LogOut className="mr-2 h-3.5 w-3.5" />
        {signingOut ? "Signing out…" : "Sign Out"}
      </Button>
    </div>
  );
}

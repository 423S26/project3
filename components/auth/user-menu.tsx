"use client";

import { useSession } from "./session-provider";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const { user, supabase } = useSession();
  const router = useRouter();

  if (!user) return null;

  const roleLabel = user.role === "PSYCHOLOGIST" ? "Psychologist" : "Athlete";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
      >
        <LogOut className="mr-2 h-3.5 w-3.5" />
        Sign Out
      </Button>
    </div>
  );
}

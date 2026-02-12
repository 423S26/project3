"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/browser";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Public types ─────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string; // "ATHLETE" | "PSYCHOLOGIST"
}

interface SessionContextValue {
  /** The authenticated user's profile, or null. */
  user: UserProfile | null;
  /** True while the initial auth check is in progress. */
  loading: boolean;
  /** The shared Supabase browser client. */
  supabase: SupabaseClient;
  /** Force a profile re-fetch (e.g. after profile update). */
  refreshProfile: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /** Fetch the profile row for a given auth uid. */
  const loadProfile = useCallback(
    async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, name, role")
        .eq("id", uid)
        .single();
      if (data) {
        setUser(data as UserProfile);
      } else {
        setUser(null);
      }
    },
    [supabase]
  );

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (authUser) {
      await loadProfile(authUser.id);
    }
  }, [supabase, loadProfile]);

  useEffect(() => {
    // 1. Check the current session on mount
    const init = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (authUser) {
        await loadProfile(authUser.id);
      }
      setLoading(false);
    };
    init();

    // 2. Listen for sign-in / sign-out events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadProfile]);

  return (
    <SessionContext.Provider value={{ user, loading, supabase, refreshProfile }}>
      {children}
    </SessionContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Access the current user profile + loading state.
 * Must be called inside <SessionProvider>.
 */
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}

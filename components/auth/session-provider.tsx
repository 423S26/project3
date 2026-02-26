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

  /** Fetch the profile row for a given auth uid. Falls back to auth user if profile missing. */
  const loadProfile = useCallback(
    async (uid: string, authUser?: { id: string; email?: string; user_metadata?: Record<string, unknown> }) => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, name, role")
        .eq("id", uid)
        .single();
      if (data) {
        setUser(data as UserProfile);
      } else if (authUser) {
        // Profile missing (e.g. RLS or timing) — keep menu visible with fallback so sign out works
        setUser({
          id: authUser.id,
          email: authUser.email ?? "",
          name: (authUser.user_metadata?.name as string) ?? "User",
          role: "ATHLETE",
        });
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
      await loadProfile(authUser.id, authUser);
    } else {
      setUser(null);
    }
  }, [supabase, loadProfile]);

  useEffect(() => {
    const init = async () => {
      // 1. Fast path: getSession() reads from local storage (instant, no network).
      //    Use it to render the UI immediately with the correct role.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id, session.user);
      }
      setLoading(false);

      // 2. Slow path: getUser() validates the token with Supabase (network call).
      //    If the token is expired or invalid, clear the user.
      const {
        data: { user: verifiedUser },
      } = await supabase.auth.getUser();
      if (verifiedUser) {
        await loadProfile(verifiedUser.id, verifiedUser);
      } else if (!session?.user) {
        setUser(null);
      }
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id, session.user);
      } else if (event === "SIGNED_OUT") {
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

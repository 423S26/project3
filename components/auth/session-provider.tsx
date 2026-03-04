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
      // Fast path: getSession() reads from localStorage — instant, no network.
      // We clear loading immediately after this so the UI is never stuck behind a network call.
      let sessionUserId: string | null = null;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        sessionUserId = session?.user?.id ?? null;
        if (session?.user) {
          void loadProfile(session.user.id, session.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        // Always clear loading after the fast path, regardless of any error.
        setLoading(false);
      }

      // Slow path: getUser() validates/refreshes the token with Supabase over the network.
      // Runs entirely in the background — loading is already false, so the UI is never blocked.
      try {
        const {
          data: { user: verifiedUser },
        } = await supabase.auth.getUser();
        if (verifiedUser) {
          void loadProfile(verifiedUser.id, verifiedUser);
        } else if (!sessionUserId) {
          // Token was invalid and there was no local session either — clear the user.
          setUser(null);
        }
      } catch {
        // Silently ignore — the fast path result stands.
      }
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          void loadProfile(session.user.id, session.user);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
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

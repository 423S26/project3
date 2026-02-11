"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

const AUTH_EXPIRES_KEY = "anchor-auth-expiresAt";

/**
 * Lightweight guard that checks `localStorage.anchor-auth-expiresAt`.
 * If the expiry timestamp is in the past and there is an active session,
 * the user is automatically signed out and redirected to /login.
 *
 * This component renders nothing; mount it inside the authenticated
 * app shell so it runs on every page navigation.
 */
export function SessionExpiryGuard() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    const raw = localStorage.getItem(AUTH_EXPIRES_KEY);
    if (!raw) return; // No expiry set (legacy sessions) — leave them alone

    const expiresAt = Number(raw);
    if (Number.isNaN(expiresAt)) return;

    if (Date.now() > expiresAt) {
      // Clear the key so we don't loop on redirect
      localStorage.removeItem(AUTH_EXPIRES_KEY);
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  return null;
}

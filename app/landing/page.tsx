/**
 * Route: /landing (Public Marketing Page)
 *
 * A public-facing landing page for the Anchor sports psychology platform.
 * Accessible without authentication. No app shell / sidebar rendered
 * (AppShell is bypassed via the /landing allowlist in app-shell.tsx).
 */

import type { Metadata } from "next";
import LandingClient from "./LandingClient";

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                   */
/* -------------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Anchor — Sports Psychology & Performance Tracking",
  description:
    "Track what matters, stay consistent, and perform when it counts. Anchor connects athletes with their sports psychologists on one platform.",
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return <LandingClient />;
}

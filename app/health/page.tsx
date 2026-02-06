/**
 * Route alias: /health → /physical-state
 * Redirects to the canonical /physical-state route (legacy path).
 */

import { redirect } from "next/navigation";

export default function HealthPage() {
  redirect("/physical-state");
}

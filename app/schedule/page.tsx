/**
 * Route alias: /schedule → /sessions
 * Redirects to the canonical /sessions route (legacy path).
 */

import { redirect } from "next/navigation";

export default function SchedulePage() {
  redirect("/sessions");
}

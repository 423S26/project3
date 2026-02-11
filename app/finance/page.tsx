/**
 * Route alias: /finance → /psychological-state
 * Redirects to the canonical /psychological-state route (legacy path).
 */

import { redirect } from "next/navigation";

export default function FinancePage() {
  redirect("/psychological-state");
}

/**
 * Route: / (Dashboard)
 * The application home page - redirects psychologists to /psychologist,
 * shows athlete dashboard for athletes.
 */

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { HomeDashboard } from "@/components/calendar";
import { LocalStorageImportBanner } from "@/components/auth/localstorage-import-banner";

export default async function Home() {
  const user = await getAuthUser();
  
  // Redirect psychologists to their dedicated dashboard
  if (user?.role === "PSYCHOLOGIST") {
    redirect("/psychologist");
  }

  return (
    <>
      <LocalStorageImportBanner />
      <HomeDashboard />
    </>
  );
}

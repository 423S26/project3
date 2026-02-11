/**
 * Route: / (Dashboard)
 * The application home page displaying an interactive calendar dashboard.
 */

import { HomeDashboard } from "@/components/calendar";
import { LocalStorageImportBanner } from "@/components/auth/localstorage-import-banner";

export default function Home() {
  return (
    <>
      <LocalStorageImportBanner />
      <HomeDashboard />
    </>
  );
}

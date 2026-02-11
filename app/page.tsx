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

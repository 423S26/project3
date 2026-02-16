/**
 * Route: /psychologist/athletes/[athleteId]
 * Dedicated athlete drill-down view for psychologists.
 * Shows athlete profile header, calendar, and check-in day history.
 */

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { AthleteDrillDown } from "@/components/psychologist/athlete-drill-down";

interface PageProps {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ date?: string; checkInId?: string }>;
}

export default async function AthleteDrillDownPage({
  params,
  searchParams,
}: PageProps) {
  const user = await getAuthUser();

  if (!user || user.role !== "PSYCHOLOGIST") {
    redirect("/login");
  }

  const { athleteId } = await params;
  const { date, checkInId } = await searchParams;

  return (
    <AthleteDrillDown
      athleteId={athleteId}
      initialDateKey={date}
      initialFocusCheckInId={checkInId}
    />
  );
}

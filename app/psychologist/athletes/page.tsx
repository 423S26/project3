import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { PsychologistAthletesManager } from "@/components/psychologist/psychologist-athletes-manager";

export default async function PsychologistAthletesPage() {
  const user = await getAuthUser();

  if (!user || user.role !== "PSYCHOLOGIST") {
    redirect("/login");
  }

  return <PsychologistAthletesManager />;
}

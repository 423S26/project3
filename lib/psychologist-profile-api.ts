export interface PsychologistProfile {
  user_id: string;
  school: string | null;
  degree: string | null;
  certifications: string | null;
  phone: string | null;
  office_location: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchPsychologistProfile(): Promise<PsychologistProfile | null> {
  const res = await fetch("/api/psychologist-profile");
  if (!res.ok) return null;
  return res.json();
}

export async function updatePsychologistProfile(data: {
  school?: string;
  degree?: string;
  certifications?: string;
  phone?: string;
  officeLocation?: string;
  bio?: string;
}): Promise<PsychologistProfile> {
  const res = await fetch("/api/psychologist-profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update profile");
  }
  return res.json();
}

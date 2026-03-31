"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  fetchPsychologistProfile,
  updatePsychologistProfile,
  type PsychologistProfile,
} from "@/lib/psychologist-profile-api";

export function PsychologistProfileEditor() {
  const [profile, setProfile] = useState<PsychologistProfile | null>(null);
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [certifications, setCertifications] = useState("");
  const [phone, setPhone] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchPsychologistProfile();
      if (data) {
        setProfile(data);
        setSchool(data.school ?? "");
        setDegree(data.degree ?? "");
        setCertifications(data.certifications ?? "");
        setPhone(data.phone ?? "");
        setOfficeLocation(data.office_location ?? "");
        setBio(data.bio ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updatePsychologistProfile({
        school: school || undefined,
        degree: degree || undefined,
        certifications: certifications || undefined,
        phone: phone || undefined,
        officeLocation: officeLocation || undefined,
        bio: bio || undefined,
      });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    }
    setSaving(false);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading profile...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">School / University</span>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Montana State University"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Degree</span>
          <input
            type="text"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Ph.D. in Sport Psychology"
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Certifications / Licenses</span>
          <input
            type="text"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g. CMPC, Licensed Psychologist"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g. (406) 555-1234"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Office Location</span>
          <input
            type="text"
            value={officeLocation}
            onChange={(e) => setOfficeLocation(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Herrick Hall, Room 204"
          />
        </label>
        <label className="space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Bio (optional)</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            placeholder="A brief bio about your background and expertise..."
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Scale } from "lucide-react";
import {
  fetchAthleteProfile,
  updateAthleteProfile,
  type AthleteProfile,
} from "@/lib/physical-state-api";

export function AthleteProfileEditor() {
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [bodyweight, setBodyweight] = useState("");
  const [sport, setSport] = useState("");
  const [position, setPosition] = useState("");
  const [team, setTeam] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await fetchAthleteProfile();
      if (data) {
        setProfile(data);
        setBodyweight(data.bodyweight_kg != null ? String(data.bodyweight_kg) : "");
        setSport(data.sport ?? "");
        setPosition(data.position ?? "");
        setTeam(data.team ?? "");
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateAthleteProfile({
        sport: sport || undefined,
        position: position || undefined,
        team: team || undefined,
        bodyweightKg: bodyweight ? parseFloat(bodyweight) : null,
      });
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
          <span className="text-sm font-medium">Sport</span>
          <input
            type="text"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="e.g. Baseball, Soccer"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Position</span>
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="e.g. Pitcher, Midfielder"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Team</span>
          <input
            type="text"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="e.g. MSU Bobcats"
          />
        </label>
        <label className="space-y-1">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <Scale className="h-3.5 w-3.5 text-blue-500" />
            Bodyweight (kg)
          </span>
          <input
            type="number"
            step="0.1"
            min="20"
            max="300"
            value={bodyweight}
            onChange={(e) => setBodyweight(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="e.g. 80.0"
          />
          <p className="text-xs text-muted-foreground">
            Used for calorie estimates on sport sessions
          </p>
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

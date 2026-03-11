"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Video,
  MapPin,
  Plus,
  X,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";

interface Session {
  id: string;
  session_type: "virtual" | "in_person";
  status: "scheduled" | "completed" | "cancelled";
  starts_at: string;
  duration_min: number;
  location: string | null;
  notes: string | null;
  created_at: string;
  psychologist: { name: string; email: string } | null;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) +
    " at " +
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
}

function isUpcoming(s: Session) {
  return s.status === "scheduled" && new Date(s.starts_at) >= new Date();
}

function isPast(s: Session) {
  return (
    s.status === "completed" ||
    s.status === "cancelled" ||
    (s.status === "scheduled" && new Date(s.starts_at) < new Date())
  );
}

const TIME_SLOTS: { value: string; label: string }[] = (() => {
  const slots: { value: string; label: string }[] = [];
  for (let h = 6; h <= 21; h++) {
    for (const m of [0, 30]) {
      if (h === 21 && m === 30) break;
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const period = h < 12 ? "AM" : "PM";
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      slots.push({ value: `${hh}:${mm}`, label: `${displayH}:${mm} ${period}` });
    }
  }
  return slots;
})();

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [sessionType, setSessionType] = useState<"virtual" | "in_person">(
    "virtual"
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(50);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to load sessions");
      }
      setSessions(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    const startsAt = new Date(`${date}T${time}`).toISOString();

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType,
          startsAt,
          durationMin: duration,
          location: location.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to schedule session");
      }
      setShowForm(false);
      setDate("");
      setTime("");
      setDuration(50);
      setLocation("");
      setNotes("");
      setSessionType("virtual");
      await load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to schedule session"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: string) {
    if (!confirm("Cancel this session?")) return;
    try {
      const res = await fetch(`/api/sessions?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) await load();
    } catch {
      /* ignore */
    }
  }

  const upcoming = sessions.filter(isUpcoming);
  const past = sessions.filter(isPast);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">
            Schedule, manage, and review practitioner sessions
          </p>
        </div>
        <Button onClick={() => setShowForm((p) => !p)}>
          {showForm ? (
            <X className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          {showForm ? "Close" : "Schedule session"}
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Booking form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule a new session</CardTitle>
            <CardDescription>
              Book a session with your assigned psychologist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 sm:max-w-xl"
            >
              {/* Session type toggle */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Session type</legend>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionType("virtual")}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                      sessionType === "virtual"
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    Virtual
                  </button>
                  <button
                    type="button"
                    onClick={() => setSessionType("in_person")}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                      sessionType === "in_person"
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    In-person
                  </button>
                </div>
              </fieldset>

              {/* Date & time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium">Date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Time</span>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="" disabled>
                      Select a time
                    </option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Duration */}
              <label className="space-y-1">
                <span className="text-sm font-medium">
                  Duration (minutes)
                </span>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min={15}
                  max={120}
                  step={5}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>

              {/* Location (in-person only) */}
              {sessionType === "in_person" && (
                <label className="space-y-1">
                  <span className="text-sm font-medium">Location</span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Athletic Center, Room 204"
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </label>
              )}

              {/* Notes */}
              <label className="space-y-1">
                <span className="text-sm font-medium">
                  Notes{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Anything you'd like to discuss..."
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              </label>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Scheduling..." : "Schedule session"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Upcoming sessions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions ({upcoming.length})
          </CardTitle>
          <CardDescription>Your scheduled appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : upcoming.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              No upcoming sessions. Click{" "}
              <strong>Schedule session</strong> to book one.
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {upcoming.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  onCancel={() => handleCancel(s.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past / cancelled sessions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Session History ({past.length})
          </CardTitle>
          <CardDescription>
            Past and cancelled sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : past.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No past sessions yet.
            </p>
          ) : (
            <div className="divide-y rounded-md border">
              {past.map((s) => (
                <SessionRow key={s.id} session={s} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SessionRow({
  session: s,
  onCancel,
}: {
  session: Session;
  onCancel?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">
            {s.session_type === "virtual" ? (
              <span className="inline-flex items-center gap-1">
                <Video className="h-4 w-4 text-blue-500" /> Virtual
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4 text-emerald-500" /> In-person
              </span>
            )}
          </span>
          <Badge
            variant={
              s.status === "cancelled"
                ? "destructive"
                : s.status === "completed"
                ? "secondary"
                : "default"
            }
            className="text-xs"
          >
            {s.status}
          </Badge>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTime(s.starts_at)} · {s.duration_min} min
        </p>
        {s.psychologist && (
          <p className="text-xs text-muted-foreground">
            with {s.psychologist.name}
          </p>
        )}
        {s.location && (
          <p className="text-xs text-muted-foreground">
            <MapPin className="mr-1 inline h-3 w-3" />
            {s.location}
          </p>
        )}
        {s.notes && (
          <p className="text-xs text-muted-foreground italic">{s.notes}</p>
        )}
      </div>
      {onCancel && s.status === "scheduled" && (
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
      )}
    </div>
  );
}

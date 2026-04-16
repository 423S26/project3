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
  CalendarDays,
  Video,
  MapPin,
  Clock,
  FileText,
  AlertCircle,
  RefreshCw,
  Pencil,
  Check,
  X,
  Filter,
  Plus,
} from "lucide-react";

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

interface Session {
  id: string;
  athlete_id: string;
  psychologist_id: string;
  session_type: "virtual" | "in_person";
  status: "scheduled" | "completed" | "cancelled";
  starts_at: string;
  duration_min: number;
  location: string | null;
  notes: string | null;
  created_at: string;
  athlete: { name: string; email: string } | null;
}

interface CaseloadAthlete {
  athleteId: string;
  athlete: { id: string; name: string; email: string };
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
    " at " +
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  );
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

export function PsychologistSessionsManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [athletes, setAthletes] = useState<CaseloadAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAthleteId, setFilterAthleteId] = useState<string>("");

  const [showForm, setShowForm] = useState(false);
  const [formAthleteId, setFormAthleteId] = useState("");
  const [formType, setFormType] = useState<"virtual" | "in_person">("virtual");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDuration, setFormDuration] = useState(50);
  const [formLocation, setFormLocation] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const loadSessions = useCallback(async (athleteId?: string) => {
    setError(null);
    try {
      const url = athleteId
        ? `/api/sessions?athleteId=${encodeURIComponent(athleteId)}`
        : "/api/sessions";
      const res = await fetch(url);
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

  const loadAthletes = useCallback(async () => {
    try {
      const res = await fetch("/api/assignments");
      if (res.ok) {
        const data = await res.json();
        setAthletes(data.caseload ?? []);
      }
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadAthletes();
  }, [loadSessions, loadAthletes]);

  function handleFilterChange(athleteId: string) {
    setFilterAthleteId(athleteId);
    setLoading(true);
    loadSessions(athleteId || undefined);
  }

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!formAthleteId) {
      setFormError("Please select an athlete.");
      return;
    }
    setFormSaving(true);
    try {
      const startsAt = new Date(`${formDate}T${formTime}`).toISOString();
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          athleteId: formAthleteId,
          sessionType: formType,
          startsAt,
          durationMin: formDuration,
          location: formLocation.trim() || null,
          notes: formNotes.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to schedule session");
      }
      setShowForm(false);
      setFormAthleteId("");
      setFormType("virtual");
      setFormDate("");
      setFormTime("");
      setFormDuration(50);
      setFormLocation("");
      setFormNotes("");
      setLoading(true);
      loadSessions(filterAthleteId || undefined);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to schedule session");
    } finally {
      setFormSaving(false);
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
            View and manage your scheduled athlete sessions
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm((p) => !p)}>
            {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showForm ? "Close" : "Schedule session"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              loadSessions(filterAthleteId || undefined);
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Scheduling form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Schedule a new session</CardTitle>
            <CardDescription>
              Book a session with one of your assigned athletes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSchedule} className="grid gap-4 sm:max-w-xl">
              <label className="space-y-1">
                <span className="text-sm font-medium">Athlete</span>
                <select
                  value={formAthleteId}
                  onChange={(e) => setFormAthleteId(e.target.value)}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="" disabled>Select an athlete</option>
                  {athletes.map((a) => (
                    <option key={a.athleteId} value={a.athleteId}>
                      {a.athlete.name}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Session type</legend>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormType("virtual")}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                      formType === "virtual"
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <Video className="h-4 w-4" />
                    Virtual
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("in_person")}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors ${
                      formType === "in_person"
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "hover:bg-accent"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    In-person
                  </button>
                </div>
              </fieldset>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium">Date</span>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm font-medium">Time</span>
                  <select
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="" disabled>Select a time</option>
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-sm font-medium">Duration (minutes)</span>
                <input
                  type="number"
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  min={15}
                  max={120}
                  step={5}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>

              {formType === "in_person" && (
                <label className="space-y-1">
                  <span className="text-sm font-medium">Location</span>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Athletic Center, Room 204"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  />
                </label>
              )}

              <label className="space-y-1">
                <span className="text-sm font-medium">
                  Notes <span className="font-normal text-muted-foreground">(optional)</span>
                </span>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Session agenda or pre-session notes..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={formSaving}>
                  {formSaving ? "Scheduling..." : "Schedule session"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Athlete filter */}
      {athletes.length > 0 && (
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterAthleteId}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">All athletes</option>
            {athletes.map((a) => (
              <option key={a.athleteId} value={a.athleteId}>
                {a.athlete.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Upcoming sessions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5" />
            Upcoming Sessions ({upcoming.length})
          </CardTitle>
          <CardDescription>Scheduled appointments with your athletes</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : upcoming.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              No upcoming sessions.
              {filterAthleteId
                ? " Try selecting a different athlete or clearing the filter."
                : " Schedule a session or wait for athletes to book one."}
            </div>
          ) : (
            <div className="divide-y rounded-md border">
              {upcoming.map((s) => (
                <PsychSessionRow
                  key={s.id}
                  session={s}
                  onUpdated={() => loadSessions(filterAthleteId || undefined)}
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
          <CardDescription>Past and cancelled sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : past.length === 0 ? (
            <p className="text-sm text-muted-foreground">No past sessions yet.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {past.map((s) => (
                <PsychSessionRow
                  key={s.id}
                  session={s}
                  onUpdated={() => loadSessions(filterAthleteId || undefined)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PsychSessionRow({
  session: s,
  onUpdated,
}: {
  session: Session;
  onUpdated?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editType, setEditType] = useState(s.session_type);
  const [editDate, setEditDate] = useState(
    new Date(s.starts_at).toISOString().split("T")[0]
  );
  const [editTime, setEditTime] = useState(
    new Date(s.starts_at).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
  const [editDuration, setEditDuration] = useState(s.duration_min);
  const [editLocation, setEditLocation] = useState(s.location ?? "");
  const [editNotes, setEditNotes] = useState(s.notes ?? "");

  async function handleSave() {
    setSaving(true);
    try {
      const startsAt = new Date(`${editDate}T${editTime}`).toISOString();
      const res = await fetch(`/api/sessions?id=${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionType: editType,
          startsAt,
          durationMin: editDuration,
          location: editLocation.trim() || null,
          notes: editNotes.trim() || null,
        }),
      });
      if (res.ok) {
        setEditing(false);
        onUpdated?.();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotes() {
    setSaving(true);
    try {
      const res = await fetch(`/api/sessions?id=${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editNotes.trim() || null }),
      });
      if (res.ok) {
        setEditingNotes(false);
        onUpdated?.();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this session?")) return;
    try {
      const res = await fetch(`/api/sessions?id=${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) onUpdated?.();
    } catch {
      /* ignore */
    }
  }

  async function handleComplete() {
    try {
      const res = await fetch(`/api/sessions?id=${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        setEditingNotes(true);
        onUpdated?.();
      }
    } catch {
      /* ignore */
    }
  }

  if (editingNotes) {
    return (
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-3.5 w-3.5" />
          Post-session notes &mdash; {s.athlete?.name ?? "Unknown"}
        </div>

        <div className="grid gap-3 sm:max-w-xl">
          <label className="space-y-1">
            <span className="text-xs font-medium">Notes</span>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              placeholder="Add your post-session observations, follow-up items, or recommendations..."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveNotes} disabled={saving}>
              {saving ? "Saving..." : "Save notes"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditNotes(s.notes ?? "");
                setEditingNotes(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-3 p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Pencil className="h-3.5 w-3.5" />
          Editing session with {s.athlete?.name ?? "Unknown"}
        </div>

        <div className="grid gap-3 sm:max-w-xl">
          {/* Session type */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditType("virtual")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                editType === "virtual"
                  ? "border-primary bg-primary/5 font-medium text-primary"
                  : "hover:bg-accent"
              }`}
            >
              <Video className="h-4 w-4" />
              Virtual
            </button>
            <button
              type="button"
              onClick={() => setEditType("in_person")}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors ${
                editType === "in_person"
                  ? "border-primary bg-primary/5 font-medium text-primary"
                  : "hover:bg-accent"
              }`}
            >
              <MapPin className="h-4 w-4" />
              In-person
            </button>
          </div>

          {/* Date, time, duration */}
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-medium">Date</span>
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Time</span>
              <input
                type="time"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium">Duration (min)</span>
              <input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(Number(e.target.value))}
                min={15}
                max={120}
                step={5}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>

          {/* Location */}
          {editType === "in_person" && (
            <label className="space-y-1">
              <span className="text-xs font-medium">Location</span>
              <input
                type="text"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="e.g. Athletic Center, Room 204"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </label>
          )}

          {/* Notes */}
          <label className="space-y-1">
            <span className="text-xs font-medium">Notes</span>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </label>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          {formatDateTime(s.starts_at)} &middot; {s.duration_min} min
        </p>
        {s.athlete && (
          <p className="text-xs text-muted-foreground">
            with <span className="font-medium">{s.athlete.name}</span>{" "}
            <span className="text-muted-foreground/70">{s.athlete.email}</span>
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

      {onUpdated && s.status === "scheduled" && (
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            title="Edit session"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleComplete}
            title="Mark completed"
          >
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            title="Cancel session"
          >
            <X className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      )}

      {onUpdated && s.status === "completed" && (
        <div className="flex shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingNotes(true)}
            title={s.notes ? "Edit notes" : "Add notes"}
          >
            <FileText className="mr-1 h-3.5 w-3.5" />
            {s.notes ? "Edit notes" : "Add notes"}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  todayDateKey,
  fromLocalDateKey,
  type PsychCheckIn,
  type BrumsData,
} from "@/lib/psych-checkins";
import { createCheckIn } from "@/lib/checkins-api";
import { useAthlete } from "@/components/auth/athlete-context";
import { EMOJI_SCALE, SCALE_OPTIONS } from "@/lib/emoji-scale";
import {
  BRUMS_ITEMS,
  ITEM_PRESENTATION_ORDER,
  RESPONSE_LABELS,
  SUBSCALE_LABELS,
  BRUMS_SUBSCALES,
  computeSubscales,
  isComplete,
  type BrumsResponses,
  type ResponseValue,
} from "@/lib/brums-inspired";
import { Smile, Zap, Target, ChevronDown, ChevronUp, CalendarDays } from "lucide-react";

/* ───── Quick-scale row (1–10 emoji) ───── */

interface ScaleRowProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  icon: React.ReactNode;
}

function ScaleRow({ label, value, onChange, icon }: ScaleRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{label}</span>
        {value >= 1 && (
          <span className="text-muted-foreground">
            {value} {EMOJI_SCALE[value]}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        {SCALE_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors ${
              value === n
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background hover:bg-accent"
            }`}
            title={`${n} ${EMOJI_SCALE[n]}`}
          >
            {EMOJI_SCALE[n]}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───── BRUMS item row (0–4 radio-style) ───── */

interface BrumsItemRowProps {
  itemId: number;
  label: string;
  value: ResponseValue | undefined;
  onChange: (val: ResponseValue) => void;
}

function BrumsItemRow({ itemId, label, value, onChange }: BrumsItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-36 shrink-0 text-sm">{label}</span>
      <div className="flex gap-1">
        {([0, 1, 2, 3, 4] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            title={RESPONSE_LABELS[v]}
            className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors ${
              value === v
                ? "border-violet-500 bg-violet-500 text-white"
                : "border-input bg-background hover:bg-accent"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ───── Subscale summary bar ───── */

function SubscaleSummary({ responses }: { responses: BrumsResponses }) {
  const scores = computeSubscales(responses);
  const answeredCount = BRUMS_ITEMS.filter((i) => responses[i.id] != null).length;
  return (
    <div className="rounded-lg border bg-muted/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Subscale Preview ({answeredCount}/24 answered)
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        {BRUMS_SUBSCALES.map((key) => (
          <div key={key} className="flex justify-between">
            <span className="text-muted-foreground">{SUBSCALE_LABELS[key]}</span>
            <span className="font-medium">{scores[key]}/16</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Main form ───── */

export interface CheckInFormProps {
  /** Called after a check-in is persisted */
  onSaved?: (checkIn: PsychCheckIn) => void;
  /** Controlled date key (YYYY-MM-DD). If omitted the form manages its own. */
  dateKey?: string;
  /** Called when the user changes the date picker */
  onDateKeyChange?: (key: string) => void;
}

export function CheckInForm({ onSaved, dateKey: controlledDateKey, onDateKeyChange }: CheckInFormProps) {
  const { activeAthleteId, isPsychologist } = useAthlete();
  const isDateControlled = controlledDateKey !== undefined;
  const [internalDateKey, setInternalDateKey] = useState(todayDateKey);
  const dateKey = isDateControlled ? controlledDateKey : internalDateKey;

  const handleDateKeyChange = (key: string) => {
    if (isDateControlled) {
      onDateKeyChange?.(key);
    } else {
      setInternalDateKey(key);
    }
  };
  const [mood, setMood] = useState<number>(0);
  const [stress, setStress] = useState<number>(0);
  const [motivation, setMotivation] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // BRUMS expanded section
  const [expanded, setExpanded] = useState(false);
  const [brumsResponses, setBrumsResponses] = useState<BrumsResponses>({});

  const isQuickValid =
    mood >= 1 && mood <= 10 && stress >= 1 && stress <= 10 && motivation >= 1 && motivation <= 10;

  const brumsComplete = useMemo(() => isComplete(brumsResponses), [brumsResponses]);

  const orderedItems = useMemo(() => {
    return ITEM_PRESENTATION_ORDER.map((id) => BRUMS_ITEMS.find((i) => i.id === id)!);
  }, []);

  const handleBrumsChange = (itemId: number, val: ResponseValue) => {
    setBrumsResponses((prev) => ({ ...prev, [itemId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isQuickValid) {
      setError("Please select a value (1–10) for Mood, Stress, and Motivation.");
      return;
    }
    if (expanded && !brumsComplete) {
      setError("Please answer all 24 items in the expanded mood profile, or collapse it to skip.");
      return;
    }
    setIsSubmitting(true);
    try {
      let brumsData: BrumsData | undefined;
      if (expanded && brumsComplete) {
        brumsData = {
          completed: true,
          items: { ...brumsResponses },
          subscales: computeSubscales(brumsResponses),
        };
      }
      // Build createdAt from selected date + current local time-of-day
      const now = new Date();
      const createdAt = fromLocalDateKey(dateKey, {
        h: now.getHours(),
        m: now.getMinutes(),
        s: now.getSeconds(),
      }).toISOString();

      const checkIn = await createCheckIn({
        mood,
        stress,
        motivation,
        notes: notes || undefined,
        brums: brumsData,
        createdAt,
        athleteId: isPsychologist ? activeAthleteId ?? undefined : undefined,
      });
      onSaved?.(checkIn);
      // Reset form
      setMood(0);
      setStress(0);
      setMotivation(0);
      setNotes("");
      setExpanded(false);
      setBrumsResponses({});
    } catch {
      setError("Failed to save check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daily Check-In</CardTitle>
        <CardDescription>
          Log your mood, stress, and motivation (1–10). Optionally expand for a detailed mood profile.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date selector */}
          <div className="space-y-2">
            <label htmlFor="checkin-date" className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4" />
              Date
            </label>
            <input
              id="checkin-date"
              type="date"
              value={dateKey}
              onChange={(e) => handleDateKeyChange(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
            />
          </div>

          {/* Quick scales */}
          <ScaleRow
            label="Mood"
            value={mood}
            onChange={setMood}
            icon={<Smile className="h-4 w-4" />}
          />
          <ScaleRow
            label="Stress"
            value={stress}
            onChange={setStress}
            icon={<Zap className="h-4 w-4" />}
          />
          <ScaleRow
            label="Motivation"
            value={motivation}
            onChange={setMotivation}
            icon={<Target className="h-4 w-4" />}
          />

          {/* Expand toggle */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent"
          >
            <span>
              {expanded ? "Collapse" : "Expand"} Detailed Mood Profile (24 items)
            </span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* BRUMS-inspired expanded section */}
          {expanded && (
            <div className="space-y-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Mood Profile</p>
                <p className="text-xs text-muted-foreground">
                  Rate how each word describes how you feel <strong>right now</strong> (0 = Not at all, 4 = Extremely).
                </p>
              </div>

              {/* Response legend */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {RESPONSE_LABELS.map((lbl, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-medium">
                      {i}
                    </span>
                    <span className="mr-2">{lbl}</span>
                  </span>
                ))}
              </div>

              {/* Items */}
              <div className="max-h-[400px] space-y-0.5 overflow-y-auto">
                {orderedItems.map((item) => (
                  <BrumsItemRow
                    key={item.id}
                    itemId={item.id}
                    label={item.label}
                    value={brumsResponses[item.id]}
                    onChange={(val) => handleBrumsChange(item.id, val)}
                  />
                ))}
              </div>

              {/* Live subscale summary */}
              <SubscaleSummary responses={brumsResponses} />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="checkin-notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <textarea
              id="checkin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context or reflections..."
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={!isQuickValid || isSubmitting || (expanded && !brumsComplete)}
          >
            {isSubmitting ? "Saving..." : "Save Check-In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

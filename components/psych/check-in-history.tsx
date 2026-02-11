"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type PsychCheckIn } from "@/lib/psych-checkins";
import { EMOJI_SCALE } from "@/lib/emoji-scale";
import { SUBSCALE_LABELS, BRUMS_SUBSCALES } from "@/lib/brums-inspired";
import { Clock, Smile, Zap, Target } from "lucide-react";

/* ───── helpers ───── */

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ───── In-day trend sparkline (pure SVG) ───── */

interface TrendProps {
  checkIns: PsychCheckIn[];
}

function InDayTrend({ checkIns }: TrendProps) {
  if (checkIns.length < 2) return null;

  const width = 220;
  const height = 60;
  const pad = 4;
  const inner = { w: width - pad * 2, h: height - pad * 2 };

  // x-axis = index (evenly spaced)
  const xStep = inner.w / (checkIns.length - 1);

  const buildPath = (values: number[], max: number) => {
    return values
      .map((v, i) => {
        const x = pad + i * xStep;
        const y = pad + inner.h - (v / max) * inner.h;
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
  };

  const moodPath = buildPath(
    checkIns.map((c) => c.mood),
    10
  );
  const stressPath = buildPath(
    checkIns.map((c) => c.stress),
    10
  );
  const motivPath = buildPath(
    checkIns.map((c) => c.motivation),
    10
  );

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">In-Day Trend</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-[280px]"
        aria-label="In-day trend"
      >
        {/* Mood – violet */}
        <path d={moodPath} fill="none" stroke="#8b5cf6" strokeWidth="2" />
        {/* Stress – amber */}
        <path d={stressPath} fill="none" stroke="#f59e0b" strokeWidth="2" />
        {/* Motivation – green */}
        <path d={motivPath} fill="none" stroke="#22c55e" strokeWidth="2" />
      </svg>
      <div className="flex gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-violet-500" /> Mood
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Stress
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" /> Motivation
        </span>
      </div>
    </div>
  );
}

/* ───── Single check-in row ───── */

interface CheckInRowProps {
  checkIn: PsychCheckIn;
  isFocused: boolean;
}

function CheckInRow({ checkIn, isFocused }: CheckInRowProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isFocused]);

  return (
    <div
      ref={ref}
      id={`checkin-row-${checkIn.id}`}
      className={`rounded-lg border p-3 transition-all ${
        isFocused
          ? "border-violet-500 bg-violet-50 ring-2 ring-violet-300 dark:bg-violet-950/30 dark:ring-violet-700"
          : ""
      }`}
    >
      {/* Time header */}
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {formatTime(checkIn.createdAt)}
      </div>

      {/* Quick scores */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex items-center gap-1.5">
          <Smile className="h-3.5 w-3.5 text-violet-500" />
          <span>{checkIn.mood} {EMOJI_SCALE[checkIn.mood]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>{checkIn.stress} {EMOJI_SCALE[checkIn.stress]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-green-500" />
          <span>{checkIn.motivation} {EMOJI_SCALE[checkIn.motivation]}</span>
        </div>
      </div>

      {/* BRUMS subscale summary (compact) */}
      {checkIn.brums?.completed && (
        <div className="mt-2 border-t pt-2">
          <p className="mb-1 text-[10px] font-medium text-muted-foreground">
            Mood Profile
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-xs">
            {BRUMS_SUBSCALES.map((key) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{SUBSCALE_LABELS[key]}</span>
                <span className="font-medium">{checkIn.brums!.subscales[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {checkIn.notes && (
        <p className="mt-2 border-t pt-2 text-xs text-muted-foreground line-clamp-2">
          {checkIn.notes}
        </p>
      )}
    </div>
  );
}

/* ───── Main history component ───── */

export interface CheckInHistoryProps {
  dateKey: string;
  checkIns: PsychCheckIn[];
  focusCheckInId?: string | null;
}

export function CheckInHistory({
  dateKey,
  checkIns,
  focusCheckInId,
}: CheckInHistoryProps) {
  return (
    <Card id="checkins">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Check-Ins &mdash; {formatDateLabel(dateKey)}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {checkIns.length === 0
            ? "No check-ins recorded for this day."
            : `${checkIns.length} check-in${checkIns.length > 1 ? "s" : ""} logged`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {checkIns.length > 0 && <InDayTrend checkIns={checkIns} />}
        <div className="space-y-3">
          {checkIns.map((ci) => (
            <CheckInRow
              key={ci.id}
              checkIn={ci}
              isFocused={ci.id === focusCheckInId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

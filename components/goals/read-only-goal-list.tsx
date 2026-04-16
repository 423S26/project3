"use client";

import { CheckCircle2 } from "lucide-react";
import type { AthleteGoal, GoalCategory } from "@/lib/goals-api";

const GOAL_CATEGORY_META: Record<GoalCategory, { label: string; color: string }> = {
  weight: { label: "Weight", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  performance: { label: "Performance", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  training: { label: "Training", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  custom: { label: "Custom", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
};

export function ReadOnlyGoalRow({ goal }: { goal: AthleteGoal }) {
  const meta = GOAL_CATEGORY_META[goal.category];
  const isCompleted = goal.status === "completed";

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {isCompleted ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
      ) : (
        <div className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}
          >
            {goal.title}
          </span>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}>
            {meta.label}
          </span>
        </div>
        {goal.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
        )}
        {(goal.target_value || goal.current_value) && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {goal.current_value && <>Current: {goal.current_value}</>}
            {goal.current_value && goal.target_value && " · "}
            {goal.target_value && <>Target: {goal.target_value}</>}
          </p>
        )}
      </div>
    </div>
  );
}

export function ReadOnlyGoalList({ goals }: { goals: AthleteGoal[] }) {
  if (goals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">
        No goals have been set yet.
      </p>
    );
  }

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {active.length} active, {completed.length} completed
      </p>
      {goals.map((goal) => (
        <ReadOnlyGoalRow key={goal.id} goal={goal} />
      ))}
    </div>
  );
}

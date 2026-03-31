export type GoalCategory = "weight" | "performance" | "training" | "custom";
export type GoalStatus = "active" | "completed" | "archived";

export interface AthleteGoal {
  id: string;
  athlete_id: string;
  category: GoalCategory;
  title: string;
  description: string | null;
  target_value: string | null;
  current_value: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export async function fetchGoals(athleteId?: string): Promise<AthleteGoal[]> {
  const params = new URLSearchParams();
  if (athleteId) params.set("athleteId", athleteId);
  const res = await fetch(`/api/goals?${params.toString()}`);
  if (!res.ok) return [];
  return res.json();
}

export async function createGoal(data: {
  category: GoalCategory;
  title: string;
  description?: string;
  targetValue?: string;
  currentValue?: string;
}): Promise<AthleteGoal> {
  const res = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create goal");
  }
  return res.json();
}

export async function updateGoal(
  goalId: string,
  data: {
    title?: string;
    description?: string;
    targetValue?: string;
    currentValue?: string;
    status?: GoalStatus;
    category?: GoalCategory;
  }
): Promise<AthleteGoal> {
  const res = await fetch(`/api/goals?id=${goalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to update goal");
  }
  return res.json();
}

export async function deleteGoal(goalId: string): Promise<void> {
  const res = await fetch(`/api/goals?id=${goalId}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to delete goal");
  }
}

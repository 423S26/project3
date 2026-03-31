"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  type AthleteGoal,
  type GoalCategory,
  type GoalStatus,
} from "@/lib/goals-api";

const CATEGORIES: { value: GoalCategory; label: string; color: string }[] = [
  { value: "weight", label: "Weight", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  { value: "performance", label: "Performance", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "training", label: "Training", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "custom", label: "Custom", color: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200" },
];

function categoryMeta(cat: GoalCategory) {
  return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[3];
}

export function AthleteGoalsEditor() {
  const [goals, setGoals] = useState<AthleteGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<GoalCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New goal form state
  const [newCategory, setNewCategory] = useState<GoalCategory>("weight");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newCurrent, setNewCurrent] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchGoals();
    setGoals(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setFormSaving(true);
    try {
      const created = await createGoal({
        category: newCategory,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        targetValue: newTarget.trim() || undefined,
        currentValue: newCurrent.trim() || undefined,
      });
      setGoals((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewTarget("");
      setNewCurrent("");
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create goal");
    }
    setFormSaving(false);
  };

  const handleToggleStatus = async (goal: AthleteGoal) => {
    const next: GoalStatus = goal.status === "completed" ? "active" : "completed";
    try {
      const updated = await updateGoal(goal.id, { status: next });
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
    } catch {
      /* swallow */
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch {
      /* swallow */
    }
  };

  const handleInlineUpdate = async (
    goalId: string,
    field: "currentValue" | "targetValue" | "title" | "description",
    value: string
  ) => {
    try {
      const updated = await updateGoal(goalId, { [field]: value });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    } catch {
      /* swallow */
    }
  };

  const filteredGoals =
    filterCategory === "all"
      ? goals
      : goals.filter((g) => g.category === filterCategory);

  const activeGoals = filteredGoals.filter((g) => g.status === "active");
  const completedGoals = filteredGoals.filter((g) => g.status === "completed");

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading goals...</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterCategory === "all"
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilterCategory(c.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterCategory === c.value
                  ? c.color
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm((p) => !p)}
          variant={showForm ? "outline" : "default"}
        >
          {showForm ? "Cancel" : <><Plus className="mr-1 h-4 w-4" /> New Goal</>}
        </Button>
      </div>

      {/* New goal form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border bg-card p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Category</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as GoalCategory)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Title</span>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                placeholder="e.g. Bench 225 lbs"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Description (optional)</span>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              placeholder="Describe your goal in more detail..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Target value (optional)</span>
              <input
                type="text"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="e.g. 225 lbs, 6:00 mile"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">
                Current value (optional)
              </span>
              <input
                type="text"
                value={newCurrent}
                onChange={(e) => setNewCurrent(e.target.value)}
                placeholder="e.g. 185 lbs, 7:30 mile"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={formSaving} size="sm">
              {formSaving ? "Saving..." : "Create Goal"}
            </Button>
          </div>
        </form>
      )}

      {/* Active goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No goals yet. Click &ldquo;New Goal&rdquo; to get started!
        </p>
      )}

      {activeGoals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Active ({activeGoals.length})
          </h3>
          {activeGoals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              expanded={expandedId === goal.id}
              onToggleExpand={() =>
                setExpandedId((prev) => (prev === goal.id ? null : goal.id))
              }
              onToggleStatus={() => handleToggleStatus(goal)}
              onDelete={() => handleDelete(goal.id)}
              onUpdate={(field, value) =>
                handleInlineUpdate(goal.id, field, value)
              }
            />
          ))}
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Completed ({completedGoals.length})
          </h3>
          {completedGoals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              expanded={expandedId === goal.id}
              onToggleExpand={() =>
                setExpandedId((prev) => (prev === goal.id ? null : goal.id))
              }
              onToggleStatus={() => handleToggleStatus(goal)}
              onDelete={() => handleDelete(goal.id)}
              onUpdate={(field, value) =>
                handleInlineUpdate(goal.id, field, value)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalRow({
  goal,
  expanded,
  onToggleExpand,
  onToggleStatus,
  onDelete,
  onUpdate,
}: {
  goal: AthleteGoal;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onUpdate: (
    field: "currentValue" | "targetValue" | "title" | "description",
    value: string
  ) => void;
}) {
  const meta = categoryMeta(goal.category);
  const isCompleted = goal.status === "completed";

  return (
    <div className="rounded-lg border bg-card transition-colors">
      {/* Summary row */}
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={onToggleStatus}
          className="shrink-0"
          title={isCompleted ? "Reactivate" : "Mark complete"}
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40 hover:border-green-500 transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                isCompleted ? "line-through text-muted-foreground" : ""
              }`}
            >
              {goal.title}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
            >
              {meta.label}
            </span>
          </div>
          {(goal.target_value || goal.current_value) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {goal.current_value && <>Current: {goal.current_value}</>}
              {goal.current_value && goal.target_value && " · "}
              {goal.target_value && <>Target: {goal.target_value}</>}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleExpand}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t p-3 space-y-3">
          {goal.description && (
            <p className="text-sm text-muted-foreground">{goal.description}</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Current value
              </span>
              <input
                type="text"
                defaultValue={goal.current_value ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (goal.current_value ?? "")) {
                    onUpdate("currentValue", v);
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
                placeholder="Update progress..."
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Target value
              </span>
              <input
                type="text"
                defaultValue={goal.target_value ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (goal.target_value ?? "")) {
                    onUpdate("targetValue", v);
                  }
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
                placeholder="Set target..."
              />
            </label>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleStatus}
            >
              {isCompleted ? (
                <>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reactivate
                </>
              ) : (
                <>
                  <Check className="mr-1 h-3.5 w-3.5" /> Complete
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

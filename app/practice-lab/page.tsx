"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "@/components/auth/session-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send,
  Image as ImageIcon,
  X,
  Check,
  Loader2,
  Dumbbell,
  UtensilsCrossed,
  Moon,
  Bot,
  User,
  Sparkles,
} from "lucide-react";
import {
  createWorkoutTemplate,
  createMeal,
  createRecoveryEntry,
} from "@/lib/physical-state-api";

type SuggestedActionType = "workout_template" | "meal_log" | "recovery_entry";

interface SuggestedAction {
  type: SuggestedActionType;
  payload: Record<string, unknown>;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: string[];
  suggestedActions?: SuggestedAction[];
  appliedActions?: Set<number>;
}

export default function PracticeLabPage() {
  const { user } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [applyingIdx, setApplyingIdx] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isAthlete = user?.role === "ATHLETE";

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, 4 - pendingImages.length); i++) {
      const f = files[i];
      if (!f.type.startsWith("image/")) continue;
      const b64 = await fileToBase64(f);
      newImages.push(b64);
    }
    setPendingImages((prev) => [...prev, ...newImages].slice(0, 4));
  }

  function removeImage(idx: number) {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: text || "(screenshot attached)",
      images: pendingImages.length > 0 ? [...pendingImages] : undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setPendingImages([]);
    setSending(true);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          imageBase64: userMsg.images,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: data.error ?? "Something went wrong. Please try again.",
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply,
          suggestedActions: data.suggestedActions,
          appliedActions: new Set(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Failed to reach the AI coach. Check your connection and try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function applyAction(msgId: string, actionIdx: number, action: SuggestedAction) {
    const key = `${msgId}-${actionIdx}`;
    setApplyingIdx(key);

    try {
      switch (action.type) {
        case "workout_template":
          await createWorkoutTemplate(
            action.payload as Parameters<typeof createWorkoutTemplate>[0]
          );
          break;
        case "meal_log":
          await createMeal(action.payload as Parameters<typeof createMeal>[0]);
          break;
        case "recovery_entry":
          await createRecoveryEntry(
            action.payload as Parameters<typeof createRecoveryEntry>[0]
          );
          break;
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId) return m;
          const applied = new Set(m.appliedActions);
          applied.add(actionIdx);
          return { ...m, appliedActions: applied };
        })
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("anchor-physical-state-saved"));
      }
    } catch (err) {
      alert(
        `Failed to apply: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setApplyingIdx(null);
    }
  }

  function actionLabel(type: SuggestedActionType): string {
    switch (type) {
      case "workout_template":
        return "Workout Template";
      case "meal_log":
        return "Meal Log";
      case "recovery_entry":
        return "Recovery Entry";
    }
  }

  function actionIcon(type: SuggestedActionType) {
    switch (type) {
      case "workout_template":
        return <Dumbbell className="h-4 w-4" />;
      case "meal_log":
        return <UtensilsCrossed className="h-4 w-4" />;
      case "recovery_entry":
        return <Moon className="h-4 w-4" />;
    }
  }

  function actionSummary(action: SuggestedAction): string {
    const p = action.payload;
    switch (action.type) {
      case "workout_template": {
        const name = (p.name as string) ?? "Workout";
        const exCount = Array.isArray(p.exercises) ? p.exercises.length : 0;
        return `${name}${exCount > 0 ? ` (${exCount} exercise${exCount > 1 ? "s" : ""})` : ""}`;
      }
      case "meal_log": {
        const name = (p.mealName as string) ?? "Meal";
        const cal = p.calories as number | undefined;
        return `${name}${cal ? ` — ${Math.round(cal)} cal` : ""}`;
      }
      case "recovery_entry": {
        const date = (p.date as string) ?? "today";
        const sleep = p.sleepMinutes as number | undefined;
        return `Recovery ${date}${sleep ? ` — ${Math.round(sleep / 60)}h sleep` : ""}`;
      }
    }
  }

  if (!isAthlete) {
    return (
      <div className="flex items-center justify-center py-24">
        <Card className="max-w-sm">
          <CardContent className="py-8 text-center">
            <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="font-medium">Practice Lab is for athletes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This feature is only available when signed in as an athlete.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      {/* Header */}
      <div className="shrink-0 space-y-1 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Practice Lab</h1>
        </div>
        <p className="text-muted-foreground">
          Your AI coach — ask questions, get reflections, or upload screenshots of
          schedules, lifting plans, and meal plans to import into your profile.
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-lg border bg-background p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              How can I help you today?
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Ask about your check-ins, get motivation tips, or upload a screenshot
              of a workout plan / meal plan to import it.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}

            <div
              className={`max-w-[80%] space-y-2 ${msg.role === "user" ? "text-right" : ""}`}
            >
              <div
                className={`inline-block rounded-lg px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Attached images (user) */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {msg.images.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Attached ${i + 1}`}
                      className="h-24 w-auto rounded-md border object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Suggested actions (assistant) */}
              {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <Card className="mt-2 text-left">
                  <CardHeader className="px-4 py-3">
                    <CardTitle className="text-sm font-medium">
                      Extracted items — review and apply
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 px-4 pb-4">
                    {msg.suggestedActions.map((action, idx) => {
                      const applied = msg.appliedActions?.has(idx);
                      const loading = applyingIdx === `${msg.id}-${idx}`;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-md border p-3"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                            {actionIcon(action.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                              {actionLabel(action.type)}
                            </p>
                            <p className="truncate text-sm font-medium">
                              {actionSummary(action)}
                            </p>
                          </div>
                          {applied ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                              <Check className="h-4 w-4" /> Added
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loading}
                              onClick={() => applyAction(msg.id, idx, action)}
                            >
                              {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Apply"
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>

            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="mb-4 flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="inline-block rounded-lg bg-muted px-4 py-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Image previews */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 border-x border-t bg-muted/50 p-2">
          {pendingImages.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={img}
                alt={`Upload ${i + 1}`}
                className="h-16 w-auto rounded-md border object-cover"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex shrink-0 gap-2 border-t pt-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileRef.current?.click()}
          disabled={sending || pendingImages.length >= 4}
          title="Attach screenshot"
        >
          <ImageIcon className="h-5 w-5" />
        </Button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Ask a question, or paste a screenshot of your schedule / plan..."
          rows={1}
          className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={sending}
        />
        <Button type="submit" disabled={sending || (!input.trim() && pendingImages.length === 0)}>
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
}

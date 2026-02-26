"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, CheckCircle } from "lucide-react";
import { Suspense } from "react";

type Category = "setup" | "ux" | "docs" | "question" | "bug" | "other";
type Severity = "low" | "medium" | "high" | "blocking";

const CATEGORIES: { value: Category; label: string; description: string }[] = [
  { value: "setup", label: "Setup / Workflow", description: "Trouble getting started or completing a workflow" },
  { value: "ux", label: "Interface", description: "Something looks or behaves unexpectedly" },
  { value: "docs", label: "Documentation", description: "A doc or help text was missing or unclear" },
  { value: "question", label: "Question", description: "Something I wanted to understand but couldn't" },
  { value: "bug", label: "Bug", description: "Something appears broken" },
  { value: "other", label: "Other", description: "Anything else" },
];

const SEVERITIES: { value: Severity; label: string; color: string }[] = [
  { value: "low", label: "Low — minor friction", color: "border-slate-300 bg-slate-50 hover:bg-slate-100" },
  { value: "medium", label: "Medium — slowed me down", color: "border-amber-300 bg-amber-50 hover:bg-amber-100" },
  { value: "high", label: "High — required significant effort", color: "border-orange-400 bg-orange-50 hover:bg-orange-100" },
  { value: "blocking", label: "Blocking — couldn't continue", color: "border-red-400 bg-red-50 hover:bg-red-100" },
];

function FeedbackForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<Category | "">("");
  const [severity, setSeverity] = useState<Severity | "">("");
  const [whatTrying, setWhatTrying] = useState("");
  const [message, setMessage] = useState("");
  const [pagePath, setPagePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill page path from query param (set by in-app links) or referrer
  useEffect(() => {
    const from = searchParams.get("from");
    if (from) {
      setPagePath(from);
    } else if (typeof window !== "undefined") {
      setPagePath(document.referrer ? new URL(document.referrer).pathname : "");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !severity) {
      setError("Please select a category and severity.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          severity,
          message,
          what_were_you_trying: whatTrying,
          page_path: pagePath,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold">Thank you!</h2>
        <p className="max-w-sm text-muted-foreground">
          Your feedback has been recorded. The team reviews all submissions to improve Anchor.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button
            onClick={() => {
              setSubmitted(false);
              setCategory("");
              setSeverity("");
              setWhatTrying("");
              setMessage("");
            }}
          >
            Submit More Feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          What type of feedback is this? <span className="text-destructive">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                category === c.value
                  ? "border-primary bg-primary/5 ring-2 ring-primary"
                  : "border-input bg-background hover:bg-accent"
              }`}
            >
              <span className="font-medium">{c.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{c.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div className="space-y-3">
        <label className="text-sm font-medium">
          How much did this affect you? <span className="text-destructive">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {SEVERITIES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSeverity(s.value)}
              className={`rounded-lg border p-3 text-left text-sm font-medium transition-colors ${
                severity === s.value
                  ? `${s.color} ring-2 ring-primary`
                  : `${s.color}`
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* What were you trying to do */}
      <div className="space-y-2">
        <label htmlFor="what-trying" className="text-sm font-medium">
          What were you trying to do?
        </label>
        <textarea
          id="what-trying"
          value={whatTrying}
          onChange={(e) => setWhatTrying(e.target.value)}
          placeholder="e.g. Log a daily check-in and see it on the dashboard calendar"
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label htmlFor="feedback-message" className="text-sm font-medium">
          Describe what happened <span className="text-destructive">*</span>
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you saw, what confused you, or what went wrong..."
          rows={4}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
      </div>

      {/* Page context (editable if needed) */}
      {pagePath && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Page (auto-detected)
          </label>
          <p className="rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            {pagePath}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !category || !severity}>
          {loading ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </form>
  );
}

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Submit Feedback</h1>
        <p className="text-muted-foreground">
          Help the team spot sticking points, unclear interfaces, and missing documentation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            Share Your Experience
          </CardTitle>
          <CardDescription>
            All fields marked <span className="text-destructive">*</span> are required.
            Your feedback is stored and reviewed by the team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <FeedbackForm />
          </Suspense>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Anchor does not collect personal health data through this form.
        Feedback is used solely to improve the application.
      </p>
    </div>
  );
}

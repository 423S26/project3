import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus } from "lucide-react";

interface FeedbackReport {
  id: string;
  created_at: string;
  user_id: string | null;
  user_role: string | null;
  page_path: string;
  category: string;
  severity: string;
  what_were_you_trying: string;
  message: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-300",
  medium: "bg-amber-100 text-amber-700 border-amber-300",
  high: "bg-orange-100 text-orange-700 border-orange-400",
  blocking: "bg-red-100 text-red-700 border-red-400",
};

const CATEGORY_STYLES: Record<string, string> = {
  setup: "bg-blue-100 text-blue-700",
  ux: "bg-violet-100 text-violet-700",
  docs: "bg-teal-100 text-teal-700",
  question: "bg-green-100 text-green-700",
  bug: "bg-red-100 text-red-700",
  other: "bg-slate-100 text-slate-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function PsychologistFeedbackPage() {
  // Guard: psychologists only
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (user.role !== "PSYCHOLOGIST") redirect("/");

  // Fetch using service client so we can read all reports regardless of who submitted
  const service = createServiceClient();
  const { data: reports, error } = await service
    .from("feedback_reports")
    .select(
      "id, created_at, user_id, user_role, page_path, category, severity, what_were_you_trying, message"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (reports ?? []) as FeedbackReport[];

  // Summary counts
  const counts = {
    total: rows.length,
    blocking: rows.filter((r) => r.severity === "blocking").length,
    high: rows.filter((r) => r.severity === "high").length,
    byCategory: Object.fromEntries(
      ["setup", "ux", "docs", "question", "bug", "other"].map((cat) => [
        cat,
        rows.filter((r) => r.category === cat).length,
      ])
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Feedback Reports</h1>
        <p className="text-muted-foreground">
          User-submitted feedback collected via the in-app form. Review sticking points,
          interface misconceptions, doc holes, and questions.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{counts.total}</p>
            <p className="text-xs text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className={`text-2xl font-bold ${counts.blocking > 0 ? "text-red-600" : ""}`}>
              {counts.blocking}
            </p>
            <p className="text-xs text-muted-foreground">Blocking</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className={`text-2xl font-bold ${counts.high > 0 ? "text-orange-600" : ""}`}>
              {counts.high}
            </p>
            <p className="text-xs text-muted-foreground">High Severity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-1">
              {Object.entries(counts.byCategory).map(([cat, n]) =>
                n > 0 ? (
                  <span
                    key={cat}
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${CATEGORY_STYLES[cat] ?? ""}`}
                  >
                    {cat} ({n})
                  </span>
                ) : null
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">By Category</p>
          </CardContent>
        </Card>
      </div>

      {/* Report list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5" />
            All Reports
          </CardTitle>
          <CardDescription>
            Sorted newest first. Blocking and high-severity reports are shown first within each
            day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive">
              Error loading reports: {error.message}
            </p>
          )}

          {rows.length === 0 && !error && (
            <p className="text-sm text-muted-foreground">
              No feedback reports yet. Share the app with testers and ask them to submit
              feedback via the Feedback link in navigation.
            </p>
          )}

          <div className="space-y-3">
            {rows.map((report) => (
              <div
                key={report.id}
                className="rounded-lg border p-4 space-y-2"
              >
                {/* Top row: badges + timestamp */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${
                      SEVERITY_STYLES[report.severity] ?? ""
                    }`}
                  >
                    {report.severity}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${CATEGORY_STYLES[report.category] ?? ""}`}
                  >
                    {report.category}
                  </Badge>
                  {report.page_path && (
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {report.page_path}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDate(report.created_at)}
                    {report.user_role && ` · ${report.user_role}`}
                  </span>
                </div>

                {/* What were you trying to do */}
                {report.what_were_you_trying && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      What they were trying to do
                    </p>
                    <p className="text-sm">{report.what_were_you_trying}</p>
                  </div>
                )}

                {/* Message */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">What happened</p>
                  <p className="text-sm whitespace-pre-wrap">{report.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

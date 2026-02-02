import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, TrendingDown, Calendar } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">
          Track bills, expenses, and manage your budget
        </p>
      </div>

      {/* Quick Stats Placeholder */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              Bill tracking in Sprint 2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              Expense tracking in Sprint 2
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Healthcare Costs</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              Health-finance overlap in Sprint 3
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-red-100 p-2 text-red-600">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Bills & Due Dates</CardTitle>
              <CardDescription>Never miss a payment</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 2: Add recurring bills, set reminders, and track
              payment history.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Budget & Expenses</CardTitle>
              <CardDescription>Track where your money goes</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Coming in Sprint 2: Set budgets by category, log expenses, and
              view spending trends.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spending Overview
          </CardTitle>
          <CardDescription>
            Track your expenses and budget progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">
              Spending charts coming in Sprint 2
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { startOfMonth, endOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SpendingPage() {
  const now = new Date();
  const { data: expenses = [], isLoading } = trpc.expenses.getByDateRange.useQuery({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });

  const totalThisMonth = expenses.reduce((sum, e) => sum + e.amount, 0);

  const dailyData = expenses.reduce<Record<string, number>>((acc, e) => {
    const day = formatDate(e.date);
    acc[day] = (acc[day] ?? 0) + e.amount;
    return acc;
  }, {});

  const chartData = Object.entries(dailyData)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Spending Tracker</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">This Month</p>{isLoading ? <Skeleton className="h-7 w-28 mt-1" /> : <p className="text-2xl font-bold">{formatCurrency(totalThisMonth)}</p>}</CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Transactions</p>{isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : <p className="text-2xl font-bold">{expenses.length}</p>}</CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Daily Average</p>{isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : <p className="text-2xl font-bold">{formatCurrency(expenses.length > 0 ? totalThisMonth / new Date().getDate() : 0)}</p>}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Daily Spending (Last 14 days)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64" /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.split(",")[0]} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Spent"]} />
                <Bar dataKey="amount" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.slice(0, 10).map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{e.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(e.date)}{e.budgetCategory ? ` · ${e.budgetCategory.name}` : ""}</p>
                </div>
                <p className="font-semibold">{formatCurrency(e.amount)}</p>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No spending data this month</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, AlertCircle } from "lucide-react";

export default function BudgetPage() {
  const { data: budget, isLoading } = trpc.budgets.getCurrent.useQuery();

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  if (!budget) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Budget</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No active budget. Create one to start tracking your spending.</p>
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href="/budget/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Budget
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.expenses.reduce((s, e) => s + e.amount, 0), 0);
  const percentUsed = budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Budget</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/budget/${budget.id}/edit`}>Edit Budget</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/budget/expenses">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{budget.name}</CardTitle>
          <CardDescription>{budget.period} budget</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{formatCurrency(totalSpent)} spent</span>
            <span className="text-muted-foreground">{formatCurrency(budget.amount)} total</span>
          </div>
          <Progress value={Math.min(percentUsed, 100)} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className={percentUsed > 90 ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
              {formatCurrency(budget.amount - totalSpent)} remaining
            </span>
            <Badge variant={percentUsed > 90 ? "destructive" : "secondary"}>{Math.round(percentUsed)}% used</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h2 className="text-lg font-semibold">Categories</h2>
        {budget.categories.map((cat) => {
          const spent = cat.expenses.reduce((s, e) => s + e.amount, 0);
          const pct = cat.allocated > 0 ? (spent / cat.allocated) * 100 : 0;
          return (
            <Card key={cat.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(spent)} / {formatCurrency(cat.allocated)}
                  </p>
                </div>
                <Progress value={Math.min(pct, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(pct)}% used · {formatCurrency(cat.allocated - spent)} left
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

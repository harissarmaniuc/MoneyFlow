"use client";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, getNextDueDate } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, PiggyBank, CreditCard, RefreshCw, Cake, Bell, TrendingDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: bills = [], isLoading: billsLoading } = trpc.bills.getAll.useQuery();
  const { data: subscriptions = [], isLoading: subsLoading } = trpc.subscriptions.getActive.useQuery();
  const { data: debts = [], isLoading: debtsLoading } = trpc.debts.getAll.useQuery();
  const { data: budget } = trpc.budgets.getCurrent.useQuery();
  const { data: upcomingBirthdays = [] } = trpc.contacts.getUpcoming.useQuery({ days: 30 });
  const { data: reminders = [] } = trpc.reminders.getUpcoming.useQuery({ days: 7 });

  const totalMonthlyBills = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalMonthlySubs = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);

  const budgetSpent = budget?.categories.reduce((sum, cat) => sum + cat.expenses.reduce((s, e) => s + e.amount, 0), 0) ?? 0;
  const budgetTotal = budget?.amount ?? 0;

  const upcomingBills = bills
    .filter((b) => {
      const nextDue = getNextDueDate(b.dueDay);
      const diff = (nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    })
    .slice(0, 5);

  const isLoading = billsLoading || subsLoading || debtsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground">Your financial overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Bills</p>
                {isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : <p className="text-2xl font-bold">{formatCurrency(totalMonthlyBills)}</p>}
              </div>
              <FileText className="h-9 w-9 text-blue-500 bg-blue-50 p-2 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscriptions</p>
                {isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : <p className="text-2xl font-bold">{formatCurrency(totalMonthlySubs)}</p>}
              </div>
              <RefreshCw className="h-9 w-9 text-purple-500 bg-purple-50 p-2 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Debt</p>
                {isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>}
              </div>
              <CreditCard className="h-9 w-9 text-red-500 bg-red-50 p-2 rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget Used</p>
                {isLoading ? <Skeleton className="h-7 w-24 mt-1" /> : (
                  <p className="text-2xl font-bold">
                    {budgetTotal > 0 ? `${Math.round((budgetSpent / budgetTotal) * 100)}%` : "N/A"}
                  </p>
                )}
              </div>
              <PiggyBank className="h-9 w-9 text-emerald-500 bg-emerald-50 p-2 rounded-lg" />
            </div>
            {budgetTotal > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{formatCurrency(budgetSpent)} / {formatCurrency(budgetTotal)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Upcoming Bills</CardTitle>
            <Button asChild variant="ghost" size="sm"><Link href="/bills">View all</Link></Button>
          </CardHeader>
          <CardContent>
            {upcomingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No bills due in the next 7 days</p>
            ) : (
              <div className="space-y-3">
                {upcomingBills.map((bill) => {
                  const nextDue = getNextDueDate(bill.dueDay);
                  const diff = Math.ceil((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={bill.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{bill.name}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDate(nextDue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(bill.amount)}</p>
                        <Badge variant={diff <= 2 ? "destructive" : "secondary"} className="text-xs">
                          {diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : `${diff}d`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Birthdays & Reminders */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Cake className="h-4 w-4" />Upcoming Birthdays</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link href="/birthdays">View all</Link></Button>
            </CardHeader>
            <CardContent>
              {upcomingBirthdays.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No birthdays in the next 30 days</p>
              ) : (
                <div className="space-y-2">
                  {upcomingBirthdays.slice(0, 3).map((contact) => {
                    const bday = new Date(contact.birthday);
                    const thisYear = new Date(new Date().getFullYear(), bday.getMonth(), bday.getDate());
                    return (
                      <div key={contact.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-muted-foreground">{thisYear.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Reminders</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link href="/reminders">View all</Link></Button>
            </CardHeader>
            <CardContent>
              {reminders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No reminders this week</p>
              ) : (
                <div className="space-y-2">
                  {reminders.slice(0, 3).map((reminder) => (
                    <div key={reminder.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{reminder.title}</span>
                      <span className="text-muted-foreground">{formatDate(reminder.dueAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Common tasks at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/bills/new", label: "Add Bill", icon: FileText, color: "text-blue-600 bg-blue-50" },
              { href: "/budget", label: "View Budget", icon: PiggyBank, color: "text-emerald-600 bg-emerald-50" },
              { href: "/debts", label: "Track Debt", icon: TrendingDown, color: "text-red-600 bg-red-50" },
              { href: "/subscriptions/new", label: "Add Sub", icon: RefreshCw, color: "text-purple-600 bg-purple-50" },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                  <action.icon className={`h-6 w-6 ${action.color} p-1 rounded`} />
                  <span className="text-xs font-medium text-center">{action.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

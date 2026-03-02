"use client";
import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, getNextDueDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function BillsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: bills = [], isLoading } = trpc.bills.getAll.useQuery();
  const deleteBill = trpc.bills.delete.useMutation({ onSuccess: () => utils.bills.getAll.invalidate() });
  const markPaid = trpc.bills.markPaid.useMutation({ onSuccess: () => utils.bills.getAll.invalidate() });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bill?")) return;
    await deleteBill.mutateAsync({ id });
    toast({ title: "Bill deleted" });
  };

  const handleMarkPaid = async (billId: string, amount: number) => {
    await markPaid.mutateAsync({ billId, amount });
    toast({ title: "Bill marked as paid!" });
  };

  const totalMonthly = bills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bills</h1>
          <p className="text-muted-foreground">Total monthly: {formatCurrency(totalMonthly)}</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/bills/new"><Plus className="mr-2 h-4 w-4" />Add Bill</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No bills yet. Add your first bill!</p>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/bills/new"><Plus className="mr-2 h-4 w-4" />Add Bill</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bills.map((bill) => {
            const nextDue = getNextDueDate(bill.dueDay);
            const diff = Math.ceil((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isOverdue = diff < 0;
            return (
              <Card key={bill.id} className={isOverdue ? "border-red-200 bg-red-50" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{bill.name}</p>
                        <Badge variant="secondary" className="text-xs">{bill.category}</Badge>
                        {bill.autoPay && <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300">Auto-pay</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Due: {formatDate(nextDue)} · {bill.recurrence}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatCurrency(bill.amount)}</p>
                        <Badge variant={isOverdue ? "destructive" : diff <= 3 ? "destructive" : "secondary"} className="text-xs">
                          {isOverdue ? "Overdue" : diff === 0 ? "Due today" : `${diff}d left`}
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => handleMarkPaid(bill.id, bill.amount)}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(bill.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

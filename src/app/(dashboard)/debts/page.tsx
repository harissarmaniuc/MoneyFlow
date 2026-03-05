"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, TrendingDown, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function DebtsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: debts = [], isLoading } = trpc.debts.getAll.useQuery();
  const [addPaymentId, setAddPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const addPayment = trpc.debts.addPayment.useMutation({
    onSuccess: async () => {
      await utils.debts.getAll.invalidate();
      setAddPaymentId(null);
      setPaymentAmount("");
      toast({ title: "Payment recorded!" });
    },
  });

  const totalDebt = debts.reduce((sum, d) => sum + d.currentBalance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Debts</h1>
          <p className="text-muted-foreground">Total: {formatCurrency(totalDebt)}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/debts/simulator">Payoff Simulator</Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/debts/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Debt
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : debts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No debts tracked. Add your debts to see your payoff plan.</p>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/debts/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Debt
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {debts.map((debt) => {
            const pctPaid = debt.originalBalance > 0 ? ((debt.originalBalance - debt.currentBalance) / debt.originalBalance) * 100 : 0;
            return (
              <Card key={debt.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{debt.name}</p>
                        <Badge variant="secondary">{debt.type.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {debt.interestRate}% APR · Min payment: {formatCurrency(debt.minimumPayment)}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(debt.currentBalance)}</p>
                  </div>
                  <Progress value={pctPaid} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{Math.round(pctPaid)}% paid off</p>
                  {addPaymentId === debt.id ? (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Payment amount"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      />
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={async () => {
                          const amount = parseFloat(paymentAmount);
                          if (!Number.isFinite(amount) || amount <= 0) {
                            toast({ title: "Invalid amount", variant: "destructive" });
                            return;
                          }
                          await addPayment.mutateAsync({ debtId: debt.id, amount });
                        }}
                        disabled={addPayment.isPending}
                      >
                        Record
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAddPaymentId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddPaymentId(debt.id)}>
                      <TrendingDown className="mr-1 h-3.5 w-3.5" />
                      Make Payment
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

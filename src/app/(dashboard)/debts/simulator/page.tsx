"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { calculateDebtPayoff } from "@/server/services/debt-calculator.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";
import type { PayoffMethod } from "@/types";

export default function DebtSimulatorPage() {
  const { data: debts = [] } = trpc.debts.getAll.useQuery();
  const [extraPayment, setExtraPayment] = useState("0");
  const [method, setMethod] = useState<PayoffMethod>("avalanche");
  const [plans, setPlans] = useState<ReturnType<typeof calculateDebtPayoff> | null>(null);

  const runSimulation = () => {
    const result = calculateDebtPayoff(debts, parseFloat(extraPayment) || 0, method);
    setPlans(result);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/debts"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold">Debt Payoff Simulator</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Simulation Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Extra Monthly Payment ($)</Label>
              <Input type="number" step="0.01" value={extraPayment} onChange={(e) => setExtraPayment(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Payoff Strategy</Label>
              <div className="flex gap-2">
                <Button variant={method === "avalanche" ? "default" : "outline"} size="sm" onClick={() => setMethod("avalanche")} className={method === "avalanche" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>Avalanche</Button>
                <Button variant={method === "snowball" ? "default" : "outline"} size="sm" onClick={() => setMethod("snowball")} className={method === "snowball" ? "bg-emerald-600 hover:bg-emerald-700" : ""}>Snowball</Button>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{method === "avalanche" ? "Avalanche: Pay highest interest rate first (saves most money)" : "Snowball: Pay smallest balance first (psychological wins)"}</p>
          <Button onClick={runSimulation} className="bg-emerald-600 hover:bg-emerald-700" disabled={debts.length === 0}>
            <Calculator className="mr-2 h-4 w-4" />Run Simulation
          </Button>
          {debts.length === 0 && <p className="text-sm text-muted-foreground">Add debts first to run a simulation.</p>}
        </CardContent>
      </Card>

      {plans && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Payoff Plan</h2>
          {plans.map((plan) => (
            <Card key={plan.debtId}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">Payoff date: {plan.payoffDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total interest</p>
                    <p className="font-semibold text-red-600">{formatCurrency(plan.totalInterest)}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.schedule.length} months to pay off</p>
              </CardContent>
            </Card>
          ))}
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="py-4">
              <p className="font-semibold text-emerald-800">Total interest paid: {formatCurrency(plans.reduce((s, p) => s + p.totalInterest, 0))}</p>
              <p className="text-sm text-emerald-700">Longest payoff: {Math.max(...plans.map(p => p.schedule.length))} months</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

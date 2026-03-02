"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { DEBT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import type { DebtType } from "@prisma/client";

export default function NewDebtPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createDebt = trpc.debts.create.useMutation();
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("CREDIT_CARD");
  const [originalBalance, setOriginalBalance] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDebt.mutateAsync({ name, type, originalBalance: parseFloat(originalBalance), currentBalance: parseFloat(currentBalance), interestRate: parseFloat(interestRate), minimumPayment: parseFloat(minimumPayment), startDate: new Date(startDate) });
      toast({ title: "Debt added!" });
      router.push("/debts");
    } catch {
      toast({ title: "Error", description: "Failed to add debt", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/debts"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold">Add Debt</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Debt Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="e.g. Chase Credit Card" value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Type</Label><Select value={type} onValueChange={(v) => setType(v as DebtType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DEBT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Original Balance ($)</Label><Input type="number" step="0.01" value={originalBalance} onChange={(e) => setOriginalBalance(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Current Balance ($)</Label><Input type="number" step="0.01" value={currentBalance} onChange={(e) => setCurrentBalance(e.target.value)} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Interest Rate (%)</Label><Input type="number" step="0.01" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Minimum Payment ($)</Label><Input type="number" step="0.01" value={minimumPayment} onChange={(e) => setMinimumPayment(e.target.value)} required /></div>
            </div>
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createDebt.isPending}>{createDebt.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Add Debt</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

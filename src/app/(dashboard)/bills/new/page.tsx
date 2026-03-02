"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { BILL_CATEGORIES, RECURRENCE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import type { BillCategory, Recurrence } from "@prisma/client";

export default function NewBillPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createBill = trpc.bills.create.useMutation();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<BillCategory>("CUSTOM");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [recurrence, setRecurrence] = useState<Recurrence>("MONTHLY");
  const [autoPay, setAutoPay] = useState(false);
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBill.mutateAsync({ name, category, amount: parseFloat(amount), dueDay: parseInt(dueDay), recurrence, autoPay, notes: notes || undefined });
      toast({ title: "Bill added successfully!" });
      router.push("/bills");
    } catch {
      toast({ title: "Error", description: "Failed to create bill", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/bills"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold">Add New Bill</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Bill Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g. Electric Bill" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as BillCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BILL_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Day (1-31)</Label>
                <Input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RECURRENCE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={autoPay} onCheckedChange={setAutoPay} />
              <Label>Auto-pay enabled</Label>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createBill.isPending}>
                {createBill.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add Bill
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

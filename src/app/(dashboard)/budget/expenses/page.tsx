"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

export default function ExpensesPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: budget } = trpc.budgets.getCurrent.useQuery();
  const { data: allExpenses = [] } = trpc.expenses.getAll.useQuery();
  const createExpense = trpc.expenses.create.useMutation({ onSuccess: () => utils.expenses.getAll.invalidate() });
  const deleteExpense = trpc.expenses.delete.useMutation({ onSuccess: () => utils.expenses.getAll.invalidate() });

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExpense.mutateAsync({ description, amount: parseFloat(amount), date: new Date(date), budgetCategoryId: categoryId || undefined });
      toast({ title: "Expense added!" });
      setDescription(""); setAmount(""); setCategoryId("");
    } catch {
      toast({ title: "Error", description: "Failed to add expense", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/budget"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold">Expenses</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Add Expense</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Coffee, groceries..." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {budget?.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createExpense.isPending}>
              {createExpense.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add Expense
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Expenses</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allExpenses.slice(0, 20).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(expense.date)}{expense.budgetCategory ? ` · ${expense.budgetCategory.name}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(expense.amount)}</span>
                  <Button size="sm" variant="ghost" className="text-red-500 h-7 w-7 p-0" onClick={() => deleteExpense.mutate({ id: expense.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {allExpenses.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">No expenses yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

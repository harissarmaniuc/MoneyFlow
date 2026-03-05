"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BUDGET_PERIODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { BudgetPeriod } from "@prisma/client";

type CategoryDraft = { id: string; name: string; allocated: string };

export default function NewBudgetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const createBudget = trpc.budgets.create.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.budgets.getAll.invalidate(), utils.budgets.getCurrent.invalidate()]);
    },
  });

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("MONTHLY");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [rollover, setRollover] = useState(false);
  const [categories, setCategories] = useState<CategoryDraft[]>([
    { id: crypto.randomUUID(), name: "", allocated: "" },
  ]);

  const updateCategory = (id: string, patch: Partial<CategoryDraft>) => {
    setCategories((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addCategory = () => {
    setCategories((prev) => [...prev, { id: crypto.randomUUID(), name: "", allocated: "" }]);
  };

  const removeCategory = (id: string) => {
    setCategories((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedCategories = categories
        .filter((item) => item.name.trim() && item.allocated)
        .map((item) => ({ name: item.name.trim(), allocated: parseFloat(item.allocated) }));

      await createBudget.mutateAsync({
        name: name.trim(),
        amount: parseFloat(amount),
        period,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        rollover,
        categories: parsedCategories.length ? parsedCategories : undefined,
      });
      toast({ title: "Budget created" });
      router.push("/budget");
    } catch {
      toast({ title: "Error", description: "Failed to create budget", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/budget">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Budget</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Monthly Household Budget" required />
              </div>
              <div className="space-y-2">
                <Label>Total Amount ($)</Label>
                <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as BudgetPeriod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_PERIODS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>End Date (optional)</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={rollover} onCheckedChange={setRollover} />
              <Label>Enable rollover to next period</Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Categories (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCategory}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              </div>

              {categories.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_180px_auto] gap-2">
                  <Input
                    placeholder="Category name"
                    value={item.name}
                    onChange={(e) => updateCategory(item.id, { name: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Allocated"
                    value={item.allocated}
                    onChange={(e) => updateCategory(item.id, { allocated: e.target.value })}
                  />
                  <Button type="button" variant="ghost" onClick={() => removeCategory(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createBudget.isPending}>
                {createBudget.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create Budget
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

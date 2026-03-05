"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { BUDGET_PERIODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import type { BudgetPeriod } from "@prisma/client";

export default function EditBudgetPage() {
  const params = useParams<{ id: string }>();
  const budgetId = params.id;
  const router = useRouter();
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: budget, isLoading } = trpc.budgets.getById.useQuery({ id: budgetId });

  const updateBudget = trpc.budgets.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.budgets.getById.invalidate({ id: budgetId }),
        utils.budgets.getCurrent.invalidate(),
        utils.budgets.getAll.invalidate(),
      ]);
    },
  });
  const addCategory = trpc.budgets.addCategory.useMutation({
    onSuccess: async () => {
      await utils.budgets.getById.invalidate({ id: budgetId });
    },
  });
  const updateCategory = trpc.budgets.updateCategory.useMutation({
    onSuccess: async () => {
      await utils.budgets.getById.invalidate({ id: budgetId });
    },
  });
  const deleteCategory = trpc.budgets.deleteCategory.useMutation({
    onSuccess: async () => {
      await utils.budgets.getById.invalidate({ id: budgetId });
    },
  });

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("MONTHLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rollover, setRollover] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryAllocated, setNewCategoryAllocated] = useState("");

  useEffect(() => {
    if (!budget) return;
    setName(budget.name);
    setAmount(String(budget.amount));
    setPeriod(budget.period);
    setStartDate(new Date(budget.startDate).toISOString().split("T")[0]);
    setEndDate(budget.endDate ? new Date(budget.endDate).toISOString().split("T")[0] : "");
    setRollover(budget.rollover);
  }, [budget]);

  if (isLoading) {
    return <Skeleton className="h-80" />;
  }

  if (!budget) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Budget not found.</p>
        <Button asChild variant="outline">
          <Link href="/budget">Back</Link>
        </Button>
      </div>
    );
  }

  const handleSaveBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await updateBudget.mutateAsync({
        id: budgetId,
        data: {
          name: name.trim(),
          amount: parseFloat(amount),
          period,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : undefined,
          rollover,
        },
      });
      toast({ title: "Budget updated" });
      router.push("/budget");
    } catch {
      toast({ title: "Error", description: "Failed to update budget", variant: "destructive" });
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !newCategoryAllocated) return;

    try {
      await addCategory.mutateAsync({
        budgetId,
        data: { name: newCategoryName.trim(), allocated: parseFloat(newCategoryAllocated) },
      });
      setNewCategoryName("");
      setNewCategoryAllocated("");
      toast({ title: "Category added" });
    } catch {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
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
        <h1 className="text-2xl font-bold">Edit Budget</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
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
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={rollover} onCheckedChange={setRollover} />
              <Label>Enable rollover</Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={updateBudget.isPending}>
                {updateBudget.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {budget.categories.map((category) => (
            <div key={category.id} className="grid grid-cols-[1fr_180px_auto] gap-2 items-center">
              <Input
                defaultValue={category.name}
                onBlur={(e) =>
                  updateCategory.mutate({
                    id: category.id,
                    data: { name: e.currentTarget.value.trim() || category.name },
                  })
                }
              />
              <Input
                type="number"
                step="0.01"
                defaultValue={category.allocated}
                onBlur={(e) =>
                  updateCategory.mutate({
                    id: category.id,
                    data: { allocated: parseFloat(e.currentTarget.value) || category.allocated },
                  })
                }
              />
              <Button type="button" variant="ghost" onClick={() => deleteCategory.mutate({ id: category.id })}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}

          <form onSubmit={handleAddCategory} className="grid grid-cols-[1fr_180px_auto] gap-2 pt-2">
            <Input
              placeholder="New category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Allocated"
              value={newCategoryAllocated}
              onChange={(e) => setNewCategoryAllocated(e.target.value)}
            />
            <Button type="submit" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

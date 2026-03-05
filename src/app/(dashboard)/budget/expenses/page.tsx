"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Loader2, Upload, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type CsvExpenseRow = {
  description: string;
  amount: number;
  date: Date;
  budgetCategoryId?: string;
};

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExpensesPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const { data: budget } = trpc.budgets.getCurrent.useQuery();
  const { data: allExpenses = [] } = trpc.expenses.getAll.useQuery();
  const createExpense = trpc.expenses.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.expenses.getAll.invalidate(),
        utils.expenses.getByDateRange.invalidate(),
      ]);
    },
  });
  const createManyExpenses = trpc.expenses.createMany.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.expenses.getAll.invalidate(),
        utils.expenses.getByDateRange.invalidate(),
      ]);
    },
  });
  const deleteExpense = trpc.expenses.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.expenses.getAll.invalidate(),
        utils.expenses.getByDateRange.invalidate(),
      ]);
    },
  });

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("__none");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExpense.mutateAsync({
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        budgetCategoryId: categoryId === "__none" ? undefined : categoryId,
      });
      toast({ title: "Expense added" });
      setDescription("");
      setAmount("");
      setCategoryId("__none");
    } catch {
      toast({ title: "Error", description: "Failed to add expense", variant: "destructive" });
    }
  };

  const handleExportCsv = () => {
    const rows: string[][] = [
      ["description", "amount", "date", "category"],
      ...allExpenses.map((expense) => [
        expense.description,
        String(expense.amount),
        new Date(expense.date).toISOString().split("T")[0],
        expense.budgetCategory?.name ?? "",
      ]),
    ];
    downloadCsv("expenses.csv", rows);
  };

  const handleImportCsv = async (file: File) => {
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        toast({ title: "Error", description: "CSV has no data rows", variant: "destructive" });
        return;
      }

      const header = rows[0].map((h) => h.toLowerCase());
      const descriptionIdx = header.indexOf("description");
      const amountIdx = header.indexOf("amount");
      const dateIdx = header.indexOf("date");
      const categoryIdx = header.indexOf("category");
      if (descriptionIdx === -1 || amountIdx === -1 || dateIdx === -1) {
        toast({
          title: "Error",
          description: "CSV headers must include description, amount, date",
          variant: "destructive",
        });
        return;
      }

      const categoryByName = new Map(
        (budget?.categories ?? []).map((c) => [c.name.toLowerCase(), c.id])
      );

      const items: CsvExpenseRow[] = rows.slice(1).map((row) => {
        const categoryName = categoryIdx >= 0 ? row[categoryIdx]?.toLowerCase() : "";
        return {
          description: row[descriptionIdx],
          amount: parseFloat(row[amountIdx]),
          date: new Date(row[dateIdx]),
          budgetCategoryId: categoryName ? categoryByName.get(categoryName) : undefined,
        };
      }).filter((item) => item.description && Number.isFinite(item.amount) && !Number.isNaN(item.date.getTime()));

      if (!items.length) {
        toast({ title: "Error", description: "No valid rows found in CSV", variant: "destructive" });
        return;
      }

      await createManyExpenses.mutateAsync({ items });
      toast({ title: `Imported ${items.length} expenses` });
    } catch {
      toast({ title: "Error", description: "Failed to import CSV", variant: "destructive" });
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/budget">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Expenses</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => importInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportCsv(file);
            }}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No category</SelectItem>
                    {budget?.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
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
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allExpenses.slice(0, 20).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(expense.date)}
                    {expense.budgetCategory ? ` · ${expense.budgetCategory.name}` : ""}
                  </p>
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

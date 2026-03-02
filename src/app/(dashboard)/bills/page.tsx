"use client";

import { useRef } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, getNextDueDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, CheckCircle, Trash2, AlertCircle, Upload, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { BillCategory, Recurrence } from "@prisma/client";

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

export default function BillsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const { data: bills = [], isLoading } = trpc.bills.getAll.useQuery();
  const deleteBill = trpc.bills.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.bills.getAll.invalidate(), utils.bills.getById.invalidate()]);
    },
  });
  const markPaid = trpc.bills.markPaid.useMutation({
    onSuccess: async () => {
      await utils.bills.getAll.invalidate();
    },
  });
  const createManyBills = trpc.bills.createMany.useMutation({
    onSuccess: async () => {
      await utils.bills.getAll.invalidate();
    },
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bill?")) return;
    await deleteBill.mutateAsync({ id });
    toast({ title: "Bill deleted" });
  };

  const handleMarkPaid = async (billId: string, amount: number) => {
    await markPaid.mutateAsync({ billId, amount });
    toast({ title: "Bill marked as paid" });
  };

  const totalMonthly = bills.reduce((sum, b) => sum + b.amount, 0);

  const handleExportCsv = () => {
    const rows: string[][] = [
      ["name", "category", "amount", "currency", "dueDay", "recurrence", "autoPay", "notes"],
      ...bills.map((bill) => [
        bill.name,
        bill.category,
        String(bill.amount),
        bill.currency,
        String(bill.dueDay),
        bill.recurrence,
        String(bill.autoPay),
        bill.notes ?? "",
      ]),
    ];
    downloadCsv("bills.csv", rows);
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
      const idx = {
        name: header.indexOf("name"),
        category: header.indexOf("category"),
        amount: header.indexOf("amount"),
        currency: header.indexOf("currency"),
        dueDay: header.indexOf("dueday"),
        recurrence: header.indexOf("recurrence"),
        autoPay: header.indexOf("autopay"),
        notes: header.indexOf("notes"),
      };
      if (idx.name === -1 || idx.category === -1 || idx.amount === -1 || idx.dueDay === -1 || idx.recurrence === -1) {
        toast({
          title: "Error",
          description: "CSV headers must include name, category, amount, dueDay, recurrence",
          variant: "destructive",
        });
        return;
      }

      const items = rows.slice(1).map((row) => ({
        name: row[idx.name],
        category: row[idx.category] as BillCategory,
        amount: parseFloat(row[idx.amount]),
        currency: idx.currency >= 0 ? row[idx.currency] || "USD" : "USD",
        dueDay: parseInt(row[idx.dueDay], 10),
        recurrence: row[idx.recurrence] as Recurrence,
        autoPay: idx.autoPay >= 0 ? row[idx.autoPay]?.toLowerCase() === "true" : false,
        notes: idx.notes >= 0 ? row[idx.notes] || undefined : undefined,
      })).filter((item) => item.name && Number.isFinite(item.amount) && Number.isFinite(item.dueDay));

      if (!items.length) {
        toast({ title: "Error", description: "No valid rows found in CSV", variant: "destructive" });
        return;
      }

      await createManyBills.mutateAsync({ items });
      toast({ title: `Imported ${items.length} bills` });
    } catch {
      toast({ title: "Error", description: "Failed to import CSV", variant: "destructive" });
    } finally {
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bills</h1>
          <p className="text-muted-foreground">Total monthly: {formatCurrency(totalMonthly)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => importInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
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
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/bills/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Bill
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No bills yet. Add your first bill!</p>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/bills/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Bill
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bills.map((bill) => {
            const nextDue = getNextDueDate(bill.dueDay);
            const diff = Math.ceil((nextDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <Card key={bill.id}>
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
                        <Badge variant={diff <= 2 ? "destructive" : "secondary"} className="text-xs">
                          {diff === 0 ? "Due today" : `${diff}d left`}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                        onClick={() => handleMarkPaid(bill.id, bill.amount)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(bill.id)}
                      >
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

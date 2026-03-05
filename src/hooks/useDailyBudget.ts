"use client";

import { trpc } from "@/lib/trpc";
import { startOfDay, endOfDay } from "date-fns";

export function useDailyBudget() {
  const today = new Date();
  const { data: expenses = [] } = trpc.expenses.getByDateRange.useQuery({
    start: startOfDay(today),
    end: endOfDay(today),
  });

  const totalToday = expenses.reduce((sum, e) => sum + e.amount, 0);

  return { expenses, totalToday };
}

import type { Budget, BudgetCategory, Expense } from "@prisma/client";

export type BudgetWithFull = Budget & {
  categories: (BudgetCategory & { expenses: Expense[] })[];
};

export function calculateBudgetUsage(budget: BudgetWithFull) {
  const totalAllocated = budget.categories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = budget.categories.reduce(
    (sum, cat) => sum + cat.expenses.reduce((s, e) => s + e.amount, 0),
    0
  );

  const categories = budget.categories.map((cat) => {
    const spent = cat.expenses.reduce((s, e) => s + e.amount, 0);
    return {
      id: cat.id,
      name: cat.name,
      allocated: cat.allocated,
      spent,
      remaining: cat.allocated - spent,
      percentage: cat.allocated > 0 ? (spent / cat.allocated) * 100 : 0,
    };
  });

  return {
    totalAllocated,
    totalSpent,
    totalRemaining: totalAllocated - totalSpent,
    percentageUsed: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
    categories,
  };
}

export function calculateDailyBudget(budget: BudgetWithFull): number {
  const now = new Date();
  const endDate = budget.endDate ?? new Date(budget.startDate.getFullYear(), budget.startDate.getMonth() + 1, budget.startDate.getDate());
  const daysRemaining = Math.max(1, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const totalSpent = budget.categories.reduce(
    (sum, cat) => sum + cat.expenses.reduce((s, e) => s + e.amount, 0),
    0
  );
  const remaining = budget.amount - totalSpent;
  return remaining / daysRemaining;
}

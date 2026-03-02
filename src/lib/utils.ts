import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelativeDate(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getDaysUntil(date: Date | string): number {
  return differenceInDays(new Date(date), new Date());
}

export function getNextDueDate(dueDay: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const candidate = new Date(year, month, dueDay);
  if (candidate <= now) {
    return new Date(year, month + 1, dueDay);
  }
  return candidate;
}

export function calculateMonthlyAmount(amount: number, billingCycle: string): number {
  switch (billingCycle) {
    case "WEEKLY": return amount * 52 / 12;
    case "BIWEEKLY": return amount * 26 / 12;
    case "MONTHLY": return amount;
    case "QUARTERLY": return amount / 3;
    case "YEARLY": return amount / 12;
    default: return amount;
  }
}

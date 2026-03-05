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

function getValidDayOfMonth(year: number, month: number, day: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(1, day), daysInMonth);
}

function dateAtLocalNoon(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function getNextDueDate(dueDay: number, fromDate = new Date()): Date {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const candidate = dateAtLocalNoon(year, month, getValidDayOfMonth(year, month, dueDay));
  if (candidate <= fromDate) {
    const nextMonth = month + 1;
    const nextYear = year + Math.floor(nextMonth / 12);
    const normalizedNextMonth = nextMonth % 12;
    return dateAtLocalNoon(
      nextYear,
      normalizedNextMonth,
      getValidDayOfMonth(nextYear, normalizedNextMonth, dueDay)
    );
  }
  return candidate;
}

export function getNextBirthdayDate(birthday: Date | string, fromDate = new Date()): Date {
  const bday = new Date(birthday);
  const year = fromDate.getFullYear();
  const thisYearDate = dateAtLocalNoon(
    year,
    bday.getMonth(),
    getValidDayOfMonth(year, bday.getMonth(), bday.getDate())
  );

  if (thisYearDate >= fromDate) return thisYearDate;

  const nextYear = year + 1;
  return dateAtLocalNoon(
    nextYear,
    bday.getMonth(),
    getValidDayOfMonth(nextYear, bday.getMonth(), bday.getDate())
  );
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

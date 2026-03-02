import type { Bill, Budget, BudgetCategory, Contact, Debt, DebtPayment, Expense, Gift, MaintenanceRecord, Notification, Reminder, Subscription, Vehicle, BillPayment } from "@prisma/client";

export type BillWithPayments = Bill & { payments: BillPayment[] };
export type BudgetWithCategories = Budget & { categories: (BudgetCategory & { expenses: Expense[] })[] };
export type DebtWithPayments = Debt & { payments: DebtPayment[] };
export type ContactWithGifts = Contact & { gifts: Gift[] };
export type VehicleWithRecords = Vehicle & { records: MaintenanceRecord[] };

export type PayoffMethod = "avalanche" | "snowball";

export interface DebtPayoffPlan {
  debtId: string;
  name: string;
  payoffDate: Date;
  totalInterest: number;
  monthlyPayment: number;
  schedule: PayoffScheduleItem[];
}

export interface PayoffScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface DashboardStats {
  totalMonthlyBills: number;
  totalMonthlySubscriptions: number;
  totalDebt: number;
  upcomingBills: BillWithPayments[];
  upcomingBirthdays: Contact[];
  monthlyBudgetUsed: number;
  monthlyBudgetTotal: number;
}

export interface SpendingData {
  date: string;
  amount: number;
  category?: string;
}

export type NotificationWithUser = Notification & { user: { email: string; name: string | null } };

import { addMonths, subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../index";
import { calculateMonthlyAmount } from "@/lib/utils";

export const analyticsRouter = createTRPCRouter({
  getOverview: protectedProcedure
    .input(z.object({ months: z.number().int().min(3).max(24).default(6) }).optional())
    .query(async ({ ctx, input }) => {
      const monthsCount = input?.months ?? 6;
      const now = new Date();
      const firstMonthStart = startOfMonth(subMonths(now, monthsCount - 1));
      const lastMonthEnd = endOfMonth(now);

      const [expenses, bills, subscriptions] = await Promise.all([
        ctx.prisma.expense.findMany({
          where: {
            userId: ctx.session.user.id,
            date: { gte: firstMonthStart, lte: lastMonthEnd },
          },
          select: { amount: true, date: true },
        }),
        ctx.prisma.bill.findMany({
          where: { userId: ctx.session.user.id },
          select: { amount: true, recurrence: true },
        }),
        ctx.prisma.subscription.findMany({
          where: { userId: ctx.session.user.id, active: true },
          select: { amount: true, billingCycle: true },
        }),
      ]);

      const recurringBillsMonthly = bills.reduce(
        (sum, bill) => sum + calculateMonthlyAmount(bill.amount, bill.recurrence),
        0
      );
      const recurringSubsMonthly = subscriptions.reduce(
        (sum, sub) => sum + calculateMonthlyAmount(sub.amount, sub.billingCycle),
        0
      );

      const monthMap = new Map<string, { label: string; expenses: number }>();
      for (let i = monthsCount - 1; i >= 0; i--) {
        const date = subMonths(now, i);
        const key = format(date, "yyyy-MM");
        monthMap.set(key, { label: format(date, "MMM yyyy"), expenses: 0 });
      }

      for (const expense of expenses) {
        const key = format(expense.date, "yyyy-MM");
        const month = monthMap.get(key);
        if (month) month.expenses += expense.amount;
      }

      const monthly = Array.from(monthMap.entries()).map(([key, data]) => {
        const billsValue = recurringBillsMonthly;
        const subscriptionsValue = recurringSubsMonthly;
        const totalOutflow = billsValue + subscriptionsValue + data.expenses;
        return {
          key,
          label: data.label,
          bills: billsValue,
          subscriptions: subscriptionsValue,
          expenses: data.expenses,
          totalOutflow,
        };
      });

      const recent = monthly.slice(-3);
      const avgRecent = recent.length
        ? recent.reduce((sum, month) => sum + month.totalOutflow, 0) / recent.length
        : 0;

      const forecast = Array.from({ length: 3 }, (_, i) => {
        const date = addMonths(now, i + 1);
        return {
          key: format(date, "yyyy-MM"),
          label: format(date, "MMM yyyy"),
          forecastOutflow: avgRecent,
        };
      });

      return {
        monthly,
        forecast,
        recurringMonthly: recurringBillsMonthly + recurringSubsMonthly,
        averageRecentOutflow: avgRecent,
      };
    }),
});

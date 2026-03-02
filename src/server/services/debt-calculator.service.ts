import type { Debt } from "@prisma/client";
import type { DebtPayoffPlan, PayoffMethod, PayoffScheduleItem } from "@/types";

export function calculateDebtPayoff(
  debts: Debt[],
  extraPayment: number,
  method: PayoffMethod
): DebtPayoffPlan[] {
  const sortedDebts = [...debts].sort((a, b) => {
    if (method === "avalanche") return b.interestRate - a.interestRate;
    return a.currentBalance - b.currentBalance;
  });

  const plans: DebtPayoffPlan[] = sortedDebts.map((debt) => {
    const schedule: PayoffScheduleItem[] = [];
    let balance = debt.currentBalance;
    let month = 0;
    let totalInterest = 0;

    while (balance > 0 && month < 600) {
      month++;
      const interest = (balance * (debt.interestRate / 100)) / 12;
      const payment = Math.min(debt.minimumPayment + (month === 1 ? extraPayment : 0), balance + interest);
      const principal = payment - interest;
      balance = Math.max(0, balance - principal);
      totalInterest += interest;

      schedule.push({ month, payment, principal, interest, balance });
    }

    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + month);

    return {
      debtId: debt.id,
      name: debt.name,
      payoffDate,
      totalInterest,
      monthlyPayment: debt.minimumPayment,
      schedule,
    };
  });

  return plans;
}

export function calculateTotalInterest(debt: Debt): number {
  let balance = debt.currentBalance;
  let totalInterest = 0;
  let month = 0;

  while (balance > 0 && month < 600) {
    month++;
    const interest = (balance * (debt.interestRate / 100)) / 12;
    const payment = Math.min(debt.minimumPayment, balance + interest);
    const principal = payment - interest;
    balance = Math.max(0, balance - principal);
    totalInterest += interest;
  }

  return totalInterest;
}

export function calculatePayoffMonths(debt: Debt, extraPayment = 0): number {
  let balance = debt.currentBalance;
  let months = 0;

  while (balance > 0 && months < 600) {
    months++;
    const interest = (balance * (debt.interestRate / 100)) / 12;
    const payment = debt.minimumPayment + extraPayment;
    const principal = payment - interest;
    if (principal <= 0) return 600;
    balance = Math.max(0, balance - principal);
  }

  return months;
}

import type { Debt } from "@prisma/client";
import type { DebtPayoffPlan, PayoffMethod, PayoffScheduleItem } from "@/types";

export function calculateDebtPayoff(
  debts: Debt[],
  extraPayment: number,
  method: PayoffMethod
): DebtPayoffPlan[] {
  const state = debts.map((debt) => ({
    debtId: debt.id,
    name: debt.name,
    interestRate: debt.interestRate,
    minimumPayment: debt.minimumPayment,
    balance: debt.currentBalance,
    totalInterest: 0,
    payoffMonth: 600,
    schedule: [] as PayoffScheduleItem[],
  }));

  const rankDebts = () =>
    [...state]
      .filter((item) => item.balance > 0)
      .sort((a, b) => {
        if (method === "avalanche") {
          if (b.interestRate !== a.interestRate) return b.interestRate - a.interestRate;
          return a.balance - b.balance;
        }
        if (a.balance !== b.balance) return a.balance - b.balance;
        return b.interestRate - a.interestRate;
      });

  let month = 0;
  while (state.some((item) => item.balance > 0) && month < 600) {
    month++;

    const monthly = new Map<
      string,
      {
        interest: number;
        payment: number;
        due: number;
      }
    >();

    for (const debt of state.filter((item) => item.balance > 0)) {
      const interest = (debt.balance * (debt.interestRate / 100)) / 12;
      const due = debt.balance + interest;
      const payment = Math.min(debt.minimumPayment, due);
      monthly.set(debt.debtId, { interest, payment, due });
    }

    let remainingExtra = Math.max(0, extraPayment);
    for (const debt of rankDebts()) {
      if (remainingExtra <= 0) break;
      const current = monthly.get(debt.debtId);
      if (!current) continue;
      const remainingDue = Math.max(0, current.due - current.payment);
      const extra = Math.min(remainingExtra, remainingDue);
      current.payment += extra;
      remainingExtra -= extra;
    }

    for (const debt of state.filter((item) => item.balance > 0)) {
      const current = monthly.get(debt.debtId);
      if (!current) continue;
      const principal = current.payment - current.interest;
      debt.balance = Math.max(0, debt.balance - principal);
      debt.totalInterest += current.interest;
      debt.schedule.push({
        month,
        payment: current.payment,
        principal,
        interest: current.interest,
        balance: debt.balance,
      });
      if (debt.balance <= 0 && debt.payoffMonth === 600) {
        debt.payoffMonth = month;
      }
    }
  }

  return state.map((debt) => {
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + debt.payoffMonth);
    return {
      debtId: debt.debtId,
      name: debt.name,
      payoffDate,
      totalInterest: debt.totalInterest,
      monthlyPayment: debt.minimumPayment,
      schedule: debt.schedule,
    };
  });
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

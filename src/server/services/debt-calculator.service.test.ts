import { describe, expect, it } from "vitest";
import type { Debt } from "@prisma/client";
import { calculateDebtPayoff } from "./debt-calculator.service";

function debt(overrides: Partial<Debt>): Debt {
  return {
    id: "debt-1",
    userId: "user-1",
    name: "Debt",
    type: "CREDIT_CARD",
    originalBalance: 1000,
    currentBalance: 1000,
    interestRate: 20,
    minimumPayment: 50,
    dueDay: null,
    startDate: new Date("2024-01-01T00:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("calculateDebtPayoff", () => {
  it("uses extra monthly payment to reduce payoff duration", () => {
    const debts = [debt({ id: "a", currentBalance: 1200, interestRate: 18 })];
    const noExtra = calculateDebtPayoff(debts, 0, "avalanche");
    const withExtra = calculateDebtPayoff(debts, 100, "avalanche");
    expect(withExtra[0].schedule.length).toBeLessThan(noExtra[0].schedule.length);
  });

  it("prioritizes highest interest debt first for avalanche", () => {
    const debts = [
      debt({ id: "low", name: "Low APR", currentBalance: 1000, interestRate: 8 }),
      debt({ id: "high", name: "High APR", currentBalance: 1000, interestRate: 24 }),
    ];
    const plans = calculateDebtPayoff(debts, 200, "avalanche");

    const high = plans.find((p) => p.debtId === "high");
    const low = plans.find((p) => p.debtId === "low");
    expect(high && low).toBeTruthy();
    expect(high!.schedule[0].payment).toBeGreaterThan(low!.schedule[0].payment);
  });
});

import { describe, expect, it } from "vitest";
import { getNextBirthdayDate, getNextDueDate } from "./utils";

describe("getNextDueDate", () => {
  it("clamps due day for shorter months", () => {
    const from = new Date("2026-02-10T12:00:00.000Z");
    const due = getNextDueDate(31, from);
    expect(due.getUTCDate()).toBe(28);
    expect(due.getUTCMonth()).toBe(1);
  });

  it("moves to next month when due day has passed", () => {
    const from = new Date("2026-03-20T12:00:00.000Z");
    const due = getNextDueDate(5, from);
    expect(due.getUTCMonth()).toBe(3);
    expect(due.getUTCDate()).toBe(5);
  });
});

describe("getNextBirthdayDate", () => {
  it("handles leap-day birthdays on non-leap years", () => {
    const bday = new Date("2000-02-29T00:00:00.000Z");
    const from = new Date("2026-01-15T12:00:00.000Z");
    const next = getNextBirthdayDate(bday, from);
    expect(next.getUTCFullYear()).toBe(2026);
    expect(next.getUTCMonth()).toBe(1);
    expect(next.getUTCDate()).toBe(28);
  });
});

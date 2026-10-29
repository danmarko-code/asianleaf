import { DUE_DAY } from "@/lib/constants";
import { manilaNow } from "@/lib/dates";

// "YYYY-MM" for the current month in Asia/Manila.
export function currentMonthKey() {
  const { year, month } = manilaNow();
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function isValidMonthKey(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

// Billing periods are stored as UTC midnight on the first of the month.
export function periodFromMonthKey(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

export function dueDateForPeriod(periodStart: Date) {
  return new Date(
    Date.UTC(
      periodStart.getUTCFullYear(),
      periodStart.getUTCMonth(),
      DUE_DAY,
    ),
  );
}

export function monthKeyFromDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function dueBalance(amount: unknown, payments: { amount: unknown }[]) {
  const paid = payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );
  return Math.max(Number(amount) - paid, 0);
}

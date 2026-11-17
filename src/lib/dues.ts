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

// Billing months are "YYYY-MM", so a plain string comparison is chronological.
// The current month is allowed; only strictly earlier months are past.
export function isPastMonthKey(value: string) {
  return value < currentMonthKey();
}

export function shiftMonthKey(value: string, delta: number) {
  const [year, month] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return monthKeyFromDate(shifted);
}

export function formatMonthKey(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
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

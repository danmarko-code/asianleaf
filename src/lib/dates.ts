import { DUE_DAY } from "@/lib/constants";

export function manilaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
  };
}

export function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Returns the next calendar due date in Asia/Manila, at UTC midnight.
export function nextDueDate() {
  const { year, month, day } = manilaNow();
  let dueYear = year;
  let dueMonth = month;

  if (day > DUE_DAY) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }

  return new Date(Date.UTC(dueYear, dueMonth - 1, DUE_DAY));
}

export function formatMonthDay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function todayInputValue() {
  const { year, month, day } = manilaNow();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function dateFromInput(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

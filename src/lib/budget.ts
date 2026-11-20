// Standard HOA budget/expense categories. `BudgetEntry.category` stays a plain
// text column (no DB enum) so rows created before this list, e.g. "Security" or
// "Clubhouse rental", keep rendering unchanged in reports.
export const BUDGET_CATEGORIES = [
  "Utilities",
  "Repairs",
  "Rental",
  "Landscaping",
  "Maintenance",
  "Security Services",
  "Garbage Collection & Sanitation",
  "Administrative & Office Supplies",
  "Community Events & Activities",
  "Permits, Taxes & Legal Fees",
  "Other",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export const OTHER_CATEGORY: BudgetCategory = "Other";

// Longest free-text suffix allowed after "Other:".
export const CATEGORY_DETAIL_MAX = 60;

const categoryHints: Partial<Record<BudgetCategory, string>> = {
  Utilities: "electricity, water, internet",
  Rental: "equipment or venue rental",
};

export function budgetCategoryLabel(category: BudgetCategory) {
  const hint = categoryHints[category];
  return hint ? `${category} (${hint})` : category;
}

export function isBudgetCategory(value: string): value is BudgetCategory {
  return (BUDGET_CATEGORIES as readonly string[]).includes(value);
}

// Accepts "Utilities" or "Other: Christmas lights". Anything outside the list,
// or a suffix on a category that is not "Other", is rejected.
export function parseBudgetCategory(raw: string): string | null {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) return null;

  const [head, ...rest] = value.split(":");
  const base = head.trim();
  if (!isBudgetCategory(base)) return null;

  const detail = rest.join(":").trim();
  if (!detail) return base;
  if (base !== OTHER_CATEGORY) return null;

  return `${base}: ${detail.slice(0, CATEGORY_DETAIL_MAX)}`;
}

// Combines the selected option with the optional "Other" detail.
export function composeBudgetCategory(base: string, detail?: string | null) {
  const category = parseBudgetCategory(base);
  if (!category) return null;

  const clean = (detail ?? "").trim().replace(/\s+/g, " ");
  if (!clean || category !== OTHER_CATEGORY) return category;

  return `${OTHER_CATEGORY}: ${clean.slice(0, CATEGORY_DETAIL_MAX)}`;
}

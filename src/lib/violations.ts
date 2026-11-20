// Standard Philippine HOA violation categories. Stored as free text so notices
// issued before this list existed keep rendering unchanged.
export const VIOLATION_CATEGORIES = [
  "Illegal Parking / Road Obstruction",
  "Noise Disturbance / Curfew Violation",
  "Improper Garbage Disposal",
  "Pet Policy Violation",
  "Unauthorized Construction / Renovation",
  "Unpaid / Overdue HOA Dues",
  "Common Area Misuse",
  "Security / Gate Pass Violation",
  "Other",
] as const;

export type ViolationCategory = (typeof VIOLATION_CATEGORIES)[number];

export const OTHER_CATEGORY: ViolationCategory = "Other";

export const MAX_CATEGORY_DETAIL = 80;

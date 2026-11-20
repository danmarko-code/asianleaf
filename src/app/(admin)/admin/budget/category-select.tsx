"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/form";
import {
  BUDGET_CATEGORIES,
  CATEGORY_DETAIL_MAX,
  OTHER_CATEGORY,
  budgetCategoryLabel,
} from "@/lib/budget";

// Category picker for the Add entry form. "Other" reveals an optional detail
// field; the server composes the two into a single stored value.
export function BudgetCategoryFields() {
  const [category, setCategory] = useState("");

  return (
    <div className="space-y-4 lg:col-span-3">
      <Select
        label="Category"
        name="category"
        required
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      >
        <option value="" disabled>
          Select category
        </option>
        {BUDGET_CATEGORIES.map((option) => (
          <option key={option} value={option}>
            {budgetCategoryLabel(option)}
          </option>
        ))}
      </Select>

      {category === OTHER_CATEGORY ? (
        <Input
          label="Category detail"
          name="categoryDetail"
          maxLength={CATEGORY_DETAIL_MAX}
          placeholder="e.g. Christmas lights"
          hint="Optional. Saved as “Other: detail”."
        />
      ) : null}
    </div>
  );
}

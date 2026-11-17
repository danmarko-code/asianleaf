"use client";

import { useActionState, useState } from "react";
import { createViolationAction } from "@/app/(admin)/admin/violations/actions";
import { initialViolationState } from "@/app/(admin)/admin/violations/form-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { todayInputValue } from "@/lib/dates";
import { MAX_CATEGORY_DETAIL, OTHER_CATEGORY, VIOLATION_CATEGORIES } from "@/lib/violations";

type Household = {
  id: string;
  unitAddress: string;
  members: { id: string; firstName: string; lastName: string }[];
};

export function ViolationForm({ households }: { households: Household[] }) {
  const [state, formAction, pending] = useActionState(
    createViolationAction,
    initialViolationState,
  );
  const [householdId, setHouseholdId] = useState(households[0]?.id ?? "");
  const [memberId, setMemberId] = useState("");
  const [kind, setKind] = useState<"WARNING" | "PAYMENT_REQUIRED">("WARNING");
  const [category, setCategory] = useState("");
  const [violationDate, setViolationDate] = useState(todayInputValue());
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [dueDateError, setDueDateError] = useState("");

  const household = households.find((row) => row.id === householdId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (
      kind === "PAYMENT_REQUIRED" &&
      paymentDueDate &&
      violationDate &&
      paymentDueDate <= violationDate
    ) {
      event.preventDefault();
      setDueDateError(
        "Payment due date must be after the date of violation."
      );
      return;
    }
    setDueDateError("");
  }

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Household"
          name="householdId"
          value={householdId}
          onChange={(event) => {
            setHouseholdId(event.target.value);
            setMemberId("");
          }}
          required
        >
          {households.map((row) => (
            <option key={row.id} value={row.id}>
              {row.unitAddress}
            </option>
          ))}
        </Select>

        <Select
          label="Resident (optional)"
          name="memberId"
          value={memberId}
          onChange={(event) => setMemberId(event.target.value)}
          hint="Leave blank for the whole household."
        >
          <option value="">Whole household</option>
          {household?.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.firstName} {member.lastName}
            </option>
          ))}
        </Select>

        <Select
          label="Type"
          name="kind"
          value={kind}
          onChange={(event) =>
            setKind(event.target.value as "WARNING" | "PAYMENT_REQUIRED")
          }
        >
          <option value="WARNING">Warning only</option>
          <option value="PAYMENT_REQUIRED">Needs payment</option>
        </Select>

        <Input
          label="Date of violation"
          name="issuedAt"
          type="date"
          value={violationDate}
          onChange={(event) => {
            setViolationDate(event.target.value);
            setDueDateError("");
          }}
          required
        />

        <Select
          label="Category"
          name="category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          error={state.fieldErrors?.category}
        >
          <option value="" disabled>
            Select violation category...
          </option>
          {VIOLATION_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>

        {category === OTHER_CATEGORY ? (
          <Input
            label="Specify category"
            name="categoryDetail"
            maxLength={MAX_CATEGORY_DETAIL}
            placeholder="e.g. Stray dogs inside the pool area"
            hint="Optional. Adds detail to the category."
          />
        ) : null}

        {kind === "PAYMENT_REQUIRED" ? (
          <>
            <Input
              label="Amount to pay"
              name="fineAmount"
              type="number"
              min="1"
              step="0.01"
              required
              placeholder="500.00"
            />
            <Input
              label="Payment due date"
              name="dueDate"
              type="date"
              required
              value={paymentDueDate}
              onChange={(event) => {
                setPaymentDueDate(event.target.value);
                setDueDateError("");
              }}
            />
            {dueDateError && (
              <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">
                {dueDateError}
              </p>
            )}
          </>
        ) : null}
      </div>

      <Textarea
        label="Description"
        name="description"
        required
        minLength={5}
        maxLength={1000}
        placeholder="Explain what the resident needs to do or settle."
      />

      <Button type="submit" isLoading={pending}>
        Issue violation
      </Button>
    </form>
  );
}

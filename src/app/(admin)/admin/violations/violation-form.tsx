"use client";

import { useState } from "react";
import { createViolationAction } from "@/app/(admin)/admin/violations/actions";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { todayInputValue } from "@/lib/dates";

type Household = {
  id: string;
  unitAddress: string;
  members: { id: string; firstName: string; lastName: string }[];
};

export function ViolationForm({ households }: { households: Household[] }) {
  const [householdId, setHouseholdId] = useState(households[0]?.id ?? "");
  const [memberId, setMemberId] = useState("");
  const [kind, setKind] = useState<"WARNING" | "PAYMENT_REQUIRED">("WARNING");
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
      action={createViolationAction}
      className="space-y-4"
      onSubmit={handleSubmit}
    >
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
          hint="Leave blank to address the whole household."
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

        <Input
          label="Category"
          name="category"
          required
          minLength={2}
          maxLength={100}
          placeholder="e.g. No vehicle sticker"
        />

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

      <Button type="submit">Issue violation</Button>
    </form>
  );
}

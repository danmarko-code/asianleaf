"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import {
  MAX_RECEIPT_BYTES,
  RECEIPT_ACCEPT,
  RECEIPT_HINT,
  RECEIPT_TYPES,
} from "@/lib/receipt-limits";
import { cn } from "@/lib/utils";
import { submitPaymentAction } from "./actions";
import { initialPaymentState } from "./form-state";

const METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "GCASH", label: "GCash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "OTHER", label: "Other" },
];

type Preview = { url?: string; name: string; isImage: boolean };

export function PaymentForm() {
  const [state, formAction, pending] = useActionState(
    submitPaymentAction,
    initialPaymentState,
  );
  const [method, setMethod] = useState(state.values?.method ?? "CASH");
  const [preview, setPreview] = useState<Preview>();
  const [fileError, setFileError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);

  const needsReference = method === "GCASH" || method === "BANK_TRANSFER";

  // Object URLs are only valid until revoked, so drop the old one on change.
  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileError(undefined);
    setPreview(undefined);
    if (!file) return;

    if (!RECEIPT_TYPES[file.type]) {
      setFileError("Upload a JPG, PNG or PDF file.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setFileError("The receipt must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    const isImage = file.type.startsWith("image/");
    setPreview({
      url: isImage ? URL.createObjectURL(file) : undefined,
      name: file.name,
      isImage,
    });
  }

  function clearFile() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(undefined);
    setFileError(undefined);
  }

  const receiptError = state.fieldErrors?.receipt ?? fileError;

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? <Alert tone="danger">{state.error}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Amount paid (₱)"
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          required
          defaultValue={state.values?.amount}
          error={state.fieldErrors?.amount}
        />

        <Select
          label="Payment method"
          name="method"
          required
          value={method}
          onChange={(event) => setMethod(event.target.value)}
          error={state.fieldErrors?.method}
        >
          {METHODS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Reference number"
        name="referenceNumber"
        maxLength={80}
        required={needsReference}
        defaultValue={state.values?.referenceNumber}
        placeholder={needsReference ? "e.g. 1234567890123" : "N/A"}
        hint={
          needsReference
            ? "Find this on your transaction receipt."
            : "Optional for cash payments."
        }
        error={state.fieldErrors?.referenceNumber}
      />

      <div>
        <label
          htmlFor="receipt"
          className="block text-sm font-medium text-ink"
        >
          Receipt or screenshot
          {method === "CASH" ? null : (
            <span aria-hidden="true" className="ml-0.5 text-red">
              *
            </span>
          )}
        </label>

        <div className="mt-1.5">
          {preview ? (
            <div className="flex items-center gap-3 rounded-md border border-line bg-cream p-3">
              {preview.isImage && preview.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.url}
                  alt="Receipt preview"
                  className="h-16 w-16 shrink-0 rounded-sm border border-line bg-surface object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm border border-line bg-surface text-xs font-semibold text-muted">
                  PDF
                </span>
              )}
              <p className="min-w-0 flex-1 truncate text-sm text-ink">
                {preview.name}
              </p>
              <button
                type="button"
                onClick={clearFile}
                className="shrink-0 text-xs font-medium text-forest hover:underline"
              >
                Remove
              </button>
            </div>
          ) : null}
          {/* Keep the input mounted while the preview is shown: an unmounted
              file input drops the selected File from the submitted FormData. */}
          <input
            ref={fileRef}
            id="receipt"
            name="receipt"
            type="file"
            accept={RECEIPT_ACCEPT}
            onChange={handleFile}
            style={preview ? { display: "none" } : undefined}
            aria-invalid={receiptError ? true : undefined}
            aria-describedby={receiptError ? "receipt-error" : "receipt-hint"}
            className={cn(
              "block w-full cursor-pointer rounded-md border bg-surface px-3 py-2.5 text-sm text-muted transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-forest-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-forest hover:border-leaf",
              receiptError ? "border-red" : "border-line",
            )}
          />
        </div>

        {receiptError ? (
          <p id="receipt-error" role="alert" className="mt-1.5 text-xs text-red">
            {receiptError}
          </p>
        ) : (
          <p id="receipt-hint" className="mt-1.5 text-xs text-muted">
            {RECEIPT_HINT}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button type="submit" isLoading={pending}>
          Submit payment
        </Button>
        
      </div>
    </form>
  );
}

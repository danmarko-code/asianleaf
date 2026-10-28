"use client";

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-md border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:bg-cream";

function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-ink"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1.5 text-xs text-red">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, hint, error, id, className, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <Field label={label} hint={hint} error={error} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            controlClasses,
            "h-11",
            error && "border-red",
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
      </Field>
    );
  },
);

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, hint, error, id, className, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <Field label={label} hint={hint} error={error} htmlFor={inputId}>
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            controlClasses,
            "min-h-28 py-2.5",
            error && "border-red",
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </Field>
    );
  },
);

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, hint, error, id, className, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <Field label={label} hint={hint} error={error} htmlFor={inputId}>
        <select
          ref={ref}
          id={inputId}
          className={cn(
            controlClasses,
            "h-11",
            error && "border-red",
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </Field>
    );
  },
);

export function Checkbox({
  label,
  description,
  id,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  description?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex items-start gap-3">
      <input
        id={inputId}
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 rounded-sm border-line accent-forest",
          className,
        )}
        {...props}
      />
      <div>
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

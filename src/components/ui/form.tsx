"use client";

import {
  forwardRef,
  useId,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const controlBase =
  "w-full rounded-md border bg-surface px-3 text-sm text-ink placeholder:text-muted disabled:cursor-not-allowed disabled:bg-cream";

// The error state swaps the border colour instead of adding a second border
// class, so the red outline always wins (cn does not merge Tailwind classes).
function controlClasses(hasError: boolean) {
  return cn(controlBase, hasError ? "border-red" : "border-line");
}

function Field({
  label,
  hint,
  error,
  htmlFor,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-ink"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-red">
            *
          </span>
        ) : null}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="mt-1.5 text-xs text-red"
        >
          {error}
        </p>
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
  // Strip every non-digit as the user types (contact numbers).
  onlyDigits?: boolean;
  // Strip digits and symbols a person name may not contain.
  nameOnly?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      hint,
      error,
      required,
      id,
      className,
      onlyDigits,
      nameOnly,
      onChange,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      if (onlyDigits || nameOnly) {
        const raw = event.target.value;
        const clean = onlyDigits
          ? raw.replace(/\D/g, "")
          : raw.replace(/[^A-Za-zÑñ .'-]/g, "");
        if (clean !== raw) event.target.value = clean;
      }
      onChange?.(event);
    }

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={inputId}
        required={required}
      >
        <input
          ref={ref}
          id={inputId}
          className={cn(controlClasses(Boolean(error)), "h-11", className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          required={required}
          inputMode={onlyDigits ? "numeric" : props.inputMode}
          onChange={handleChange}
          {...props}
        />
      </Field>
    );
  },
);

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: string;
  hint?: string;
  error?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(
    { label, hint, error, required, id, className, ...props },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = useState(false);

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={inputId}
        required={required}
      >
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              controlClasses(Boolean(error)),
              "h-11 pr-16",
              className,
            )}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            required={required}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            className="absolute inset-y-0 right-0 rounded-r-md px-3 text-xs font-medium text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-1"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? "Hide" : "Show"}
          </button>
        </div>
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
  function Textarea({ label, hint, error, required, id, className, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={inputId}
        required={required}
      >
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            controlClasses(Boolean(error)),
            "min-h-28 py-2.5",
            className,
          )}
          aria-invalid={error ? true : undefined}
          required={required}
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
  function Select({ label, hint, error, required, id, className, ...props }, ref) {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <Field
        label={label}
        hint={hint}
        error={error}
        htmlFor={inputId}
        required={required}
      >
        <select
          ref={ref}
          id={inputId}
          className={cn(controlClasses(Boolean(error)), "h-11", className)}
          aria-invalid={error ? true : undefined}
          required={required}
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

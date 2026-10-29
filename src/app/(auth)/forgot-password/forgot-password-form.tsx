"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  requestResetAction,
  resetPasswordAction,
} from "@/app/(auth)/forgot-password/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/form";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function requestCode() {
    setError(null);
    setNotice(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await requestResetAction(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(result.notice ?? null);
      setDevCode(result.devCode ?? null);
    });
  }

  function reset() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await resetPasswordAction({
        email,
        code,
        newPassword,
        confirmPassword,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setNotice(null);
      setDevCode(null);
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title="Password updated">
          You can now sign in with your new password.
        </Alert>
        <Link
          href="/login"
          className={buttonStyles({ className: "w-full" })}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {notice ? <Alert tone="info">{notice}</Alert> : null}
      {devCode ? (
        <Alert tone="info" title="Development code">
          No SMS/email provider is configured, so the code is shown here:{" "}
          <span className="font-mono font-semibold">{devCode}</span>.
        </Alert>
      ) : null}

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        placeholder="name@example.com"
      />

      <Button
        type="button"
        variant="secondary"
        onClick={requestCode}
        isLoading={pending}
        disabled={!email}
      >
        Send reset code
      </Button>

      <div className="border-t border-line pt-4">
        <Input
          label="6-digit code"
          inputMode="numeric"
          minLength={6}
          maxLength={6}
          pattern="[0-9]{6}"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="123456"
          required
        />
      </div>

      <PasswordInput
        label="New password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        required
      />
      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />

      <Button type="button" onClick={reset} isLoading={pending}>
        Set new password
      </Button>

      <p className="text-sm text-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-forest underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

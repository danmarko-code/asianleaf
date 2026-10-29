"use client";

import { useState, useTransition } from "react";
import {
  changePasswordAction,
  requestChangeCodeAction,
} from "@/app/(homeowner)/app/change-password/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, PasswordInput } from "@/components/ui/form";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const checks = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    {
      label: "Upper and lowercase letters",
      met: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    },
    { label: "At least one number", met: /\d/.test(newPassword) },
  ];

  function requestCode() {
    setError(null);
    startTransition(async () => {
      const result = await requestChangeCodeAction(currentPassword);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDevCode(result.devCode ?? null);
    });
  }

  function submit() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
        code,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCode("");
      setDevCode(null);
    });
  }

  return (
    <div className="space-y-4">
      {success ? (
        <Alert tone="success" title="Password changed">
          Use your new password the next time you sign in. Other sessions were
          signed out.
        </Alert>
      ) : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {devCode ? (
        <Alert tone="info" title="Development code">
          No SMS/email provider is configured, so the code is shown here:{" "}
          <span className="font-mono font-semibold">{devCode}</span>. It expires
          in 5 minutes.
        </Alert>
      ) : null}

      <PasswordInput
        label="Current password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        required
      />

      <div>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
        />
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {checks.map((check) => (
            <li key={check.label} className={check.met ? "text-forest" : undefined}>
              {check.met ? "✓" : "○"} {check.label}
            </li>
          ))}
        </ul>
      </div>

      <PasswordInput
        label="Confirm new password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        required
      />

      <div className="flex flex-wrap items-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={requestCode}
          isLoading={pending}
          disabled={!currentPassword}
        >
          Send verification code
        </Button>
        <p className="text-xs text-muted">
          The code is sent to the email on your account.
        </p>
      </div>

      <Input
        label="Verification code"
        inputMode="numeric"
        minLength={6}
        maxLength={6}
        pattern="[0-9]{6}"
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="123456"
        required
      />

      <Button type="button" onClick={submit} isLoading={pending}>
        Change password
      </Button>
    </div>
  );
}

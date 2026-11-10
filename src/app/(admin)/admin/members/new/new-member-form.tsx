"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { createMemberAction } from "@/app/(admin)/admin/members/new/actions";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, PasswordInput, Select } from "@/components/ui/form";
import { CheckIcon } from "@/components/icons";
import { composeUnitAddress, OTHER_STREET, STREETS } from "@/lib/locations";

type Person = { fullName: string; relationship: string };
type Pet = { name: string; breed: string };
type Vehicle = { plateNumber: string };
type Kasambahay = { fullName: string; contactNumber: string };

const NAME_INPUT_PATTERN = /[\sA-Za-zÑñ]*[A-Za-zÑñ]{2,}[\sA-Za-zÑñ]*/;
const NAME_INPUT_TITLE =
  "Use letters and spaces only. Numbers and special characters are not allowed.";
const REQUIRED_NAME_PATTERN = "^[A-Za-zÑñ]+(?: [A-Za-zÑñ]+)*$";

function invalidFieldMessage(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  if (field.validity.valueMissing) return "This field is required.";

  if (field.validity.patternMismatch) {
    switch (field.name) {
      case "username":
        return "Use 3–30 lowercase letters, numbers, dots, dashes and underscores only.";
      case "contactNumber":
        return "Enter an 11-digit contact number.";
      case "firstName":
      case "lastName":
        return "Use letters and spaces only.";
      case "block":
      case "lot":
        return "Use letters or numbers only.";
      default:
        return "Check the format of this field.";
    }
  }

  if ("minLength" in field && field.validity.tooShort) {
    return `Use at least ${field.minLength} characters.`;
  }

  if ("maxLength" in field && field.validity.tooLong) {
    return `Use at most ${field.maxLength} characters.`;
  }

  return field.validationMessage || "Check this field.";
}

export function NewMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const shouldFocusError = useRef(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [unit, setUnit] = useState({
    street: STREETS[0] as string,
    customStreet: "",
    block: "",
    lot: "",
  });

  const [householdMembers, setHouseholdMembers] = useState<Person[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [kasambahay, setKasambahay] = useState<Kasambahay[]>([]);

  const passwordChecks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    {
      label: "Upper and lowercase letters",
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    { label: "At least one number", met: /\d/.test(password) },
  ];
  const passwordMeetsRequirements = passwordChecks.every((check) => check.met);
  const passwordsMatch = confirmPassword === password;

  const previewStreet =
    unit.street === OTHER_STREET ? unit.customStreet.trim() : unit.street;
  const addressPreview =
    previewStreet && unit.block.trim() && unit.lot.trim()
      ? composeUnitAddress({
          street: previewStreet,
          block: unit.block,
          lot: unit.lot,
        })
      : "";

  const payload = JSON.stringify({
    householdMembers: householdMembers
      .filter((row) => row.fullName.trim())
      .map((row) => ({
        fullName: row.fullName.trim(),
        relationship: row.relationship.trim() || undefined,
      })),
    pets: pets
      .filter((row) => row.name.trim())
      .map((row) => ({
        name: row.name.trim(),
        breed: row.breed.trim() || undefined,
      })),
    vehicles: vehicles
      .filter((row) => row.plateNumber.trim())
      .map((row) => ({
        plateNumber: row.plateNumber.trim(),
      })),
    kasambahay: kasambahay
      .filter((row) => row.fullName.trim())
      .map((row) => ({
        fullName: row.fullName.trim(),
        contactNumber: row.contactNumber.trim(),
      })),
  });

  function handleInvalid(event: FormEvent<HTMLFormElement>) {
    const target = event.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;

    if (!target.name) return;

    // Suppress the browser tooltip; this form shows the message under the
    // field instead and scrolls the first invalid field into view.
    event.preventDefault();
    shouldFocusError.current = true;
    setFieldErrors((current) => ({
      ...current,
      [target.name]: invalidFieldMessage(target),
    }));
  }

  function handleInput(event: FormEvent<HTMLFormElement>) {
    const target = event.target as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement;
    const name = target.name;
    if (!name) return;

    setError(null);
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  useEffect(() => {
    if (!shouldFocusError.current) return;

    const first = Object.keys(fieldErrors)[0];
    if (!first) return;

    shouldFocusError.current = false;
    const field = formRef.current?.querySelector<HTMLElement>(
      `[name="${first}"]`,
    );
    if (!field) return;

    field.scrollIntoView({ behavior: "smooth", block: "center" });
    field.focus({ preventScroll: true });
  }, [fieldErrors]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !formRef.current) return;

    setError(null);

    const nextErrors: Record<string, string> = {};

    if (!passwordMeetsRequirements) {
      nextErrors.password =
        "Use a password with at least 8 characters, upper and lowercase letters, and a number.";
    }

    if (!passwordsMatch) {
      nextErrors.confirmPassword = "The passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      shouldFocusError.current = true;
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    const formData = new FormData(formRef.current);

    startTransition(async () => {
      const result = await createMemberAction({}, formData);

      if (result?.fieldErrors && Object.keys(result.fieldErrors).length > 0) {
        shouldFocusError.current = true;
        setFieldErrors(result.fieldErrors);
      }

      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onInvalid={handleInvalid}
      onInput={handleInput}
      className="space-y-6"
    >
      <input type="hidden" name="payload" value={payload} />

      {error ? (
        <div aria-live="polite">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Account and login</CardTitle>
          <CardDescription>
            The resident uses this username and password to sign in. Share the
            credentials with them after saving.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Username"
            name="username"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9._\-]{3,30}"
            placeholder="e.g. maria.santos"
            hint="3–30 characters. Lowercase letters, numbers, dots, dashes and underscores only."
            error={fieldErrors.username}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <PasswordInput
                label="Password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={password}
                error={fieldErrors.password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <ul className="mt-2 space-y-1 text-xs text-muted" aria-live="polite">
                {passwordChecks.map((check) => (
                  <li key={check.label} className="flex items-center gap-2">
                    {check.met ? (
                      <CheckIcon className="h-4 w-4 text-leaf" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-line" />
                    )}
                    <span className={check.met ? "text-ink" : undefined}>
                      {check.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <PasswordInput
              label="Confirm password"
              name="confirmPassword"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={confirmPassword}
              error={
                fieldErrors.confirmPassword ??
                (confirmPassword.length > 0 && !passwordsMatch
                  ? "The passwords do not match."
                  : undefined)
              }
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Primary resident</CardTitle>
          <CardDescription>
            Contact details for the household member who holds the login.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="First name"
              name="firstName"
              autoComplete="given-name"
              required
              maxLength={60}
              pattern={REQUIRED_NAME_PATTERN}
              title={NAME_INPUT_TITLE}
              hint="Letters and spaces only."
              error={fieldErrors.firstName}
            />
            <Input
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              required
              maxLength={60}
              pattern={REQUIRED_NAME_PATTERN}
              title={NAME_INPUT_TITLE}
              hint="Letters and spaces only."
              error={fieldErrors.lastName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Contact number"
              name="contactNumber"
              type="tel"
              autoComplete="tel"
              inputMode="numeric"
              required
              minLength={11}
              maxLength={11}
              pattern="[0-9]{11}"
              placeholder="09171234567"
              hint="11-digit mobile number used for due reminders."
              error={fieldErrors.contactNumber}
            />

            <Select
              label="Occupancy"
              name="occupancyType"
              required
              defaultValue="OWNER_OCCUPIED"
              error={fieldErrors.occupancyType}
            >
              <option value="OWNER_OCCUPIED">Owner</option>
              <option value="TENANT">Tenant</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unit</CardTitle>
          <CardDescription>
            Street, block and lot identify the household record.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Street"
              name="street"
              required
              value={unit.street}
              error={fieldErrors.street}
              onChange={(event) =>
                setUnit((current) => ({ ...current, street: event.target.value }))
              }
            >
              {STREETS.map((street) => (
                <option key={street} value={street}>
                  {street}
                </option>
              ))}
              <option value={OTHER_STREET}>Other street</option>
            </Select>

            {unit.street === OTHER_STREET ? (
              <Input
                label="Street name"
                name="customStreet"
                required
                minLength={2}
                maxLength={80}
                value={unit.customStreet}
                error={fieldErrors.customStreet}
                onChange={(event) =>
                  setUnit((current) => ({
                    ...current,
                    customStreet: event.target.value,
                  }))
                }
                placeholder="e.g. Mabini St."
              />
            ) : (
              <input type="hidden" name="customStreet" value="" />
            )}

            <Input
              label="Block"
              name="block"
              required
              pattern="[A-Za-z0-9-]{1,10}"
              maxLength={10}
              value={unit.block}
              error={fieldErrors.block}
              onChange={(event) =>
                setUnit((current) => ({ ...current, block: event.target.value }))
              }
              placeholder="2"
            />

            <Input
              label="Lot"
              name="lot"
              required
              pattern="[A-Za-z0-9-]{1,10}"
              maxLength={10}
              value={unit.lot}
              error={fieldErrors.lot}
              onChange={(event) =>
                setUnit((current) => ({ ...current, lot: event.target.value }))
              }
              placeholder="14"
            />
          </div>

          <div className="rounded-md border border-dashed border-line bg-cream px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Unit address
            </p>
            <p className="mt-1 text-sm text-ink">
              {addressPreview || "Choose a street, then enter block and lot."}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>People and property</CardTitle>
          <CardDescription>
            Add only what applies to this household. Each section can be left
            empty.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <RepeatableSection
            title="Other household members"
            description="Dependents or relatives living in the unit."
            actionLabel="Add household member"
            onAdd={() =>
              setHouseholdMembers((rows) => [
                ...rows,
                { fullName: "", relationship: "" },
              ])
            }
            empty={householdMembers.length === 0}
          >
            {householdMembers.map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <Input
                  label="Full name"
                  value={row.fullName}
                  onChange={(event) =>
                    setHouseholdMembers((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, fullName: event.target.value }
                          : item,
                      ),
                    )
                  }
                  maxLength={120}
                  pattern={NAME_INPUT_PATTERN.source}
                  title={NAME_INPUT_TITLE}
                />
                <Select
                  label="Relationship"
                  required
                  value={row.relationship}
                  onChange={(event) =>
                    setHouseholdMembers((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, relationship: event.target.value }
                          : item,
                      ),
                    )
                  }
                >
                  <option value="">Select relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Relative">Relative</option>
                  <option value="Other">Other</option>
                </Select>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setHouseholdMembers((rows) =>
                        rows.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </RepeatableSection>

          <RepeatableSection
            title="Kasambahay"
            description="Household help staying or working at the unit."
            actionLabel="Add kasambahay"
            onAdd={() =>
              setKasambahay((rows) => [
                ...rows,
                { fullName: "", contactNumber: "" },
              ])
            }
            empty={kasambahay.length === 0}
          >
            {kasambahay.map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr_180px_auto]"
              >
                <Input
                  label="Full name"
                  value={row.fullName}
                  onChange={(event) =>
                    setKasambahay((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, fullName: event.target.value }
                          : item,
                      ),
                    )
                  }
                  maxLength={120}
                  pattern={NAME_INPUT_PATTERN.source}
                  title={NAME_INPUT_TITLE}
                />
                <Input
                  label="Contact number"
                  type="tel"
                  inputMode="numeric"
                  required
                  minLength={11}
                  maxLength={11}
                  pattern="[0-9]{11}"
                  placeholder="09171234567"
                  value={row.contactNumber}
                  onChange={(event) =>
                    setKasambahay((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, contactNumber: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setKasambahay((rows) =>
                        rows.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </RepeatableSection>

          <RepeatableSection
            title="Pets"
            description="List each pet kept at the unit."
            actionLabel="Add pet"
            onAdd={() => setPets((rows) => [...rows, { name: "", breed: "" }])}
            empty={pets.length === 0}
          >
            {pets.map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <Input
                  label="Name"
                  value={row.name}
                  onChange={(event) =>
                    setPets((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                  maxLength={60}
                />
                <Input
                  label="Breed"
                  value={row.breed}
                  onChange={(event) =>
                    setPets((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, breed: event.target.value }
                          : item,
                      ),
                    )
                  }
                  maxLength={60}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setPets((rows) =>
                        rows.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </RepeatableSection>

          <RepeatableSection
            title="Vehicles"
            description="List the plate numbers kept at the household."
            actionLabel="Add vehicle"
            onAdd={() => setVehicles((rows) => [...rows, { plateNumber: "" }])}
            empty={vehicles.length === 0}
          >
            {vehicles.map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border border-line p-3 sm:grid-cols-[1fr_auto]"
              >
                <Input
                  label="Plate number"
                  value={row.plateNumber}
                  onChange={(event) =>
                    setVehicles((rows) =>
                      rows.map((item, rowIndex) =>
                        rowIndex === index
                          ? { ...item, plateNumber: event.target.value }
                          : item,
                      ),
                    )
                  }
                  maxLength={20}
                  placeholder="ABC 1234"
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setVehicles((rows) =>
                        rows.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </RepeatableSection>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button type="submit" className="sm:flex-1" isLoading={pending}>
          Create member and login
        </Button>
        <Link
          href="/admin/members"
          className={buttonStyles({ variant: "secondary", className: "sm:flex-1" })}
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function RepeatableSection({
  title,
  description,
  actionLabel,
  onAdd,
  empty,
  children,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAdd: () => void;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-ink">{title}</h3>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          {actionLabel}
        </Button>
      </div>
      {empty ? (
        <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-xs text-muted">
          No entries added.
        </p>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
}

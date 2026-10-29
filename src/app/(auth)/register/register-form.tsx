"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { registerAction } from "@/app/(auth)/register/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Checkbox,
  Input,
  PasswordInput,
  Select,
} from "@/components/ui/form";
import { CheckIcon } from "@/components/icons";

type Person = { fullName: string; relationship: string };
type Pet = { name: string; breed: string };
type Vehicle = { plateNumber: string };
type Kasambahay = { fullName: string; contactNumber: string };

export function RegisterForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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

  function continueToStepTwo() {
    const form = formRef.current;
    if (!form) return;

    const fields = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        '[data-step="1"]',
      ),
    );

    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }

    if (!passwordMeetsRequirements) {
      setClientError(
        "Use at least 8 characters with upper and lowercase letters and a number.",
      );
      return;
    }

    const data = new FormData(form);
    if (data.get("password") !== data.get("confirmPassword")) {
      setClientError("The passwords do not match.");
      return;
    }

    setClientError(null);
    setServerError(null);
    setStep(2);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !formRef.current) return;

    const formData = new FormData(formRef.current);
    setClientError(null);
    setServerError(null);

    startTransition(async () => {
      const result = await registerAction({}, formData);
      if (result?.error) {
        setServerError(result.error);
        setStep(result.step ?? 2);
      }
    });
  }

  const error = clientError ?? serverError;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register your household</CardTitle>
        <CardDescription>
          One login per household. An administrator reviews every request before
          the account is activated.
        </CardDescription>
      </CardHeader>
      <CardBody>
        <div className="mb-6 flex items-center gap-3" aria-label="Registration steps">
          <StepBadge number={1} label="Account and unit" active={step === 1} />
          <span className="h-px flex-1 bg-line" />
          <StepBadge number={2} label="Household" active={step === 2} />
        </div>

        {error ? (
          <div className="mb-4" aria-live="polite">
            <Alert tone="danger">{error}</Alert>
          </div>
        ) : null}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="payload" value={payload} />

          <div className={step === 2 ? "hidden" : "space-y-4"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                name="firstName"
                data-step="1"
                autoComplete="given-name"
                required
                minLength={2}
                maxLength={60}
              />
              <Input
                label="Last name"
                name="lastName"
                data-step="1"
                autoComplete="family-name"
                required
                minLength={2}
                maxLength={60}
              />
            </div>

            <Input
              label="Email"
              name="email"
              type="email"
              data-step="1"
              autoComplete="email"
              inputMode="email"
              required
              maxLength={254}
              placeholder="name@example.com"
              hint="This becomes the household login."
            />

            <Input
              label="Contact number"
              name="contactNumber"
              type="tel"
              data-step="1"
              autoComplete="tel"
              inputMode="numeric"
              required
              minLength={11}
              maxLength={11}
              pattern="[0-9]{11}"
              placeholder="09171234567"
              hint="11-digit mobile number used for due reminders."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <PasswordInput
                  label="Password"
                  name="password"
                  data-step="1"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <ul
                  className="mt-2 space-y-1 text-xs text-muted"
                  aria-live="polite"
                >
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
                data-step="1"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            <Input
              label="Unit address"
              name="unitAddress"
              data-step="1"
              required
              minLength={5}
              maxLength={200}
              placeholder="12 Sampaguita St., Phase 1"
            />

            <div className="sm:max-w-xs">
              <Select
                label="Occupancy"
                name="occupancyType"
                data-step="1"
                required
                defaultValue="OWNER_OCCUPIED"
              >
                <option value="OWNER_OCCUPIED">Owner</option>
                <option value="TENANT">Tenant</option>
              </Select>
            </div>

            <Button type="button" onClick={continueToStepTwo} className="w-full">
              Continue to household details
            </Button>
          </div>

          <div className={step === 1 ? "hidden" : "space-y-6"}>
            <div>
              <h2 className="font-serif text-xl text-ink">
                People and property
              </h2>
              <p className="mt-1 text-sm text-muted">
                Add only what applies to this household. You can leave any
                section empty.
              </p>
            </div>

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
              onAdd={() =>
                setPets((rows) => [...rows, { name: "", breed: "" }])
              }
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
              onAdd={() =>
                setVehicles((rows) => [...rows, { plateNumber: "" }])
              }
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

            <div className="rounded-md border border-line bg-cream p-4">
              <Checkbox
                name="consent"
                value="on"
                required
                label="Data Privacy Act consent"
                description="I confirm the information is accurate and consent to the association processing it for household records, dues and community notices. Consent version 2026-10-v1."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row-reverse">
              <Button
                type="submit"
                className="sm:flex-1"
                isLoading={pending}
              >
                Submit registration
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="sm:flex-1"
                onClick={() => {
                  setClientError(null);
                  setStep(1);
                }}
                disabled={pending}
              >
                Back to account details
              </Button>
            </div>
          </div>
        </form>

        <p className="mt-4 text-xs text-muted">
          Your password is hashed before it is stored. Registration does not
          create a login until an administrator approves the request.
        </p>
      </CardBody>
    </Card>
  );
}

function StepBadge({
  number,
  label,
  active,
}: {
  number: number;
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          active
            ? "flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white dark:bg-lime dark:text-[#1a220f]"
            : "flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-xs font-semibold text-muted"
        }
      >
        {number}
      </span>
      <span
        className={
          active ? "text-sm font-medium text-ink" : "text-sm text-muted"
        }
      >
        {label}
      </span>
    </div>
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

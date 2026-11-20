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
import {
  isValidContactNumber,
  isValidPersonName,
  NAME_ERROR,
  NAME_INPUT_PATTERN,
} from "@/lib/registration";
import {
  VEHICLE_TYPES,
  normalizeVehiclePlate,
  parseVehicleForm,
  plateCopy,
} from "@/lib/vehicles";

type Person = { fullName: string; relationship: string };
type Pet = { name: string; breed: string };
type Vehicle = {
  vehicleType: string;
  plateNumber: string;
  brandModel: string;
  color: string;
};
type Kasambahay = { fullName: string; contactNumber: string };

function vehicleRowHasValue(row: Vehicle) {
  return Boolean(
    row.vehicleType.trim() ||
      row.plateNumber.trim() ||
      row.brandModel.trim() ||
      row.color.trim(),
  );
}

const NAME_INPUT_TITLE =
  "Use letters, spaces, hyphens, apostrophes or periods only. At least 2 letters.";

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

const STEPS = [
  "Account and login",
  "Primary resident",
  "Unit",
  "People and property",
];

export function NewMemberForm({
  inline = false,
  onCancel,
  onCreated,
}: {
  // Rendered inside the members modal: no page navigation on success.
  inline?: boolean;
  onCancel?: () => void;
  onCreated?: (username: string) => void;
} = {}) {
  const formRef = useRef<HTMLFormElement>(null);
  const shouldFocusError = useRef(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [kasambahayErrors, setKasambahayErrors] = useState<
    Record<number, string>
  >({});
  const [step, setStep] = useState(0);
  const [vehicleErrors, setVehicleErrors] = useState<
    Record<number, Record<string, string>>
  >({});

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

  // Row inputs share no unique name, so the vehicle errors are kept by index.
  function updateVehicle(index: number, patch: Partial<Vehicle>) {
    setError(null);
    setVehicles((rows) =>
      rows.map((item, rowIndex) => (rowIndex === index ? { ...item, ...patch } : item)),
    );
    setVehicleErrors((current) => {
      if (!current[index]) return current;
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

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

  const firstNameError =
    fieldErrors.firstName ??
    (touched.firstName && !isValidPersonName(firstName) ? NAME_ERROR : undefined);
  const lastNameError =
    fieldErrors.lastName ??
    (touched.lastName && !isValidPersonName(lastName) ? NAME_ERROR : undefined);
  const contactError =
    fieldErrors.contactNumber ??
    (touched.contactNumber && !isValidContactNumber(contactNumber)
      ? "Enter an 11-digit contact number."
      : undefined);

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
      .filter(vehicleRowHasValue)
      .map((row) => ({
        vehicleType: row.vehicleType,
        plateNumber: normalizeVehiclePlate(row.vehicleType, row.plateNumber),
        brandModel: row.brandModel.trim(),
        color: row.color.trim(),
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

  // Steps differ in height, so put the reader back at the top of the
  // scrollable modal body (or the page when rendered standalone) once the new
  // step has rendered. Doing this in an effect beats the browser's own scroll
  // anchoring, which would otherwise keep the old position.
  useEffect(() => {
    const scroller = formRef.current?.parentElement;
    if (scroller) scroller.scrollTop = 0;
    window.scrollTo({ top: 0 });
  }, [step]);

  function goBack() {
    setError(null);
    setStep((current) => Math.max(0, current - 1));
  }

  // Only the visible step is checked, so Next never blocks on a later section.
  function goNext() {
    if (!formRef.current) return;

    const errors: Record<string, string> = {};
    if (step === 0 && !passwordMeetsRequirements) {
      errors.password =
        "Use a password with at least 8 characters, upper and lowercase letters, and a number.";
    }
    if (step === 0 && !passwordsMatch) {
      errors.confirmPassword = "The passwords do not match.";
    }
    if (step === 1 && !isValidPersonName(firstName)) {
      errors.firstName = NAME_ERROR;
    }
    if (step === 1 && !isValidPersonName(lastName)) {
      errors.lastName = NAME_ERROR;
    }
    if (step === 1 && !isValidContactNumber(contactNumber)) {
      errors.contactNumber = "Enter an 11-digit contact number.";
    }

    if (Object.keys(errors).length > 0) {
      shouldFocusError.current = true;
      setFieldErrors((current) => ({ ...current, ...errors }));
      return;
    }

    const section = formRef.current.querySelector<HTMLElement>(
      `[data-step="${step}"]`,
    );
    for (const field of section?.querySelectorAll<HTMLElement>("input, select") ??
      []) {
      if (!(field as HTMLInputElement).checkValidity()) {
        shouldFocusError.current = true;
        (field as HTMLInputElement).reportValidity();
        return;
      }
    }

    setError(null);
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
  }

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

    if (!isValidPersonName(firstName)) nextErrors.firstName = NAME_ERROR;
    if (!isValidPersonName(lastName)) nextErrors.lastName = NAME_ERROR;
    if (!isValidContactNumber(contactNumber)) {
      nextErrors.contactNumber = "Enter an 11-digit contact number.";
    }

    const nextKasambahayErrors: Record<number, string> = {};
    kasambahay.forEach((row, index) => {
      if (!isValidPersonName(row.fullName)) {
        nextKasambahayErrors[index] = NAME_ERROR;
      } else if (
        row.contactNumber.trim() &&
        !isValidContactNumber(row.contactNumber)
      ) {
        nextKasambahayErrors[index] =
          "Enter an 11-digit contact number or leave it blank.";
      }
    });
    if (Object.keys(nextKasambahayErrors).length > 0) {
      nextErrors.kasambahay = "Check the kasambahay details.";
    }
    setKasambahayErrors(nextKasambahayErrors);

    const nextVehicleErrors: Record<number, Record<string, string>> = {};
    vehicles.forEach((row, index) => {
      if (!vehicleRowHasValue(row)) return;
      const result = parseVehicleForm({
        vehicleType: row.vehicleType,
        plateNumber: normalizeVehiclePlate(row.vehicleType, row.plateNumber),
        brandModel: row.brandModel,
        color: row.color,
      });
      if (!result.ok) {
        nextVehicleErrors[index] = result.state.fieldErrors ?? {};
      }
    });
    if (Object.keys(nextVehicleErrors).length > 0) {
      nextErrors.vehicles = "Check the vehicle details.";
    }
    setVehicleErrors(nextVehicleErrors);

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

      if (result?.vehicleErrors) {
        setVehicleErrors(result.vehicleErrors);
      }

      if (result?.error) {
        setError(result.error);
      }

      if (result?.created) {
        onCreated?.(result.created.username);
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
      {inline ? <input type="hidden" name="inline" value="1" /> : null}

      {error ? (
        <div aria-live="polite">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <p className="text-sm font-medium text-muted">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      <Card data-step="0" className={step === 0 ? undefined : "hidden"}>
        <CardHeader>
          <CardTitle>Account and login</CardTitle>
          <CardDescription>
            Share these with the resident after saving so they can sign in.
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
            hint="3–30 characters. Lowercase letters, numbers, dots, dashes or underscores."
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

      <Card data-step="1" className={step === 1 ? undefined : "hidden"}>
        <CardHeader>
          <CardTitle>Primary resident</CardTitle>
          <CardDescription>
            The main contact for this household.
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
              pattern={NAME_INPUT_PATTERN}
              title={NAME_INPUT_TITLE}
              hint="Letters, spaces, hyphens or apostrophes."
              error={firstNameError}
              value={firstName}
              nameOnly
              onChange={(event) => setFirstName(event.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, firstName: true }))}
            />
            <Input
              label="Last name"
              name="lastName"
              autoComplete="family-name"
              required
              maxLength={60}
              pattern={NAME_INPUT_PATTERN}
              title={NAME_INPUT_TITLE}
              hint="Letters, spaces, hyphens or apostrophes."
              error={lastNameError}
              value={lastName}
              nameOnly
              onChange={(event) => setLastName(event.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, lastName: true }))}
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
              hint="11 digits. We’ll send dues reminders here."
              error={contactError}
              value={contactNumber}
              onlyDigits
              onChange={(event) => setContactNumber(event.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, contactNumber: true }))}
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

      <Card data-step="2" className={step === 2 ? undefined : "hidden"}>
        <CardHeader>
          <CardTitle>Unit</CardTitle>
          <CardDescription>
            Where this household lives.
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
            <p className="text-sm font-medium text-muted">
              Unit address
            </p>
            <p className="mt-1 text-sm text-ink">
              {addressPreview || "Choose a street, then enter block and lot."}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card data-step="3" className={step === 3 ? undefined : "hidden"}>
        <CardHeader>
          <CardTitle>People and property</CardTitle>
          <CardDescription>
            Add family, helpers, pets and vehicles. Skip anything that doesn’t apply.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-6">
          <RepeatableSection
            title="Other household members"
            description="Family or relatives living in the home."
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
                  pattern={NAME_INPUT_PATTERN}
                  title={NAME_INPUT_TITLE}
                  nameOnly
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
            description="Household helpers living or working in the home."
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
                  pattern={NAME_INPUT_PATTERN}
                  title={NAME_INPUT_TITLE}
                  nameOnly
                  error={kasambahayErrors[index]}
                />
                <Input
                  label="Contact number"
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  pattern="[0-9]{11}"
                  placeholder="Optional"
                  hint="Optional"
                  value={row.contactNumber}
                  onlyDigits
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
            description="Pets living in the home."
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
            description="Vehicles owned by the household."
            actionLabel="Add vehicle"
            onAdd={() =>
              setVehicles((rows) => [
                ...rows,
                { vehicleType: "", plateNumber: "", brandModel: "", color: "" },
              ])
            }
            empty={vehicles.length === 0}
          >
            {vehicles.map((row, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-md border border-line p-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    label="Vehicle type"
                    value={row.vehicleType}
                    onChange={(event) =>
                      updateVehicle(index, { vehicleType: event.target.value })
                    }
                    error={vehicleErrors[index]?.vehicleType}
                  >
                    <option value="">Select vehicle type</option>
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Plate number"
                    value={row.plateNumber}
                    onChange={(event) =>
                      updateVehicle(index, { plateNumber: event.target.value })
                    }
                    onBlur={(event) =>
                      updateVehicle(index, {
                        plateNumber: normalizeVehiclePlate(
                          row.vehicleType,
                          event.target.value,
                        ),
                      })
                    }
                    maxLength={15}
                    autoComplete="off"
                    autoCapitalize="characters"
                    placeholder={plateCopy(row.vehicleType).placeholder}
                    hint={plateCopy(row.vehicleType).hint}
                    error={vehicleErrors[index]?.plateNumber}
                  />
                  <Input
                    label="Brand / model"
                    value={row.brandModel}
                    onChange={(event) =>
                      updateVehicle(index, { brandModel: event.target.value })
                    }
                    maxLength={60}
                    placeholder="e.g., Toyota Vios"
                    error={vehicleErrors[index]?.brandModel}
                  />
                  <Input
                    label="Color"
                    value={row.color}
                    onChange={(event) =>
                      updateVehicle(index, { color: event.target.value })
                    }
                    maxLength={30}
                    placeholder="e.g., Silver"
                    error={vehicleErrors[index]?.color}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setVehicles((rows) =>
                        rows.filter((_, rowIndex) => rowIndex !== index),
                      );
                      setVehicleErrors({});
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </RepeatableSection>
        </CardBody>
      </Card>

      {/* Pinned to the bottom of the modal body so the controls stay reachable
          while a long step scrolls behind them. */}
      <div className="sticky bottom-0 z-10 -mx-5 -mb-4 mt-6 flex items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3">
        {step === 0 ? (
          onCancel ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : (
            <Link
              href="/admin/members"
              className={buttonStyles({
                variant: "secondary",
                size: "sm",
              })}
            >
              Cancel
            </Link>
          )
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={goBack}
          >
            ← Back
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          // The key forces a fresh element: without it React reuses this <button>
          // node and patches type="button" into type="submit" mid-click, so the
          // browser then runs the new submit default action.
          <Button
            key="next"
            type="button"
            size="sm"
            onClick={(event) => {
              // Belt and braces: never let a navigation click submit the form.
              event.preventDefault();
              goNext();
            }}
          >
            Next →
          </Button>
        ) : (
          <Button key="save" type="submit" size="sm" isLoading={pending}>
            {inline ? "Save member" : "Create member and login"}
          </Button>
        )}
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

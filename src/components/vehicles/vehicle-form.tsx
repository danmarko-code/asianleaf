"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import {
  VEHICLE_TYPES,
  isVehicleType,
  normalizePlate,
  plateCopy,
  plateInputPattern,
  type VehicleFormState,
  type VehicleInput,
} from "@/lib/vehicles";

type VehicleAction = (
  state: VehicleFormState,
  formData: FormData,
) => Promise<VehicleFormState>;

export function VehicleForm({
  action,
  vehicle,
  hiddenFields,
  submitLabel = "Add vehicle",
  resetOnSuccess = false,
}: {
  action: VehicleAction;
  vehicle?: Partial<VehicleInput>;
  hiddenFields?: Record<string, string>;
  submitLabel?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState<VehicleFormState, FormData>(
    action,
    { status: "idle" },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const initialType = vehicle?.vehicleType ?? "CAR";
  const [vehicleType, setVehicleType] = useState(initialType);

  useEffect(() => {
    if (!resetOnSuccess || state.status !== "success") return;
    formRef.current?.reset();
    setVehicleType("CAR");
  }, [state, resetOnSuccess]);

  const copy = plateCopy(vehicleType);
  // A stored value that is no longer in the list still shows up, so editing an
  // older row never silently rewrites its type.
  const options = isVehicleType(initialType)
    ? VEHICLE_TYPES
    : [...VEHICLE_TYPES, { value: initialType, label: initialType }];
  const errors = state.fieldErrors ?? {};

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {Object.entries(hiddenFields ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {state.message ? (
        <Alert
          tone={state.status === "error" ? "danger" : "success"}
          title={state.message}
        />
      ) : null}

      <Select
        label="Vehicle type"
        name="vehicleType"
        required
        value={vehicleType}
        onChange={(event) => setVehicleType(event.target.value)}
        error={errors.vehicleType}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Input
        label="Plate number"
        name="plateNumber"
        required
        defaultValue={vehicle?.plateNumber}
        placeholder={copy.placeholder}
        hint={copy.hint}
        error={errors.plateNumber}
        pattern={plateInputPattern(vehicleType)}
        maxLength={15}
        autoComplete="off"
        autoCapitalize="characters"
        onBlur={(event) => {
          event.target.value = normalizePlate(event.target.value);
        }}
      />

      <Input
        label="Brand / model"
        name="brandModel"
        required
        defaultValue={vehicle?.brandModel}
        placeholder="e.g., Toyota Vios"
        maxLength={60}
        error={errors.brandModel}
      />

      <Input
        label="Color"
        name="color"
        required
        defaultValue={vehicle?.color}
        placeholder="e.g., Silver"
        maxLength={30}
        error={errors.color}
      />

      <Button type="submit" size="sm" isLoading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}

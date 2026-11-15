import { z } from "zod";

/**
 * Philippine vehicle types used by every vehicle form. Stored as text so an
 * older or renamed value still displays instead of breaking.
 */
export const VEHICLE_TYPES = [
  { value: "CAR", label: "Car (Sedan / Hatchback)" },
  { value: "SUV_VAN", label: "SUV / MPV / Van" },
  { value: "PICKUP", label: "Pickup Truck" },
  { value: "MOTORCYCLE", label: "Motorcycle" },
  { value: "EBIKE", label: "E-Bike / E-Trike" },
  { value: "TRICYCLE", label: "Tricycle" },
  { value: "DELIVERY", label: "Delivery Van / Truck" },
  { value: "OTHER", label: "Other" },
] as const;

export type VehicleTypeValue = (typeof VEHICLE_TYPES)[number]["value"];

const TYPE_VALUES = VEHICLE_TYPES.map((type) => type.value) as unknown as [
  VehicleTypeValue,
  ...VehicleTypeValue[],
];

// Letters, digits, spaces and hyphens only.
export const PLATE_PATTERN = /^[A-Z0-9 -]{2,15}$/;
export const PLATE_ERROR =
  "Use letters, numbers, spaces or hyphens only (2-15 characters).";
export const PLATE_TAKEN_ERROR =
  "That plate number is already listed in this household.";
export const UNREGISTERED_PLATE = "N/A";

export function normalizePlate(value: string) {
  return value.toUpperCase().replace(/\s+/g, " ").trim().slice(0, 15);
}

export function normalizeVehiclePlate(vehicleType: string, value: string) {
  const plate = normalizePlate(value);
  return vehicleType === "EBIKE" && plate === UNREGISTERED_PLATE
    ? UNREGISTERED_PLATE
    : plate;
}


export function isVehicleType(value: string): value is VehicleTypeValue {
  return TYPE_VALUES.includes(value as VehicleTypeValue);
}

export function vehicleTypeLabel(value: string) {
  const known = VEHICLE_TYPES.find((type) => type.value === value);
  // Legacy values display as stored, so old rows never render a blank cell.
  return known?.label ?? (value.trim() || "Other");
}

type PlateCopy = { placeholder: string; hint: string };

const standardPlate: PlateCopy = {
  placeholder: "e.g., ABC-1234 or AB-1234",
  hint: "Enter 3 letters & 3-4 numbers (e.g., ABC-1234) or Conduction Sticker.",
};

const PLATE_COPY: Record<string, PlateCopy> = {
  standard: standardPlate,
  motorcycle: {
    placeholder: "e.g., 123-ABC or D-123-BC",
    hint: "Enter 6-character LTO plate (e.g., 123-ABC), old plate, or MV File No.",
  },
  ebike: {
    placeholder: "e.g., N/A or 123-ABC",
    hint: "Enter 'N/A' if LTO registration is not required, or enter plate number.",
  },
  other: {
    placeholder: "e.g., ABC-1234 or N/A",
    hint: standardPlate.hint,
  },
};

function plateKind(vehicleType: string) {
  switch (vehicleType) {
    case "MOTORCYCLE":
    case "TRICYCLE":
      return "motorcycle";
    case "EBIKE":
      return "ebike";
    case "CAR":
    case "SUV_VAN":
    case "PICKUP":
    case "DELIVERY":
      return "standard";
    default:
      return "other";
  }
}

export function plateCopy(vehicleType: string): PlateCopy {
  return PLATE_COPY[plateKind(vehicleType)];
}

/** HTML `pattern` for the plate input, per vehicle type. */
export function plateInputPattern(vehicleType: string) {
  return vehicleType === "EBIKE" ? "[A-Za-z0-9 /-]{2,15}" : "[A-Za-z0-9 -]{2,15}";
}

const vehicleFields = z.object({
  vehicleType: z.enum(TYPE_VALUES, {
    message: "Choose a vehicle type.",
  }),
  plateNumber: z
    .string()
    .trim()
    .min(1, "Enter the plate number.")
    .max(15, "Keep the plate number to 15 characters."),
  brandModel: z
    .string()
    .trim()
    .min(1, "Enter the brand and model.")
    .max(60, "Keep the brand and model to 60 characters."),
  color: z
    .string()
    .trim()
    .min(1, "Enter the color.")
    .max(30, "Keep the color to 30 characters."),
});

export type VehicleFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string>;
};

export type VehicleInput = {
  vehicleType: string;
  plateNumber: string;
  brandModel: string;
  color: string;
};

/**
 * Shared by every vehicle action and by the client form, so the browser and the
 * server reject the same input.
 */
export function parseVehicleForm(
  input: Record<string, unknown>,
):
  | { ok: true; data: VehicleInput }
  | { ok: false; state: VehicleFormState } {
  const parsed = vehicleFields.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      state: { status: "error", message: "Check the highlighted fields.", fieldErrors },
    };
  }

  const plate = normalizeVehiclePlate(
    parsed.data.vehicleType,
    parsed.data.plateNumber,
  );

  // "N/A" is only a real value for e-bikes; any other type must match the
  // plate pattern (so a typed "N/A" on a car is rejected).
  const unregistered =
    parsed.data.vehicleType === "EBIKE" && plate === UNREGISTERED_PLATE;

  if (!unregistered && !PLATE_PATTERN.test(plate)) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Check the highlighted fields.",
        fieldErrors: { plateNumber: PLATE_ERROR },
      },
    };
  }

  return {
    ok: true,
    data: {
      vehicleType: parsed.data.vehicleType,
      plateNumber: plate,
      brandModel: parsed.data.brandModel,
      color: parsed.data.color,
    },
  };
}

import { z } from "zod";
import {
  composeUnitAddress,
  HOUSE_NUMBER_PATTERN,
  MAX_STREET_LENGTH,
  OTHER_STREET,
  resolveStreet,
} from "@/lib/locations";

export const CONTACT_NUMBER_PATTERN = /^\d{11}$/;

// Person names accept letters, single spaces, hyphens, apostrophes and a
// trailing period (for suffixes such as "Jr."). Digits and every other symbol
// are rejected. At least two letters are required, so a single-letter entry or
// a blank field is rejected.
export const NAME_PATTERN = /^[A-Za-zÑñ][A-Za-zÑñ .'-]*[A-Za-zÑñ.]$/;

// HTML `pattern` counterpart with a lookahead that requires two letters, so the
// browser blocks submission before the server sees it.
export const NAME_INPUT_PATTERN =
  "(?=(?:[^A-Za-zÑñ]*[A-Za-zÑñ]){2})[A-Za-zÑñ][A-Za-zÑñ .'-]*";

export const NAME_MIN_LETTERS = 2;

export const NAME_ERROR =
  "Use letters, spaces, hyphens, apostrophes or periods only. At least 2 letters are required.";

export function isValidPersonName(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");
  if (cleaned.length < NAME_MIN_LETTERS) return false;
  if (!NAME_PATTERN.test(cleaned)) return false;
  return (cleaned.match(/[A-Za-zÑñ]/g) ?? []).length >= NAME_MIN_LETTERS;
}

// Keeps only characters a person name may contain. Used by the client inputs so
// digits cannot be typed at all.
export function sanitizeNameInput(value: string) {
  return value.replace(/[^A-Za-zÑñ .'-]/g, "");
}

export function sanitizeContactInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function isValidContactNumber(value: string) {
  return CONTACT_NUMBER_PATTERN.test(value.trim());
}

// The street dropdown stores either a known street or the literal "Other",
// with the typed value carried in customStreet.
export const unitDetailsSchema = z
  .object({
    street: z.string().trim().min(1).max(MAX_STREET_LENGTH),
    customStreet: z.string().trim().max(MAX_STREET_LENGTH).optional(),
    block: z.string().trim().regex(HOUSE_NUMBER_PATTERN),
    lot: z.string().trim().regex(HOUSE_NUMBER_PATTERN),
  })
  .transform((data, ctx) => {
    const street = resolveStreet(data.street, data.customStreet);
    if (street.length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["street"],
        message: "Enter the street name.",
      });
      return z.NEVER;
    }

    return {
      street,
      block: data.block.toUpperCase(),
      lot: data.lot.toUpperCase(),
      unitAddress: composeUnitAddress({
        street,
        block: data.block,
        lot: data.lot,
      }),
    };
  });

export type UnitDetails = z.infer<typeof unitDetailsSchema>;

export const registrationPayloadSchema = z.object({
  occupancyType: z.enum(["OWNER_OCCUPIED", "TENANT"]),
  householdMembers: z
    .array(
      z.object({
        fullName: z.string().trim().min(1).max(120),
        relationship: z.string().trim().max(60).optional(),
      }),
    )
    .max(10),
  pets: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        breed: z.string().trim().max(60).optional(),
      }),
    )
    .max(10),
  vehicles: z
    .array(
      z.object({
        plateNumber: z.string().trim().min(1).max(20),
      }),
    )
    .max(10),
  kasambahay: z
    .array(
      z.object({
        fullName: z.string().trim().min(1).max(120),
        // Optional only for requests submitted before contacts were required.
        contactNumber: z
          .string()
          .trim()
          .regex(CONTACT_NUMBER_PATTERN)
          .optional(),
      }),
    )
    .max(10),
});

export type RegistrationPayload = z.infer<typeof registrationPayloadSchema>;


export { OTHER_STREET };

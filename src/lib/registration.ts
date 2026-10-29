import { z } from "zod";
import {
  composeUnitAddress,
  HOUSE_NUMBER_PATTERN,
  MAX_STREET_LENGTH,
  OTHER_STREET,
  resolveStreet,
} from "@/lib/locations";

export const CONTACT_NUMBER_PATTERN = /^\d{11}$/;

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
        fullName: z.string().trim().min(2).max(120),
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
        fullName: z.string().trim().min(2).max(120),
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

export function parseRegistrationPayload(value: unknown) {
  return registrationPayloadSchema.safeParse(value);
}

export { OTHER_STREET };

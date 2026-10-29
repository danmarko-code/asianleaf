import { z } from "zod";

export const CONTACT_NUMBER_PATTERN = /^\d{11}$/;

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

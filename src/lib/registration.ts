import { z } from "zod";

export const registrationPayloadSchema = z.object({
  occupancyType: z.enum([
    "OWNER_OCCUPIED",
    "OWNER_NON_OCCUPIED",
    "TENANT",
  ]),
  block: z.string().trim().max(20).optional(),
  lot: z.string().trim().max(20).optional(),
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
        count: z.coerce.number().int().min(1).max(20),
      }),
    )
    .max(10),
  vehicles: z
    .array(
      z.object({
        plateNumber: z.string().trim().min(1).max(20),
        count: z.coerce.number().int().min(1).max(10),
      }),
    )
    .max(10),
  kasambahay: z
    .array(
      z.object({
        fullName: z.string().trim().min(2).max(120),
      }),
    )
    .max(10),
});

export type RegistrationPayload = z.infer<typeof registrationPayloadSchema>;

export function parseRegistrationPayload(value: unknown) {
  return registrationPayloadSchema.safeParse(value);
}

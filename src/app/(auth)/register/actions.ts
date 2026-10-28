"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CONSENT_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { registrationPayloadSchema } from "@/lib/registration";

const registrationSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  contactNumber: z
    .string()
    .trim()
    .min(7)
    .max(30)
    .regex(/^[+0-9()\s.-]+$/, "Enter a valid contact number."),
  password: z.string().min(8).max(72),
  confirmPassword: z.string().min(8).max(72),
  unitAddress: z.string().trim().min(5).max(200),
  occupancyType: z.enum([
    "OWNER_OCCUPIED",
    "OWNER_NON_OCCUPIED",
    "TENANT",
  ]),
  block: z.string().trim().max(20).optional(),
  lot: z.string().trim().max(20).optional(),
  consent: z.string().optional(),
  payload: z.string().max(30000),
});

const extrasSchema = registrationPayloadSchema.pick({
  householdMembers: true,
  pets: true,
  vehicles: true,
  kasambahay: true,
});

export type RegisterState = { error?: string; step?: 1 | 2 };

export async function registerAction(
  _previous: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registrationSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    contactNumber: formData.get("contactNumber"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    unitAddress: formData.get("unitAddress"),
    occupancyType: formData.get("occupancyType"),
    block: formData.get("block") || undefined,
    lot: formData.get("lot") || undefined,
    consent: formData.get("consent"),
    payload: formData.get("payload"),
  });

  if (!parsed.success) {
    return {
      error:
        "Check the required fields. Use at least 8 characters for the password and enter a valid contact number.",
      step: 1,
    };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "The passwords do not match.", step: 1 };
  }

  if (parsed.data.consent !== "on") {
    return {
      error: "Please accept the Data Privacy Act consent to continue.",
      step: 2,
    };
  }

  let extras: z.infer<typeof extrasSchema>;
  try {
    const json = JSON.parse(parsed.data.payload) as unknown;
    const result = extrasSchema.safeParse(json);
    if (!result.success) {
      return {
        error: "Check the household member, pet and vehicle details.",
        step: 2,
      };
    }
    extras = result.data;
  } catch {
    return { error: "Check the household details and try again.", step: 2 };
  }

  const payload = registrationPayloadSchema.safeParse({
    ...extras,
    occupancyType: parsed.data.occupancyType,
    block: parsed.data.block,
    lot: parsed.data.lot,
  });

  if (!payload.success) {
    return { error: "Check the household details and try again.", step: 2 };
  }

  const [account, household, pendingRequest] = await Promise.all([
    prisma.user.findUnique({ where: { email: parsed.data.email } }),
    prisma.household.findFirst({
      where: {
        unitAddress: {
          equals: parsed.data.unitAddress,
          mode: "insensitive",
        },
      },
    }),
    prisma.registrationRequest.findFirst({
      where: {
        status: "PENDING",
        OR: [
          { email: parsed.data.email },
          {
            unitAddress: {
              equals: parsed.data.unitAddress,
              mode: "insensitive",
            },
          },
        ],
      },
    }),
  ]);

  if (account) {
    return {
      error:
        "An account already uses this email address. Sign in instead, or contact the association office.",
      step: 1,
    };
  }

  if (household) {
    return {
      error:
        "This unit is already registered. Contact the association office if you need to update its records.",
      step: 1,
    };
  }

  if (pendingRequest) {
    return {
      error:
        pendingRequest.email === parsed.data.email
          ? "A registration with this email is already waiting for review."
          : "A registration for this unit is already waiting for review.",
      step: 1,
    };
  }

  const plateNumbers = payload.data.vehicles.map((vehicle) =>
    vehicle.plateNumber.toLowerCase(),
  );
  if (new Set(plateNumbers).size !== plateNumbers.length) {
    return {
      error: "Each vehicle plate number can only be listed once.",
      step: 2,
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.registrationRequest.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      contactNumber: parsed.data.contactNumber,
      unitAddress: parsed.data.unitAddress,
      payload: payload.data,
      passwordHash,
      consentVersion: CONSENT_VERSION,
      consentAt: new Date(),
      status: "PENDING",
    },
  });

  redirect("/register?submitted=1");
}

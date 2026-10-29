"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CONSENT_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import {
  CONTACT_NUMBER_PATTERN,
  registrationPayloadSchema,
  unitDetailsSchema,
} from "@/lib/registration";

const registrationSchema = z.object({
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  contactNumber: z
    .string()
    .trim()
    .regex(CONTACT_NUMBER_PATTERN, "Enter an 11-digit contact number."),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/\d/),
  confirmPassword: z.string().min(8).max(72),
  street: z.string().trim().min(1).max(80),
  customStreet: z.string().trim().max(80).optional(),
  block: z.string().trim().min(1).max(10),
  lot: z.string().trim().min(1).max(10),
  occupancyType: z.enum(["OWNER_OCCUPIED", "TENANT"]),
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
    street: formData.get("street"),
    customStreet: formData.get("customStreet") || undefined,
    block: formData.get("block"),
    lot: formData.get("lot"),
    occupancyType: formData.get("occupancyType"),
    consent: formData.get("consent"),
    payload: formData.get("payload"),
  });

  if (!parsed.success) {
    return {
      error:
        "Check the required fields. Choose a street, enter a block and lot, use an 11-digit contact number and a password with at least 8 characters, upper and lowercase letters, and a number.",
      step: 1,
    };
  }

  const unit = unitDetailsSchema.safeParse({
    street: parsed.data.street,
    customStreet: parsed.data.customStreet,
    block: parsed.data.block,
    lot: parsed.data.lot,
  });

  if (!unit.success) {
    return {
      error:
        "Check the unit details. Choose a street, then enter a block and lot using letters or numbers only.",
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
  });

  if (!payload.success) {
    return { error: "Check the household details and try again.", step: 2 };
  }

  const [account, household, pendingRequest] = await Promise.all([
    prisma.user.findUnique({ where: { email: parsed.data.email } }),
    prisma.household.findFirst({
      where: {
        OR: [
          {
            unitAddress: {
              equals: unit.data.unitAddress,
              mode: "insensitive",
            },
          },
          {
            block: unit.data.block,
            lot: unit.data.lot,
          },
        ],
      },
    }),
    prisma.registrationRequest.findFirst({
      where: {
        status: "PENDING",
        OR: [
          { email: parsed.data.email },
          {
            unitAddress: {
              equals: unit.data.unitAddress,
              mode: "insensitive",
            },
          },
          {
            block: unit.data.block,
            lot: unit.data.lot,
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
      unitAddress: unit.data.unitAddress,
      street: unit.data.street,
      block: unit.data.block,
      lot: unit.data.lot,
      payload: payload.data,
      passwordHash,
      consentVersion: CONSENT_VERSION,
      consentAt: new Date(),
      status: "PENDING",
    },
  });

  redirect("/register?submitted=1");
}

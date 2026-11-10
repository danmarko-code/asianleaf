"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { CONSENT_VERSION } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { OTHER_STREET } from "@/lib/locations";
import {
  CONTACT_NUMBER_PATTERN,
  isValidPersonName,
  NAME_ERROR,
  registrationPayloadSchema,
  unitDetailsSchema,
} from "@/lib/registration";

export type CreateMemberState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/, "Invalid username.");

const schema = z.object({
  username: usernameSchema,
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/\d/),
  confirmPassword: z.string().min(8).max(72),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  contactNumber: z
    .string()
    .trim()
    .regex(CONTACT_NUMBER_PATTERN, "Enter an 11-digit contact number."),
  street: z.string().trim().min(1).max(80),
  customStreet: z.string().trim().max(80).optional(),
  block: z.string().trim().min(1).max(10),
  lot: z.string().trim().min(1).max(10),
  occupancyType: z.enum(["OWNER_OCCUPIED", "TENANT"]),
  payload: z.string().max(30000),
});

const extrasSchema = registrationPayloadSchema.pick({
  householdMembers: true,
  pets: true,
  vehicles: true,
  kasambahay: true,
});

const fieldMessages: Record<string, string> = {
  username:
    "Use 3–30 lowercase letters, numbers, dots, dashes and underscores only.",
  password:
    "Use at least 8 characters with upper and lowercase letters and a number.",
  confirmPassword: "Re-enter the same password.",
  firstName: "Enter a valid name using letters and spaces only.",
  lastName: "Enter a valid name using letters and spaces only.",
  contactNumber: "Enter an 11-digit contact number.",
  street: "Choose a street.",
  customStreet: "Enter the street name.",
  block: "Use letters or numbers only.",
  lot: "Use letters or numbers only.",
  occupancyType: "Choose an occupancy type.",
};

function zodFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field !== "string" || !field || fieldErrors[field]) continue;
    fieldErrors[field] = fieldMessages[field] ?? "Check this field.";
  }

  return fieldErrors;
}

export async function createMemberAction(
  _previous: CreateMemberState,
  formData: FormData,
): Promise<CreateMemberState> {
  const admin = await requireRole("ADMIN");

  const parsed = schema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    contactNumber: formData.get("contactNumber"),
    street: formData.get("street"),
    customStreet: formData.get("customStreet") || undefined,
    block: formData.get("block"),
    lot: formData.get("lot"),
    occupancyType: formData.get("occupancyType"),
    payload: formData.get("payload"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: zodFieldErrors(parsed.error),
      error: "Check the highlighted fields and try again.",
    };
  }

  if (!isValidPersonName(parsed.data.firstName)) {
    return { fieldErrors: { firstName: NAME_ERROR } };
  }

  if (!isValidPersonName(parsed.data.lastName)) {
    return { fieldErrors: { lastName: NAME_ERROR } };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { fieldErrors: { confirmPassword: "The passwords do not match." } };
  }

  const unit = unitDetailsSchema.safeParse({
    street: parsed.data.street,
    customStreet:
      parsed.data.street === OTHER_STREET
        ? parsed.data.customStreet
        : undefined,
    block: parsed.data.block,
    lot: parsed.data.lot,
  });

  if (!unit.success) {
    const fieldErrors: Record<string, string> = {};

    for (const issue of unit.error.issues) {
      const field = issue.path[0];
      if (field === "street" && parsed.data.street === OTHER_STREET) {
        fieldErrors.customStreet = "Enter the street name.";
      } else if (field === "street" || field === "block" || field === "lot") {
        fieldErrors[field] =
          fieldMessages[field] ?? "Check this unit detail.";
      }
    }

    return { fieldErrors };
  }

  let extras: z.infer<typeof extrasSchema>;
  try {
    const result = extrasSchema.safeParse(
      JSON.parse(parsed.data.payload) as unknown,
    );
    if (!result.success) {
      return {
        error: "Check the household member, pet and vehicle details.",
      };
    }
    extras = result.data;
  } catch {
    return { error: "Check the household details and try again." };
  }

  const invalidName =
    extras.householdMembers.some(
      (person) => !isValidPersonName(person.fullName),
    ) || extras.kasambahay.some((person) => !isValidPersonName(person.fullName));

  if (invalidName) {
    return { error: NAME_ERROR };
  }

  const payload = registrationPayloadSchema.safeParse({
    ...extras,
    occupancyType: parsed.data.occupancyType,
  });

  if (!payload.success) {
    return { error: "Check the household details and try again." };
  }

  const plateNumbers = payload.data.vehicles.map((vehicle) =>
    vehicle.plateNumber.toLowerCase(),
  );
  if (new Set(plateNumbers).size !== plateNumbers.length) {
    return { error: "Each vehicle plate number can only be listed once." };
  }

  const [usernameTaken, householdTaken, memberTaken] = await Promise.all([
    prisma.user.findUnique({
      where: { username: parsed.data.username },
      select: { id: true },
    }),
    prisma.household.findFirst({
      where: {
        OR: [
          {
            unitAddress: {
              equals: unit.data.unitAddress,
              mode: "insensitive",
            },
          },
          { block: unit.data.block, lot: unit.data.lot },
        ],
      },
      select: { id: true },
    }),
    prisma.member.findFirst({
      where: { contactNumber: parsed.data.contactNumber },
      select: { id: true },
    }),
  ]);

  if (usernameTaken) {
    return {
      fieldErrors: {
        username: "That username is already taken. Choose another one.",
      },
    };
  }

  if (memberTaken) {
    return {
      fieldErrors: {
        contactNumber: "A member already uses this contact number.",
      },
    };
  }

  if (householdTaken) {
    return {
      fieldErrors: {
        block: "A household with this street, block and lot already exists.",
      },
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const consentAt = new Date();

  let memberId: string;

  try {
    memberId = await prisma.$transaction(async (tx) => {
      const household = await tx.household.create({
        data: {
          unitAddress: unit.data.unitAddress,
          street: unit.data.street,
          block: unit.data.block,
          lot: unit.data.lot,
        },
      });

      const member = await tx.member.create({
        data: {
          householdId: household.id,
          firstName: parsed.data.firstName,
          lastName: parsed.data.lastName,
          contactNumber: parsed.data.contactNumber,
          occupancyType: parsed.data.occupancyType,
          status: "ACTIVE",
          consentVersion: CONSENT_VERSION,
          consentAt,
        },
      });

      const account = await tx.user.create({
        data: {
          username: parsed.data.username,
          passwordHash,
          role: "HOMEOWNER",
          status: "ACTIVE",
          householdId: household.id,
          memberId: member.id,
        },
      });

      if (payload.data.householdMembers.length > 0) {
        await tx.householdMember.createMany({
          data: payload.data.householdMembers.map((person) => ({
            memberId: member.id,
            fullName: person.fullName,
            relationship: person.relationship || null,
          })),
        });
      }

      if (payload.data.pets.length > 0) {
        await tx.pet.createMany({
          data: payload.data.pets.map((pet) => ({
            memberId: member.id,
            name: pet.name,
            breed: pet.breed || "Not specified",
          })),
        });
      }

      if (payload.data.vehicles.length > 0) {
        await tx.vehicle.createMany({
          data: payload.data.vehicles.map((vehicle) => ({
            memberId: member.id,
            plateNumber: vehicle.plateNumber,
          })),
        });
      }

      if (payload.data.kasambahay.length > 0) {
        await tx.kasambahay.createMany({
          data: payload.data.kasambahay.map((person) => ({
            memberId: member.id,
            fullName: person.fullName,
            contactNumber: person.contactNumber || null,
          })),
        });
      }

      await tx.notification.create({
        data: {
          userId: account.id,
          type: "GENERAL",
          title: "Your household login is ready",
          body: `The association created a portal login for ${household.unitAddress}. Sign in with the username ${account.username}.`,
          link: "/login",
        },
      });

      return member.id;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          error:
            "That username, contact number or unit is already in use. Check the details and try again.",
        };
      }
    }
    throw error;
  }

  await logAudit({
    actorUserId: admin.id,
    action: "MEMBER_CREATED",
    entityType: "Member",
    entityId: memberId,
    metadata: {
      username: parsed.data.username,
      unitAddress: unit.data.unitAddress,
    },
  });

  revalidatePath("/admin/members");
  revalidatePath("/admin/dashboard");

  redirect(
    `/admin/members/${memberId}?notice=${encodeURIComponent(
      `Member added. The portal login username is ${parsed.data.username}.`,
    )}`,
  );
}

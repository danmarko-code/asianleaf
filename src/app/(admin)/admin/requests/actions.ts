"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { composeUnitAddress, HOUSE_NUMBER_PATTERN } from "@/lib/locations";
import { parseRegistrationPayload } from "@/lib/registration";

const requestIdSchema = z.object({ requestId: z.string().min(1) });
const rejectionSchema = requestIdSchema.extend({
  reason: z.string().trim().min(3).max(300),
});
const unitSchema = z.object({
  street: z.string().trim().min(2).max(80),
  block: z.string().trim().regex(HOUSE_NUMBER_PATTERN),
  lot: z.string().trim().regex(HOUSE_NUMBER_PATTERN),
});

function fail(message: string): never {
  redirect(`/admin/requests?error=${encodeURIComponent(message)}`);
}

function refreshRegistrationViews() {
  revalidatePath("/admin/requests");
  revalidatePath("/admin/members");
  revalidatePath("/admin/dashboard");
}

export async function approveRegistrationAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = requestIdSchema.safeParse({
    requestId: formData.get("requestId"),
  });

  if (!parsed.success) fail("Choose a valid registration request.");

  const request = await prisma.registrationRequest.findUnique({
    where: { id: parsed.data.requestId },
  });

  if (!request) fail("Registration request not found.");
  if (request.status !== "PENDING") {
    fail("This request has already been reviewed.");
  }

  if (!request.passwordHash) {
    fail("This request has no password. Ask the applicant to register again.");
  }

  const payload = parseRegistrationPayload(request.payload);
  if (!payload.success) {
    fail(
      "This request is missing household details. Ask the applicant to register again.",
    );
  }

  // The admin can correct the unit while approving; otherwise the values the
  // applicant submitted are used.
  const submittedUnit = unitSchema.safeParse({
    street: formData.get("street") || request.street,
    block: formData.get("block") || request.block,
    lot: formData.get("lot") || request.lot,
  });

  if (!submittedUnit.success) {
    fail(
      "Set the street, block and lot before approving. Block and lot may only contain letters, numbers and dashes.",
    );
  }

  const block = submittedUnit.data.block.toUpperCase();
  const lot = submittedUnit.data.lot.toUpperCase();
  const unitAddress = composeUnitAddress({
    street: submittedUnit.data.street,
    block,
    lot,
  });

  const [existingAccount, existingHousehold] = await Promise.all([
    prisma.user.findUnique({ where: { email: request.email } }),
    prisma.household.findFirst({
      where: {
        OR: [
          { unitAddress: { equals: unitAddress, mode: "insensitive" } },
          {
            block,
            lot,
          },
        ],
      },
    }),
  ]);

  if (existingAccount) {
    fail("An account with this email already exists.");
  }

  if (existingHousehold) {
    fail("A household with this unit already exists.");
  }

  try {
    await prisma.$transaction(async (tx) => {
      const household = await tx.household.create({
        data: {
          unitAddress,
          street: submittedUnit.data.street,
          block,
          lot,
        },
      });

      const member = await tx.member.create({
        data: {
          householdId: household.id,
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email,
          contactNumber: request.contactNumber,
          occupancyType: payload.data.occupancyType,
          status: "ACTIVE",
          consentVersion: request.consentVersion,
          consentAt: request.consentAt,
        },
      });

      const account = await tx.user.create({
        data: {
          email: request.email,
          passwordHash: request.passwordHash!,
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

      await tx.registrationRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          unitAddress,
          street: submittedUnit.data.street,
          block,
          lot,
          reviewedById: admin.id,
          reviewedAt: new Date(),
          createdUserId: account.id,
          rejectionReason: null,
        },
      });

      await tx.notification.create({
        data: {
          userId: account.id,
          type: "REGISTRATION_APPROVED",
          title: "Registration approved",
          body: `Your household at ${household.unitAddress} is now active. You can sign in with your registered email.`,
          link: "/login",
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        fail(
          "This email or unit is already in use. Refresh the queue and try again.",
        );
      }

      if (error.code === "P2021" || error.code === "P2022") {
        console.error("Registration approval schema mismatch:", error.message);
        fail(
          "The database schema is out of date. Run `npx prisma db push` and restart the server, then try again.",
        );
      }
    }
    throw error;
  }

  refreshRegistrationViews();
  await logAudit({
    actorUserId: admin.id,
    action: "REGISTRATION_APPROVED",
    entityType: "RegistrationRequest",
    entityId: request.id,
    metadata: { unitAddress, email: request.email },
  });
  redirect(
    `/admin/requests?notice=${encodeURIComponent(
      "Registration approved. The household login is now active.",
    )}`,
  );
}

export async function rejectRegistrationAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = rejectionSchema.safeParse({
    requestId: formData.get("requestId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    fail("Enter a rejection reason of at least 3 characters.");
  }

  const request = await prisma.registrationRequest.findUnique({
    where: { id: parsed.data.requestId },
  });

  if (!request) fail("Registration request not found.");
  if (request.status !== "PENDING") {
    fail("This request has already been reviewed.");
  }

  await prisma.registrationRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      reviewedById: admin.id,
      reviewedAt: new Date(),
      rejectionReason: parsed.data.reason,
    },
  });

  refreshRegistrationViews();
  await logAudit({
    actorUserId: admin.id,
    action: "REGISTRATION_REJECTED",
    entityType: "RegistrationRequest",
    entityId: request.id,
    metadata: { reason: parsed.data.reason },
  });
  redirect(
    `/admin/requests?notice=${encodeURIComponent(
      "Registration rejected. The applicant can submit a corrected request.",
    )}`,
  );
}

"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  composeUnitAddress,
  HOUSE_NUMBER_PATTERN,
  OTHER_STREET,
} from "@/lib/locations";
import { CONTACT_NUMBER_PATTERN } from "@/lib/registration";

const idSchema = z.string().min(1);
const contact = z.string().trim().regex(CONTACT_NUMBER_PATTERN);
const name = z.string().trim().min(2).max(120);

function back(
  memberId: string,
  tab: string,
  message: string,
  tone: "notice" | "error" = "notice",
): never {
  redirect(
    `/admin/members/${memberId}?tab=${tab}&${tone}=${encodeURIComponent(message)}`,
  );
}

function requireMemberId(formData: FormData) {
  const parsed = idSchema.safeParse(formData.get("memberId"));
  if (!parsed.success) redirect("/admin/members");
  return parsed.data;
}

function refresh(memberId: string) {
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  revalidatePath("/admin/dashboard");
}

export async function updateMemberAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const memberId = requireMemberId(formData);

  const parsed = z
    .object({
      firstName: name.regex(/^[A-Za-z .'-]+$/),
      lastName: name.regex(/^[A-Za-z .'-]+$/),
      email: z.string().trim().toLowerCase().email().max(254),
      contactNumber: contact,
      occupancyType: z.enum(["OWNER_OCCUPIED", "TENANT"]),
      status: z.enum(["ACTIVE", "INACTIVE"]),
    })
    .safeParse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      contactNumber: formData.get("contactNumber"),
      occupancyType: formData.get("occupancyType"),
      status: formData.get("status"),
    });

  if (!parsed.success) {
    back(
      memberId,
      "overview",
      "Check the name, email, 11-digit contact number and status.",
      "error",
    );
  }

  const member = await prisma.member.update({
    where: { id: memberId },
    data: parsed.data,
  });

  await logAudit({
    actorUserId: admin.id,
    action: "MEMBER_UPDATED",
    entityType: "Member",
    entityId: member.id,
    metadata: { householdId: member.householdId },
  });

  refresh(member.id);
  back(member.id, "overview", "Resident details updated.");
}

export async function updateHouseholdUnitAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const memberId = requireMemberId(formData);

  const parsed = z
    .object({
      phase: z.string().trim().min(1).max(40),
      streetChoice: z.string().trim().min(1).max(80),
      customStreet: z.string().trim().max(80).optional(),
      block: z.string().trim().regex(HOUSE_NUMBER_PATTERN),
      lot: z.string().trim().regex(HOUSE_NUMBER_PATTERN),
    })
    .safeParse({
      phase: formData.get("phase"),
      streetChoice: formData.get("streetChoice"),
      customStreet: formData.get("customStreet") || undefined,
      block: formData.get("block"),
      lot: formData.get("lot"),
    });

  if (!parsed.success) {
    back(
      memberId,
      "overview",
      "Enter a valid phase, street, block and lot.",
      "error",
    );
  }

  const street =
    parsed.data.streetChoice === OTHER_STREET
      ? (parsed.data.customStreet ?? "").trim()
      : parsed.data.streetChoice;

  if (street.length < 2) {
    back(memberId, "overview", "Enter the street name.", "error");
  }

  const block = parsed.data.block.toUpperCase();
  const lot = parsed.data.lot.toUpperCase();
  const unitAddress = composeUnitAddress({
    phase: parsed.data.phase,
    street,
    block,
    lot,
  });

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: { id: true, householdId: true },
  });
  if (!member) redirect("/admin/members");

  const clash = await prisma.household.findFirst({
    where: {
      id: { not: member.householdId },
      OR: [
        { unitAddress: { equals: unitAddress, mode: "insensitive" } },
        { phase: parsed.data.phase, block, lot },
      ],
    },
  });

  if (clash) {
    back(
      member.id,
      "overview",
      "Another household already uses that unit.",
      "error",
    );
  }

  await prisma.household.update({
    where: { id: member.householdId },
    data: {
      unitAddress,
      phase: parsed.data.phase,
      street,
      block,
      lot,
    },
  });

  await logAudit({
    actorUserId: admin.id,
    action: "HOUSEHOLD_UNIT_UPDATED",
    entityType: "Household",
    entityId: member.householdId,
    metadata: { unitAddress },
  });

  refresh(member.id);
  back(member.id, "overview", "Household unit updated.");
}

export async function addHouseholdMemberAction(formData: FormData) {
  await requireRole("ADMIN");
  const memberId = requireMemberId(formData);
  const parsed = z
    .object({
      fullName: name,
      relationship: z.string().trim().max(60).optional(),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      relationship: formData.get("relationship") || undefined,
    });

  if (!parsed.success) {
    back(memberId, "people", "Enter a full name and relationship.", "error");
  }

  await prisma.householdMember.create({
    data: {
      memberId,
      fullName: parsed.data.fullName,
      relationship: parsed.data.relationship ?? null,
    },
  });

  refresh(memberId);
  back(memberId, "people", "Household member added.");
}

export async function removeHouseholdMemberAction(formData: FormData) {
  await requireRole("ADMIN");
  const memberId = requireMemberId(formData);
  const id = idSchema.parse(formData.get("id"));

  const row = await prisma.householdMember.findFirst({
    where: { id, memberId },
  });
  if (row) await prisma.householdMember.delete({ where: { id } });

  refresh(memberId);
  back(memberId, "people", "Household member removed.");
}

export async function addKasambahayAction(formData: FormData) {
  await requireRole("ADMIN");
  const memberId = requireMemberId(formData);
  const parsed = z
    .object({
      fullName: name,
      contactNumber: contact.optional(),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      contactNumber: formData.get("contactNumber") || undefined,
    });

  if (!parsed.success) {
    back(
      memberId,
      "kasambahay",
      "Enter a full name and an 11-digit contact number.",
      "error",
    );
  }

  await prisma.kasambahay.create({
    data: {
      memberId,
      fullName: parsed.data.fullName,
      contactNumber: parsed.data.contactNumber ?? null,
    },
  });

  refresh(memberId);
  back(memberId, "kasambahay", "Kasambahay added.");
}

export async function removeKasambahayAction(formData: FormData) {
  await requireRole("ADMIN");
  const memberId = requireMemberId(formData);
  const id = idSchema.parse(formData.get("id"));

  const row = await prisma.kasambahay.findFirst({ where: { id, memberId } });
  if (row) await prisma.kasambahay.delete({ where: { id } });

  refresh(memberId);
  back(memberId, "kasambahay", "Kasambahay removed.");
}

export async function addPetAction(formData: FormData) {
  await requireRole("ADMIN");
  const memberId = requireMemberId(formData);
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(60),
      breed: z.string().trim().max(60).optional(),
      count: z.coerce.number().int().min(1).max(20),
    })
    .safeParse({
      name: formData.get("name"),
      breed: formData.get("breed") || undefined,
      count: formData.get("count") || 1,
    });

  if (!parsed.success) {
    back(
      memberId,
      "pets",
      "Enter a pet name, breed and a count of at least 1.",
      "error",
    );
  }

  await prisma.pet.create({
    data: {
      memberId,
      name: parsed.data.name,
      breed: parsed.data.breed || "Not specified",
      count: parsed.data.count,
    },
  });

  refresh(memberId);
  back(memberId, "pets", "Pet added.");
}

export async function removePetAction(formData: FormData) {
  await requireRole("ADMIN");
  const memberId = requireMemberId(formData);
  const id = idSchema.parse(formData.get("id"));

  const row = await prisma.pet.findFirst({ where: { id, memberId } });
  if (row) await prisma.pet.delete({ where: { id } });

  refresh(memberId);
  back(memberId, "pets", "Pet removed.");
}

export async function addVehicleAction(formData: FormData) {
  await requireRole("ADMIN");
  const memberId = requireMemberId(formData);
  const parsed = z
    .object({
      plateNumber: z.string().trim().min(3).max(20),
      count: z.coerce.number().int().min(1).max(20),
    })
    .safeParse({
      plateNumber: formData.get("plateNumber"),
      count: formData.get("count") || 1,
    });

  if (!parsed.success) {
    back(
      memberId,
      "vehicles",
      "Enter a plate number and a count of at least 1.",
      "error",
    );
  }

  try {
    await prisma.vehicle.create({
      data: {
        memberId,
        plateNumber: parsed.data.plateNumber.toUpperCase(),
        count: parsed.data.count,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      back(memberId, "vehicles", "That plate number is already listed.", "error");
    }
    throw error;
  }

  refresh(memberId);
  back(memberId, "vehicles", "Vehicle added.");
}

export async function removeVehicleAction(formData: FormData) {
  await requireRole("ADMIN");
  const memberId = requireMemberId(formData);
  const id = idSchema.parse(formData.get("id"));

  const row = await prisma.vehicle.findFirst({ where: { id, memberId } });
  if (row) await prisma.vehicle.delete({ where: { id } });

  refresh(memberId);
  back(memberId, "vehicles", "Vehicle removed.");
}

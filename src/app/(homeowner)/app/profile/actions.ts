"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { CONTACT_NUMBER_PATTERN } from "@/lib/registration";

const contact = z.string().trim().regex(CONTACT_NUMBER_PATTERN);
const name = z.string().trim().min(2).max(120);

function back(message: string, tone: "notice" | "error" = "notice"): never {
  redirect(`/app/profile?${tone}=${encodeURIComponent(message)}`);
}

async function ownMember() {
  const user = await requireRole("HOMEOWNER");
  if (!user.memberId) back("Your login is not linked to a member record yet.", "error");
  return user;
}

export async function updateOwnContactAction(formData: FormData) {
  const user = await ownMember();

  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().email().max(254),
      contactNumber: contact,
    })
    .safeParse({
      email: formData.get("email"),
      contactNumber: formData.get("contactNumber"),
    });

  if (!parsed.success) {
    back("Enter a valid email address and an 11-digit contact number.", "error");
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: user.memberId! },
        data: parsed.data,
      });

      if (user.email !== parsed.data.email) {
        await tx.user.update({
          where: { id: user.id },
          data: { email: parsed.data.email },
        });
      }
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      back("That email address is already used by another account.", "error");
    }
    throw error;
  }

  await logAudit({
    actorUserId: user.id,
    action: "PROFILE_CONTACT_UPDATED",
    entityType: "Member",
    entityId: user.memberId,
  });

  revalidatePath("/app/profile");
  back("Contact details updated.");
}

export async function addOwnHouseholdMemberAction(formData: FormData) {
  const user = await ownMember();
  const parsed = z
    .object({
      fullName: name,
      relationship: z.string().trim().max(60).optional(),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      relationship: formData.get("relationship") || undefined,
    });

  if (!parsed.success) back("Enter a full name and relationship.", "error");

  await prisma.householdMember.create({
    data: {
      memberId: user.memberId!,
      fullName: parsed.data.fullName,
      relationship: parsed.data.relationship ?? null,
    },
  });

  revalidatePath("/app/profile");
  back("Household member added.");
}

export async function removeOwnHouseholdMemberAction(formData: FormData) {
  const user = await ownMember();
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back("Choose a valid record.", "error");

  const row = await prisma.householdMember.findFirst({
    where: { id: id.data, memberId: user.memberId! },
  });
  if (row) await prisma.householdMember.delete({ where: { id: id.data } });

  revalidatePath("/app/profile");
  back("Household member removed.");
}

export async function addOwnKasambahayAction(formData: FormData) {
  const user = await ownMember();
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
    back("Enter a full name and an 11-digit contact number.", "error");
  }

  await prisma.kasambahay.create({
    data: {
      memberId: user.memberId!,
      fullName: parsed.data.fullName,
      contactNumber: parsed.data.contactNumber ?? null,
    },
  });

  revalidatePath("/app/profile");
  back("Kasambahay added.");
}

export async function removeOwnKasambahayAction(formData: FormData) {
  const user = await ownMember();
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back("Choose a valid record.", "error");

  const row = await prisma.kasambahay.findFirst({
    where: { id: id.data, memberId: user.memberId! },
  });
  if (row) await prisma.kasambahay.delete({ where: { id: id.data } });

  revalidatePath("/app/profile");
  back("Kasambahay removed.");
}

export async function addOwnPetAction(formData: FormData) {
  const user = await ownMember();
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

  if (!parsed.success) back("Enter a pet name and a count of at least 1.", "error");

  await prisma.pet.create({
    data: {
      memberId: user.memberId!,
      name: parsed.data.name,
      breed: parsed.data.breed || "Not specified",
      count: parsed.data.count,
    },
  });

  revalidatePath("/app/profile");
  back("Pet added.");
}

export async function removeOwnPetAction(formData: FormData) {
  const user = await ownMember();
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back("Choose a valid record.", "error");

  const row = await prisma.pet.findFirst({
    where: { id: id.data, memberId: user.memberId! },
  });
  if (row) await prisma.pet.delete({ where: { id: id.data } });

  revalidatePath("/app/profile");
  back("Pet removed.");
}

export async function addOwnVehicleAction(formData: FormData) {
  const user = await ownMember();
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
    back("Enter a plate number and a count of at least 1.", "error");
  }

  try {
    await prisma.vehicle.create({
      data: {
        memberId: user.memberId!,
        plateNumber: parsed.data.plateNumber.toUpperCase(),
        count: parsed.data.count,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      back("That plate number is already listed.", "error");
    }
    throw error;
  }

  revalidatePath("/app/profile");
  back("Vehicle added.");
}

export async function removeOwnVehicleAction(formData: FormData) {
  const user = await ownMember();
  const id = z.string().min(1).safeParse(formData.get("id"));
  if (!id.success) back("Choose a valid record.", "error");

  const row = await prisma.vehicle.findFirst({
    where: { id: id.data, memberId: user.memberId! },
  });
  if (row) await prisma.vehicle.delete({ where: { id: id.data } });

  revalidatePath("/app/profile");
  back("Vehicle removed.");
}

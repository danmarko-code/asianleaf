import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  PLATE_TAKEN_ERROR,
  UNREGISTERED_PLATE,
  type VehicleFormState,
  type VehicleInput,
} from "@/lib/vehicles";

/**
 * Creates or updates a vehicle for one member. Returns a form state on failure
 * (duplicate plate, missing record, Prisma unique race) and null on success.
 */
export async function saveVehicleRecord({
  memberId,
  id,
  data,
}: {
  memberId: string;
  id?: string;
  data: VehicleInput;
}): Promise<VehicleFormState | null> {
  // "N/A" is the e-bike placeholder, so it never has to be unique.
  if (data.plateNumber !== UNREGISTERED_PLATE) {
    const taken = await prisma.vehicle.findFirst({
      where: {
        memberId,
        plateNumber: data.plateNumber,
        ...(id ? { NOT: { id } } : {}),
      },
      select: { id: true },
    });

    if (taken) {
      return {
        status: "error",
        message: PLATE_TAKEN_ERROR,
        fieldErrors: { plateNumber: PLATE_TAKEN_ERROR },
      };
    }
  }

  try {
    if (id) {
      const own = await prisma.vehicle.findFirst({
        where: { id, memberId },
        select: { id: true },
      });
      if (!own) {
        return { status: "error", message: "That vehicle is no longer listed." };
      }
      await prisma.vehicle.update({ where: { id }, data });
    } else {
      await prisma.vehicle.create({ data: { memberId, ...data } });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          status: "error",
          message: PLATE_TAKEN_ERROR,
          fieldErrors: { plateNumber: PLATE_TAKEN_ERROR },
        };
      }
      // The row was deleted between the ownership check and the update.
      if (error.code === "P2025") {
        return { status: "error", message: "That vehicle is no longer listed." };
      }
    }
    throw error;
  }

  return null;
}

import { PrismaClient } from "@prisma/client";

// Next.js hot reload creates new module instances in development. Reusing one
// client through globalThis avoids exhausting database connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

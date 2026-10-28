import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [users, households, members, dues] = await Promise.all([
      prisma.user.count(),
      prisma.household.count(),
      prisma.member.count(),
      prisma.due.count(),
    ]);

    return Response.json({
      ok: true,
      database: "up",
      counts: { users, households, members, dues },
    });
  } catch {
    return Response.json(
      { ok: false, database: "down" },
      { status: 503 },
    );
  }
}

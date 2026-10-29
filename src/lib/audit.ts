import { prisma } from "@/lib/db";

// Audit writes must never break the action they describe, so failures are
// logged and swallowed. Every privileged mutation calls this helper.
export async function logAudit({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: metadata
          ? (JSON.parse(JSON.stringify(metadata)) as object)
          : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}

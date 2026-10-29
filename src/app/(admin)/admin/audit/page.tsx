import type { Metadata } from "next";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Audit log" };

export default async function AdminAuditPage() {
  await requireRole("ADMIN");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { actor: { select: { email: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Oversight"
        title="Audit log"
        description="Administrative actions recorded by the portal, newest first."
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            The latest 100 recorded actions. Metadata is stored as JSON.
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {logs.length === 0 ? (
            <EmptyState
              title="No audit records yet"
              description="Approvals, payment reviews, violations, dues runs and edits will appear here."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Action</Th>
                    <Th>Entity</Th>
                    <Th>Actor</Th>
                    <Th>Details</Th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <Td className="whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </Td>
                      <Td>
                        <span className="font-mono text-xs">{log.action}</span>
                      </Td>
                      <Td>
                        {log.entityType}
                        {log.entityId ? (
                          <span className="mt-0.5 block font-mono text-[11px] text-muted">
                            {log.entityId}
                          </span>
                        ) : null}
                      </Td>
                      <Td>{log.actor?.email ?? "system"}</Td>
                      <Td>
                        <span className="block max-w-72 break-words font-mono text-[11px] text-muted">
                          {log.metadata ? JSON.stringify(log.metadata) : "—"}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrapper>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import {
  approveRegistrationAction,
  rejectRegistrationAction,
} from "@/app/(admin)/admin/requests/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { parseHouseholdLabel, STREETS } from "@/lib/locations";
import { parseRegistrationPayload } from "@/lib/registration";

export const metadata: Metadata = { title: "Register requests" };

const occupancyLabels = {
  OWNER_OCCUPIED: "Owner",
  TENANT: "Tenant",
} as const;

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  await requireRole("ADMIN");
  const { error, notice } = await searchParams;

  const [pending, reviewed] = await Promise.all([
    prisma.registrationRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.registrationRequest.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 12,
      include: { reviewedBy: { select: { email: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Register requests"
        description="Review a submitted registration. Approval creates the household record and its single login."
      />

      {notice ? <Alert tone="info">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Alert tone="info" title="Check the unit before approving">
        Approval creates the household, primary resident, dependents, pets,
        vehicles, kasambahay and the homeowner login in one transaction.
      </Alert>

      <div>
        <h2 className="font-serif text-2xl text-ink">Pending review</h2>
        <p className="mt-1 text-sm text-muted">
          {pending.length === 0
            ? "No registration requests are waiting."
            : `${pending.length} request${pending.length === 1 ? "" : "s"} waiting for review.`}
        </p>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          title="The review queue is clear"
          description="New household registrations will appear here after the applicant submits the two-step form."
        />
      ) : (
        <div className="space-y-5">
          {pending.map((request) => {
            const parsed = parseRegistrationPayload(request.payload);
            const legacy = parseHouseholdLabel(request.unitAddress);
            const unit = {
              street: request.street ?? legacy?.street ?? "",
              block: request.block ?? legacy?.block ?? "",
              lot: request.lot ?? legacy?.lot ?? "",
            };

            return (
              <Card key={request.id}>
                <CardHeader className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {request.firstName} {request.lastName}
                    </CardTitle>
                    <CardDescription>
                      {request.unitAddress} · Submitted{" "}
                      {formatDate(request.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </CardHeader>

                <CardBody className="space-y-6">
                  {parsed.success ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Detail label="Email" value={request.email} />
                        <Detail
                          label="Contact"
                          value={request.contactNumber}
                        />
                        <Detail
                          label="Occupancy"
                          value={occupancyLabels[parsed.data.occupancyType]}
                        />
                        <Detail
                          label="Street"
                          value={unit.street || "Not provided"}
                        />
                        <Detail
                          label="Block / Lot"
                          value={
                            unit.block || unit.lot
                              ? `Block ${unit.block || "?"} · Lot ${unit.lot || "?"}`
                              : "Not provided"
                          }
                        />
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <DetailList
                          title="Household members"
                          empty="No additional members."
                          items={parsed.data.householdMembers.map(
                            (row) =>
                              `${row.fullName}${row.relationship ? ` — ${row.relationship}` : ""}`,
                          )}
                        />
                        <DetailList
                          title="Kasambahay"
                          empty="No kasambahay listed."
                          items={parsed.data.kasambahay.map(
                            (row) =>
                              `${row.fullName} — ${row.contactNumber || "contact not provided"}`,
                          )}
                        />
                        <DetailList
                          title="Pets"
                          empty="No pets listed."
                          items={parsed.data.pets.map(
                            (row) =>
                              `${row.name}${row.breed ? ` (${row.breed})` : ""}`,
                          )}
                        />
                        <DetailList
                          title="Vehicles"
                          empty="No vehicles listed."
                          items={parsed.data.vehicles.map(
                            (row) => row.plateNumber,
                          )}
                        />
                      </div>

                      <p className="text-xs text-muted">
                        Consent {request.consentVersion} accepted{" "}
                        {formatDate(request.consentAt)}.
                      </p>
                    </>
                  ) : (
                    <Alert tone="warning" title="Incomplete household details">
                      This request cannot be approved automatically because the
                      stored household details are incomplete. Reject it and ask
                      the applicant to register again.
                    </Alert>
                  )}

                  <div className="grid gap-4 border-t border-line pt-5 lg:grid-cols-2">
                    <div className="rounded-md border border-line p-4">
                      <p className="text-sm font-medium text-ink">
                        Approve and create login
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        Check the unit details, correct them if needed, then
                        approve. The applicant&apos;s email and password become the
                        household login.
                      </p>
                      <form
                        action={approveRegistrationAction}
                        className="mt-3 space-y-3"
                      >
                        <input
                          type="hidden"
                          name="requestId"
                          value={request.id}
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            label="Street"
                            name="street"
                            defaultValue={unit.street}
                            list={`streets-${request.id}`}
                            required
                            minLength={2}
                            maxLength={80}
                            hint={`Known: ${STREETS.join(", ")}`}
                          />
                          <datalist id={`streets-${request.id}`}>
                            {STREETS.map((street) => (
                              <option key={street} value={street} />
                            ))}
                          </datalist>
                          <Input
                            label="Block"
                            name="block"
                            defaultValue={unit.block}
                            required
                            pattern="[A-Za-z0-9-]{1,10}"
                            maxLength={10}
                          />
                          <Input
                            label="Lot"
                            name="lot"
                            defaultValue={unit.lot}
                            required
                            pattern="[A-Za-z0-9-]{1,10}"
                            maxLength={10}
                          />
                        </div>
                        <Button type="submit" size="sm">
                          Approve registration
                        </Button>
                      </form>
                    </div>

                    <div className="rounded-md border border-line p-4">
                      <form
                        action={rejectRegistrationAction}
                        className="space-y-3"
                      >
                        <input
                          type="hidden"
                          name="requestId"
                          value={request.id}
                        />
                        <Input
                          label="Rejection reason"
                          name="reason"
                          required
                          minLength={3}
                          maxLength={300}
                          placeholder="Unit details need correction"
                        />
                        <Button type="submit" size="sm" variant="danger">
                          Reject request
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recently reviewed</CardTitle>
          <CardDescription>
            Approved and rejected requests, most recent first.
          </CardDescription>
        </CardHeader>
        <CardBody className="px-0 py-0">
          {reviewed.length === 0 ? (
            <EmptyState
              title="No reviewed requests yet"
              description="Decisions will be recorded here with the reviewer and reason."
              className="mx-5 my-5"
            />
          ) : (
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Applicant</Th>
                    <Th>Unit</Th>
                    <Th>Decision</Th>
                    <Th>Reviewed</Th>
                  </tr>
                </thead>
                <tbody>
                  {reviewed.map((request) => (
                    <tr key={request.id}>
                      <Td>
                        <p className="font-medium text-ink">
                          {request.firstName} {request.lastName}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {request.email}
                        </p>
                      </Td>
                      <Td>{request.unitAddress}</Td>
                      <Td>
                        <Badge
                          tone={
                            request.status === "APPROVED"
                              ? "success"
                              : "danger"
                          }
                        >
                          {request.status === "APPROVED"
                            ? "Approved"
                            : "Rejected"}
                        </Badge>
                        {request.rejectionReason ? (
                          <p className="mt-1 max-w-56 text-xs text-muted">
                            {request.rejectionReason}
                          </p>
                        ) : null}
                      </Td>
                      <Td>
                        <p>{request.reviewedAt ? formatDate(request.reviewedAt) : "Unknown"}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {request.reviewedBy?.email ?? "Reviewer not recorded"}
                        </p>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-ink">{value}</p>
    </div>
  );
}

function DetailList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-1 text-sm text-ink">
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

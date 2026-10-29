import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STREETS } from "@/lib/locations";

export const metadata: Metadata = { title: "Members" };

const occupancyLabels = {
  OWNER_OCCUPIED: "Owner",
  TENANT: "Tenant",
} as const;

const statusTone = {
  ACTIVE: "success",
  INACTIVE: "neutral",
} as const;

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    street?: string | string[];
    block?: string | string[];
    lot?: string | string[];
    occupancy?: string | string[];
    status?: string | string[];
  }>;
}) {
  await requireRole("ADMIN");
  const params = await searchParams;

  const q = firstValue(params.q).slice(0, 80);
  const street = firstValue(params.street).slice(0, 80);
  const block = firstValue(params.block).slice(0, 10);
  const lot = firstValue(params.lot).slice(0, 10);
  const occupancy = firstValue(params.occupancy);
  const status = firstValue(params.status);

  const filters: Prisma.MemberWhereInput[] = [];

  for (const term of q.split(/\s+/).filter(Boolean).slice(0, 5)) {
    filters.push({
      OR: [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { contactNumber: { contains: term, mode: "insensitive" } },
        {
          household: {
            unitAddress: { contains: term, mode: "insensitive" },
          },
        },
      ],
    });
  }

  if (street) {
    filters.push({
      household: {
        OR: [
          { street: { equals: street, mode: "insensitive" } },
          // Legacy households have no street column yet.
          {
            street: null,
            unitAddress: { contains: street, mode: "insensitive" },
          },
        ],
      },
    });
  }

  if (block) {
    filters.push({
      household: { block: { equals: block, mode: "insensitive" } },
    });
  }

  if (lot) {
    filters.push({
      household: { lot: { equals: lot, mode: "insensitive" } },
    });
  }

  if (
    occupancy === "OWNER_OCCUPIED" ||
    occupancy === "TENANT"
  ) {
    filters.push({ occupancyType: occupancy });
  }

  if (status === "ACTIVE" || status === "INACTIVE") {
    filters.push({ status });
  }

  const members = await prisma.member.findMany({
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: [
      { household: { unitAddress: "asc" } },
      { lastName: "asc" },
      { firstName: "asc" },
    ],
    include: {
      household: {
        include: {
          _count: { select: { members: true } },
          account: { select: { status: true } },
        },
      },
      _count: {
        select: {
          occupants: true,
          vehicles: true,
          pets: true,
          kasambahay: true,
        },
      },
    },
  });

  const householdCount = new Set(members.map((member) => member.householdId))
    .size;
  const hasFilters = Boolean(
    q || street || block || lot || occupancy || status,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Members"
        description="Search household records by resident, contact details, street or block."
      />

      <Card>
        <CardBody>
          <form
            key={[q, street, block, lot, occupancy, status].join("|")}
            method="get"
            action="/admin/members"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12"
          >
            <div className="sm:col-span-2 lg:col-span-4">
              <Input
                label="Search"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Name, email, contact or address"
              />
            </div>
            <div className="lg:col-span-4">
              <Select label="Street" name="street" defaultValue={street}>
                <option value="">All streets</option>
                {STREETS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-1">
              <Input
                label="Block"
                name="block"
                defaultValue={block}
                placeholder="1"
                maxLength={10}
              />
            </div>
            <div className="lg:col-span-1">
              <Input
                label="Lot"
                name="lot"
                defaultValue={lot}
                placeholder="12"
                maxLength={10}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <Select
                label="Occupancy"
                name="occupancy"
                defaultValue={occupancy}
              >
                <option value="">All occupancies</option>
                <option value="OWNER_OCCUPIED">Owner</option>
                <option value="TENANT">Tenant</option>
              </Select>
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <Select label="Status" name="status" defaultValue={status}>
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-12">
              <Button type="submit">Search records</Button>
              {hasFilters ? (
                <Link
                  href="/admin/members"
                  className={buttonStyles({ variant: "secondary" })}
                >
                  Clear filters
                </Link>
              ) : null}
            </div>
          </form>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-muted">
          {members.length} member{members.length === 1 ? "" : "s"} across{" "}
          {householdCount} household{householdCount === 1 ? "" : "s"}
        </p>
        {hasFilters ? (
          <p className="text-xs text-muted">Filtered results</p>
        ) : null}
      </div>

      {members.length === 0 ? (
        <EmptyState
          title="No matching members"
          description="Try a different name, street or block, or clear the filters to see every record."
          action={
            <Link
              href="/admin/members"
              className={buttonStyles({ variant: "secondary" })}
            >
              Clear filters
            </Link>
          }
        />
      ) : (
        <Card>
          <CardBody className="px-0 py-0">
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <Th>Resident</Th>
                    <Th>Address</Th>
                    <Th>Contact</Th>
                    <Th>Household</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const household = member.household;
                    const extraMembers = Math.max(
                      household._count.members - 1,
                      0,
                    );
                    const dependents = member._count.occupants;

                    return (
                      <tr key={member.id}>
                        <Td>
                          <Link
                            href={`/admin/members/${member.id}`}
                            className="font-medium text-forest underline-offset-4 hover:underline"
                          >
                            {member.firstName} {member.lastName}
                          </Link>
                          <p className="mt-0.5 text-xs text-muted">
                            {member.email}
                          </p>
                        </Td>
                        <Td>
                          <p className="text-ink">{household.unitAddress}</p>
                          {household.block || household.lot ? (
                            <p className="mt-0.5 text-xs text-muted">
                              {household.block
                                ? `Block ${household.block}`
                                : "No block"}
                              {household.lot ? ` · Lot ${household.lot}` : ""}
                            </p>
                          ) : null}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {member.contactNumber}
                        </Td>
                        <Td>
                          <p className="text-ink">
                            {occupancyLabels[member.occupancyType]}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {extraMembers === 0
                              ? "Primary resident only"
                              : `Primary + ${extraMembers} more`}
                            {dependents > 0
                              ? ` · ${dependents} listed dependent${dependents === 1 ? "" : "s"}`
                              : ""}
                            {member._count.vehicles > 0
                              ? ` · ${member._count.vehicles} vehicle${member._count.vehicles === 1 ? "" : "s"}`
                              : ""}
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {household.account?.status === "ACTIVE"
                              ? "Portal login active"
                              : "No active portal login"}
                          </p>
                        </Td>
                        <Td>
                          <Badge tone={statusTone[member.status]}>
                            {member.status === "ACTIVE" ? "Active" : "Inactive"}
                          </Badge>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrapper>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

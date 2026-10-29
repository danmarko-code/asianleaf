import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addHouseholdMemberAction,
  addKasambahayAction,
  addPetAction,
  addVehicleAction,
  removeHouseholdMemberAction,
  removeKasambahayAction,
  removePetAction,
  removeVehicleAction,
  updateHouseholdUnitAction,
  updateMemberAction,
} from "@/app/(admin)/admin/members/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMonthDay } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { OTHER_STREET, PHASES, STREETS } from "@/lib/locations";
import { formatPeso } from "@/lib/money";

export const metadata: Metadata = { title: "Member record" };

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "people", label: "Household" },
  { key: "kasambahay", label: "Kasambahay" },
  { key: "pets", label: "Pets" },
  { key: "vehicles", label: "Vehicles" },
  { key: "violations", label: "Violations" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const occupancyLabels = {
  OWNER_OCCUPIED: "Owner",
  TENANT: "Tenant",
} as const;

const violationTone = {
  OPEN: "warning",
  RESOLVED: "success",
  DISMISSED: "neutral",
} as const;

export default async function AdminMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    notice?: string;
    error?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;
  const query = await searchParams;
  const tab: TabKey =
    (tabs.find((item) => item.key === query.tab)?.key as TabKey) ?? "overview";

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      household: {
        include: {
          account: { select: { email: true, status: true } },
          members: {
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          },
          dues: {
            orderBy: { periodStart: "desc" },
            take: 6,
            include: {
              payments: {
                where: { status: "PAID" },
                select: { amount: true },
              },
            },
          },
          violations: { orderBy: { issuedAt: "desc" }, take: 20 },
        },
      },
      occupants: { orderBy: { fullName: "asc" } },
      pets: { orderBy: { name: "asc" } },
      vehicles: { orderBy: { plateNumber: "asc" } },
      kasambahay: { orderBy: { fullName: "asc" } },
    },
  });

  if (!member) notFound();

  const household = member.household;
  const streetKnown = household.street
    ? (STREETS as readonly string[]).includes(household.street)
    : false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Member record"
        title={`${member.firstName} ${member.lastName}`}
        description={`${household.unitAddress} · ${
          occupancyLabels[member.occupancyType]
        } · ${member.status === "ACTIVE" ? "Active" : "Inactive"}`}
      />

      {query.notice ? <Alert tone="success">{query.notice}</Alert> : null}
      {query.error ? <Alert tone="danger">{query.error}</Alert> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/members"
          className={buttonStyles({ variant: "secondary", size: "sm" })}
        >
          Back to members
        </Link>
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={`/admin/members/${member.id}?tab=${item.key}`}
            className={buttonStyles({
              variant: tab === item.key ? "primary" : "secondary",
              size: "sm",
            })}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resident details</CardTitle>
              <CardDescription>
                Update the primary resident for this household.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form action={updateMemberAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First name"
                    name="firstName"
                    defaultValue={member.firstName}
                    required
                    minLength={2}
                    maxLength={60}
                  />
                  <Input
                    label="Last name"
                    name="lastName"
                    defaultValue={member.lastName}
                    required
                    minLength={2}
                    maxLength={60}
                  />
                </div>
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  defaultValue={member.email}
                  required
                />
                <Input
                  label="Contact number"
                  name="contactNumber"
                  defaultValue={member.contactNumber}
                  required
                  minLength={11}
                  maxLength={11}
                  pattern="[0-9]{11}"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Occupancy"
                    name="occupancyType"
                    defaultValue={member.occupancyType}
                  >
                    <option value="OWNER_OCCUPIED">Owner</option>
                    <option value="TENANT">Tenant</option>
                  </Select>
                  <Select
                    label="Status"
                    name="status"
                    defaultValue={member.status}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </div>
                <Button type="submit" size="sm">
                  Save resident details
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Household unit</CardTitle>
              <CardDescription>
                Block and lot identify the unit inside a phase.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form action={updateHouseholdUnitAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Phase"
                    name="phase"
                    defaultValue={household.phase ?? PHASES[0]}
                  >
                    {PHASES.map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </Select>
                  <Select
                    label="Street"
                    name="streetChoice"
                    defaultValue={
                      streetKnown ? (household.street ?? "") : OTHER_STREET
                    }
                  >
                    {STREETS.map((street) => (
                      <option key={street} value={street}>
                        {street}
                      </option>
                    ))}
                    <option value={OTHER_STREET}>Other street</option>
                  </Select>
                  {!streetKnown ? (
                    <div className="sm:col-span-2">
                      <Input
                        label="Custom street"
                        name="customStreet"
                        defaultValue={household.street ?? ""}
                        maxLength={80}
                        hint="Used when the street is not in the list."
                      />
                    </div>
                  ) : null}
                  <Input
                    label="Block"
                    name="block"
                    defaultValue={household.block ?? ""}
                    required
                    pattern="[A-Za-z0-9-]{1,10}"
                    maxLength={10}
                  />
                  <Input
                    label="Lot"
                    name="lot"
                    defaultValue={household.lot ?? ""}
                    required
                    pattern="[A-Za-z0-9-]{1,10}"
                    maxLength={10}
                  />
                </div>
                <p className="rounded-md border border-dashed border-line bg-cream px-3 py-2 text-xs text-muted">
                  Current label: {household.unitAddress}
                </p>
                <Button type="submit" size="sm">
                  Save household unit
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Recent dues</CardTitle>
              <CardDescription>
                Latest billing periods for this household.
              </CardDescription>
            </CardHeader>
            <CardBody className="px-0 py-0">
              {household.dues.length === 0 ? (
                <EmptyState
                  title="No dues yet"
                  description="Generate monthly dues from the Dues page."
                  className="mx-5 my-5"
                />
              ) : (
                <TableWrapper>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Period</Th>
                        <Th>Due date</Th>
                        <Th>Amount</Th>
                        <Th>Balance</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {household.dues.map((due) => {
                        const paid = due.payments.reduce(
                          (total, payment) => total + Number(payment.amount),
                          0,
                        );
                        return (
                          <tr key={due.id}>
                            <Td>{formatMonthDay(due.periodStart)}</Td>
                            <Td>{formatMonthDay(due.dueDate)}</Td>
                            <Td className="tabular">
                              {formatPeso(Number(due.amount))}
                            </Td>
                            <Td className="tabular">
                              {formatPeso(Math.max(Number(due.amount) - paid, 0))}
                            </Td>
                            <Td>
                              <Badge
                                tone={
                                  due.status === "PAID"
                                    ? "success"
                                    : due.status === "WAIVED"
                                      ? "neutral"
                                      : "warning"
                                }
                              >
                                {due.status.replace("_", " ")}
                              </Badge>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </TableWrapper>
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "people" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Primary resident</CardTitle>
              <CardDescription>
                The household account holder.
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-1 text-sm">
              <p className="font-medium text-ink">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-muted">{member.email}</p>
              <p className="text-muted">{member.contactNumber}</p>
              <p className="text-muted">
                {occupancyLabels[member.occupancyType]} · {member.status}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add household member</CardTitle>
              <CardDescription>
                Dependents or relatives living in the unit.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form action={addHouseholdMemberAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <Input
                  label="Full name"
                  name="fullName"
                  required
                  minLength={2}
                  maxLength={120}
                />
                <Select
                  label="Relationship"
                  name="relationship"
                  defaultValue=""
                >
                  <option value="">Not specified</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Relative">Relative</option>
                  <option value="Other">Other</option>
                </Select>
                <Button type="submit" size="sm">
                  Add member
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>Listed household members</CardTitle>
              <CardDescription>
                {member.occupants.length} listed dependent
                {member.occupants.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-3">
              {member.occupants.length === 0 ? (
                <p className="text-sm text-muted">No additional members listed.</p>
              ) : (
                member.occupants.map((person) => (
                  <div
                    key={person.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {person.fullName}
                      </p>
                      <p className="text-xs text-muted">
                        {person.relationship ?? "Relationship not set"}
                      </p>
                    </div>
                    <form action={removeHouseholdMemberAction}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="id" value={person.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "kasambahay" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add kasambahay</CardTitle>
              <CardDescription>
                Household help staying or working at the unit.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form action={addKasambahayAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <Input
                  label="Full name"
                  name="fullName"
                  required
                  minLength={2}
                  maxLength={120}
                />
                <Input
                  label="Contact number"
                  name="contactNumber"
                  required
                  minLength={11}
                  maxLength={11}
                  pattern="[0-9]{11}"
                  placeholder="09171234567"
                />
                <Button type="submit" size="sm">
                  Add kasambahay
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listed kasambahay</CardTitle>
              <CardDescription>
                {member.kasambahay.length} record
                {member.kasambahay.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-3">
              {member.kasambahay.length === 0 ? (
                <p className="text-sm text-muted">No kasambahay listed.</p>
              ) : (
                member.kasambahay.map((person) => (
                  <div
                    key={person.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {person.fullName}
                      </p>
                      <p className="text-xs text-muted">
                        {person.contactNumber ?? "No contact number"}
                      </p>
                    </div>
                    <form action={removeKasambahayAction}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="id" value={person.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "pets" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add pet</CardTitle>
              <CardDescription>List each pet kept at the unit.</CardDescription>
            </CardHeader>
            <CardBody>
              <form action={addPetAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <Input
                  label="Name"
                  name="name"
                  required
                  maxLength={60}
                />
                <Input label="Breed" name="breed" maxLength={60} />
                <Input
                  label="Count"
                  name="count"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="1"
                />
                <Button type="submit" size="sm">
                  Add pet
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listed pets</CardTitle>
              <CardDescription>
                {member.pets.length} pet record
                {member.pets.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-3">
              {member.pets.length === 0 ? (
                <p className="text-sm text-muted">No pets listed.</p>
              ) : (
                member.pets.map((pet) => (
                  <div
                    key={pet.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {pet.name} · {pet.count}
                      </p>
                      <p className="text-xs text-muted">{pet.breed}</p>
                    </div>
                    <form action={removePetAction}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="id" value={pet.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "vehicles" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add vehicle</CardTitle>
              <CardDescription>
                Plate numbers kept at the household.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form action={addVehicleAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <Input
                  label="Plate number"
                  name="plateNumber"
                  required
                  minLength={3}
                  maxLength={20}
                  placeholder="ABC 1234"
                />
                <Input
                  label="Count"
                  name="count"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="1"
                />
                <Button type="submit" size="sm">
                  Add vehicle
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listed vehicles</CardTitle>
              <CardDescription>
                {member.vehicles.length} vehicle
                {member.vehicles.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-3">
              {member.vehicles.length === 0 ? (
                <p className="text-sm text-muted">No vehicles listed.</p>
              ) : (
                member.vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line px-4 py-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-medium text-ink">
                        {vehicle.plateNumber}
                      </p>
                      <p className="text-xs text-muted">
                        Count: {vehicle.count}
                      </p>
                    </div>
                    <form action={removeVehicleAction}>
                      <input type="hidden" name="memberId" value={member.id} />
                      <input type="hidden" name="id" value={vehicle.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "violations" ? (
        <Card>
          <CardHeader>
            <CardTitle>Household violations</CardTitle>
            <CardDescription>
              Notices issued to this household or its residents.
            </CardDescription>
          </CardHeader>
          <CardBody className="px-0 py-0">
            {household.violations.length === 0 ? (
              <EmptyState
                title="No violations"
                description="This household has a clean record."
                className="mx-5 my-5"
              />
            ) : (
              <TableWrapper>
                <Table>
                  <thead>
                    <tr>
                      <Th>Violation</Th>
                      <Th>Issued</Th>
                      <Th>Fine</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {household.violations.map((violation) => (
                      <tr key={violation.id}>
                        <Td>
                          <p className="font-medium text-ink">
                            {violation.category}
                          </p>
                          <p className="mt-0.5 max-w-80 text-xs text-muted">
                            {violation.description}
                          </p>
                        </Td>
                        <Td>{formatDate(violation.issuedAt)}</Td>
                        <Td className="tabular">
                          {violation.fineAmount
                            ? formatPeso(Number(violation.fineAmount))
                            : "—"}
                        </Td>
                        <Td>
                          <Badge tone={violationTone[violation.status]}>
                            {violation.status}
                          </Badge>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableWrapper>
            )}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <p className="font-medium text-ink">Portal login</p>
            <p className="text-muted">
              {household.account
                ? `${household.account.email} · ${household.account.status}`
                : "No login linked to this household."}
            </p>
          </div>
          <Link
            href="/admin/members"
            className={buttonStyles({ variant: "secondary", size: "sm" })}
          >
            Back to members
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

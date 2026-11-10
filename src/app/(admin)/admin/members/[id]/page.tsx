import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addHouseholdMemberAction,
  addKasambahayAction,
  addPetAction,
  addVehicleAction,
  deleteMemberAction,
  removeHouseholdMemberAction,
  removeKasambahayAction,
  removePetAction,
  removeVehicleAction,
  resetMemberPasswordAction,
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
import { Input, PasswordInput, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableWrapper, Td, Th } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { formatDate, formatMonthDay } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { OTHER_STREET, STREETS } from "@/lib/locations";
import { formatPeso } from "@/lib/money";
import { NAME_INPUT_PATTERN, NAME_ERROR } from "@/lib/registration";

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
  OWNER_OCCUPIED: "Owner-occupied",
  TENANT: "Tenant",
} as const;

const violationStatusTone = {
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
          account: {
            select: { id: true, username: true, status: true },
          },
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
        description={`${household.unitAddress} · ${occupancyLabels[member.occupancyType]}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={member.status === "ACTIVE" ? "success" : "neutral"}>
              {member.status === "ACTIVE" ? "Active" : "Inactive"}
            </Badge>
            <Badge tone="forest">
              {occupancyLabels[member.occupancyType]}
            </Badge>
          </div>
        }
      />

      {query.notice ? <Alert tone="success">{query.notice}</Alert> : null}
      {query.error ? <Alert tone="danger">{query.error}</Alert> : null}

      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {tabs.map((item) => {
          const active = item.key === tab;
          return (
            <Link
              key={item.key}
              href={`/admin/members/${member.id}?tab=${item.key}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-forest text-white dark:bg-lime dark:text-[#1a220f]"
                  : "text-muted hover:bg-cream hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Edit resident details</CardTitle>
              <CardDescription>
                Primary resident name, contact number and status.
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
                    pattern={NAME_INPUT_PATTERN}
                    nameOnly
                    hint={NAME_ERROR}
                  />
                  <Input
                    label="Last name"
                    name="lastName"
                    defaultValue={member.lastName}
                    required
                    minLength={2}
                    maxLength={60}
                    pattern={NAME_INPUT_PATTERN}
                    nameOnly
                    hint={NAME_ERROR}
                  />
                </div>
                <Input
                  label="Contact number"
                  name="contactNumber"
                  defaultValue={member.contactNumber}
                  required
                  onlyDigits
                  minLength={11}
                  maxLength={11}
                  pattern="[0-9]{11}"
                  hint="Exactly 11 digits."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Occupancy"
                    name="occupancyType"
                    defaultValue={member.occupancyType}
                  >
                    <option value="OWNER_OCCUPIED">Owner-occupied</option>
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
                Block and lot identify the unit.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form action={updateHouseholdUnitAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    className="sm:col-span-2"
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

          {/* Danger Zone: Delete Member */}
          <Card className="xl:col-span-2 border-red/40 bg-red-soft/10">
            <CardHeader>
              <CardTitle className="text-red">Delete member record</CardTitle>
              <CardDescription>
                Permanently delete this resident from the association directory.
              </CardDescription>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm text-ink">
                Deleting <strong>{member.firstName} {member.lastName}</strong> removes
                their directory entry, any linked portal login, and related household
                data. This action is logged in the audit trail and cannot be undone.
              </p>
              <form action={deleteMemberAction}>
                <input type="hidden" name="memberId" value={member.id} />
                <Button type="submit" variant="danger" size="sm">
                  Delete member
                </Button>
              </form>
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
                  pattern={NAME_INPUT_PATTERN}
                  nameOnly
                  hint={NAME_ERROR}
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
            <CardBody className="px-0 py-0">
              {member.occupants.length === 0 ? (
                <EmptyState
                  title="No household members listed"
                  description="Add dependents or other occupants using the form above."
                  className="mx-5 my-5"
                />
              ) : (
                <TableWrapper>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Name</Th>
                        <Th>Relationship</Th>
                        <Th>Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.occupants.map((person) => (
                        <tr key={person.id}>
                          <Td className="font-medium text-ink">
                            {person.fullName}
                          </Td>
                          <Td>{person.relationship ?? "Not specified"}</Td>
                          <Td>
                            <form action={removeHouseholdMemberAction}>
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                              <input
                                type="hidden"
                                name="id"
                                value={person.id}
                              />
                              <Button type="submit" size="sm" variant="ghost">
                                Remove
                              </Button>
                            </form>
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
      ) : null}

      {tab === "kasambahay" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add kasambahay</CardTitle>
              <CardDescription>
                Household staff registered with this address.
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
                  pattern={NAME_INPUT_PATTERN}
                  nameOnly
                  hint={NAME_ERROR}
                />
                <Input
                  label="Contact number"
                  name="contactNumber"
                  onlyDigits
                  minLength={11}
                  maxLength={11}
                  pattern="[0-9]{11}"
                  placeholder="Optional"
                  hint="Optional. If given, use 11 digits."
                />
                <Button type="submit" size="sm">
                  Add kasambahay
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered staff</CardTitle>
              <CardDescription>
                {member.kasambahay.length} registered staff member
                {member.kasambahay.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardBody className="px-0 py-0">
              {member.kasambahay.length === 0 ? (
                <EmptyState
                  title="No kasambahay registered"
                  description="Add household staff using the form on the left."
                  className="mx-5 my-5"
                />
              ) : (
                <TableWrapper>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Name</Th>
                        <Th>Contact</Th>
                        <Th>Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.kasambahay.map((person) => (
                        <tr key={person.id}>
                          <Td className="font-medium text-ink">
                            {person.fullName}
                          </Td>
                          <Td>{person.contactNumber || "—"}</Td>
                          <Td>
                            <form action={removeKasambahayAction}>
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                              <input
                                type="hidden"
                                name="id"
                                value={person.id}
                              />
                              <Button type="submit" size="sm" variant="ghost">
                                Remove
                              </Button>
                            </form>
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
      ) : null}

      {tab === "pets" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add pet</CardTitle>
              <CardDescription>
                Pets kept at the unit address.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form action={addPetAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <Input
                  label="Name"
                  name="name"
                  required
                  maxLength={60}
                  placeholder="Mochi"
                />
                <Input
                  label="Breed / Type"
                  name="breed"
                  maxLength={60}
                  placeholder="Shih Tzu"
                />
                <Button type="submit" size="sm">
                  Add pet
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered pets</CardTitle>
              <CardDescription>
                {member.pets.length} registered pet
                {member.pets.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardBody className="px-0 py-0">
              {member.pets.length === 0 ? (
                <EmptyState
                  title="No pets registered"
                  description="Register pets using the form on the left."
                  className="mx-5 my-5"
                />
              ) : (
                <TableWrapper>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Name</Th>
                        <Th>Breed</Th>
                        <Th>Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.pets.map((pet) => (
                        <tr key={pet.id}>
                          <Td className="font-medium text-ink">{pet.name}</Td>
                          <Td>{pet.breed || "—"}</Td>
                          <Td>
                            <form action={removePetAction}>
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                              <input type="hidden" name="id" value={pet.id} />
                              <Button type="submit" size="sm" variant="ghost">
                                Remove
                              </Button>
                            </form>
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
      ) : null}

      {tab === "vehicles" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add vehicle</CardTitle>
              <CardDescription>
                Vehicles associated with this household.
              </CardDescription>
            </CardHeader>
            <CardBody>
              <form action={addVehicleAction} className="space-y-4">
                <input type="hidden" name="memberId" value={member.id} />
                <Input
                  label="Plate number"
                  name="plateNumber"
                  required
                  maxLength={20}
                  placeholder="ABC 1234"
                />
                <Button type="submit" size="sm">
                  Add vehicle
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered vehicles</CardTitle>
              <CardDescription>
                {member.vehicles.length} registered vehicle
                {member.vehicles.length === 1 ? "" : "s"}.
              </CardDescription>
            </CardHeader>
            <CardBody className="px-0 py-0">
              {member.vehicles.length === 0 ? (
                <EmptyState
                  title="No vehicles registered"
                  description="Register vehicles using the form on the left."
                  className="mx-5 my-5"
                />
              ) : (
                <TableWrapper>
                  <Table>
                    <thead>
                      <tr>
                        <Th>Plate number</Th>
                        <Th>Action</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {member.vehicles.map((vehicle) => (
                        <tr key={vehicle.id}>
                          <Td className="font-medium text-ink">
                            {vehicle.plateNumber}
                          </Td>
                          <Td>
                            <form action={removeVehicleAction}>
                              <input
                                type="hidden"
                                name="memberId"
                                value={member.id}
                              />
                              <input
                                type="hidden"
                                name="id"
                                value={vehicle.id}
                              />
                              <Button type="submit" size="sm" variant="ghost">
                                Remove
                              </Button>
                            </form>
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
      ) : null}

      {tab === "violations" ? (
        <Card>
          <CardHeader>
            <CardTitle>Violation history</CardTitle>
            <CardDescription>
              Notices recorded for this household.
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
                      <Th>Category</Th>
                      <Th>Description</Th>
                      <Th>Issued</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {household.violations.map((violation) => (
                      <tr key={violation.id}>
                        <Td className="font-medium text-ink">
                          {violation.category}
                        </Td>
                        <Td className="text-muted">{violation.description}</Td>
                        <Td>{formatDate(violation.issuedAt)}</Td>
                        <Td>
                          <Badge tone={violationStatusTone[violation.status]}>
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
        <CardHeader>
          <CardTitle>Portal login</CardTitle>
          <CardDescription>
            Resetting the password signs the resident out of every device.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <p className="text-sm text-muted">
              {household.account
                ? `Username: ${household.account.username} · Status: ${household.account.status}`
                : "No login linked to this household."}
            </p>
          </div>

          {household.account ? (
            <form
              action={resetMemberPasswordAction}
              className="max-w-sm space-y-3"
            >
              <input type="hidden" name="memberId" value={member.id} />
              <input
                type="hidden"
                name="userId"
                value={household.account.id}
              />
              <PasswordInput
                label="New password"
                name="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
                hint="At least 8 characters with upper and lowercase letters and a number."
              />
              <PasswordInput
                label="Confirm new password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={72}
              />
              <Button type="submit" size="sm">
                Reset password
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Link
          href="/admin/members"
          className={buttonStyles({ variant: "secondary", size: "sm" })}
        >
          Back to members
        </Link>
      </div>
    </div>
  );
}

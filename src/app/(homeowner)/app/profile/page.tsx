import type { Metadata } from "next";
import {
  addOwnHouseholdMemberAction,
  addOwnKasambahayAction,
  addOwnPetAction,
  addOwnVehicleAction,
  removeOwnHouseholdMemberAction,
  removeOwnKasambahayAction,
  removeOwnPetAction,
  removeOwnVehicleAction,
  updateOwnContactAction,
} from "@/app/(homeowner)/app/profile/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Select } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Household profile" };

export default async function HomeownerProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const user = await requireRole("HOMEOWNER");
  const { notice, error } = await searchParams;

  if (!user.memberId) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Household"
          title="Profile"
          description="Your login is not linked to a member record yet."
        />
        <Alert tone="warning" title="Member record missing">
          Contact the association office so your login can be linked to your
          household.
        </Alert>
      </div>
    );
  }

  const member = await prisma.member.findUnique({
    where: { id: user.memberId },
    include: {
      household: true,
      occupants: { orderBy: { fullName: "asc" } },
      kasambahay: { orderBy: { fullName: "asc" } },
      pets: { orderBy: { name: "asc" } },
      vehicles: { orderBy: { plateNumber: "asc" } },
    },
  });

  if (!member) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Household"
          title="Profile"
          description="Member record not found."
        />
        <Alert tone="warning" title="Member record missing">
          Contact the association office so your login can be linked to your
          household.
        </Alert>
      </div>
    );
  }

  const household = member.household;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Household"
        title="Profile"
        description="Contact details, kasambahay, pets, vehicles and household members."
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Unit</CardTitle>
          <CardDescription>
            Unit details are maintained by the association office.
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-1 text-sm">
          <p className="font-medium text-ink">{household.unitAddress}</p>
          <p className="text-muted">
            Block{" "}
            {household.block ?? "—"} · Lot {household.lot ?? "—"}
          </p>
          <p className="text-muted">
            {member.occupancyType === "TENANT" ? "Tenant" : "Owner"} ·{" "}
            {member.status === "ACTIVE" ? "Active" : "Inactive"}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
          <CardDescription>
            Your email is also the household login.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={updateOwnContactAction} className="space-y-4">
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
            <Button type="submit" size="sm">
              Save contact details
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Household members</CardTitle>
          <CardDescription>
            {member.occupants.length === 0
              ? "No additional members listed."
              : `${member.occupants.length} listed.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <form action={addOwnHouseholdMemberAction} className="space-y-3">
            <Input
              label="Full name"
              name="fullName"
              required
              minLength={2}
              maxLength={120}
            />
            <Select label="Relationship" name="relationship" defaultValue="">
              <option value="">Not specified</option>
              <option value="Spouse">Spouse</option>
              <option value="Child">Child</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Relative">Relative</option>
              <option value="Other">Other</option>
            </Select>
            <Button type="submit" size="sm" variant="secondary">
              Add member
            </Button>
          </form>

          {member.occupants.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line pt-2">
              {member.occupants.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {person.fullName}
                    </p>
                    <p className="text-xs text-muted">
                      {person.relationship ?? "Relationship not set"}
                    </p>
                  </div>
                  <form action={removeOwnHouseholdMemberAction}>
                    <input type="hidden" name="id" value={person.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kasambahay</CardTitle>
          <CardDescription>
            {member.kasambahay.length === 0
              ? "No kasambahay listed."
              : `${member.kasambahay.length} listed.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <form action={addOwnKasambahayAction} className="space-y-3">
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
            <Button type="submit" size="sm" variant="secondary">
              Add kasambahay
            </Button>
          </form>

          {member.kasambahay.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line pt-2">
              {member.kasambahay.map((person) => (
                <li
                  key={person.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {person.fullName}
                    </p>
                    <p className="text-xs text-muted">
                      {person.contactNumber ?? "No contact number"}
                    </p>
                  </div>
                  <form action={removeOwnKasambahayAction}>
                    <input type="hidden" name="id" value={person.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pets</CardTitle>
          <CardDescription>
            {member.pets.length === 0 ? "No pets listed." : `${member.pets.length} listed.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <form action={addOwnPetAction} className="space-y-3">
            <Input label="Name" name="name" required maxLength={60} />
            <Input label="Breed" name="breed" maxLength={60} />
            <Input
              label="Count"
              name="count"
              type="number"
              min="1"
              max="20"
              defaultValue="1"
            />
            <Button type="submit" size="sm" variant="secondary">
              Add pet
            </Button>
          </form>

          {member.pets.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line pt-2">
              {member.pets.map((pet) => (
                <li
                  key={pet.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {pet.name} · {pet.count}
                    </p>
                    <p className="text-xs text-muted">{pet.breed}</p>
                  </div>
                  <form action={removeOwnPetAction}>
                    <input type="hidden" name="id" value={pet.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>
            {member.vehicles.length === 0
              ? "No vehicles listed."
              : `${member.vehicles.length} listed.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <form action={addOwnVehicleAction} className="space-y-3">
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
            <Button type="submit" size="sm" variant="secondary">
              Add vehicle
            </Button>
          </form>

          {member.vehicles.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line pt-2">
              {member.vehicles.map((vehicle) => (
                <li
                  key={vehicle.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-mono text-sm font-medium text-ink">
                      {vehicle.plateNumber}
                    </p>
                    <p className="text-xs text-muted">Count: {vehicle.count}</p>
                  </div>
                  <form action={removeOwnVehicleAction}>
                    <input type="hidden" name="id" value={vehicle.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

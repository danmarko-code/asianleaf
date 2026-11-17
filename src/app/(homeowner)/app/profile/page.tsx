import type { Metadata } from "next";
import {
  addOwnHouseholdMemberAction,
  addOwnKasambahayAction,
  addOwnPetAction,
  removeOwnHouseholdMemberAction,
  removeOwnKasambahayAction,
  removeOwnPetAction,
  removeOwnVehicleAction,
  saveOwnVehicleAction,
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
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NAME_INPUT_PATTERN, NAME_ERROR } from "@/lib/registration";
import { vehicleTypeLabel } from "@/lib/vehicles";

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
          title="Profile"
          description="Your household details in one place."
        />
        <Alert tone="warning" title="Your account isn’t linked yet">
          Please contact the HOA office so we can connect your account to your home.
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
          title="Profile"
          description="Your household details in one place."
        />
        <Alert tone="warning" title="Your account isn’t linked yet">
          Please contact the HOA office so we can connect your account to your home.
        </Alert>
      </div>
    );
  }

  const household = member.household;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile"
        description="Your household details in one place."
      />

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Unit</CardTitle>
          <CardDescription>
            Need to change your address? Contact the HOA office.
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
            Keep your number up to date so we can reach you.
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={updateOwnContactAction} className="space-y-4">
            <Input
              label="Contact number"
              name="contactNumber"
              defaultValue={member.contactNumber}
              required
              onlyDigits
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
              ? "No household members added yet."
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
              pattern={NAME_INPUT_PATTERN}
              nameOnly
              hint={NAME_ERROR}
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
              ? "No kasambahay added yet."
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
              pattern={NAME_INPUT_PATTERN}
              nameOnly
              hint={NAME_ERROR}
            />
            <Input
              label="Contact number"
              name="contactNumber"
              onlyDigits
              maxLength={11}
              pattern="[0-9]{11}"
              placeholder="Optional"
              hint="Optional. If given, use 11 digits."
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
            {member.pets.length === 0 ? "No pets added yet." : `${member.pets.length} listed.`}
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
              ? "No vehicles added yet."
              : `${member.vehicles.length} listed.`}
          </CardDescription>
        </CardHeader>
        <CardBody className="space-y-4">
          <VehicleForm action={saveOwnVehicleAction} resetOnSuccess />

          {member.vehicles.length > 0 ? (
            <ul className="divide-y divide-line border-t border-line pt-2">
              {member.vehicles.map((vehicle) => (
                <li key={vehicle.id} className="space-y-2 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-medium text-ink">
                        {vehicle.plateNumber}
                      </p>
                      <p className="text-xs text-muted">
                        {vehicleTypeLabel(vehicle.vehicleType)} ·{" "}
                        {vehicle.brandModel} · {vehicle.color}
                      </p>
                    </div>
                    <form action={removeOwnVehicleAction}>
                      <input type="hidden" name="id" value={vehicle.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                  <details>
                    <summary className="cursor-pointer text-xs font-medium text-forest">
                      Edit details
                    </summary>
                    <div className="mt-3">
                      <VehicleForm
                        action={saveOwnVehicleAction}
                        vehicle={vehicle}
                        hiddenFields={{ id: vehicle.id }}
                        submitLabel="Save changes"
                      />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}

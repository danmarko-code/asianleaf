// One source of truth for the subdivision layout. Registration, admin review,
// member filters, seed data and household edits all read from these lists so a
// street is spelled the same way everywhere.

export const STREETS = [
  "Sampaguita St.",
  "Ilang-Ilang St.",
  "Narra St.",
  "Acacia Lane",
  "Molave St.",
  "Bataan Ave.",
] as const;

export const OTHER_STREET = "Other";

export const STREET_OPTIONS: readonly string[] = [...STREETS, OTHER_STREET];

// Block and lot labels are alphanumeric so "2A" or "14-B" remain valid.
export const HOUSE_NUMBER_PATTERN = /^[A-Za-z0-9-]{1,10}$/;

export const MAX_STREET_LENGTH = 80;

export function resolveStreet(street: string, customStreet?: string) {
  const value = street === OTHER_STREET ? (customStreet ?? "").trim() : street.trim();
  return value;
}

export function isKnownStreet(value: string) {
  return (STREETS as readonly string[]).includes(value);
}

export function composeUnitAddress({
  block,
  lot,
  street,
}: {
  block: string;
  lot: string;
  street: string;
}) {
  return `Blk ${block.trim()} Lot ${lot.trim()}, ${street.trim()}`;
}

export type UnitDetails = {
  street: string;
  block: string;
  lot: string;
};

export function parseHouseholdLabel(unitAddress: string): UnitDetails | null {
  // Handles the legacy shape "12 Sampaguita St." with the lot stored as the
  // leading house number and the block kept separately in the record.
  const match = /^\s*(\d+[A-Za-z-]?)\s+(.+?)\s*$/.exec(unitAddress);
  if (!match) return null;

  return {
    lot: match[1],
    street: match[2].trim(),
    block: "",
  };
}

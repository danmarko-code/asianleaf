import { prisma } from "@/lib/db";

export const REPORT_KEYS = [
  "unpaid",
  "inactive",
  "violations",
  "payments",
] as const;

export type ReportKey = (typeof REPORT_KEYS)[number];

export type ReportTable = {
  key: ReportKey;
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
};

export function isReportKey(value: string | undefined): value is ReportKey {
  return !!value && (REPORT_KEYS as readonly string[]).includes(value);
}

function rangeStart(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function rangeEnd(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dateFilter(
  from: string | undefined,
  to: string | undefined,
  field: "dueDate" | "issuedAt" | "paidAt",
) {
  const start = rangeStart(from);
  const end = rangeEnd(to);
  if (!start && !end) return undefined;
  return {
    [field]: {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    },
  };
}

function money(value: number) {
  return value.toFixed(2);
}

function iso(value: Date | null | undefined) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export async function buildReport(
  key: ReportKey,
  from?: string,
  to?: string,
): Promise<ReportTable> {
  if (key === "unpaid") {
    const dues = await prisma.due.findMany({
      where: {
        status: "UNPAID",
        ...(dateFilter(from, to, "dueDate") ?? {}),
      },
      orderBy: { dueDate: "asc" },
      take: 1000,
      include: {
        household: {
          include: {
            members: { take: 1, orderBy: { createdAt: "asc" } },
          },
        },
        payments: { where: { status: "PAID" }, select: { amount: true } },
      },
    });

    return {
      key,
      title: "Unpaid dues",
      description: "Households with an unpaid due, with the remaining balance.",
      columns: [
        "Unit",
        "Resident",
        "Contact",
        "Period",
        "Due date",
        "Amount",
        "Balance",
        "Status",
      ],
      rows: dues.map((due) => {
        const member = due.household.members[0];
        const paid = due.payments.reduce(
          (total, payment) => total + Number(payment.amount),
          0,
        );
        return [
          due.household.unitAddress,
          member ? `${member.firstName} ${member.lastName}` : "No member",
          member?.contactNumber ?? "",
          iso(due.periodStart),
          iso(due.dueDate),
          money(Number(due.amount)),
          money(Math.max(Number(due.amount) - paid, 0)),
          due.status,
        ];
      }),
    };
  }

  if (key === "inactive") {
    const members = await prisma.member.findMany({
      where: { status: "INACTIVE" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 1000,
      include: { household: true },
    });

    return {
      key,
      title: "Inactive members",
      description: "Residents whose household record is marked inactive.",
      columns: [
        "Last name",
        "First name",
        "Unit",
        "Occupancy",
        "Contact",
        "Created",
      ],
      rows: members.map((member) => [
        member.lastName,
        member.firstName,
        member.household.unitAddress,
        member.occupancyType === "OWNER_OCCUPIED" ? "Owner" : "Tenant",
        member.contactNumber,
        iso(member.createdAt),
      ]),
    };
  }

  if (key === "violations") {
    const violations = await prisma.violation.findMany({
      where: {
        status: "OPEN",
        ...(dateFilter(from, to, "issuedAt") ?? {}),
      },
      orderBy: { issuedAt: "desc" },
      take: 1000,
      include: {
        household: {
          include: {
            members: { take: 1, orderBy: { createdAt: "asc" } },
          },
        },
      },
    });

    return {
      key,
      title: "Open violations",
      description: "Notices that are still open, with the fine and due date.",
      columns: [
        "Unit",
        "Resident",
        "Category",
        "Kind",
        "Description",
        "Issued",
        "Due",
        "Fine",
        "Status",
      ],
      rows: violations.map((violation) => {
        const member = violation.household.members[0];
        return [
          violation.household.unitAddress,
          member ? `${member.firstName} ${member.lastName}` : "No member",
          violation.category,
          violation.kind === "WARNING" ? "Warning" : "Payment required",
          violation.description,
          iso(violation.issuedAt),
          iso(violation.dueDate),
          violation.fineAmount ? money(Number(violation.fineAmount)) : "",
          violation.status,
        ];
      }),
    };
  }

  const payments = await prisma.payment.findMany({
    where: dateFilter(from, to, "paidAt"),
    orderBy: { createdAt: "desc" },
    take: 2000,
    include: {
      channel: true,
      due: {
        include: {
          household: {
            include: {
              members: { take: 1, orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
    },
  });

  return {
    key,
    title: "Payments",
    description: "Every submitted payment, including pending and rejected ones.",
    columns: [
      "Unit",
      "Resident",
      "Reference",
      "Receipt",
      "Method",
      "Channel",
      "Amount",
      "Status",
      "Paid date",
      "Submitted",
    ],
    rows: payments.map((payment) => {
      const member = payment.due.household.members[0];
      return [
        payment.due.household.unitAddress,
        member ? `${member.firstName} ${member.lastName}` : "No member",
        payment.referenceNumber,
        payment.receiptNumber ?? "",
        payment.method,
        payment.channel?.name ?? "",
        money(Number(payment.amount)),
        payment.status,
        iso(payment.paidAt),
        iso(payment.createdAt),
      ];
    }),
  };
}

function csvCell(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function toCsv(table: ReportTable) {
  const lines = [
    table.columns.map(csvCell).join(","),
    ...table.rows.map((row) => row.map(csvCell).join(",")),
  ];
  // Excel needs the BOM to read UTF-8 (ñ, é) correctly.
  return "\uFEFF" + lines.join("\r\n");
}

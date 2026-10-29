import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Leaf2026!";
const CONSENT_VERSION = "2026-10-v1";

// Dates are stored as UTC midnight because the columns are PostgreSQL `date`.
// The HOA operates in Asia/Manila, so month boundaries are derived there first.
function manilaToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);

  return { year: value("year"), month: value("month") };
}

const { year, month } = manilaToday();

// offset 0 = current month, -1 = previous month, 1 = next month
function monthDate(offset: number, day: number) {
  return new Date(Date.UTC(year, month - 1 + offset, day));
}

async function main() {
  const passwordHash = hashSync(DEMO_PASSWORD, 12);

  // ---------- Households ----------
  const households = [
    {
      id: "hh_001",
      unitAddress: "Blk 1 Lot 12, Sampaguita St., Phase 1",
      phase: "Phase 1",
      street: "Sampaguita St.",
      block: "1",
      lot: "12",
    },
    {
      id: "hh_002",
      unitAddress: "Blk 1 Lot 8, Ilang-Ilang St., Phase 1",
      phase: "Phase 1",
      street: "Ilang-Ilang St.",
      block: "1",
      lot: "8",
    },
    {
      id: "hh_003",
      unitAddress: "Blk 2 Lot 22, Narra St., Phase 2",
      phase: "Phase 2",
      street: "Narra St.",
      block: "2",
      lot: "22",
    },
    {
      id: "hh_004",
      unitAddress: "Blk 2 Lot 5, Acacia Lane, Phase 2",
      phase: "Phase 2",
      street: "Acacia Lane",
      block: "2",
      lot: "5",
    },
    {
      id: "hh_005",
      unitAddress: "Blk 3 Lot 31, Molave St., Phase 3",
      phase: "Phase 3",
      street: "Molave St.",
      block: "3",
      lot: "31",
    },
  ];

  for (const household of households) {
    await prisma.household.upsert({
      where: { id: household.id },
      update: household,
      create: household,
    });
  }

  // ---------- Members ----------
  const members = [
    {
      id: "mem_maria",
      householdId: "hh_001",
      firstName: "Maria",
      lastName: "Santos",
      contactNumber: "09171000001",
      email: "maria.santos@example.test",
      occupancyType: "OWNER_OCCUPIED" as const,
    },
    {
      id: "mem_liza",
      householdId: "hh_001",
      firstName: "Liza",
      lastName: "Santos",
      contactNumber: "09171000002",
      email: "liza.santos@example.test",
      occupancyType: "OWNER_OCCUPIED" as const,
    },
    {
      id: "mem_jose",
      householdId: "hh_002",
      firstName: "Jose",
      lastName: "Reyes",
      contactNumber: "09171000003",
      email: "jose.reyes@example.test",
      occupancyType: "OWNER_OCCUPIED" as const,
    },
    {
      id: "mem_ana",
      householdId: "hh_003",
      firstName: "Ana",
      lastName: "Dela Cruz",
      contactNumber: "09171000004",
      email: "ana.delacruz@example.test",
      occupancyType: "TENANT" as const,
    },
    {
      id: "mem_pedro",
      householdId: "hh_004",
      firstName: "Pedro",
      lastName: "Lim",
      contactNumber: "09171000005",
      email: "pedro.lim@example.test",
      occupancyType: "OWNER_OCCUPIED" as const,
    },
    {
      id: "mem_rosa",
      householdId: "hh_005",
      firstName: "Rosa",
      lastName: "Garcia",
      contactNumber: "09171000006",
      email: "rosa.garcia@example.test",
      occupancyType: "OWNER_OCCUPIED" as const,
    },
  ];

  for (const member of members) {
    await prisma.member.upsert({
      where: { id: member.id },
      update: {
        householdId: member.householdId,
        firstName: member.firstName,
        lastName: member.lastName,
        contactNumber: member.contactNumber,
        email: member.email,
        occupancyType: member.occupancyType,
        consentVersion: CONSENT_VERSION,
        consentAt: monthDate(-2, 1),
      },
      create: {
        ...member,
        consentVersion: CONSENT_VERSION,
        consentAt: monthDate(-2, 1),
      },
    });
  }

  // ---------- Logins (one per household) ----------
  const users = [
    {
      id: "usr_admin",
      email: "admin@asialeaf.test",
      role: "ADMIN" as const,
      householdId: null,
      memberId: null,
    },
    {
      id: "usr_treasurer",
      email: "treasurer@asialeaf.test",
      role: "ADMIN" as const,
      householdId: null,
      memberId: null,
    },
    {
      id: "usr_maria",
      email: "maria.santos@example.test",
      role: "HOMEOWNER" as const,
      householdId: "hh_001",
      memberId: "mem_maria",
    },
    {
      id: "usr_jose",
      email: "jose.reyes@example.test",
      role: "HOMEOWNER" as const,
      householdId: "hh_002",
      memberId: "mem_jose",
    },
    {
      id: "usr_ana",
      email: "ana.delacruz@example.test",
      role: "HOMEOWNER" as const,
      householdId: "hh_003",
      memberId: "mem_ana",
    },
    {
      id: "usr_pedro",
      email: "pedro.lim@example.test",
      role: "HOMEOWNER" as const,
      householdId: "hh_004",
      memberId: "mem_pedro",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        id: user.id,
        passwordHash,
        role: user.role,
        status: "ACTIVE",
        householdId: user.householdId,
        memberId: user.memberId,
      },
      create: {
        ...user,
        passwordHash,
        status: "ACTIVE",
      },
    });
  }

  // A household with no login yet: useful for testing admin-only records.
  await prisma.user.deleteMany({ where: { householdId: "hh_005" } });

  // ---------- Dependents ----------
  const kasambahay = [
    {
      id: "kas_001",
      memberId: "mem_maria",
      fullName: "Nena Bautista",
      contactNumber: "09171000011",
    },
    {
      id: "kas_002",
      memberId: "mem_pedro",
      fullName: "Ruel Ocampo",
      contactNumber: "09171000012",
    },
  ];

  for (const person of kasambahay) {
    await prisma.kasambahay.upsert({
      where: { id: person.id },
      update: person,
      create: person,
    });
  }

  const pets = [
    { id: "pet_001", memberId: "mem_maria", name: "Mochi", breed: "Shih Tzu", count: 1 },
    { id: "pet_002", memberId: "mem_ana", name: "Bruno", breed: "Aspin", count: 2 },
  ];

  for (const pet of pets) {
    await prisma.pet.upsert({
      where: { id: pet.id },
      update: pet,
      create: pet,
    });
  }

  const vehicles = [
    { id: "veh_001", memberId: "mem_jose", plateNumber: "ABC 1234", count: 1 },
    { id: "veh_002", memberId: "mem_pedro", plateNumber: "NCR 5678", count: 1 },
  ];

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { id: vehicle.id },
      update: vehicle,
      create: vehicle,
    });
  }

  const occupants = [
    { id: "occ_001", memberId: "mem_maria", fullName: "Liza Santos", relationship: "Spouse" },
    { id: "occ_002", memberId: "mem_maria", fullName: "Paolo Santos", relationship: "Son" },
    { id: "occ_003", memberId: "mem_rosa", fullName: "Cely Garcia", relationship: "Sister" },
  ];

  for (const occupant of occupants) {
    await prisma.householdMember.upsert({
      where: { id: occupant.id },
      update: occupant,
      create: occupant,
    });
  }

  // ---------- Registration requests ----------
  const carloPayload = {
    occupancyType: "OWNER_OCCUPIED",
    kasambahay: [
      { fullName: "Beth Mendoza", contactNumber: "09171000013" },
    ],
    pets: [{ name: "Coco", breed: "Poodle" }],
    vehicles: [{ plateNumber: "XYZ 9012" }],
    householdMembers: [
      { fullName: "Elena Mendoza", relationship: "Spouse" },
    ],
  };

  await prisma.registrationRequest.upsert({
    where: { id: "req_001" },
    update: {
      payload: carloPayload,
      unitAddress: "Blk 2 Lot 14, Sampaguita St., Phase 1",
      phase: "Phase 1",
      street: "Sampaguita St.",
      block: "2",
      lot: "14",
    },
    create: {
      id: "req_001",
      firstName: "Carlo",
      lastName: "Mendoza",
      email: "carlo.mendoza@example.test",
      contactNumber: "09171000007",
      unitAddress: "Blk 2 Lot 14, Sampaguita St., Phase 1",
      phase: "Phase 1",
      street: "Sampaguita St.",
      block: "2",
      lot: "14",
      passwordHash: hashSync("Carlo2026", 12),
      consentVersion: CONSENT_VERSION,
      consentAt: monthDate(0, 20),
      payload: carloPayload,
    },
  });

  const gracePayload = {
    occupancyType: "TENANT",
    kasambahay: [],
    pets: [
      { name: "Milo", breed: "Aspin" },
      { name: "Tofu", breed: "Puspin" },
    ],
    vehicles: [{ plateNumber: "QRS 3456" }],
    householdMembers: [
      { fullName: "Mark Villanueva", relationship: "Spouse" },
      { fullName: "Mia Villanueva", relationship: "Daughter" },
    ],
  };

  await prisma.registrationRequest.upsert({
    where: { id: "req_002" },
    update: {
      payload: gracePayload,
      unitAddress: "Blk 4 Lot 9, Narra St., Phase 2",
      phase: "Phase 2",
      street: "Narra St.",
      block: "4",
      lot: "9",
    },
    create: {
      id: "req_002",
      firstName: "Grace",
      lastName: "Villanueva",
      email: "grace.villanueva@example.test",
      contactNumber: "09171000008",
      unitAddress: "Blk 4 Lot 9, Narra St., Phase 2",
      phase: "Phase 2",
      street: "Narra St.",
      block: "4",
      lot: "9",
      passwordHash: hashSync("Grace2026", 12),
      consentVersion: CONSENT_VERSION,
      consentAt: monthDate(0, 24),
      payload: gracePayload,
    },
  });

  // ---------- Dues ----------
  // Each row is one household's monthly obligation. A due remains open until
  // the sum of its PAID payments reaches the full amount.
  const duePlans = [
    // household, month offset, status
    ["hh_001", 0, "PAID"],
    ["hh_002", 0, "PARTIALLY_PAID"],
    ["hh_003", 0, "UNPAID"],
    ["hh_004", 0, "PAID"],
    ["hh_005", 0, "UNPAID"],
    ["hh_001", -1, "PAID"],
    ["hh_002", -1, "UNPAID"],
    ["hh_003", -1, "PAID"],
    ["hh_004", -1, "PAID"],
    ["hh_005", -1, "PAID"],
    ["hh_001", 1, "UNPAID"],
    ["hh_002", 1, "UNPAID"],
    ["hh_003", 1, "UNPAID"],
    ["hh_004", 1, "UNPAID"],
    ["hh_005", 1, "UNPAID"],
  ] as const;

  for (const [householdId, offset, status] of duePlans) {
    const periodStart = monthDate(offset, 1);
    await prisma.due.upsert({
      where: { householdId_periodStart: { householdId, periodStart } },
      update: {
        amount: 1500,
        dueDate: monthDate(offset, 5),
        status,
      },
      create: {
        householdId,
        periodStart,
        amount: 1500,
        dueDate: monthDate(offset, 5),
        status,
      },
    });
  }

  const currentDues = await prisma.due.findMany({
    where: { periodStart: monthDate(0, 1) },
    select: { id: true, householdId: true },
  });

  const dueId = (householdId: string) => {
    const due = currentDues.find((row) => row.householdId === householdId);
    if (!due) throw new Error(`Missing seeded due for ${householdId}`);
    return due.id;
  };

  // ---------- Payment channels ----------
  // In this flow the homeowner scans the HOA's own GCash QR, sends the money,
  // and submits the reference number. The treasurer verifies it.
  const paymentChannels = [
    {
      id: "ch_gcash",
      name: "GCash",
      type: "GCASH" as const,
      accountName: "Asian Leaf HOA",
      accountNumber: "0917 000 0000",
      qrImageUrl: null,
      instructions:
        "Open GCash, scan the HOA QR, and send the amount. Then submit the GCash reference number here.",
      sortOrder: 1,
    },
  ];

  for (const channel of paymentChannels) {
    await prisma.paymentChannel.upsert({
      where: { id: channel.id },
      update: channel,
      create: { ...channel, isActive: true },
    });
  }

  // ---------- Payments ----------
  // Paid rows represent money already verified by the treasurer. Pending rows
  // are claims that must never count toward the balance until approved.
  const payments = [
    {
      id: "pay_001",
      dueId: dueId("hh_001"),
      channelId: "ch_gcash",
      amount: 1500,
      method: "GCASH" as const,
      status: "PAID" as const,
      referenceNumber: "AL-SEED-0001",
      receiptNumber: "RCPT-2026-0001",
      notes: "October dues, full payment.",
      paidAt: monthDate(0, 4),
      reviewedById: "usr_treasurer",
      reviewedAt: monthDate(0, 4),
      rejectionReason: null,
    },
    {
      id: "pay_002",
      dueId: dueId("hh_002"),
      channelId: "ch_gcash",
      amount: 700,
      method: "GCASH" as const,
      status: "PAID" as const,
      referenceNumber: "AL-SEED-0002",
      receiptNumber: "RCPT-2026-0002",
      notes: "Partial payment for October.",
      paidAt: monthDate(0, 6),
      reviewedById: "usr_treasurer",
      reviewedAt: monthDate(0, 6),
      rejectionReason: null,
    },
    {
      id: "pay_003",
      dueId: dueId("hh_004"),
      channelId: "ch_gcash",
      amount: 500,
      method: "GCASH" as const,
      status: "PAID" as const,
      referenceNumber: "AL-SEED-0003",
      receiptNumber: "RCPT-2026-0003",
      notes: "First partial payment.",
      paidAt: monthDate(0, 2),
      reviewedById: "usr_treasurer",
      reviewedAt: monthDate(0, 2),
      rejectionReason: null,
    },
    {
      id: "pay_004",
      dueId: dueId("hh_004"),
      channelId: "ch_gcash",
      amount: 1000,
      method: "GCASH" as const,
      status: "PAID" as const,
      referenceNumber: "AL-SEED-0004",
      receiptNumber: "RCPT-2026-0004",
      notes: "Balance of the October dues.",
      paidAt: monthDate(0, 9),
      reviewedById: "usr_treasurer",
      reviewedAt: monthDate(0, 9),
      rejectionReason: null,
    },
    {
      id: "pay_005",
      dueId: dueId("hh_005"),
      channelId: "ch_gcash",
      amount: 1500,
      method: "GCASH" as const,
      status: "PENDING" as const,
      referenceNumber: "AL-SEED-0005",
      receiptNumber: null,
      notes: "Sent through GCash at 8:42 AM. Awaiting treasurer verification.",
      paidAt: monthDate(0, 27),
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
    },
    {
      id: "pay_006",
      dueId: dueId("hh_003"),
      channelId: "ch_gcash",
      amount: 1500,
      method: "GCASH" as const,
      status: "PENDING" as const,
      referenceNumber: "AL-SEED-0006",
      receiptNumber: null,
      notes: "Sent through GCash at 9:05 AM. Awaiting treasurer verification.",
      paidAt: monthDate(0, 27),
      reviewedById: null,
      reviewedAt: null,
      rejectionReason: null,
    },
  ];

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: payment,
      create: payment,
    });
  }

  // Remove the old bank channel from earlier seed runs after its payments have
  // been moved to GCash.
  await prisma.paymentChannel.deleteMany({ where: { id: "ch_bank" } });

  // Previous-month payments, kept simple so the dashboard has history.
  const previousDues = await prisma.due.findMany({
    where: { periodStart: monthDate(-1, 1) },
    select: { id: true, householdId: true },
  });

  const previousDueId = (householdId: string) => {
    const due = previousDues.find((row) => row.householdId === householdId);
    if (!due) throw new Error(`Missing previous due for ${householdId}`);
    return due.id;
  };

  for (const [index, householdId] of ["hh_001", "hh_003", "hh_004", "hh_005"].entries()) {
    const id = `pay_prev_${index + 1}`;
    const paidAt = monthDate(-1, 3 + index);
    const payment = {
      dueId: previousDueId(householdId),
      channelId: "ch_gcash",
      amount: 1500,
      method: "GCASH" as const,
      status: "PAID" as const,
      referenceNumber: `AL-SEED-P0${index + 1}`,
      receiptNumber: `RCPT-PREV-000${index + 1}`,
      notes: "Previous month dues, paid in full.",
      paidAt,
      reviewedById: "usr_treasurer",
      reviewedAt: paidAt,
      rejectionReason: null,
    };

    await prisma.payment.upsert({
      where: { id },
      update: payment,
      create: { id, ...payment },
    });
  }

  // ---------- Budget entries ----------
  const budgetEntries = [
    { id: "bud_001", type: "INCOME" as const, category: "Clubhouse rental", description: "Weekend rental of the clubhouse", amount: 2500, dayOffset: -12 },
    { id: "bud_002", type: "INCOME" as const, category: "Donations", description: "Landscaping fund donation", amount: 1000, dayOffset: -20 },
    { id: "bud_003", type: "EXPENSE" as const, category: "Security", description: "Guard services, first half of the month", amount: 12000, dayOffset: -18 },
    { id: "bud_004", type: "EXPENSE" as const, category: "Landscaping", description: "Plants and soil for the entrance", amount: 3500, dayOffset: -14 },
    { id: "bud_005", type: "EXPENSE" as const, category: "Repairs", description: "Streetlight replacement, Phase 2", amount: 1800, dayOffset: -7 },
    { id: "bud_006", type: "EXPENSE" as const, category: "Utilities", description: "Common-area water bill", amount: 900, dayOffset: -3 },
  ];

  for (const entry of budgetEntries) {
    const occurredAt = monthDate(0, 28);
    occurredAt.setUTCDate(occurredAt.getUTCDate() + entry.dayOffset);

    await prisma.budgetEntry.upsert({
      where: { id: entry.id },
      update: {
        type: entry.type,
        category: entry.category,
        description: entry.description,
        amount: entry.amount,
        occurredAt,
        createdById: "usr_treasurer",
      },
      create: {
        id: entry.id,
        type: entry.type,
        category: entry.category,
        description: entry.description,
        amount: entry.amount,
        occurredAt,
        createdById: "usr_treasurer",
      },
    });
  }

  // ---------- Notifications ----------
  const notifications = [
    {
      id: "notif_001",
      userId: "usr_maria",
      type: "PAYMENT_RECEIVED" as const,
      title: "Payment received",
      body: "We received PHP 1,500.00 for your October dues. Receipt RCPT-2026-0001.",
      link: "/app/payments",
      readAt: monthDate(0, 4),
    },
    {
      id: "notif_002",
      userId: "usr_jose",
      type: "PAYMENT_RECEIVED" as const,
      title: "Partial payment received",
      body: "We received PHP 700.00. Your remaining balance for October is PHP 800.00.",
      link: "/app/payments",
      readAt: null,
    },
    {
      id: "notif_003",
      userId: "usr_ana",
      type: "DUE_OVERDUE" as const,
      title: "October dues are overdue",
      body: "PHP 1,500.00 was due on October 5. Please settle the balance to avoid penalties.",
      link: "/app/payments",
      readAt: null,
    },
    {
      id: "notif_004",
      userId: "usr_pedro",
      type: "PAYMENT_RECEIVED" as const,
      title: "October dues fully paid",
      body: "Your October balance is settled. Thank you.",
      link: "/app/payments",
      readAt: monthDate(0, 9),
    },
  ];

  for (const notification of notifications) {
    await prisma.notification.upsert({
      where: { id: notification.id },
      update: notification,
      create: notification,
    });
  }

  // ---------- Feedback ----------
  const feedback = [
    {
      id: "fb_001",
      userId: "usr_ana",
      subject: "Parking markings",
      message: "Please repaint the parking markings near Phase 2. It is hard to tell which slot is ours at night.",
      status: "NEW" as const,
      adminNote: null,
    },
    {
      id: "fb_002",
      userId: "usr_maria",
      subject: "Clubhouse booking",
      message: "Can we post the clubhouse booking steps online? The group chat instructions are hard to follow.",
      status: "READ" as const,
      adminNote: null,
    },
    {
      id: "fb_003",
      userId: "usr_jose",
      subject: "Streetlights",
      message: "Two streetlights near the Phase 2 corner were flickering last week.",
      status: "RESOLVED" as const,
      adminNote: "Replaced the bulbs on the 18th. Closing this report.",
    },
  ];

  for (const item of feedback) {
    await prisma.feedback.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  // ---------- Violations ----------
  // Admins issue these directly to a resident's household. A violation can be
  // a plain warning or require a payment with a due date.
  const violations = [
    {
      id: "vio_001",
      householdId: "hh_001",
      memberId: "mem_maria",
      kind: "WARNING" as const,
      category: "No vehicle sticker",
      description:
        "Vehicle with plate ABC 1234 was seen inside the subdivision without the 2026 HOA sticker. Please secure a sticker from the office.",
      status: "OPEN" as const,
      fineAmount: null,
      issuedAt: monthDate(0, 22),
      dueDate: monthDate(0, 30),
      resolvedAt: null,
      resolutionNote: null,
      issuedById: "usr_admin",
    },
    {
      id: "vio_002",
      householdId: "hh_003",
      memberId: "mem_ana",
      kind: "PAYMENT_REQUIRED" as const,
      category: "Improper waste disposal",
      description:
        "Household waste was left outside the designated collection area after collection day. Please settle the corresponding penalty.",
      status: "OPEN" as const,
      fineAmount: 500,
      issuedAt: monthDate(0, 18),
      dueDate: monthDate(0, 31),
      resolvedAt: null,
      resolutionNote: null,
      issuedById: "usr_admin",
    },
    {
      id: "vio_003",
      householdId: "hh_002",
      memberId: "mem_jose",
      kind: "PAYMENT_REQUIRED" as const,
      category: "Unregistered pet",
      description:
        "A second dog was observed at the unit but is not listed in the household record.",
      status: "RESOLVED" as const,
      fineAmount: 300,
      issuedAt: monthDate(-1, 15),
      dueDate: monthDate(-1, 25),
      resolvedAt: monthDate(-1, 22),
      resolutionNote: "Penalty settled and the pet was added to the household record.",
      issuedById: "usr_admin",
    },
  ];

  for (const violation of violations) {
    await prisma.violation.upsert({
      where: { id: violation.id },
      update: violation,
      create: violation,
    });
  }

  // ---------- Reminder history ----------
  const previousAnaDue = previousDueId("hh_003");
  await prisma.reminderLog.upsert({
    where: {
      dueId_dedupeKey: {
        dueId: previousAnaDue,
        dedupeKey: "ONE_DAY",
      },
    },
    update: {},
    create: {
      dueId: previousAnaDue,
      kind: "ONE_DAY",
      dedupeKey: "ONE_DAY",
      sentAt: monthDate(-2, 4),
    },
  });

  const counts = {
    users: await prisma.user.count(),
    households: await prisma.household.count(),
    members: await prisma.member.count(),
    dues: await prisma.due.count(),
    payments: await prisma.payment.count(),
    paymentChannels: await prisma.paymentChannel.count(),
    violations: await prisma.violation.count(),
    budgetEntries: await prisma.budgetEntry.count(),
    registrationRequests: await prisma.registrationRequest.count(),
    feedback: await prisma.feedback.count(),
  };

  console.log("\nSeed complete.");
  console.log("Admin: admin@asialeaf.test / " + DEMO_PASSWORD);
  console.log("Treasurer: treasurer@asialeaf.test / " + DEMO_PASSWORD);
  console.log("Homeowner: maria.santos@example.test / " + DEMO_PASSWORD);
  console.log(counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

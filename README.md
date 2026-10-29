# Asian Leaf HOA

A mobile-friendly web app for the Asian Leaf Homeowners Association in General
Trias, Cavite. The repository contains the Phase 0 foundation plus
confirmed-account access, two-step household registration with admin approval,
GCash QR payment submissions, admin payment verification, searchable member
records and household violations.

## Stack

- Next.js 15.5 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 with CSS-variable design tokens
- PostgreSQL + Prisma 6
- Custom opaque session cookies stored as SHA-256 hashes
- Payments: GCash QR scan + manual treasurer verification; no uploads
- SMS/email: provider interfaces with console mocks

## Prerequisites

- Node.js 24 and npm 11
- PostgreSQL running locally
- Database `asialeaf_dev` and a role that can connect with the credentials in
  `.env`. The local setup uses the `danmarko` role.

## Setup

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open <http://localhost:3000>.

Useful commands:

```bash
npm run lint
npm run typecheck
npm run build
npm run db:studio
npm run db:seed
```

To reset the local database completely:

```bash
npx prisma migrate reset --force
npm run db:seed
```

## Environment

Copy `.env.example` to `.env` and fill in the values:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled/runtime PostgreSQL connection |
| `DIRECT_URL` | Direct connection used by Prisma migrations |
| `SESSION_SECRET` | Reserved for future signed values |
| `APP_URL` | Public app URL; used for redirects later |

Locally, `DATABASE_URL` and `DIRECT_URL` can point to the same database. For a
hosted provider such as Neon or Supabase, use the pooled URL for `DATABASE_URL`
and the direct URL for `DIRECT_URL`.

## Seeded accounts

All seeded accounts use the password `Leaf2026!`.

| Role | Email |
| --- | --- |
| Admin | `admin@asialeaf.test` |
| Treasurer | `treasurer@asialeaf.test` |
| Homeowner | `maria.santos@example.test` |
| Homeowner | `jose.reyes@example.test` |
| Homeowner | `ana.delacruz@example.test` |
| Homeowner | `pedro.lim@example.test` |

There is no guest account. Only users whose `status` is `ACTIVE` can sign in;
pending registrations and disabled accounts are rejected at login.

The seed also creates five households, dependents, dues for three months, paid
and partial payments, one GCash payment channel, pending payments, violations,
budget entries, notifications, feedback and two pending registration requests.

Re-running `npm run db:seed` is safe: records are upserted by fixed IDs and no
duplicates are created.

## Routes

| Route | What it shows |
| --- | --- |
| `/` | Redirects to the signed-in dashboard or `/login` |
| `/login` | Email/password sign-in for confirmed accounts |
| `/register` | Two-step household registration |
| `/design` | Internal style guide and UI states |
| `/admin/dashboard` | Admin workspace |
| `/admin/members` | Searchable member and household records |
| `/admin/requests` | Review and approve or reject registrations |
| `/admin/payments` | Verify, approve or reject GCash payments |
| `/admin/violations` | Issue warnings or payment requirements |
| `/app/dashboard` | Household balance and open violation notice |
| `/app/payments` | GCash QR instructions, submission form and history |
| `/app/violations` | Household warning and payment notices |
| `/api/health` | Database health and seeded counts |

All `/admin`, `/app` and `/design` routes are protected. Middleware checks for
a session cookie, then the server layouts verify the session, expiry and
`ACTIVE` account status against the database.

## Registration flow

1. The applicant completes Step 1 with their name, email, 11-digit contact
   number, password, unit address and occupancy type (owner or tenant).
2. Step 2 records other household members and their relationship, kasambahay
   with contact numbers, pets, vehicles and the Data Privacy Act consent.
3. Passwords need at least 8 characters with upper and lowercase letters and a
   number. The password is hashed immediately and the request is stored as
   `PENDING`. No login is created yet.
4. An administrator reviews the queue at `/admin/requests`, including the unit,
   household details and consent record.
5. Approval creates the household, primary member, dependents, pets, vehicles,
   kasambahay and the single homeowner login in one transaction.
6. Rejection stores a reason. The applicant can submit a corrected request.

Duplicate emails, unit addresses and pending household requests are rejected
before a request is stored. One login remains tied to each household.

## Payment flow

1. The treasurer publishes the HOA GCash name, number and official QR image.
2. The homeowner scans the QR, sends the amount, keeps a screenshot and submits
   the GCash reference number in the app.
3. The payment is stored as `PENDING` and does not reduce the balance yet.
4. The treasurer checks the reference in GCash and approves or rejects it.
5. Approval marks the payment `PAID`, generates a receipt number and updates the
   household dues to `PARTIALLY_PAID` or `PAID`.
6. Rejection stores a reason so the homeowner can submit a corrected reference.

The QR image is optional in the schema. Until an official image is supplied,
the payment page shows the account details and a clear “QR image pending”
message instead of a fake QR code.

## Member records

Admins can search resident records by name, email, contact number or address.
The list can also be filtered by street/phase, block, occupancy type and member
status. Results show household details, dependents, vehicles and portal-login
state.

## Violations flow

Admins issue a notice to a household or a specific resident and choose:

- **Warning only** — a notice with the violation date.
- **Needs payment** — a notice with a fine and payment due date.

Residents see open notices in a red alert below the dashboard greeting and on
`/app/violations`. Admins can mark a notice resolved or dismissed. One login per
household means every household member using the account sees the same notices.

## Design rules applied

- Colors: forest `#4F6B1F`, leaf `#7BA11E`, lime `#B7D335`, cream `#F5F8EC`,
  ink `#2A3414`, amber `#E0A100`, red `#C8402F`.
- Fonts: Playfair Display for headings, Inter for everything else.
- One card style, one radius scale (8/12/16), one shadow token.
- No gradients, glow, emoji or decorative icons.
- Every data view must define loading, empty, error and success states.
- Splash appears once per browser session, can be skipped, and plays a short
  leaf/wordmark entrance with a thin progress rule.
- Splash motion becomes static when `prefers-reduced-motion` is enabled.
- A light/dark theme toggle persists per browser and respects the system theme
  on first visit.

## Manual test checklist

1. `npx prisma migrate dev` and `npm run db:seed` succeed on a clean database.
2. Running the seed twice keeps the same counts.
3. `/` redirects to `/login` when signed out.
4. `/admin/dashboard` and `/app/dashboard` redirect to `/login` without a session.
5. A pending or disabled account cannot sign in.
6. Admin and homeowner accounts land on their correct dashboard.
7. `/register` validates both steps, hashes the password and creates a `PENDING`
   request without creating a login.
8. A duplicate email, unit address or pending household request is rejected.
9. `/admin/requests` shows the unit, household members, pets, vehicles,
   kasambahay contact numbers, occupancy and consent details.
10. Rejecting a request stores the reason; approving it creates the household,
    records, login and in-app approval notice in one transaction.
11. The approved applicant can sign in and sees the household dashboard; the
    household appears in `/admin/members`.
12. First load in a new tab shows the splash, then fades out; reloading the same
    tab does not show it again.
13. Clicking or pressing Enter during the splash skips it; reduced motion
    produces a static splash.
14. Homeowner `/app/payments` shows the GCash details, QR placeholder or image,
    submission form and payment history.
15. A submitted payment appears as `PENDING` on `/admin/payments`.
16. Approving a payment updates the due and creates a receipt number; rejecting
    it stores a reason.
17. An admin-issued warning/payment violation appears in a red alert under the
    homeowner greeting and on `/app/violations`.
18. `/admin/members` searches by name/address and filters by street, block,
    occupancy and status.
19. The theme toggle switches light/dark mode, persists after reload and does
    not flash the wrong theme.
20. `/design` shows the exact palette, two fonts, motion states and all UI states.
21. `/admin/dashboard` works at 1440px and 390px; the sidebar collapses and
    becomes a drawer.
22. `/app/dashboard` shows the five-item bottom navigation at 390px.
23. Tables scroll horizontally inside their card without scrolling the page.
24. `/api/health` returns seeded counts.
25. `npm run lint`, `npm run typecheck` and `npm run build` pass.

## Scope notes and known gaps

- Outbound email/SMS delivery, password reset/OTP, dues generation, reminder
  jobs, budget entry and feedback submission are still placeholders.
- Registration review, payment approval and violation issuance are wired, but
  there is no audit-log write yet for those actions.
- The GCash QR image still needs to be supplied by the association. Do not
  generate a QR that claims to be an official GCash QR without the real payload.
- Uploads are deliberately removed. Payment receipts are kept by the payer as a
  screenshot; the app shows a reminder.
- SMS and email will be mocked with console output until a real provider is
  configured.
- Dues are billed **per household**, due on the 5th. Partial payments are
  allowed, but a balance remains open until the full amount is settled.
  Overdue reminders repeat weekly until the balance is paid.
- One login per household is enforced by a unique household link on `User`.
- The app is designed to move from Vercel + hosted PostgreSQL to a VPS with
  Cloudflare Tunnel later without a rewrite. No Vercel-only APIs are used.

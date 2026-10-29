# Asian Leaf HOA

A mobile-friendly portal for the **Asian Leaf Homeowners Association**, General
Trias, Cavite. Homeowners register their household, pay monthly dues through the
association's GCash account, and read notices. Administrators review
registrations, verify payments, manage household records, generate dues, issue
violations, publish the budget report, answer feedback and inspect an audit log.

---

## Stack

- Next.js 15.5 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 with CSS-variable design tokens
- PostgreSQL + Prisma 6
- Opaque session cookies, stored as SHA-256 hashes; bcrypt password hashes
- GCash QR + manual treasurer verification (no receipt uploads)
- Email/SMS provider interface with a console mock

---

## 1. Run it from GitHub

### Prerequisites

- Node.js 24 and npm 11
- PostgreSQL 15+ running locally (or a hosted database such as Neon/Supabase)
- Git

### Step 1 — Clone and install

```bash
git clone <your-repository-url> asialeaf
cd asialeaf
npm install
```

`npm install` also runs `prisma generate`.

### Step 2 — Create the database

Using `psql`:

```bash
createdb asialeaf_dev
```

Or create an empty database named `asialeaf_dev` in pgAdmin.

### Step 3 — Configure `.env`

Copy the example file and edit the values:

```bash
cp .env.example .env
```

The file should contain:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/asialeaf_dev?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/asialeaf_dev?schema=public"
APP_URL="http://localhost:3000"
CRON_SECRET="replace-with-a-long-random-string"
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Runtime database connection (may be pooled) |
| `DIRECT_URL` | Direct connection used by Prisma migrations |
| `APP_URL` | Public app URL |
| `CRON_SECRET` | Bearer token required by `/api/cron/reminders` in production |

Without `CRON_SECRET`, the reminder endpoint only works in development.

### Step 4 — Create the schema and seed demo data

```bash
npx prisma migrate deploy
npm run db:seed
```

If you are iterating locally, `npx prisma migrate dev` is the equivalent and
will also create new migrations when the schema changes.

### Step 5 — Start the app

```bash
npm run dev
```

Open <http://localhost:3000>. You are redirected to `/login`.

### Useful commands

```bash
npm run dev          # development server
npm run build        # production build (stop the dev server first)
npm run lint
npm run typecheck
npm run db:seed      # safe to re-run; upserts by fixed IDs
npm run db:studio    # inspect the database
```

To reset everything:

```bash
npx prisma migrate reset --force
npm run db:seed
```

---

## 2. Using the website

### 2.1 Sign in

1. Open `/login`.
2. Enter one of the seeded accounts below.
3. Admins land on `/admin/dashboard`; homeowners land on `/app/dashboard`.
4. Use **Forgot your password?** to reset with a 6-digit code.

Only `ACTIVE` accounts can sign in. Pending registrations are refused until an
administrator approves them.

### 2.2 Register a household (homeowner)

1. Open `/register`.
2. **Step 1 — Account and unit:** first/last name, email (this becomes the
   login), 11-digit contact number, password (8+ characters, upper and lower
   case, one number), **phase**, **street** (dropdown, with an *Other street*
   option), **block** and **lot**. A live preview shows the composed address,
   for example `Blk 2 Lot 14, Sampaguita St., Phase 1`.
3. **Step 2 — Household:** dependents with a relationship, kasambahay with
   their 11-digit contacts, pets, vehicles and the Data Privacy consent.
4. Submit. Nothing is activated yet; the request is stored as `PENDING`.
5. Warn the applicant that duplicates (same email, unit or pending request) are
   rejected before saving.

### 2.3 Review registrations (admin)

1. Go to **Register requests**.
2. Each card shows contact details, phase/street/block/lot, household members,
   kasambahay, pets, vehicles and consent.
3. Correct the unit fields if the applicant mistyped them, then **Approve**.
   Approval creates the household, primary resident, dependents, kasambahay,
   pets, vehicles and the single homeowner login — and sends an in-app
   notification.
4. **Reject** with a short reason; the applicant can submit again.

### 2.4 Find and edit member records (admin)

1. Open **Members**.
2. Filter by free-text search, **street dropdown**, **phase**, **block**, **lot**,
   occupancy and status.
3. Click a resident's name to open the household record:
   - **Overview** — edit the primary resident and the unit (phase/street/block/
     lot) and review recent dues.
   - **Household** — add or remove dependents.
   - **Kasambahay**, **Pets**, **Vehicles** — add or remove records.
   - **Violations** — the household's notice history.
4. Every edit is written to the audit log.

### 2.5 Generate dues and send reminders (admin)

1. Open **Dues**.
2. Pick the **billing month** and press **Generate dues**. Every household is
   billed `PHP 1,500.00` on the 5th. Re-running is safe: existing dues are
   skipped.
3. Review billed, collected and outstanding totals and each household balance.
4. Press **Run reminders now** to create in-app notifications and write the
   outbound email/SMS to the server log. Reminders are de-duplicated per period
   and repeat weekly while overdue.
5. Use **Waive** when a due should be cancelled.

For automation, call the cron endpoint:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/reminders
```

### 2.6 Verify GCash payments (homeowner + admin)

1. Homeowner: open **Dues** → `/app/payments`, scan the HOA GCash QR (or use the
   displayed account details), send the amount, keep the screenshot.
2. Submit the GCash **reference number** and date. The payment is `PENDING` and
   does not reduce the balance yet.
3. Admin: open **Payments**, confirm the reference in GCash, then **Approve** or
   **Reject** with a reason.
4. Approval marks the payment `PAID`, generates a receipt number, updates the
   due to `PARTIALLY_PAID` or `PAID`, and notifies the homeowner.

### 2.7 Issue violations (admin)

1. Open **Violations**.
2. Choose the household (optionally a resident), type, category, description and
   date.
3. Choose **Warning only** or **Needs payment** with a fine and due date.
4. Homeowners see an open notice in a red alert on their dashboard and on
   `/app/violations`.
5. Mark a notice **Resolved** or **Dismissed** when settled.

### 2.8 Transparency report (admin + homeowner)

- Admin: **Budget** → add income or expense entries (type, category,
  description, amount, date), review monthly totals and delete mistakes.
- Homeowner: dashboard → **Transparency report** (`/app/budget`) for the
  read-only list and monthly totals.

### 2.9 Feedback (homeowner + admin)

1. Homeowner: open **Feedback**, add an optional subject and a message.
2. Admin: **Feedback** shows the inbox with unread/open counts.
3. Set the status (`New` → `In review` → `Resolved`) and write a reply note. The
   homeowner sees the note on `/app/feedback` and receives a notification.

### 2.10 Profile and password (homeowner)

- **Profile** (`/app/profile`): edit email and contact number; add or remove
  dependents, kasambahay, pets and vehicles. Unit details are admin-controlled.
- **Change password** (`/app/change-password`): enter the current password,
  request a 6-digit code, then set the new password. Codes expire in 5 minutes
  and allow 5 attempts. Other sessions are signed out. With no email provider
  configured, the code is shown in the interface and the server log in
  development only.
- **Forgot password** (`/forgot-password`): request a code by email and set a new
  password. The form never reveals whether an email is registered.

### 2.11 Audit log (admin)

**Audit log** lists the last 100 privileged actions with actor, entity and JSON
metadata. Recorded actions include registration approval/rejection, payment
approval/rejection, violation changes, dues generation/waiving, reminder runs,
member and household edits, budget entries, feedback updates and password
changes.

---

## 3. Seeded data

`npm run db:seed` creates the records below and is safe to re-run.

### Accounts — password `Leaf2026!`

| Role | Email |
| --- | --- |
| Admin | `admin@asialeaf.test` |
| Treasurer | `treasurer@asialeaf.test` |
| Homeowner | `maria.santos@example.test` |
| Homeowner | `jose.reyes@example.test` |
| Homeowner | `ana.delacruz@example.test` |
| Homeowner | `pedro.lim@example.test` |

`rosa.garcia@example.test` belongs to a household with **no login**, which is
useful for testing admin-only records.

### Households

| ID | Unit address | Phase | Street | Block | Lot | Login |
| --- | --- | --- | --- | --- | --- | --- |
| `hh_001` | Blk 1 Lot 12, Sampaguita St., Phase 1 | Phase 1 | Sampaguita St. | 1 | 12 | maria |
| `hh_002` | Blk 1 Lot 8, Ilang-Ilang St., Phase 1 | Phase 1 | Ilang-Ilang St. | 1 | 8 | jose |
| `hh_003` | Blk 2 Lot 22, Narra St., Phase 2 | Phase 2 | Narra St. | 2 | 22 | ana |
| `hh_004` | Blk 2 Lot 5, Acacia Lane, Phase 2 | Phase 2 | Acacia Lane | 2 | 5 | pedro |
| `hh_005` | Blk 3 Lot 31, Molave St., Phase 3 | Phase 3 | Molave St. | 3 | 31 | none |

### Members and property

| Record | Details |
| --- | --- |
| Primary residents | Maria Santos, Jose Reyes, Ana Dela Cruz (tenant), Pedro Lim, Rosa Garcia; Liza Santos is a second member of `hh_001` |
| Household dependents | Liza Santos (Spouse), Paolo Santos (Son), Cely Garcia (Sister) |
| Kasambahay | Nena Bautista (`hh_001`), Ruel Ocampo (`hh_004`) |
| Pets | Mochi (Shih Tzu, `hh_001`), Bruno (Aspin ×2, `hh_003`) |
| Vehicles | ABC 1234 (`hh_002`), NCR 5678 (`hh_004`) |

### Dues and payments

- **15 dues**: 5 households × current month, previous month and next month.
- Current month statuses: `hh_001` paid, `hh_002` partially paid, `hh_003` unpaid,
  `hh_004` paid, `hh_005` unpaid.
- **10 payments**: verified full/partial payments for the current and previous
  months, plus two `PENDING` GCash claims:
  - `AL-SEED-0005` — `hh_005`, `PHP 1,500.00`
  - `AL-SEED-0006` — `hh_003`, `PHP 1,500.00`
- One active payment channel: **GCash**, `Asian Leaf HOA`, `0917 000 0000`, with
  the QR image pending.

### Violations

| ID | Household | Type | Category | Status |
| --- | --- | --- | --- | --- |
| `vio_001` | `hh_001` | Warning | No vehicle sticker | Open |
| `vio_002` | `hh_003` | Payment required (`PHP 500`) | Improper waste disposal | Open |
| `vio_003` | `hh_002` | Payment required (`PHP 300`) | Unregistered pet | Resolved |

### Budget entries

Six entries: clubhouse rental and donations (income); security, landscaping,
repairs and utilities (expense).

### Feedback

| Household | Subject | Status |
| --- | --- | --- |
| `hh_003` (Ana) | Parking markings | New |
| `hh_001` (Maria) | Clubhouse booking | In review |
| `hh_002` (Jose) | Streetlights | Resolved, with note |

### Registration requests

| Applicant | Unit | Status | Password |
| --- | --- | --- | --- |
| Carlo Mendoza | Blk 2 Lot 14, Sampaguita St., Phase 1 | Pending | `Carlo2026` |
| Grace Villanueva | Blk 4 Lot 9, Narra St., Phase 2 | Pending | `Grace2026` |

Requests submitted through the app are additional pending rows; approve or
reject them from **Register requests**.

### Other seeded rows

- 4 notifications (payment received, partial payment, overdue dues).
- 1 reminder log entry (one-day reminder for a previous due).
- Audit log and OTP tables start empty and fill as you use the app.

Seed counts after a fresh seed:

```text
users 6 · households 5 · members 6 · dues 15 · payments 10
paymentChannels 1 · violations 3 · budgetEntries 6
registrationRequests 2 · feedback 3
plus 2 kasambahay, 2 pets, 2 vehicles, 3 dependents, 4 notifications
```

An extra app-submitted pending request raises `registrationRequests` to 3.

---

## 4. Routes

| Route | Access | What it shows |
| --- | --- | --- |
| `/` | Public | Redirects to the signed-in dashboard or `/login` |
| `/login` | Public | Email/password sign-in |
| `/register` | Public | Two-step household registration |
| `/forgot-password` | Public | OTP-based password reset |
| `/admin/dashboard` | Admin | Collections, unpaid dues, pending work |
| `/admin/members` | Admin | Search and filter household records |
| `/admin/members/[id]` | Admin | Household record with tabs and edit forms |
| `/admin/requests` | Admin | Registration review queue |
| `/admin/dues` | Admin | Billing run, balances, reminders |
| `/admin/payments` | Admin | GCash verification queue |
| `/admin/violations` | Admin | Issue and close notices |
| `/admin/budget` | Admin | Income/expense entries and totals |
| `/admin/feedback` | Admin | Feedback inbox and replies |
| `/admin/audit` | Admin | Audit log |
| `/app/dashboard` | Homeowner | Balance, violations, notifications |
| `/app/payments` | Homeowner | GCash instructions, submission, history |
| `/app/violations` | Homeowner | Household notices |
| `/app/profile` | Homeowner | Contact and household records |
| `/app/budget` | Homeowner | Read-only transparency report |
| `/app/feedback` | Homeowner | Submit feedback and read replies |
| `/app/change-password` | Homeowner | OTP-confirmed password change |
| `/api/health` | Public | Database health and counts |
| `/api/cron/reminders` | Secret | Reminder job (Bearer `CRON_SECRET`) |
| `/design` | Authenticated | Internal style guide |

`/admin`, `/app` and `/design` are protected by middleware plus server-side
session, expiry and status checks.

---

## 5. Verification checklist

1. `npm run lint`, `npm run typecheck` and `npm run build` pass.
2. The seed runs twice without changing counts.
3. Registration rejects duplicate email, unit and pending requests.
4. Approving a request creates the household, login and all submitted records.
5. `/admin/members` filters by street, phase, block and lot.
6. Editing a member or household writes an audit entry.
7. Generating dues twice creates one due per household per month.
8. Running reminders twice sends nothing the second time.
9. Payment approval updates the due and notifies the homeowner.
10. Change-password and forgot-password work with the development code.
11. Budget entries appear for homeowners on `/app/budget`.
12. Feedback replies notify the homeowner.

---

## 6. Known gaps

- No official GCash QR image is bundled; the payment page shows “QR image
  pending” until the treasurer supplies one.
- No outbound email/SMS provider is configured. Messages are logged by
  `src/lib/messaging.ts`; replace that file with a real provider.
- OTP codes are displayed in development only. In production they are only sent
  through the messaging adapter, which must be configured first.
- Receipt uploads are intentionally not supported.
- The reminder job relies on an external scheduler (cron, Vercel Cron, or a
  `curl` job) calling `/api/cron/reminders`.
- Audit logs capture administrative actions but not failed login attempts.

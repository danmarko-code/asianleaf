# Asian Leaf HOA — Working Context

## Project
Mobile-friendly HOA portal for Asian Leaf Homeowners Association, General Trias,
Cavite. Stack: Next.js 15.5 App Router, React 19, TypeScript, Tailwind 3.4,
Prisma 6 + PostgreSQL.

## Run
```bash
npm run dev
```
Open http://localhost:3000. The current dev server is already running on port
3000. PostgreSQL must be running and `.env` must have valid `DATABASE_URL` and
`DIRECT_URL`.

Useful:
```bash
npm run db:seed
npm run lint
npm run typecheck
npm run build
npm run db:studio
```

## Git state
- Last commit: `1edd6c3 feat: complete auth, payments, violations and household registration`
- Pushed to `origin/main`.
- Since then: registration refinements (11-digit contacts, owner/tenant only,
  kasambahay contacts, relationship dropdown, password checklist, no block/lot,
  no pet/vehicle counts) and login copy cleanup are uncommitted.
- Do not commit or push unless the user explicitly asks.

## Implemented so far
- **Auth/access:** opaque session cookie, hashed session tokens, bcrypt passwords,
  ACTIVE-only login, role guards, no guest account.
- **Homeowner:** dashboard with real balance and red violation alert, GCash payment
  submission, payment history, violations page.
- **Admin:** dashboard, searchable/filterable members, payment verification,
  violations, registration review, budget/dues placeholders.
- **Payments:** GCash-only QR instructions, reference submission, admin
  approve/reject, receipt and due updates. No receipt uploads.
- **Violations:** warning or payment-required notices, household/member targeting,
  resolve/dismiss, red dashboard alert.
- **Members:** search by name/contact/address; filters for street,
  block, occupancy, status. Member records include an admin **Portal login**
  card for resetting a password.
- **Dark mode:** persisted theme toggle in auth/admin/homeowner headers and design
  guide; system preference on first visit.
- **Login and accounts:**
  - Sign-in uses a unique `User.username` plus password. No email address is
    stored for users or members.
  - There is no self-service change-password or forgot-password flow and no
    OTP. An admin resets a password from the member record; that reset deletes
    the user's sessions.
  - Contact numbers are exactly 11 digits. Passwords need at least 8 characters,
    upper and lowercase letters, and a number; forms show live checks.
- **Admin member creation:**
  - `/admin/members/new` creates a household, primary resident, dependents,
    kasambahay, pets, vehicles and the homeowner login in one transaction.
  - Username, contact number and unit must be unique.
  - Required fields show a red asterisk. Validation errors render under the field
    with a red border and the first invalid field is scrolled into view.
  - The account is `ACTIVE` immediately and receives an in-app welcome notice.
- **Member records:** `/admin/members/[id]` has tabs for overview, household,
  kasambahay, pets, vehicles and violations, with add/edit/remove forms.
- **Reports:** `/admin/reports` builds unpaid dues, inactive members, open
  violations and payments tables with date filters, print CSS and CSV export at
  `/admin/reports/export`.
- **Dashboard:** clickable section tiles show counts for every admin area.
- Seed creates usernames for every login; README updated.

## Validation already done
- `npm run db:seed` is idempotent; seed data: users 6, households 5, members 6,
  dues 15, payments 10, paymentChannels 1, violations 3, budgetEntries 6,
  feedback 3.
- Username login, admin-created member with login, duplicate rejection, member
  filters, theme toggle.
- `npm run lint`, `npm run typecheck`, `npm run build` pass. Stop the dev server
  before building; a running dev server can corrupt `.next` and trigger
  `/_not-found` invariant errors.
- Latest migrations:
  `20261112000000_remove_otp_and_email`,
  `20261111000000_payment_methods`,
  `20261110000000_username_login_remove_requests`,
  `20261029014500_restrict_occupancy_types`.

## Next phase
Remaining work: outbound SMS delivery, official GCash QR asset, and any further
reporting/reminder polish.

## Known gaps / notes
- Official GCash QR image is not supplied; UI shows “QR image pending.”
- No outbound SMS provider; reminders log to the console and member-account
  notices are in-app only.
- `next.config.ts` has `devIndicators: false` because the dev badge overlapped
  the theme toggle.
- Test accounts use password `Leaf2026!`: usernames `admin`, `treasurer`,
  `maria.santos`, `jose.reyes`, `ana.delacruz`, `pedro.lim`.

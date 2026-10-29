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
- **Members:** search by name/email/contact/address; filters for street,
  block, occupancy, status.
- **Dark mode:** persisted theme toggle in auth/admin/homeowner headers and design
  guide; system preference on first visit.
- **Phase 2 registration:**
  - `/register` two-step form: account/unit, owner/tenant occupancy, household
    members with relationship dropdown, kasambahay with 11-digit contacts, pets,
    vehicles, Data Privacy consent.
  - Contact numbers are exactly 11 digits. Passwords need at least 8 characters,
    upper and lowercase letters, and a number; the form shows live checks.
  - No block/lot fields and no pet/vehicle count fields in registration.
  - Password hashed; request stored `PENDING`; no login until approval.
  - Duplicate email/unit/pending-request protection; errors preserve entered data
    and return to the correct step.
  - `/admin/requests` shows full details and approve/reject controls.
  - Approval transaction creates household, member, occupants, pets, vehicles,
    kasambahay, login, and in-app notification.
  - Rejection stores a reason; applicant can resubmit.
- Seed updated for registration payloads; README updated.

## Validation already done
- `npm run db:seed` is idempotent; seed data: users 6, households 5, members 6,
  dues 15, payments 10, paymentChannels 1, violations 3, budgetEntries 6,
  registrationRequests 2, feedback 3. The live DB currently has one additional
  pending request submitted through the app, so the total count is 3.
- Registration success, duplicate rejection with field preservation, admin
  approval, rejection, approved-user login, member filters, theme toggle.
- `npm run lint`, `npm run typecheck`, `npm run build` pass. Stop the dev server
  before building; a running dev server can corrupt `.next` and trigger
  `/_not-found` invariant errors.
- Two pending seeded requests remain plus one pending app-submitted request.
- Latest migrations: `20261029013000_kasambahay_contact_number` and
  `20261029014500_restrict_occupancy_types`.

## Next phase
Complete Phase 3 member records:
- Household/member detail page with tabs.
- Add/edit forms for member, dependents, pets, vehicles, kasambahay.
- Link from `/admin/members`.
Then later phases: dues generation, reminders, budget entry, feedback submission,
OTP/password reset, email/SMS delivery, audit logs.

## Known gaps / notes
- Official GCash QR image is not supplied; UI shows “QR image pending.”
- No audit-log writes for approvals/violations yet.
- No outbound email/SMS; approval notification is in-app only.
- Budget entry, feedback submission, password reset/OTP, dues generation and
  reminders still need work.
- `next.config.ts` has `devIndicators: false` because the dev badge overlapped
  the theme toggle.
- Test accounts use password `Leaf2026!`: `admin@asialeaf.test`,
  `treasurer@asialeaf.test`, `maria.santos@example.test`,
  `jose.reyes@example.test`, `ana.delacruz@example.test`,
  `pedro.lim@example.test`.

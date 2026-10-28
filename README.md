# Asian Leaf HOA

A mobile-friendly web app for the Asian Leaf Homeowners Association in General
Trias, Cavite. This repository is at the end of **Phase 0**: project setup,
design system, navigation shells, splash intro, database schema and seed data.

Authentication, registration, dues, payments, OTP and feedback are built in the
next phases.

## Stack

- Next.js 15.5 (App Router) + React 19 + TypeScript
- Tailwind CSS 3.4 with CSS-variable design tokens
- PostgreSQL + Prisma 6
- Auth (Phase 1): custom opaque session cookies stored as hashes
- Payments (later phase): PayMongo test mode; no uploads
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
| `SESSION_SECRET` | Signing secret for Phase 1 sessions |
| `APP_URL` | Public app URL; used for redirects and webhooks later |

Locally, `DATABASE_URL` and `DIRECT_URL` can point to the same database. For a
hosted provider such as Neon or Supabase, use the pooled URL for `DATABASE_URL`
and the direct URL for `DIRECT_URL`.

## Seeded accounts

All seeded accounts use the password `Leaf2026!`. Login is not wired until
Phase 1.

| Role | Email |
| --- | --- |
| Admin | `admin@asialeaf.test` |
| Treasurer | `treasurer@asialeaf.test` |
| Homeowner | `maria.santos@example.test` |
| Homeowner | `jose.reyes@example.test` |
| Homeowner | `ana.delacruz@example.test` |
| Homeowner | `pedro.lim@example.test` |

The seed also creates five households, dependents, dues for three months, paid
and partial payments, budget entries, notifications, feedback and two pending
registration requests.

Re-running `npm run db:seed` is safe: records are upserted by fixed IDs and no
duplicates are created.

## Routes in Phase 0

| Route | What it shows |
| --- | --- |
| `/` | Phase 0 preview and links |
| `/design` | Style guide and all UI states |
| `/admin/dashboard` | Admin sidebar shell |
| `/app/dashboard` | Homeowner bottom-nav shell |
| `/login`, `/register` | Honest placeholders for Phase 1 and 2 |
| `/api/health` | Database health and seeded counts |

The admin and homeowner shells are intentionally **unguarded** until Phase 1.

## Design rules applied

- Colors: forest `#4F6B1F`, leaf `#7BA11E`, lime `#B7D335`, cream `#F5F8EC`,
  ink `#2A3414`, amber `#E0A100`, red `#C8402F`.
- Fonts: Playfair Display for headings, Inter for everything else.
- One card style, one radius scale (8/12/16), one shadow token.
- No gradients, glow, emoji or decorative icons.
- Every data view must define loading, empty, error and success states.
- Splash appears once per browser session, can be skipped, and becomes static
  when `prefers-reduced-motion` is enabled.

## Phase 0 manual test checklist

1. `npx prisma migrate dev` and `npm run db:seed` succeed on a clean database.
2. Running the seed twice keeps the same counts.
3. First load in a new tab shows the splash for about 1.8 seconds.
4. Reloading the same tab does not show the splash again.
5. Clicking or pressing Enter during the splash skips it.
6. Emulating reduced motion produces a static splash.
7. `/design` shows the exact palette, only two fonts, and all four UI states.
8. `/admin/dashboard` works at 1440px and 390px; the sidebar collapses and
   becomes a drawer.
9. `/app/dashboard` shows the bottom navigation at 390px and the desktop nav at
   1280px.
10. Tables scroll horizontally inside their card without scrolling the page.
11. `/api/health` returns seeded counts.
12. `npm run lint`, `npm run typecheck` and `npm run build` pass.

## Scope notes and known gaps

- No authentication yet; admin and homeowner routes are public.
- No registration, approval, member editing, dues generation, reminder job,
  PayMongo checkout, OTP or feedback submission yet.
- Uploads are deliberately removed. Payment receipts are kept by the payer as a
  screenshot; the app will show a reminder after checkout.
- SMS and email will be mocked with console output until a real provider is
  configured.
- Dues are billed **per household**, due on the 5th. Partial payments are
  allowed, but a balance remains open until the full amount is settled.
  Overdue reminders repeat weekly until the balance is paid.
- One login per household is enforced by a unique household link on `User`.
- The app is designed to move from Vercel + hosted PostgreSQL to a VPS with
  Cloudflare Tunnel later without a rewrite. No Vercel-only APIs are used.

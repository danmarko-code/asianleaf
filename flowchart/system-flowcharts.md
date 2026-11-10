# Asian Leaf HOA — Process, Workflow and Algorithm Spec

Companion to the `.mmd` files in this folder. Use this page when you want to draw
the charts by hand (draw.io, Word, PowerPoint, Lucidchart); use the `.mmd` files
when you want them generated instantly at <https://mermaid.live>.

Scope: the whole portal — registration, approval, login, dues, payment
verification, reminders, violations, budget, feedback, password reset.

---

## 1. Shape legend

| Shape | Name | Use it for | Example from this system |
|---|---|---|---|
| ⬭ Oval / rounded rectangle | Terminator | Start and End only | "Visitor opens /register" |
| ▭ Rectangle | Process | A person or the system does something | "Hash the password with bcrypt" |
| ▱ Parallelogram | Input / Output | Data typed or chosen by a person, or a message shown back | "Enter email + password", "Red box: Only numbers are allowed." |
| ◇ Diamond | Decision | One question, **exactly two** labelled arrows (Yes / No) | "Password correct?" |
| ⬡ Hexagon | Preparation | Computed values, setup | "periodStart = 1st of month" |
| 🛢 Cylinder | Data store | A database read or write | "Save RegistrationRequest, status = PENDING" |
| 🗎 Document | Report / notification | Something a human reads | "In-app notification REGISTRATION_APPROVED" |
| ◯ Small circle | On-page connector | Continue elsewhere on the same sheet | "A2", "L1" |
| ⬒ Pentagon / off-page arrow | Off-page connector | Continue on a different sheet | Sheet A2 → Sheet B |
| ▭▭ Swimlane | Actor band | One column per actor | Applicant · Homeowner · Admin · System |

### Drawing rules

1. Exactly one Start oval per chart; every path must reach an End oval.
2. Every diamond has two and only two exits, labelled `Yes` / `No` (or
   `Approve` / `Reject` where the decision is a choice).
3. Arrows run top→bottom or left→right. No diagonal crossings.
4. A step sits in the lane of whoever performs it. All database writes sit in
   the **System** lane.
5. Number every shape (`A1`, `S4`, `V7`). It makes review and revision painless.
6. Keep a sheet under ~15 shapes; split with off-page connectors.
7. Dashed arrows mean "later" or "the other actor continues from here" —
   solid arrows are the primary path.

---

## 2. Actors (swimlanes)

| Lane | Who | Can do |
|---|---|---|
| **Guest / Applicant** | Not signed in | Register, read the login page |
| **Homeowner** | `role = HOMEOWNER`, one login per household | See dues, violations, budget; submit a GCash reference; send feedback |
| **Admin / Treasurer** | `role = ADMIN` | Approve registrations, verify payments, generate dues, send reminders, issue violations, post budget, answer feedback |
| **System** | Next.js server + PostgreSQL | Validation, bcrypt hashing, transactions, notifications, audit log, cron |

---

## 3. Whole system — one diagram

See `00-whole-system.mmd` (single picture, four lanes).

**Lane 1 — Guest / Applicant**

| # | Text in shape | Shape | Goes to |
|---|---|---|---|
| GA | Visitor opens the site | Oval · Start | GB |
| GB | Has an active account? | Diamond | No → GC · Yes → SE |
| GC | Fill the registration form: name, email, 11-digit contact, password, street, block, lot, owner/tenant | Parallelogram | GD |
| GD | All fields valid? | Diamond | No → GE · Yes → GF |
| GE | Red box under the field with the exact rule | Parallelogram | GC |
| GF | Step 2: household members, pets, vehicles, kasambahay, consent | Parallelogram | GG |
| GG | Submit the request | Rectangle | SA |
| GH | End — waits for admin approval | Oval · End | — |

**Lane 2 — System (Next.js + PostgreSQL)**

| # | Text in shape | Shape | Goes to |
|---|---|---|---|
| SA | Duplicate email, unit, or pending request? | Diamond | Yes → SB · No → SC |
| SB | Reject with the matching message | Parallelogram | GC |
| SC | Hash the password with bcrypt | Rectangle | SD |
| SD | `RegistrationRequest status = PENDING` | Cylinder | GH |
| SE | Login page | Oval (entry point) | SF |
| SF | Email belongs to a user? | Diamond | No → SG · Yes → SI |
| SG | Pending or rejected request for this email? | Diamond | Yes/No → SH |
| SH | Pending, rejected, or not-registered message | Parallelogram | SE |
| SI | Password correct and status ACTIVE? | Diamond | No → SJ · Yes → SK |
| SJ | "Incorrect email or password" | Parallelogram | SE |
| SK | Session row + httpOnly cookie | Cylinder | SL |
| SL | Role? | Diamond | ADMIN → AA · HOMEOWNER → HA |

**Lane 3 — Admin / Treasurer**

| # | Text in shape | Shape | Goes to |
|---|---|---|---|
| AA | Admin dashboard | Oval (entry point) | AB, AF, AH, AL, AM, AN |
| AB | Approve the request? | Diamond | Approve → AC · Reject → AE |
| AC | Create Household, Member, User ACTIVE, dependents, pets, vehicles, kasambahay | Rectangle | AD |
| AD | `status = APPROVED` + in-app notification | Cylinder | SE |
| AE | `status = REJECTED` + reason saved | Cylinder | GC |
| AF | Generate the monthly dues, ₱1,500 per household | Rectangle | AG |
| AG | Send reminders — daily cron or manual button | Rectangle | — |
| AH | Verify the GCash payment? | Diamond | Approve → AI · Reject → AK |
| AI | Payment = PAID, receipt `RCPT-YYYY-XXXXXX` | Rectangle | AJ |
| AJ | Recompute the Due: PAID or PARTIALLY_PAID | Cylinder | HB |
| AK | Payment = REJECTED, reason saved | Cylinder | HD |
| AL | Issue a violation: warning or payment required | Rectangle | HH |
| AM | Post a budget entry: income or expense | Rectangle | HI |
| AN | Reply to feedback | Rectangle | — |

**Lane 4 — Homeowner**

| # | Text in shape | Shape | Goes to |
|---|---|---|---|
| HA | Homeowner dashboard | Oval (entry point) | HB, HH, HI, HJ |
| HB | Open balance? | Diamond | No → HC · Yes → HD |
| HC | No open balance — history only | Parallelogram | HK |
| HD | Scan the GCash QR, enter amount, reference, date, channel | Parallelogram | HE |
| HE | Amount within balance and reference unused? | Diamond | No → HF · Yes → HG |
| HF | Amount too high, or reference already submitted | Parallelogram | HD |
| HG | Payment PENDING — waiting for verification | Cylinder | AH |
| HH | Violations shown in red | Rectangle | HK |
| HI | Budget shown read-only | Rectangle | HK |
| HJ | Send feedback | Rectangle | AN |
| HK | End — sign out | Oval · End | — |

Dashed arrows in the drawing mean "the other lane continues from here"; solid
arrows are the primary path.

---

## 4. Chart A — registration → approval → login

See `01-registration-approval-login.mmd`. Four sheets: **A1** applicant form,
**A2** server checks, **B** admin review, **L** login.

### Sheet A1 — applicant fills in the form

| # | Text in shape | Shape | Next |
|---|---|---|---|
| A1 | Visitor opens `/register` | Oval · Start | A2 |
| A2 | Enter first name, last name, email, 11-digit contact, password + confirm, street, block, lot, owner/tenant | Parallelogram | A3 |
| A3 | Names: letters and spaces only, 2+ letters? | Diamond | No → A4 · Yes → A5 |
| A4 | Red box: "Only letters are required. Numbers and special characters are not allowed." | Parallelogram | A2 |
| A5 | Email looks like `name@domain.tld`? | Diamond | No → A6 · Yes → A7 |
| A6 | Red box: "Enter a complete email, like name@example.com." | Parallelogram | A2 |
| A7 | Contact exactly 11 digits? | Diamond | No → A8 · Yes → A9 |
| A8 | Red box: "Only numbers are allowed." **or** "Please enter the 11 digits of your mobile number." | Parallelogram | A2 |
| A9 | Password 8+ chars, upper, lower, number, matches confirmation? | Diamond | No → A10 · Yes → A11 |
| A10 | Red box: password rule message / "The passwords do not match." | Parallelogram | A2 |
| A11 | Click **Continue to household details** | Rectangle | A12 |
| A12 | Enter household members, pets, vehicles, kasambahay; tick Data Privacy consent | Parallelogram | A13 |
| A13 | Consent ticked and household names valid? | Diamond | No → A14 · Yes → A15 |
| A14 | Message at the top of the form, back to step 2 | Parallelogram | A12 |
| A15 | Connector → Sheet A2 | Circle | → S1 |

Two rules worth writing on the sheet itself:

- An **empty** field only shows "Please add your first name." after the field is
  left or Continue is pressed.
- A digit or symbol shows the letters-only message immediately, **before** the
  length check.

### Sheet A2 — server validates and stores

| # | Text in shape | Shape | Next |
|---|---|---|---|
| S1 | Re-validate every field with zod | Rectangle | S2 |
| S2 | Email already has an account? | Diamond | Yes → S3 · No → S4 |
| S3 | "An account already uses this email" | Parallelogram | back to A2 |
| S4 | Unit already registered? | Diamond | Yes → S5 · No → S6 |
| S5 | "This unit is already registered" | Parallelogram | back to A2 |
| S6 | A PENDING request exists for this email or unit? | Diamond | Yes → S7 · No → S8 |
| S7 | "Already waiting for review" | Parallelogram | back to A2 |
| S8 | Hash the password with bcrypt | Rectangle | S9 |
| S9 | Save `RegistrationRequest`, `status = PENDING` | Cylinder | S10 |
| S10 | Show "Submitted — wait for admin approval" | Document | S11 |
| S11 | End — no login exists yet | Oval · End | — |

### Sheet B — admin review

| # | Text in shape | Shape | Next |
|---|---|---|---|
| B1 | Admin opens `/admin/requests` | Oval · Start | B2 |
| B2 | Request still PENDING? | Diamond | No → B3 · Yes → B4 |
| B3 | "This request has already been reviewed" | Parallelogram | B14 |
| B4 | Approve or reject? | Diamond | Reject → B5 · Approve → B7 |
| B5 | Enter rejection reason (3–300 chars) | Parallelogram | B6 |
| B6 | `status = REJECTED`, save reason + reviewer | Cylinder | B13 |
| B7 | Email and unit still free, payload still valid? | Diamond | No → B8 · Yes → B9 |
| B8 | Show error, stay on the queue | Parallelogram | B2 |
| B9 | **TRANSACTION:** create Household → Member → User (ACTIVE) → dependents, pets, vehicles, kasambahay | Rectangle | B10 |
| B10 | `status = APPROVED`, link `createdUserId` | Cylinder | B11 |
| B11 | Notification `REGISTRATION_APPROVED` | Document | B12 |
| B12 | "Registration approved" | Parallelogram | B14 |
| B13 | "Registration rejected — applicant may resubmit" | Parallelogram | B14 |
| B14 | End | Oval · End | — |

### Sheet L — login

| # | Text in shape | Shape | Next |
|---|---|---|---|
| L1 | User opens `/login` | Oval · Start | L2 |
| L2 | Enter email + password | Parallelogram | L3 |
| L3 | Formats valid? | Diamond | No → L4 · Yes → L5 |
| L4 | "Enter a valid email address and password" | Parallelogram | L2 |
| L5 | User account exists for this email? | Diamond | No → L6 · Yes → L11 |
| L6 | PENDING registration for this email? | Diamond | Yes → L7 · No → L8 |
| L7 | "Your registration is still pending. The admin must approve it first, so please wait patiently." | Parallelogram | L14 |
| L8 | REJECTED registration for this email? | Diamond | Yes → L9 · No → L10 |
| L9 | "Your registration was not approved. Please register again or contact the association office." | Parallelogram | L14 |
| L10 | "This email is not registered yet. Please register your household first." | Parallelogram | L14 |
| L11 | Password correct? | Diamond | No → L12 · Yes → L13 |
| L12 | "Incorrect email or password" | Parallelogram | L14 |
| L13 | Account status? | Diamond | PENDING → L7 · DISABLED → L13a · ACTIVE → L15 |
| L13a | "This account has been disabled. Contact the association office." | Parallelogram | L14 |
| L15 | Create session: random token, SHA-256 hash, 14-day expiry | Cylinder | L16 |
| L16 | Set httpOnly cookie `asialeaf_session` | Rectangle | L17 |
| L17 | Role? | Diamond | ADMIN → L18 · HOMEOWNER → L19 |
| L18 | Redirect `/admin/dashboard` | Rectangle | L20 |
| L19 | Redirect `/app/dashboard` | Rectangle | L20 |
| L20 | Signed in | Oval · End | — |
| L14 | Connector back to the login form | Circle | → L1 |

Note for the drawing: L6/L8 key off the email alone, **before** the password is
checked — that is deliberate, so an applicant who has not been approved yet
still gets the right explanation.

---

## 5. Chart B — dues → payment → verification

See `02-dues-payment-verification.mmd`. Four lanes on one sheet, plus the
reminder job in a box of its own.

### B1 — admin generates dues

| # | Text in shape | Shape | Next |
|---|---|---|---|
| D1 | Admin opens `/admin/dues` | Oval · Start | D2 |
| D2 | Choose billing month `YYYY-MM` | Parallelogram | D3 |
| D3 | periodStart = 1st, dueDate = 5th | Hexagon | D4 |
| D4 | One Due per household, ₱1,500, skip existing | Cylinder | D5 |
| D5 | Any new rows? | Diamond | Yes → D6 · No → D7 |
| D6 | "Generated N dues" + audit log | Parallelogram | D8 |
| D7 | "Dues for this month were already generated" | Parallelogram | D8 |
| D8 | End | Oval · End | — |

### B2 — homeowner submits a GCash reference

| # | Text in shape | Shape | Next |
|---|---|---|---|
| P1 | Homeowner opens `/app/payments` | Oval · Start | P2 |
| P2 | Open due exists (UNPAID / PARTIALLY_PAID)? | Diamond | No → P3 · Yes → P4 |
| P3 | "No open balance" — history only | Parallelogram | P12 |
| P4 | Scan GCash QR, enter amount, reference, date, channel | Parallelogram | P5 |
| P5 | Amount within remaining balance? | Diamond | No → P6 · Yes → P7 |
| P6 | "Amount cannot be more than the remaining balance" | Parallelogram | P4 |
| P7 | Reference number unused? | Diamond | No → P8 · Yes → P9 |
| P8 | "That reference number was already submitted" | Parallelogram | P4 |
| P9 | Save Payment, `status = PENDING` | Cylinder | P10 |
| P10 | "Submitted — waiting for treasurer verification" | Document | V1 |
| P12 | End | Oval · End | — |

### B3 — treasurer verifies

| # | Text in shape | Shape | Next |
|---|---|---|---|
| V1 | Treasurer opens `/admin/payments` | Oval · Start | V2 |
| V2 | Payment still PENDING? | Diamond | No → V3 · Yes → V4 |
| V3 | "Only pending payments can be reviewed" | Parallelogram | V11 |
| V4 | Approve or reject? | Diamond | Reject → V8 · Approve → V5 |
| V5 | Payment = PAID, receipt `RCPT-YYYY-XXXXXX` | Rectangle | V6 |
| V6 | Recompute Due: PAID if fully covered, else PARTIALLY_PAID | Cylinder | V7 |
| V7 | Notification + audit log | Document | V11 |
| V8 | Enter rejection reason (3–300) | Parallelogram | V9 |
| V9 | Payment = REJECTED, Due unchanged | Cylinder | V10 |
| V10 | Notification + audit log | Document | V11 |
| V11 | End | Oval · End | — |

### B4 — reminder job

| # | Text in shape | Shape | Next |
|---|---|---|---|
| R1 | Cron `/api/cron/reminders` or admin button | Oval · Start | R2 |
| R2 | Find dues UNPAID/PARTIALLY_PAID with dueDate ≤ today + 30 | Rectangle | R3 |
| R3 | Balance > 0? | Diamond | No → R8 · Yes → R4 |
| R4 | Bucket: OVERDUE / 1 day / 1 week / 1 month | Hexagon | R5 |
| R5 | Same reminder already logged? | Diamond | Yes → R8 · No → R6 |
| R6 | Write ReminderLog + in-app notification | Cylinder | R7 |
| R7 | Send email/SMS (console stub today) | Document | R8 |
| R8 | End | Oval · End | — |

---

## 6. Chart C — violations

See `03-violations.mmd`.

| # | Text in shape | Shape | Next |
|---|---|---|---|
| C1 | Admin opens `/admin/violations` | Oval · Start | C2 |
| C2 | Pick household, optional resident, category, description, date | Parallelogram | C3 |
| C3 | Notice kind? | Diamond | Warning → C4 · Payment required → C5 |
| C4 | Save, `status = OPEN`, no fine | Cylinder | C7 |
| C5 | Enter fine amount and due date | Parallelogram | C6 |
| C6 | Save, `status = OPEN` with fine | Cylinder | C7 |
| C7 | Homeowner dashboard shows a **red alert** | Document | H1 |
| C8 | Homeowner reads `/app/violations` | Rectangle | H3 |
| C9 | Admin resolves or dismisses | Diamond | Resolved → C10 · Dismissed → C11 |
| C10 | `status = RESOLVED` | Cylinder | C12 |
| C11 | `status = DISMISSED` | Cylinder | C12 |
| C12 | Audit log | Cylinder | C13 |

> **Dashed note on the chart:** a `PAYMENT_REQUIRED` fine is recorded but **no
> Due is created**, so it cannot be paid in the app yet. Draw a dashed box
> around C6 saying "settled at the association office — not payable in-app".

---

## 7. Chart D — budget

| # | Text in shape | Shape | Next |
|---|---|---|---|
| BD1 | Admin opens `/admin/budget` | Oval · Start | BD2 |
| BD2 | Type (income/expense), category, description, amount, date | Parallelogram | BD3 |
| BD3 | Amount > 0 and date valid? | Diamond | No → BD4 · Yes → BD5 |
| BD4 | Field error | Parallelogram | BD2 |
| BD5 | Save BudgetEntry | Cylinder | BD6 |
| BD6 | Audit log | Cylinder | BD7 |
| BD7 | Homeowner sees it read-only on `/app/budget` | Rectangle | BD8 |

## 8. Chart E — feedback

| # | Text in shape | Shape | Next |
|---|---|---|---|
| F1 | Homeowner writes subject + message | Oval · Start | F2 |
| F2 | Submit | Parallelogram | F3 |
| F3 | Subject and message not empty? | Diamond | No → F4 · Yes → F5 |
| F4 | Field error | Parallelogram | F2 |
| F5 | Save Feedback, `status = NEW` | Cylinder | F6 |
| F6 | Admin opens `/admin/feedback` | Rectangle | F7 |
| F7 | Set READ or RESOLVED + note | Diamond | → F8 |
| F8 | Save status | Cylinder | F9 |
| F9 | Notify author + audit log | Document | F10 |

## 9. Chart F — password change / reset (planned)

| # | Text in shape | Shape | Next |
|---|---|---|---|
| PW1 | User requests change or reset | Oval · Start | PW2 |
| PW2 | Generate 6-digit OTP, store hash, 5-min TTL | Rectangle | PW3 |
| PW3 | Send code (email/SMS stub today) | Document | PW4 |
| PW4 | User enters code + new password | Parallelogram | PW5 |
| PW5 | Code valid, not expired, under 5 attempts? | Diamond | No → PW6 · Yes → PW7 |
| PW6 | "Incorrect or expired code" | Parallelogram | PW4 |
| PW7 | New password meets the rule? | Diamond | No → PW8 · Yes → PW9 |
| PW8 | Password rule message | Parallelogram | PW4 |
| PW9 | Rehash + save password, delete OTP | Cylinder | PW10 |
| PW10 | Delete **all** sessions for the user | Cylinder | PW11 |
| PW11 | Issue a fresh session (change flow only) | Rectangle | PW12 |
| PW12 | Signed in with the new password | Oval · End | — |

---

## 10. Sheet layout plan

| Sheet | Content | Connector reuse |
|---|---|---|
| 1 | Whole system — one diagram | — |
| 2 | Chart A1 applicant registration | A15 → Sheet 3 |
| 3 | Chart A2 server + Sheet B admin review | off-page → Sheet 4 |
| 4 | Chart L login | L14 back to L1 |
| 5 | Chart B dues + payment + verification + reminders | P10 → V1 |
| 6 | Charts C, D, E, F side by side | each self-contained |

Cross-cutting note to print in a corner of every sheet:

> Every state change (approve, reject, verify, generate, resolve, budget save,
> feedback reply) must also write an audit-log row. It is drawn once at the end
> of each chart instead of on every arrow.

---

## 11. Known gaps to show on the diagrams

These are real gaps in the current build — draw them so the reader isn't misled:

1. `PAYMENT_REQUIRED` fines create no Due — not payable in-app.
2. Email/SMS sending is a console stub; only in-app notifications work.
3. Audit-log rows are not written yet (the shape says "planned").
4. Official GCash QR image is not supplied — the UI says "QR image pending".
5. Password reset / OTP is not built yet (Chart F is the intended design).
6. Dues generation and reminder UI exist, but a scheduled cron still needs a
   hosting provider that supports it.

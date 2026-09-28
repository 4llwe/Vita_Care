# Phase 0 Remediation — 2026-09-23

## Implemented
- Browser authentication moved to HttpOnly, Secure-in-production, SameSite=Strict cookies.
- Added refresh and logout endpoints; fixed frontend/backend 2FA contract.
- Bearer response remains for non-browser/E2E compatibility; web login no longer persists it.
- Global NestJS throttling guard activated.
- API client now sends credentials, retries once through refresh, and displays sanitized messages.
- Patient booking ownership now uses immutable `patientUserId`, not name/phone matching.
- Patient invoice list, detail, and payment enforce ownership through the linked booking.
- Health workers may update booking location/status and medical records only for assigned visits.
- Added assigned-booking endpoint and role-aware booking/invoice frontend queries.
- Clinical observations fail closed when no approved active protocol exists.
- New seeded service candidates are inactive until operator approval.
- Removed unverified numeric claims from the public landing page.
- Added a migration coverage gate. Production preflight intentionally fails until a reviewed baseline migration exists.
- Added persistent refresh sessions with opaque HMAC-hashed tokens, transactional rotation, reuse-family revocation, session management, and access-token session validation.
- Browser refresh coordination uses Web Locks when available and an IndexedDB lease fallback with a 15-second crash-expiry window; refresh retries remain single-use and bounded.

## Mandatory staging work before deployment
1. Run `pnpm install --frozen-lockfile` using Node 20 / pnpm 9.
2. Generate a reviewed baseline from the pre-remediation schema or an authoritative database snapshot.
3. Reconcile existing bookings to `patientUserId`; unmatched rows must remain inaccessible to patient accounts.
4. Run Prisma validate/generate, unit tests, build, and Playwright E2E.
5. Perform negative authorization tests for cross-patient and cross-assignment access.
6. Configure and approve the first clinical protocol before recording observations.

## Phase 1.2 — multi-role foundation
- Added additive `UserRole` assignments while preserving `User.role` as the primary compatibility role.
- Backfilled every existing primary role into `UserRole`.
- Added dedicated `DOCTOR`, `NURSE`, and `FINANCE` roles.
- JWT validation and role guards resolve effective roles from the database on every authenticated request.
- Clinical object-level assignment checks continue to apply to Doctor and Nurse access.

## Phase 1.3 — canonical care schema
- Added canonical `Patient`, `Appointment`, and `CareAssignment` models.
- Backfilled legacy Booking and Hospital-at-Home identities and assignments.
- Booking and HaH creation paths dual-write canonical records while legacy fields remain available.
- Added a database constraint requiring each care assignment to target exactly one appointment or HaH episode.

## Phase 1.4 — document row-level security
- Added explicit per-user document grants for READ, EDIT, and REVIEW access.
- Document operations now enforce owner, grant, and privileged-role checks in the API.
- PostgreSQL RLS policies protect documents, versions, and grants using transaction-scoped actor context.
- Document ownership, version authorship, and review identity are derived from the authenticated actor.

## Phase 1.5 — durable jobs and safe schedulers
- Added a Redis-backed BullMQ queue with a dedicated worker process.
- Notification deliveries use deterministic job IDs, exponential retry, database leases, and stale-job recovery.
- CAPA reminders and queue reconciliation use Redis job schedulers, so multiple worker replicas do not duplicate schedules.
- API instances only produce jobs; horizontally scaled workers coordinate processing through Redis locks.

## Still pending for Phase 1+
- Full public website information architecture and operator-approved service catalogue.

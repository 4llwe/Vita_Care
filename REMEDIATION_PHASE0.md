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

## Mandatory staging work before deployment
1. Run `pnpm install --frozen-lockfile` using Node 20 / pnpm 9.
2. Generate a reviewed baseline from the pre-remediation schema or an authoritative database snapshot.
3. Reconcile existing bookings to `patientUserId`; unmatched rows must remain inaccessible to patient accounts.
4. Run Prisma validate/generate, unit tests, build, and Playwright E2E.
5. Perform negative authorization tests for cross-patient and cross-assignment access.
6. Configure and approve the first clinical protocol before recording observations.

## Still pending for Phase 1+
- Refresh-session persistence, rotation/reuse detection, and device/session management.
- Multi-role `roles/user_roles` migration and dedicated Doctor, Nurse, Finance roles.
- Canonical patient/appointment/assignment schema.
- PostgreSQL RLS and object-level document authorization.
- Redis-backed durable jobs and horizontally safe schedulers.
- Full public website information architecture and operator-approved service catalogue.

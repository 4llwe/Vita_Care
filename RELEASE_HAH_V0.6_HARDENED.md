# Vita Care Hospital at Home v0.6 — Hardening & Functional UX

## Scope completed

- Restricted HaH episode detail/list/open-alert APIs to operational roles; governance roles no longer receive complete patient records through these endpoints.
- Added server-side clinical profession checks. Doctor-only actions include eligibility approval, admission, care-plan approval, prescribing, diagnostic decisions, alert resolution, and discharge. Observation/administration workflows require an active doctor, nurse, or midwife profile and valid license.
- Clinical alert creation, acknowledgement, and resolution now create explicit audit records. The global mutation audit is awaited before the HTTP response completes.
- Added an authenticated clinical notification center with SLA/overdue visibility.
- Replaced the generic workspace shell with patient-context modules for medication, pharmacy, laboratory, care plan, medical-record timeline, patient profile, family/caregiver, education, teleconsultation, wound care, reports, and administration links.
- Upgraded monitoring to show systolic/diastolic series, time labels, observation-range selection, trend tolerance, EWS score/category, and a clear non-diagnostic safety statement.
- Added role-aware mobile bottom navigation.
- Improved emergency UX with keyboard Escape support, focus return, high-accuracy location, location sharing/copying, contextual medical-summary/family routes, and persistent mobile SOS access.
- Upgraded the public mobile menu and made contact/action pages route to safe authenticated workflows or configured contact channels instead of generic copy only.
- Added parse/format QA for every changed TypeScript/TSX file.

## Deployment gates that cannot be manufactured in source code

The source is hardened, but production promotion still requires real deployment evidence:

1. Generate and commit `pnpm-lock.yaml` from an approved package registry.
2. Install dependencies and run `pnpm lint`, `pnpm test`, `pnpm build`, and Playwright E2E in CI.
3. Configure real emergency, email, WhatsApp, payment, object-storage, database, Redis, and public URL secrets.
4. Create/review/apply Prisma migrations against a disposable staging clone.
5. Run desktop/tablet/mobile visual QA against the built application.
6. Validate provider delivery receipts, retries, alert escalation roster, and ambulance/receiving-hospital workflow.
7. Complete penetration testing, backup/restore, disaster recovery, privacy review, clinical-governance approval, and Indonesian regulatory sign-off.

Do not handle real patient data until every gate above passes. Source code alone cannot truthfully guarantee “100% production ready” without those environment, provider, clinical, and regulatory approvals.

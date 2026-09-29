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

## Phase 1.6 — role navigation and dashboard UX
- Unified direct DOCTOR, NURSE, FINANCE, PATIENT, and CAREGIVER roles with the legacy HEALTH_WORKER navigation path.
- Added role-scoped dashboard analytics so clinical and patient accounts never receive global finance or governance metrics.
- Added dedicated doctor, nurse, finance, patient, and caregiver dashboard actions.
- Added a responsive public mega-menu and a mobile-visible Login action while keeping Emergency access persistent.

## Phase 1.7 — operational workspaces and service content
- Replaced generic public copy with section-specific scope, workflows, privacy statements, and safety guidance.
- Added clinically cautious descriptions for the thirteen requested Hospital at Home service categories.
- Added featured service routes to the homepage without unverified outcome claims.
- Upgraded teleconsultation, patient education, and wound-care workspaces with episode-scoped communication and relevant clinical context.

## Phase 1.8 — operational finance, administration, and role verification
- Added structured payer and claim tracking for self-pay, private insurance, BPJS/JKN, and corporate coverage without replacing the existing invoice flow.
- Payments now charge only the patient-responsibility balance after approved coverage; claim changes are validated and written to the audit trail.
- Added a restricted user-access workspace for Super Admins, including primary/additional role management, account activation, session revocation, and last-Super-Admin protection.
- Added role-scoped report and system-readiness pages without exposing credentials or infrastructure secrets.
- Added end-to-end mobile navigation coverage for Doctor, Nurse, Finance, Patient, and Caregiver roles.

## Phase 1.9 — public information architecture
- Connected all fourteen public navigation groups and their submenu pages to the existing dynamic menu catalogue.
- Added complete desktop mega-menu and mobile nested navigation while preserving persistent Emergency and Login actions.
- Home-directory entries now resolve to real, accessible homepage sections instead of duplicate generic pages.
- Dynamic slugs, CMS descriptions, and approved internal or HTTPS destination overrides are honored by the public directory.
- Secure patient, caregiver, monitoring, pharmacy, and payment entries preserve their intended destination through login.

## Phase 2.0 — clinical evaluation and discharge safety
- Added structured clinical evaluations linked to each Hospital at Home episode and individual care plan.
- Evaluations record clinical progress, achieved and unmet goals, follow-up needs, and an explicit clinical disposition.
- Active episodes require a current physician evaluation marked `DISCHARGE_READY` after the latest care-plan revision.
- Discharge readiness now blocks closure while clinical alerts, pending diagnostics, or unacknowledged critical results remain.
- Evaluation and discharge actions are written to the audit trail, with role and episode access enforced by the API.
- The episode workspace displays evaluation history and a live, human-readable discharge-readiness summary.

## Phase 2.1 — medication schedules, reminders, and adherence
- Extended medication orders with explicit dose schedules while preserving existing prescribing and administration records.
- Planned doses are updated in place when administered, preventing duplicate records and retaining the scheduled-versus-actual timeline.
- Added durable five-minute medication scheduling jobs for patient reminders and missed-dose detection.
- Reminder and missed-dose claims are idempotent across horizontally scaled workers; missed doses create clinical notifications and audit records.
- Added episode-level adherence calculations and patient/family views for scheduled, given, delayed, refused, omitted, and missed doses.
- Medication adherence is presented as monitoring support and never as an automated diagnosis.

## Phase 2.2 — emergency response workflow
- Connected the persistent Emergency action to authenticated Hospital at Home episodes without removing public emergency-call access.
- Added a protected emergency summary with patient identity, diagnosis, allergies, emergency plan, latest vital signs, and family contact.
- Calls to the medical team, hospital, or ambulance and patient-location sharing create auditable emergency events.
- Emergency events notify the clinical command channel and appear in the notification center for acknowledgement and resolution.
- Location is recorded only after explicit device permission and only for an authenticated, authorized episode.
- Public users can still call configured emergency numbers; failure to record an event never blocks the phone action.

## Phase 2.3 — caregiver consent and field-level privacy
- Added a fixed caregiver-consent vocabulary for summary, vital signs, care plan, medication, diagnostics, schedule, and clinical messages.
- Caregiver scope is enforced by the API for both direct endpoints and episode payload fields; hiding a menu is not treated as a security boundary.
- Patient identity numbers and emergency-event history are never exposed through caregiver access.
- Patients may grant, update, review, expire, and revoke caregiver access from the existing family workspace using the caregiver's account email.
- Consent requires a timestamp, named consent giver, mandatory summary scope, and a valid optional expiration.
- Users with both Patient and Caregiver roles retain full access to their own record while receiving scoped access to another patient's record.

## Phase 2.4 — multidisciplinary care-team coordination
- Operationalized the existing canonical CareAssignment model for Hospital at Home episodes instead of introducing a parallel staffing system.
- Coordinators can assign or replace the primary clinician and care coordinator with documented responsibilities and assignment periods.
- Reassignment ends the previous assignment transactionally, updates the attending physician when applicable, and writes an audit record.
- Active care-team membership now grants episode access alongside attending-physician and scheduled-visit access.
- Expired licenses and inactive health-worker profiles cannot be assigned.
- A primary clinician cannot be removed without assigning a replacement, preserving clinical accountability.
- The episode workspace shows active and historical team assignments and allows authorized coordinators to end non-primary assignments with a reason.

## Phase 2.5 — clinical task board and structured handover
- Added episode-scoped clinical tasks for assessment, vital signs, medication, wound care, education, follow-up, and other approved activities.
- Tasks include an assigned active care-team member, clinical priority, due time, description, and controlled lifecycle.
- Only the assigned worker or an authorized doctor/coordinator may change a task; invalid state transitions are rejected by the API.
- Completion or omission requires both an outcome note and a handover note, preserving continuity between visits and shifts.
- Added a responsive personal task board with overdue and STAT/urgent visual indicators.
- Task creation, status changes, outcomes, and handovers remain attached to the episode and are written to the audit trail.

## Phase 2.6 — diagnostic and laboratory safety workflow
- Extended existing diagnostic orders instead of replacing them: `ORDERED → COLLECTED → PROCESSING → RESULTED → ACKNOWLEDGED`, with controlled cancellation and auditable transitions.
- Added specimen-collection metadata, structured result value/unit/reference range, result flags, critical-result alerts, and documented physician acknowledgement.
- Added a responsive role-based laboratory workboard at `/diagnostics`; episode pages remain the source for new orders and link into the structured result workflow.
- Preserved caregiver diagnostic-consent filtering and episode access controls while allowing nurses to document collection and qualified diagnostic professionals to enter results.

## Phase 2.7 — pharmacy fulfillment and medication delivery
- Extended active medication orders with refill requests instead of creating a parallel prescription system.
- Added controlled fulfillment states from request and clinical review through physician approval, preparation, delivery, and receipt.
- Prevented duplicate open refill requests and required courier identity or cancellation reasons at safety-critical transitions.
- Added a responsive pharmacy workboard for staff, patients, and authorized caregivers with role-based actions and episode links.
- Refill requests, approvals, dispensing progress, and delivery confirmation are written to the episode audit trail.

## Phase 2.8 — structured wound-care workflow
- Added longitudinal wound assessments to active Hospital at Home episodes without replacing clinical tasks or care plans.
- Captures wound identity, location/type, dimensions, tissue, exudate, odor, surrounding skin, pain, cleansing, dressing, education, progress, and review schedule.
- Deterioration or documented infection signs create a high-priority clinical alert and notify the care team; the system does not generate an automatic diagnosis.
- Wound documentation is included in episode audit trails and follows existing episode access and caregiver care-plan consent.

## Phase 2.9 — functional rehabilitation and fall prevention
- Added longitudinal functional assessments covering mobility, ADL score, transfer ability, endurance, recent falls, assistive devices, and home hazards.
- Rehabilitation goals, exercise plans, caregiver training, progress, and review dates remain attached to the active Hospital at Home episode.
- High fall risk, a recent fall, or declining function creates a high-priority clinical alert for team review without generating an automatic diagnosis.
- Functional documentation follows existing episode access, caregiver care-plan consent, and clinical audit trails.

## Phase 2.10 — nutrition assessment and intervention
- Added longitudinal nutrition assessments with weight, height, calculated BMI, weight change, oral intake, appetite, swallowing difficulty, and nausea/vomiting.
- Nutrition risk, diet plan, protein/fluid targets, supplements, education, and review dates remain attached to the active episode.
- High nutrition risk, intake below 50%, or swallowing difficulty creates a high-priority clinical alert for multidisciplinary review without generating an automatic diagnosis.
- Nutrition records follow existing episode access, caregiver care-plan consent, and clinical audit trails.

## Still pending for Phase 1+
- Operator review and approval of service-catalogue wording, contact channels, legal details, and accreditation claims.

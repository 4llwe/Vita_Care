# Vita Care Hospital at Home — Clinical & Technical Baseline

> This implementation is a safety-oriented engineering baseline, not regulatory certification. Clinical thresholds, eligibility rules, staffing ratios, response times, and scope of practice require approval by the hospital's clinical governance body and Indonesian legal/compliance review.

## Implemented in v0.2

- Separate longitudinal patient identity (`HaHPatient`) and acute HaH episode.
- Explicit screening → eligibility → admission → active care → transfer/discharge lifecycle.
- Eligibility assessment with recorded exclusions and documented clinician override.
- Consent and emergency plan required before admission.
- Multidisciplinary care-plan record and review deadline.
- Complete vital-sign observations; missing vitals cannot silently score zero.
- Early-warning scoring with supplemental oxygen, Scale 1/2, confusion, response SLA, and persistent clinical alerts.
- Alert acknowledgement and resolution audit fields.
- Structured transfer request with SBAR handover.
- Medication-order/MAR-ready data model, visit scheduling, and discharge safeguards.
- HaH command-center page for active episodes, alerts, and overdue response targets.
- Global mutation audit interceptor enabled.

## Required before clinical go-live

1. Clinician validation and versioning of eligibility/EWS protocols.
2. Real 24/7 notification delivery with acknowledgement, retries, fallback phone/SMS, and escalation roster.
3. Link `User` and `HealthWorker`; enforce assignment-based, row-level authorization.
4. Implement medication order entry, pharmacy verification, dispensing, administration, reconciliation, and allergy checks.
5. Implement diagnostics orders/results/critical-result acknowledgement and device/equipment logistics.
6. Integrate ambulance and receiving-hospital acceptance workflow.
7. Add patient/caregiver portal consent, education, symptom reporting, and emergency-call route.
8. Encrypt sensitive data and files, require private S3 access, malware scanning, retention controls, and audited downloads.
9. Add FHIR/HL7 integration with the accountable hospital EMR/SIMRS.
10. Create and test database migrations, backup/restore, downtime procedures, disaster recovery, observability, and security testing.

## API lifecycle

- `POST /api/hah/patients`
- `POST /api/hah/episodes`
- `POST /api/hah/episodes/:id/eligibility`
- `POST /api/hah/episodes/:id/admit`
- `POST /api/hah/episodes/:id/care-plan`
- `POST /api/hah/episodes/:id/observations`
- `PATCH /api/hah/alerts/:id/acknowledge`
- `PATCH /api/hah/alerts/:id/resolve`
- `POST /api/hah/episodes/:id/transfer`
- `POST /api/hah/episodes/:id/discharge`
- `GET /api/hah/episodes`
- `GET /api/hah/alerts/open`

## Safety invariants

- One patient cannot have two simultaneously active HaH episodes.
- Eligibility must be documented before admission.
- Consent and an emergency plan are required for admission.
- Every vital-sign set is complete; missing values are rejected.
- Scale 2 requires documented hypercapnic respiratory failure.
- Medium/high/critical deterioration persists as an alert with a response deadline.
- An episode cannot be discharged while clinical alerts remain unresolved.
- Clinical override requires a recorded reason.

## Suggested implementation sequence

1. Run `pnpm install`, `pnpm prisma generate`, and create a reviewed migration in a development database.
2. Run `pnpm --filter api test` and `pnpm build`.
3. Have clinicians validate test fixtures and threshold behavior.
4. Add row-level authorization and notification integration before staging with patient data.
5. Conduct tabletop simulations: deterioration, network outage, ambulance transfer, medication error, and downtime.


## Phase 2 operational UI

- Intake UI for patient identity and acute episode creation.
- Full episode workspace for eligibility, admission, care plan, observations, medication orders, MAR, visits, alerts, transfer, and discharge.
- Medication allergy and duplicate-order safeguards.
- Visit license and schedule-conflict checks.
- Medication and visit APIs with explicit state transitions.

These workflows still require hospital protocol validation, real notification delivery, pharmacy/laboratory/device integrations, and regulatory approval before patient use.

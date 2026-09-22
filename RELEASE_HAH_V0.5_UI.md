# Vita Care HaH v0.5 — UI/UX and navigation upgrade

## Upgrade approach

This release revises the existing project in place. Existing clinical, quality, booking, billing, referral, authentication, storage, and Hospital at Home modules are retained. No module or existing data flow was removed.

## Added and revised

- Professional public Hospital at Home landing page in Bahasa Indonesia.
- Complete 14-group public directory covering Beranda, Tentang Kami, Layanan, Tim Kesehatan, Pasien, Keluarga & Caregiver, Monitoring, Pemesanan, Farmasi, Pembayaran, Edukasi, Mitra, Informasi, and Kontak.
- Every public menu entry resolves through a content route; no menu item is rendered as an empty anchor.
- Persistent emergency action in public and authenticated mobile/desktop headers.
- Emergency dialog for medical team, hospital, ambulance, patient location, medical summary, and family contact.
- Role-aware navigation for patient, doctor, nurse, administrator/coordinator, and governance roles while preserving existing roles.
- Mobile bottom navigation, desktop sidebar, top navigation, breadcrumb, notification access, responsive cards, and status indicators.
- Patient/family clinical summary with current condition, next visit, latest vital signs, active medication count, laboratory result count, care plan, and emergency access.
- Clinical monitoring dashboard with time-series visualisation for blood pressure, heart rate, SpO2, temperature, respiratory rate, blood glucose, weight, and pain score.
- Trend labels: Meningkat, Stabil, and Menurun.
- EWS presentation mapped to NORMAL, WARNING, ATTENTION, and CRITICAL without producing an automatic diagnosis from one parameter.
- Expanded individual care plan fields for diagnosis, doctor intervention, nursing intervention, diet, activity, education, follow-up, and evaluation target.
- Glucose and weight observations added for the requested monitoring workflow.
- HealthWorker-to-visit relation and an episode access guard added so patients see only linked records and clinicians see episodes where they are attending or assigned.
- Existing end-to-end clinical workflow remains linked: registration, assessment, diagnosis, care plan, action, medication, laboratory, monitoring, evaluation, and discharge.

## Required configuration

Production preflight now also requires:

- `NEXT_PUBLIC_MEDICAL_TEAM_PHONE`
- `NEXT_PUBLIC_HOSPITAL_PHONE`
- `NEXT_PUBLIC_AMBULANCE_PHONE`

Use E.164 phone numbers from the accountable provider. The user interface does not fabricate emergency numbers.

## Validation completed

- Prettier successfully parsed and formatted the TypeScript, TSX, and CSS sources.
- Navigation inventory confirms all 14 requested public menu groups and destination routes.
- Role navigation inventory confirms admin, doctor, nurse, patient/family, and governance menus.
- Schema structural checks confirm the added care-plan, monitoring, and clinician-assignment relations.
- Clinical early-warning fixtures remain successful.
- No lorem ipsum, coming-soon page, default demo password, fabricated payment URL, or mock-mode marker was found.

## Remaining production evidence

As with v0.4 RC, a connected staging environment must still generate and review the Prisma migration and lockfile, run the full Nest/Next build, execute unit/integration/E2E tests, perform visual QA, test provider integrations, and complete security/clinical/regulatory sign-off. This source package must not be promoted with real patient data until those gates pass.

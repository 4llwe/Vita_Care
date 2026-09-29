# Hospital at Home release acceptance

This gate verifies the upgraded existing Vita Care project against the agreed Hospital at Home scope. It supplements—not replaces—clinical, security, migration, and end-to-end tests.

## Automated acceptance

Run:

```bash
pnpm verify:acceptance
```

The gate fails when:

- the 14 public navigation groups or 117 agreed submenu entries are incomplete;
- a role dashboard loses a required operational destination;
- a desktop or mobile navigation target has no application page;
- the emergency workflow loses medical team, hospital, ambulance, location, medical-summary, family-contact, or life-threatening-condition guidance;
- core Hospital at Home clinical models or API routes are removed.

The Production readiness workflow runs this gate for every push and pull request.

## Scope traceability

| Agreed capability | Evidence |
| --- | --- |
| Indonesian public navigation | `apps/web/lib/public-menu.ts` |
| Operational destination for every public item | `apps/web/lib/menu-operation.ts`, `/informasi/[section]/[slug]` |
| Role-based desktop navigation | `apps/web/components/sidebar.tsx` |
| Role-based mobile navigation | `apps/web/components/mobile-nav.tsx` |
| Persistent emergency access | `apps/web/components/emergency-button.tsx` |
| Patient/family, doctor, nurse, admin dashboards | `apps/web/components/dashboard/role-dashboard.tsx` |
| Vital-sign trends and EWS | `/monitoring`, `HaHObservation`, `ClinicalAlert` |
| Individual care plan and digital clinical pathway | `HaHCarePlan`, `/hah/[id]` |
| Clinical visits, diagnostics, pharmacy, rehabilitation, wound, nutrition, palliative, teleconsultation | `HaHEpisode` relations and `/hah/[id]` |
| Referral and hospital handoff | `HaHTransfer` |
| Safe discharge and follow-up | `HaHDischargeChecklist`, `HaHPostDischargeFollowUp` |
| Patient/caregiver communication | `HaHClinicalMessage`, acknowledgement receipts |
| Allergy and medication reconciliation | `HaHAllergy`, `HaHMedicationReconciliation` |
| Patient-safety incidents | `HaHSafetyIncident` |
| Privacy and access control | RBAC guards, caregiver consent scopes, break-glass audit |
| Responsive UI | desktop sidebar, mobile bottom navigation, responsive cards/tables |

## Operator sign-off still required

Before production promotion, an authorized operator must verify:

1. medical-team, hospital, ambulance, WhatsApp, email, and location details;
2. legal entity, licensing, accreditation, partner, insurance, and BPJS/JKN wording;
3. service catalogue, prices, coverage area, and operating hours;
4. production secrets, domains, backups, monitoring, and incident contacts;
5. clinical protocol thresholds and response SLAs approved by the responsible clinicians.

Do not represent unverified content as an approved legal, accreditation, partner, insurance, or clinical claim.
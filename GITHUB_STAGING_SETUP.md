# GitHub Actions staging setup

Target repository: `https://github.com/4llwe/Vita_Care`
Default branch observed: `vitacare-hah-v1.3`.

## Safe branch

Push this package to a new branch, recommended: `phase0/staging-evidence`.
Open a pull request into `vitacare-hah-v1.3`. Do not push directly to the default branch.

## Workflow

Run **Phase 0 staging evidence**. The first job needs no production secrets and proves:

- Node.js 20 and pnpm 9;
- package installation from the registry;
- Prisma generate and validate;
- squashed baseline preview generation and static review;
- ephemeral PostgreSQL schema creation;
- negative authorization tests;
- full API unit tests;
- lint and production build;
- Playwright E2E.

It does not apply the baseline preview to an existing database.

## Authoritative staging database

Create a protected GitHub Environment named `staging`, require a reviewer, and add:

- `STAGING_DATABASE_URL`
- optional `BOOKING_PATIENT_MAPPING_B64` for dry-run reconciliation

Never put these values in repository variables, workflow YAML, issues, PR comments, or chat.

The authoritative database job is read-only. Backfill apply remains a separate manual operation after backup, mapping review, and migration approval.

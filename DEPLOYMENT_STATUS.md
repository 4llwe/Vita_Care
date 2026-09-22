# Deployment status — Vita Care HaH v0.4 RC

## Implemented technical controls

- Production environment validation fails closed for missing/weak secrets, non-HTTPS origins, missing providers, and missing private object storage.
- JWT access validation reloads the current user, rejects deactivated accounts, and ignores the stale role embedded in a token.
- Production CORS is allowlisted; unknown request fields are rejected.
- HSTS, CSP, proxy handling, non-root containers, internal backend networking, Redis authentication, readiness checks, and no-new-privileges are configured.
- Local file delivery requires authentication; production refuses local file storage.
- Upload MIME type, folder, and 20 MB size limits are validated.
- Health workers can be linked to authenticated User records for assignment-based authorization work.
- Payment and notification integrations fail closed; no fabricated success response is produced.
- Production seed requires an explicit strong administrator credential and creates no demo clinicians.
- Production preflight refuses deployment without lockfile, reviewed Prisma migrations, required secrets, and production URLs.

## Blocking gates in this sandbox

This repository is a release candidate, not a verified production release, because the execution environment has no package-registry/network access and no external provider credentials. Therefore the following evidence could not be produced here:

1. `pnpm-lock.yaml` generated from a successful dependency resolution.
2. Prisma baseline migration generated and tested with the actual Prisma CLI.
3. Successful full TypeScript/Nest/Next production build.
4. Successful unit, integration, E2E, and visual browser QA against a running stack.
5. Migration dry-run on a staging clone and verified rollback/restore.
6. Live delivery receipts for WhatsApp/email, Midtrans, S3, SIMRS, laboratory, pharmacy, equipment, and ambulance integrations.
7. Clinical-governance and Indonesian regulatory sign-off.

`scripts/preflight-production.sh` intentionally blocks production deployment while these artifacts are missing. Do not bypass it.

## Required commands in a connected staging environment

```bash
pnpm install
sh scripts/create-baseline-migration.sh
# Review and commit pnpm-lock.yaml and migration.sql
cp .env.example .env
# Fill every production value through a secret manager
sh scripts/release-production.sh

# Apply migration to a disposable staging clone first
pnpm prisma migrate deploy
pnpm --filter e2e test
```

Promote to production only after the release report contains successful output from every command, security testing, clinical simulation, backup/restore, and signed operational approvals.

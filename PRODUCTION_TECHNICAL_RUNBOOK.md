# Production technical runbook

## Mandatory evidence
1. Frozen `pnpm-lock.yaml` and passing CI/security workflows.
2. Encrypted secrets from a secret manager; never commit `.env` or TLS keys.
3. TLS certificate mounted under `infra/tls` only at deployment time.
4. `docker compose config`, one-shot migration, readiness checks, and smoke tests pass.
5. Backup succeeds and restore drill is executed against an isolated database.
6. Alert on readiness failures, notification FAILED > 0, queue growth, HTTP 5xx, latency, CPU, memory, disk, and database saturation.
7. Roll back application image first; database rollback requires a reviewed forward-fix migration.

## Deployment
Run `scripts/verify-deployment.sh`, archive CI/SBOM/scan/build/migration/E2E evidence, then require engineering and clinical release approval.

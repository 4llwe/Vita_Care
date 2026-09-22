# Deploy now

1. Install Node 20, Corepack, Docker Engine, and Docker Compose.
2. Run `corepack prepare pnpm@9.0.0 --activate && pnpm install`; commit the generated `pnpm-lock.yaml`.
3. Run `make env`; edit `.env.production` until no `REPLACE_ME` remains; keep mode 600.
4. Mount valid TLS files at `infra/tls/fullchain.pem` and `infra/tls/privkey.pem`.
5. Run `pnpm prisma:generate && pnpm lint && pnpm test && pnpm build && pnpm --filter e2e test`.
6. Run `make predeploy`.
7. Set `BASE_URL=https://your-domain` and run `make deploy`.
8. Run `make backup`, then execute a restore drill against an isolated database.
9. Archive `release-evidence`, SBOM, security scan, E2E, and restore evidence.

Deployment intentionally stops when the lockfile, TLS, production secrets, migration hygiene, menu baseline, readiness, or smoke tests fail.

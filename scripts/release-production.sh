#!/usr/bin/env sh
set -eu
pnpm preflight:prod
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma validate
pnpm lint
pnpm --filter api test --runInBand
pnpm build
docker compose -f docker-compose.prod.yml --env-file .env config >/dev/null
docker compose -f docker-compose.prod.yml --env-file .env build --pull
printf '%s\n' 'Release artifact built. Run migration dry-run and staging smoke/E2E before promotion.'

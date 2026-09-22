#!/usr/bin/env sh
set -eu
mkdir -p release-evidence
pnpm prisma:generate 2>&1 | tee release-evidence/prisma-generate.log
pnpm prisma migrate deploy 2>&1 | tee release-evidence/migrate.log
pnpm lint 2>&1 | tee release-evidence/lint.log
pnpm test 2>&1 | tee release-evidence/test.log
pnpm build 2>&1 | tee release-evidence/build.log
pnpm --filter e2e test 2>&1 | tee release-evidence/e2e.log
sha256sum pnpm-lock.yaml > release-evidence/lockfile.sha256
echo "All automated release gates passed." | tee release-evidence/summary.txt

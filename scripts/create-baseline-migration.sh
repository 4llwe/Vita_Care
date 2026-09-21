#!/usr/bin/env sh
set -eu
[ -x ./node_modules/.bin/prisma ] || { echo 'Prisma CLI belum terpasang. Jalankan pnpm install.' >&2; exit 1; }
mkdir -p prisma/migrations/20260920_hah_baseline
./node_modules/.bin/prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/20260920_hah_baseline/migration.sql
[ -s prisma/migrations/20260920_hah_baseline/migration.sql ] || { echo 'Migration kosong.' >&2; exit 1; }
./node_modules/.bin/prisma validate
echo 'Baseline migration dibuat. Review SQL sebelum commit dan deployment.'

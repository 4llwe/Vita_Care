#!/usr/bin/env sh
set -eu
[ -x ./node_modules/.bin/prisma ] || { echo 'Prisma CLI belum terpasang. Jalankan pnpm install.' >&2; exit 1; }
mkdir -p release-evidence
out=release-evidence/baseline-current-preview.sql
./node_modules/.bin/prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > "$out"
[ -s "$out" ] || { echo 'Baseline preview kosong.' >&2; exit 1; }
./node_modules/.bin/prisma validate
python3 scripts/review-baseline.py --sql "$out"
committed=prisma/migrations/20260920_hah_baseline/migration.sql
[ -s "$committed" ] || { echo "Baseline committed tidak ditemukan: $committed" >&2; exit 1; }
cmp -s "$out" "$committed" || { echo "Baseline committed berbeda dari schema.prisma saat ini." >&2; exit 1; }
echo "Baseline preview identik dengan baseline committed: $committed"

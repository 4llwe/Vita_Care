#!/usr/bin/env sh
set -eu
fail(){ echo "PRE-FLIGHT GAGAL: $1" >&2; exit 1; }
[ -f .env ] || fail ".env tidak ditemukan"
[ -f pnpm-lock.yaml ] || fail "pnpm-lock.yaml belum dibuat"
[ -d prisma/migrations ] || fail "migration Prisma belum dibuat"
[ -s prisma/migrations/20260920_hah_baseline/migration.sql ] || fail "baseline migration lengkap belum dibuat/review"
python3 scripts/verify-migration-coverage.py || fail "coverage migration belum lengkap"
[ "$(find prisma/migrations -name migration.sql | wc -l | tr -d ' ')" -gt 0 ] || fail "migration.sql tidak ditemukan"
for key in DATABASE_URL JWT_ACCESS_SECRET JWT_REFRESH_SECRET ENCRYPTION_KEY WEB_ORIGIN API_URL S3_BUCKET S3_REGION S3_ACCESS_KEY S3_SECRET_KEY MIDTRANS_SERVER_KEY WHATSAPP_API_URL WHATSAPP_TOKEN WHATSAPP_EMERGENCY_TO EMAIL_API_URL EMAIL_API_TOKEN EMAIL_CLINICAL_TO POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB REDIS_PASSWORD NEXT_PUBLIC_MEDICAL_TEAM_PHONE NEXT_PUBLIC_HOSPITAL_PHONE NEXT_PUBLIC_AMBULANCE_PHONE; do
  grep -Eq "^${key}=.+" .env || fail "$key belum diisi"
done
grep -q '^NODE_ENV=production$' .env || fail "NODE_ENV harus production"
if grep -Eiq 'change_me|ChangeMe|example\.local|localhost' .env; then fail "secret atau URL development masih digunakan"; fi
echo "Konfigurasi preflight lulus. Lanjutkan build, test, migration dry-run, dan smoke test."

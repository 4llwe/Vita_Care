#!/usr/bin/env sh
set -eu
umask 077
out="${1:-.env.production}"
test ! -e "$out" || { echo "$out already exists"; exit 1; }
cp .env.production.example "$out"
rand(){ openssl rand -base64 48 | tr -d '\n'; }
replace(){ key="$1"; value="$2"; sed -i "s|^${key}=.*|${key}=${value}|" "$out"; }
replace JWT_ACCESS_SECRET "$(rand)"
replace JWT_REFRESH_SECRET "$(rand)"
replace ENCRYPTION_KEY "$(rand)"
replace BACKUP_ENCRYPTION_KEY "$(rand)"
replace POSTGRES_PASSWORD "$(rand)"
replace REDIS_PASSWORD "$(rand)"
replace GIT_SHA "$(git rev-parse --short=12 HEAD 2>/dev/null || echo manual)"
echo "Generated $out with mode 600. Complete every remaining REPLACE_ME before deployment."

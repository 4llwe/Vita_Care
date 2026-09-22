#!/usr/bin/env sh
set -eu
ENV_FILE="${ENV_FILE:-.env.production}"
fail(){ echo "PREDEPLOY FAIL: $*" >&2; exit 1; }
for cmd in docker openssl curl node;do command -v "$cmd" >/dev/null||fail "missing command: $cmd";done
test -f pnpm-lock.yaml||fail "pnpm-lock.yaml missing"
test -s "$ENV_FILE"||fail "$ENV_FILE missing"
test -s infra/tls/fullchain.pem||fail "TLS fullchain missing"
test -s infra/tls/privkey.pem||fail "TLS private key missing"
grep -Eq 'REPLACE_ME|change_me|please_use' "$ENV_FILE"&&fail "placeholder remains in $ENV_FILE"
mode=$(stat -c %a "$ENV_FILE" 2>/dev/null || stat -f %Lp "$ENV_FILE");[ "$mode" = 600 ]||fail "$ENV_FILE must have mode 600"
set -a;. "$ENV_FILE";set +a
[ "${NODE_ENV:-}" = production ]||fail "NODE_ENV must be production"
case "${WEB_ORIGIN:-}" in https://*) ;; *) fail "WEB_ORIGIN must use HTTPS";; esac
case "${API_URL:-}" in https://*) ;; *) fail "API_URL must use HTTPS";; esac
[ ${#JWT_ACCESS_SECRET} -ge 32 ]||fail "JWT_ACCESS_SECRET too short"
[ ${#JWT_REFRESH_SECRET} -ge 32 ]||fail "JWT_REFRESH_SECRET too short"
[ ${#ENCRYPTION_KEY} -ge 32 ]||fail "ENCRYPTION_KEY too short"
ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml config >/dev/null
node scripts/verify-menu-operations.mjs
sh scripts/check-migrations.sh
echo "Predeploy checks passed"

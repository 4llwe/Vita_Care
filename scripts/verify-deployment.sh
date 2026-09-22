#!/usr/bin/env sh
set -eu
for cmd in docker openssl curl;do command -v "$cmd" >/dev/null||{ echo "missing $cmd";exit 1;};done
test -f pnpm-lock.yaml;test -f infra/tls/fullchain.pem;test -f infra/tls/privkey.pem
docker compose -f docker-compose.prod.yml config >/dev/null
docker compose -f docker-compose.prod.yml up -d --build
trap 'docker compose -f docker-compose.prod.yml ps' EXIT
for i in $(seq 1 60);do curl -fsS https://localhost/api/health/ready --cacert infra/tls/fullchain.pem >/dev/null&&break;sleep 5;done
curl -fsS https://localhost/api/health/ready --cacert infra/tls/fullchain.pem
echo "Deployment verification passed"

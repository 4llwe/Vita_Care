#!/usr/bin/env sh
set -eu
ENV_FILE="${ENV_FILE:-.env.production}"
BASE_URL="${BASE_URL:?Set BASE_URL=https://your-domain}"
export ENV_FILE
sh scripts/predeploy-check.sh
mkdir -p release-evidence
date -u +%FT%TZ > release-evidence/deploy-started.txt
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml build --pull | tee release-evidence/container-build.log
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml run --rm migrate | tee release-evidence/migration.log
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --remove-orphans
if BASE_URL="$BASE_URL" sh scripts/smoke-production.sh | tee release-evidence/smoke.log;then
 docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml ps > release-evidence/compose-status.txt
 date -u +%FT%TZ > release-evidence/deploy-succeeded.txt
 echo "Deployment succeeded"
else
 docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml ps >&2
 docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml logs --tail=200 api web edge >&2
 echo "Deployment failed. Restore the previous immutable image tag; do not reverse a database migration without review." >&2
 exit 1
fi

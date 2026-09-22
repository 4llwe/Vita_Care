.PHONY: env predeploy build deploy smoke backup restore status logs
env:
	sh scripts/generate-production-env.sh
predeploy:
	ENV_FILE=.env.production sh scripts/predeploy-check.sh
build:
	docker compose --env-file .env.production -f docker-compose.prod.yml build --pull
deploy:
	ENV_FILE=.env.production BASE_URL=$$BASE_URL sh scripts/deploy-production.sh
smoke:
	BASE_URL=$$BASE_URL sh scripts/smoke-production.sh
backup:
	set -a; . ./.env.production; set +a; sh scripts/backup-postgres.sh
restore:
	set -a; . ./.env.production; set +a; sh scripts/restore-drill.sh
status:
	docker compose --env-file .env.production -f docker-compose.prod.yml ps
logs:
	docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=200 api web edge

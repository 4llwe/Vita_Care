# Vercel deployment — existing projects

Use the existing Vercel projects. Do not create a replacement application or database.

## 1. API project

Configure the existing `vita-care-api` project:

- Repository: `4llwe/Vita_Care`
- Production branch: `vitacare-hah-v1.3`
- Root directory: repository root (`.`)
- Framework preset: Other
- Install/build/function/cron configuration: committed `vercel.json`
- Health endpoint: `/api/health/ready`

The catch-all function `api/[...path].ts` reuses the existing NestJS bootstrap. Prisma migrations are intentionally not run during preview builds.

Use a pooled PostgreSQL production URL suitable for serverless connections and a TLS Redis URL. Existing data remains authoritative.

## 2. Web project

Configure the existing `vita-care-web` project:

- Repository and production branch: same as the API project
- Root directory: `apps/web`
- Framework preset: Next.js
- Include source files outside the root directory: enabled
- Install command: `cd ../.. && corepack enable && corepack prepare pnpm@9.0.0 --activate && pnpm install --frozen-lockfile`
- Build command: `cd ../.. && pnpm --filter web build`
- Output directory: `.next`
- `API_URL` and `NEXT_PUBLIC_API_URL`: the approved HTTPS API project URL

The API `WEB_ORIGIN` must contain the approved web production origin. Add preview origins only when they are explicitly trusted; never use a wildcard with credentialed CORS.

## 3. Serverless scheduled work

Vercel Cron invokes:

- `/api/cron/clinical-minute` once daily at `01:00 UTC` (`09:00 Asia/Makassar`) as a temporary Vercel Hobby fallback for notification delivery, overdue clinical-alert escalation, and medication reminders;
- `/api/cron/capa-daily` at `00:00 UTC` (`08:00 Asia/Makassar`) for CAPA reminders.

Set one independent random `CRON_SECRET` of at least 32 characters on the API project. Vercel sends it as a bearer token. Direct unauthenticated calls are rejected.

This Hobby schedule is **not real-time clinical monitoring** and must not be presented as satisfying a five-minute alert SLA. Staff must continue active/manual monitoring and use the emergency workflow for urgent conditions. When the Vercel project is upgraded to Pro, restore `/api/cron/clinical-minute` to `*/5 * * * *`, rerun the acceptance gate, and document the operational sign-off.

## 4. Required API environment

Set the production values represented in `.env.production.example`, including:

- pooled `DATABASE_URL`;
- TLS `REDIS_URL`;
- authentication, refresh-token pepper, encryption, backup, and cron secrets;
- S3-compatible private object storage;
- email, WhatsApp, Midtrans, maps, emergency, and official contact configuration;
- `WEB_ORIGIN`, `API_URL`, `APP_VERSION`, and `GIT_SHA`.

Apply the same secret value only where a service explicitly requires it. Authentication, encryption, cron, database, Redis, and backup secrets must remain independent.

## 5. Promotion order

1. Back up the production database and verify restore evidence.
2. Run `prisma migrate deploy` once against the approved production database from a controlled environment.
3. Deploy the API and verify `/api/health/ready`.
4. Deploy the web project and verify login, dashboard, emergency control, API connectivity, and role navigation.
5. Verify both cron executions, notification providers, uploads, and payment sandbox/production mode as applicable.
6. Record release evidence and operator/clinical sign-off.

Rollback application deployments through Vercel's immutable deployment history. Do not reverse an additive database migration without review.
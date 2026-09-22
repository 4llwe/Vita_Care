FROM node:20-alpine AS base
RUN corepack enable && apk add --no-cache dumb-init
WORKDIR /app
FROM base AS deps
COPY pnpm-lock.yaml* pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
RUN test -f pnpm-lock.yaml && pnpm install --frozen-lockfile
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter web build
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/apps/web/.next ./apps/web/.next
COPY --from=build --chown=app:app /app/apps/web/package.json ./apps/web/package.json
COPY --from=build --chown=app:app /app/node_modules ./node_modules
USER app
WORKDIR /app/apps/web
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD node -e "fetch(\"http://127.0.0.1:3000/login\").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["dumb-init", "--"]
CMD ["../../node_modules/.bin/next", "start", "-p", "3000"]

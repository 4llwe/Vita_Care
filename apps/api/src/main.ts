import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { validateEnvironment } from "./common/config/validate-env";
async function createApp() {
  validateEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableShutdownHooks();
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = String(req.headers["x-request-id"] ?? randomUUID());
    const started = Date.now();
    res.setHeader("X-Request-Id", requestId);
    res.setHeader("Cache-Control", "no-store");
    res.on("finish", () =>
      console.log(
        JSON.stringify({
          event: "http_request",
          requestId,
          method: req.method,
          status: res.statusCode,
          durationMs: Date.now() - started,
        }),
      ),
    );
    next();
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "same-site" },
      contentSecurityPolicy: true,
      hsts:
        process.env.NODE_ENV === "production"
          ? { maxAge: 31536000, includeSubDomains: true, preload: true }
          : false,
      referrerPolicy: { policy: "no-referrer" },
    }),
  );
  const origins = (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
    exposedHeaders: ["Content-Disposition", "X-Request-Id"],
    maxAge: 600,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      stopAtFirstError: false,
    }),
  );
  app.setGlobalPrefix("api");

  await app.init();
  return app;
}

let appPromise: ReturnType<typeof createApp> | undefined;

export default async function handler(req: Request, res: Response) {
  const app = await (appPromise ??= createApp());
  const server = app.getHttpAdapter().getInstance();
  return server(req, res);
}

if (!process.env.VERCEL) {
  void createApp()
    .then(async (app) => {
      const port = Number(
        process.env.PORT?.trim() || process.env.API_PORT?.trim() || "3001",
      );
      await app.listen(port);
      console.log(
        JSON.stringify({
          event: "service_ready",
          service: "vitacare-api",
          port,
        }),
      );
    })
    .catch((error) => {
      console.error(
        JSON.stringify({
          event: "bootstrap_failed",
          message: error instanceof Error ? error.message : "unknown",
        }),
      );
      process.exit(1);
    });
}

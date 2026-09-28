import { JwtService } from "@nestjs/jwt";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";

type AccessPayload = { sub: string; sid: string; role: string; typ: string };

const integrationEnabled = Boolean(process.env.AUTH_INTEGRATION_DATABASE_URL);
const describeIntegration = integrationEnabled ? describe : describe.skip;
process.env.JWT_ACCESS_SECRET = "test-access-secret-01234567890123456789";

describeIntegration("persistent refresh sessions against PostgreSQL", () => {
  const prisma = new PrismaClient();
  const jwt = new JwtService({ secret: "test-access-secret-01234567890123456789" });
  const service = new AuthService(prisma as any, jwt);
  let userId: string;
  let otherUserId: string;

  async function createUser(suffix: string) {
    return prisma.user.create({
      data: {
        email: `refresh-${suffix}-${Date.now()}@example.invalid`,
        name: `Refresh ${suffix}`,
        passwordHash: await argon2.hash("password-for-refresh-tests"),
        role: "PATIENT",
      },
    });
  }

  async function login() {
    const result = await service.login(
      `refresh-${userId}@example.invalid`,
      "password-for-refresh-tests",
      { ipAddress: "127.0.0.1", userAgent: "integration-test" },
    );
    return result as { accessToken: string; refreshToken: string };
  }

  beforeAll(async () => {
    await prisma.$connect();
    const user = await createUser("primary");
    const other = await createUser("other");
    userId = user.id;
    otherUserId = other.id;
    await prisma.user.update({ where: { id: userId }, data: { email: `refresh-${userId}@example.invalid` } });
    await prisma.user.update({ where: { id: otherUserId }, data: { email: `refresh-${otherUserId}@example.invalid` } });
  });

  afterAll(async () => {
    await prisma.authSecurityEvent.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await prisma.authSession.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    await prisma.$disconnect();
  });

  it("rotates atomically and never persists the raw refresh token", async () => {
    const first = await login();
    const rotated = await service.refresh(first.refreshToken);
    const tokens = await prisma.refreshToken.findMany({ where: { session: { userId } } });

    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    expect(tokens).toHaveLength(2);
    expect(tokens.every((token) => !JSON.stringify(token).includes(first.refreshToken))).toBe(true);
    expect(await prisma.authSecurityEvent.count({ where: { userId, eventType: "SESSION_REFRESHED" } })).toBeGreaterThan(0);
  });

  it("enforces idle and absolute expiry and blocks the bound access token", async () => {
    const first = await login();
    const payload = JSON.parse(Buffer.from(first.accessToken.split(".")[1], "base64url").toString()) as AccessPayload;
    const strategy = new JwtStrategy(prisma as any);

    await prisma.authSession.update({ where: { id: payload.sid }, data: { lastSeenAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });
    await expect(service.refresh(first.refreshToken)).rejects.toThrow("Sesi tidak valid");
    await expect(strategy.validate(payload)).rejects.toThrow("Sesi tidak aktif");

    const second = await login();
    const secondPayload = JSON.parse(Buffer.from(second.accessToken.split(".")[1], "base64url").toString()) as AccessPayload;
    await prisma.authSession.update({ where: { id: secondPayload.sid }, data: { expiresAt: new Date(Date.now() - 1_000) } });
    await expect(service.refresh(second.refreshToken)).rejects.toThrow("Sesi tidak valid");
    await expect(strategy.validate(secondPayload)).rejects.toThrow("Sesi tidak aktif");
  });

  it("allows exactly one concurrent refresh and revokes the family on reuse", async () => {
    const first = await login();
    const results = await Promise.allSettled([
      service.refresh(first.refreshToken),
      service.refresh(first.refreshToken),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

    const session = await prisma.authSession.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: "desc" } });
    expect(session.revokedReason).toBe("REFRESH_TOKEN_REUSE");
    expect(await prisma.authSecurityEvent.count({ where: { sessionId: session.id, eventType: "SESSION_REUSE_DETECTED" } })).toBe(1);
  });

  it("leaves no active replacement after refresh races with current logout", async () => {
    const first = await login();
    const results = await Promise.allSettled([
      service.refresh(first.refreshToken),
      service.logoutCurrent(first.refreshToken),
    ]);
    const session = await prisma.authSession.findFirstOrThrow({ where: { userId }, orderBy: { createdAt: "desc" } });
    expect(session.revokedAt).not.toBeNull();
    const successfulRefresh = results.find(
      (result) =>
        result.status === "fulfilled" &&
        !!result.value &&
        typeof result.value === "object" &&
        "refreshToken" in result.value,
    );
    if (
      successfulRefresh?.status === "fulfilled" &&
      !!successfulRefresh.value &&
      typeof successfulRefresh.value === "object" &&
      "refreshToken" in successfulRefresh.value
    ) {
      await expect(service.refresh(successfulRefresh.value.refreshToken)).rejects.toThrow("Sesi tidak valid");
    }
  });

  it("leaves no active replacement after logout-all races with refresh", async () => {
    const first = await login();
    const results = await Promise.allSettled([
      service.refresh(first.refreshToken),
      service.logoutAll(userId),
    ]);
    expect(results).toHaveLength(2);
    const sessions = await prisma.authSession.findMany({ where: { userId } });
    expect(sessions.every((session) => session.revokedAt)).toBe(true);
  });

  it("does not expose or revoke another user's sessions", async () => {
    await login();
    const otherService = service;
    const otherResult = await otherService.login(
      `refresh-${otherUserId}@example.invalid`,
      "password-for-refresh-tests",
    );
    const own = await service.listSessions(userId);
    const otherSessions = await otherService.listSessions(otherUserId);
    expect(own.every((session) => !otherSessions.some((otherSession) => otherSession.id === session.id))).toBe(true);
    await service.revokeSession(userId, otherSessions[0].id);
    expect(await otherService.listSessions(otherUserId)).toHaveLength(1);
    await service.logoutCurrent((otherResult as { refreshToken: string }).refreshToken);
  });

  it("refreshes two independent sessions concurrently", async () => {
    const first = await login();
    const second = await login();
    const results = await Promise.all([service.refresh(first.refreshToken), service.refresh(second.refreshToken)]);
    expect(results).toHaveLength(2);
    expect((await service.listSessions(userId)).length).toBeGreaterThanOrEqual(2);
  });
});

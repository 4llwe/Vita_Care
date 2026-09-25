import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import * as speakeasy from "speakeasy";
import { PrismaService } from "../../common/prisma/prisma.service";
import {
  createRefreshToken,
  hashRefreshPart,
  hashesMatch,
  parseRefreshToken,
} from "./auth-token";

const SESSION_IDLE_MS = 24 * 60 * 60 * 1000;
const SESSION_ABSOLUTE_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthRequestMetadata = {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
};

export type AuthTokens = { accessToken: string; refreshToken: string };
export type LoginResult =
  | { require2fa: true; tmpToken: string }
  | ({ require2fa: false } & AuthTokens);

function clean(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return normalized ? normalized.slice(0, max) : undefined;
}

function safeMetadata(metadata: AuthRequestMetadata) {
  return {
    ipAddress: clean(metadata.ipAddress, 64),
    userAgent: clean(metadata.userAgent, 512),
    deviceName: clean(metadata.deviceName, 80),
  };
}

function unauthorized(): UnauthorizedException {
  return new UnauthorizedException("Sesi tidak valid");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException("Email atau kata sandi salah");
    }
    if (!user.isActive) throw new UnauthorizedException("Akun nonaktif");
    return user;
  }

  async login(
    email: string,
    password: string,
    metadata: AuthRequestMetadata = {},
  ): Promise<LoginResult> {
    const user = await this.validateUser(email, password);
    if (user.twoFaSecret) {
      const tmpToken = await this.jwt.signAsync(
        { sub: user.id, twofa: true, typ: "mfa_pending" },
        { expiresIn: "5m" },
      );
      return { require2fa: true, tmpToken };
    }
    return { require2fa: false, ...(await this.createSession(user.id, user.role, metadata, "LOGIN_SUCCESS")) };
  }

  async verify2fa(
    tmpToken: string,
    otp: string,
    metadata: AuthRequestMetadata = {},
  ): Promise<AuthTokens> {
    let payload: { sub?: string; twofa?: boolean; typ?: string };
    try {
      payload = await this.jwt.verifyAsync(tmpToken);
    } catch {
      throw new UnauthorizedException("Sesi 2FA kedaluwarsa");
    }
    if (!payload.sub || payload.typ !== "mfa_pending" || !payload.twofa) {
      throw new UnauthorizedException("Sesi 2FA tidak valid");
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.isActive || !user.twoFaSecret) {
      throw new UnauthorizedException("Akun atau 2FA tidak aktif");
    }
    const ok = speakeasy.totp.verify({
      secret: user.twoFaSecret,
      encoding: "base32",
      token: otp,
      window: 1,
    });
    if (!ok) throw new UnauthorizedException("Kode 2FA tidak valid");
    return this.createSession(user.id, user.role, metadata, "MFA_SUCCESS");
  }

  async refresh(token: string, metadata: AuthRequestMetadata = {}): Promise<AuthTokens> {
    const parsed = parseRefreshToken(token);
    if (!parsed) throw unauthorized();
    const tokenIdHash = hashRefreshPart(parsed.tokenId);
    const secretHash = hashRefreshPart(parsed.secret);
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      let row = await tx.refreshToken.findUnique({
        where: { tokenIdHash },
        include: { session: { include: { user: { select: { id: true, role: true, isActive: true } } } } },
      });
      if (!row) return { kind: "failure" as const };

      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "AuthSession" WHERE "id" = ${row.sessionId} FOR UPDATE`);
      row = await tx.refreshToken.findUnique({
        where: { tokenIdHash },
        include: { session: { include: { user: { select: { id: true, role: true, isActive: true } } } } },
      });
      if (!row) return { kind: "failure" as const };

      const idleExpired = row.session.lastSeenAt.getTime() + SESSION_IDLE_MS <= now.getTime();
      if (!hashesMatch(row.secretHash, secretHash)) {
        await this.event(tx, "REFRESH_INVALID", null, null, metadata);
        return { kind: "failure" as const };
      }

      if (row.rotatedAt) {
        await this.revokeFamily(tx, row.sessionId, "REFRESH_TOKEN_REUSE", now);
        await this.event(tx, "SESSION_REUSE_DETECTED", row.session.user.id, row.sessionId, metadata);
        return { kind: "failure" as const };
      }

      if (
        row.revokedAt ||
        row.session.revokedAt ||
        row.expiresAt <= now ||
        row.session.expiresAt <= now ||
        idleExpired
      ) {
        await this.revokeFamily(tx, row.sessionId, "SESSION_EXPIRED", now);
        await this.event(tx, "SESSION_EXPIRED", row.session.user.id, row.sessionId, metadata);
        return { kind: "failure" as const };
      }

      if (!row.session.user.isActive) {
        await this.revokeFamily(tx, row.sessionId, "ACCOUNT_INACTIVE", now);
        await this.event(tx, "ACCOUNT_INACTIVE_SESSION_REJECTED", row.session.user.id, row.sessionId, metadata);
        return { kind: "failure" as const };
      }

      const next = createRefreshToken();
      const nextToken = await tx.refreshToken.create({
        data: {
          sessionId: row.sessionId,
          tokenIdHash: next.tokenIdHash,
          secretHash: next.secretHash,
          expiresAt: row.session.expiresAt,
        },
      });
      await tx.refreshToken.update({
        where: { id: row.id },
        data: { rotatedAt: now, lastUsedAt: now, replacedById: nextToken.id },
      });
      await tx.authSession.update({ where: { id: row.sessionId }, data: { lastSeenAt: now } });
      await this.event(tx, "SESSION_REFRESHED", row.session.user.id, row.sessionId, metadata);
      return {
        kind: "success" as const,
        userId: row.session.user.id,
        role: row.session.user.role,
        sessionId: row.sessionId,
        refreshToken: next.value,
      };
    });

    if (result.kind !== "success") throw unauthorized();
    return {
      accessToken: await this.issueAccessToken(result.userId, result.role, result.sessionId),
      refreshToken: result.refreshToken,
    };
  }

  async logoutCurrent(token: string | undefined, metadata: AuthRequestMetadata = {}) {
    const parsed = token ? parseRefreshToken(token) : null;
    if (!parsed) return;
    const tokenIdHash = hashRefreshPart(parsed.tokenId);
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.refreshToken.findUnique({
        where: { tokenIdHash },
        select: { sessionId: true },
      });
      if (!row) return;
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "AuthSession" WHERE "id" = ${row.sessionId} FOR UPDATE`);
      const session = await tx.authSession.findUnique({ where: { id: row.sessionId } });
      if (!session || session.revokedAt) return;
      const now = new Date();
      await this.revokeFamily(tx, session.id, "LOGOUT", now);
      await this.event(tx, "SESSION_LOGOUT", session.userId, session.id, metadata);
    });
  }

  async logoutAll(userId: string, metadata: AuthRequestMetadata = {}) {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now, revokedReason: "LOGOUT_ALL" },
      });
      await tx.refreshToken.updateMany({
        where: { session: { userId }, revokedAt: null },
        data: { revokedAt: now, revokeReason: "LOGOUT_ALL" },
      });
      await this.event(tx, "SESSION_LOGOUT_ALL", userId, null, metadata);
    });
  }

  listSessions(userId: string) {
    const now = new Date();
    return this.prisma.authSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
        lastSeenAt: { gt: new Date(now.getTime() - SESSION_IDLE_MS) },
      },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true, deviceName: true, userAgent: true, createdAt: true, lastSeenAt: true, expiresAt: true },
    });
  }

  async revokeSession(userId: string, sessionId: string, metadata: AuthRequestMetadata = {}) {
    await this.prisma.$transaction(async (tx) => {
      const session = await tx.authSession.findFirst({
        where: { id: sessionId, userId },
        select: { id: true, userId: true, revokedAt: true },
      });
      if (!session || session.revokedAt) return;
      await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "AuthSession" WHERE "id" = ${session.id} FOR UPDATE`);
      const now = new Date();
      await this.revokeFamily(tx, session.id, "TARGETED_LOGOUT", now);
      await this.event(tx, "SESSION_TARGETED_LOGOUT", userId, session.id, metadata);
    });
  }

  async me(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        healthWorkerProfile: { select: { id: true, profession: true, name: true } },
      },
    });
  }

  private async createSession(
    userId: string,
    role: string,
    metadata: AuthRequestMetadata,
    successEvent: "LOGIN_SUCCESS" | "MFA_SUCCESS",
  ): Promise<AuthTokens> {
    const safe = safeMetadata(metadata);
    const material = createRefreshToken();
    const now = new Date();
    const session = await this.prisma.$transaction(async (tx) => {
      const created = await tx.authSession.create({
        data: {
          userId,
          deviceName: safe.deviceName,
          userAgent: safe.userAgent,
          ipAddress: safe.ipAddress,
          expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
          refreshTokens: {
            create: {
              tokenIdHash: material.tokenIdHash,
              secretHash: material.secretHash,
              expiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_MS),
            },
          },
        },
      });
      await this.event(tx, "SESSION_CREATED", userId, created.id, safe);
      await this.event(tx, successEvent, userId, created.id, safe);
      return created;
    });
    return {
      accessToken: await this.issueAccessToken(userId, role, session.id),
      refreshToken: material.value,
    };
  }

  private issueAccessToken(sub: string, role: string, sid: string) {
    return this.jwt.signAsync(
      { sub, role, sid, typ: "access" },
      { expiresIn: process.env.JWT_ACCESS_TTL ?? "15m" },
    );
  }

  private revokeFamily(tx: Prisma.TransactionClient, sessionId: string, reason: string, now: Date) {
    return Promise.all([
      tx.authSession.update({ where: { id: sessionId }, data: { revokedAt: now, revokedReason: reason } }),
      tx.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now, revokeReason: reason },
      }),
    ]);
  }

  private event(
    tx: Prisma.TransactionClient,
    eventType: string,
    userId: string | null,
    sessionId: string | null,
    metadata: AuthRequestMetadata,
  ) {
    const safe = safeMetadata(metadata);
    return tx.authSecurityEvent.create({
      data: {
        eventType,
        userId,
        sessionId,
        ipAddress: safe.ipAddress,
        userAgent: safe.userAgent,
        metadata: {},
      },
    });
  }
}

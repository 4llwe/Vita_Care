import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { Role } from "@prisma/client";
import type { Request } from "express";
import { PrismaService } from "../../../common/prisma/prisma.service";

const SESSION_IDLE_MS = 24 * 60 * 60 * 1000;
function effectiveRoles(primaryRole: Role, assignments: Array<{ role: Role }>): Role[] {
  return [...new Set([primaryRole, ...assignments.map(({ role }) => role)])];
}

function cookie(req: Request) {
  for (const item of (req?.headers?.cookie ?? "").split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === "vc_access") return decodeURIComponent(value.join("="));
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(), cookie]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    });
  }

  async validate(payload: { sub?: string; sid?: string; typ?: string }) {
    if (!payload.sub || !payload.sid || (payload.typ && payload.typ !== "access")) {
      throw new UnauthorizedException("Token tidak valid untuk akses API");
    }
    const now = new Date();
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        roleAssignments: { select: { role: true } },
        isActive: true,
        authSessions: {
          where: {
            id: payload.sid,
            revokedAt: null,
            expiresAt: { gt: now },
            lastSeenAt: { gt: new Date(now.getTime() - SESSION_IDLE_MS) },
          },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!user?.isActive || user.authSessions.length !== 1) {
      throw new UnauthorizedException("Sesi tidak aktif");
    }
    return {
      id: user.id, role: user.role,
      roles: effectiveRoles(user.role, user.roleAssignments),
      sessionId: payload.sid,
    };
  }
}

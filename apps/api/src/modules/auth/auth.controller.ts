import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { AuthService, AuthRequestMetadata, AuthTokens } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { Verify2faDto } from "./dto/verify-2fa.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

const ACCESS = "vc_access";
const REFRESH = "vc_refresh";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

function cookie(req: Request, name: string): string | undefined {
  for (const item of (req.headers.cookie ?? "").split(";")) {
    const [key, ...value] = item.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return undefined;
}

function metadata(req: Request): AuthRequestMetadata {
  return { ipAddress: req.ip, userAgent: req.get("user-agent") };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private set(res: Response, tokens: AuthTokens) {
    res.cookie(ACCESS, tokens.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH, tokens.refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });
  }

  private clear(res: Response) {
    res.clearCookie(ACCESS, COOKIE_OPTIONS);
    res.clearCookie(REFRESH, COOKIE_OPTIONS);
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto.email, dto.password, metadata(req));
    if (result.require2fa) return result;
    this.set(res, result);
    return { authenticated: true, accessToken: result.accessToken };
  }

  @Post("2fa")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async twofa(@Body() dto: Verify2faDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.auth.verify2fa(dto.tmpToken, dto.otp, metadata(req));
    this.set(res, tokens);
    return { authenticated: true, accessToken: tokens.accessToken };
  }

  @Post("refresh")
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = cookie(req, REFRESH);
    if (!token) throw new UnauthorizedException("Sesi tidak valid");
    const tokens = await this.auth.refresh(token, metadata(req));
    this.set(res, tokens);
    return { authenticated: true };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      await this.auth.logoutCurrent(cookie(req, REFRESH), metadata(req));
    } finally {
      this.clear(res);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout-all")
  @HttpCode(204)
  async logoutAll(@CurrentUser() user: { id: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      await this.auth.logoutAll(user.id, metadata(req));
    } finally {
      this.clear(res);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  sessions(@CurrentUser() user: { id: string }) {
    return this.auth.listSessions(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("sessions/:id")
  @HttpCode(204)
  async revokeSession(@CurrentUser() user: { id: string }, @Param("id") id: string, @Req() req: Request) {
    await this.auth.revokeSession(user.id, id, metadata(req));
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return this.auth.me(user.id);
  }
}

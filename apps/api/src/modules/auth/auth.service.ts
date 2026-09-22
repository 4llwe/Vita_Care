import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import * as speakeasy from "speakeasy";
import { PrismaService } from "../../common/prisma/prisma.service";

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

  /** Langkah 1: login. Jika 2FA aktif, kembalikan tmpToken; jika tidak, langsung token penuh. */
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (user.twoFaSecret) {
      const tmpToken = await this.jwt.signAsync(
        { sub: user.id, twofa: true },
        { expiresIn: "5m" },
      );
      return { require2fa: true, tmpToken };
    }
    return this.issueTokens(user.id, user.role);
  }

  /** Langkah 2: verifikasi OTP TOTP lalu keluarkan token penuh. */
  async verify2fa(tmpToken: string, otp: string) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(tmpToken);
    } catch {
      throw new UnauthorizedException("Sesi 2FA kedaluwarsa");
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: payload.sub },
    });
    const ok = speakeasy.totp.verify({
      secret: user.twoFaSecret!,
      encoding: "base32",
      token: otp,
      window: 1,
    });
    if (!ok) throw new UnauthorizedException("Kode 2FA tidak valid");
    return this.issueTokens(user.id, user.role);
  }

  /** Identitas pengguna saat ini (untuk header & dashboard per-peran). */
  async me(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        healthWorkerProfile: {
          select: { id: true, profession: true, name: true },
        },
      },
    });
    return user;
  }

  private async issueTokens(sub: string, role: string) {
    const accessToken = await this.jwt.signAsync({ sub, role });
    const refreshToken = await this.jwt.signAsync(
      { sub, role, typ: "refresh" },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_TTL ?? "7d",
      },
    );
    return { accessToken, refreshToken };
  }
}

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import * as speakeasy from "speakeasy";
import { PrismaService } from "../../common/prisma/prisma.service";
export type AuthTokens = { accessToken: string; refreshToken: string };
export type LoginResult = { require2fa: true; tmpToken: string } | ({ require2fa: false } & AuthTokens);
@Injectable()
export class AuthService {
 constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
 async validateUser(email:string,password:string){const user=await this.prisma.user.findUnique({where:{email}});if(!user||!(await argon2.verify(user.passwordHash,password)))throw new UnauthorizedException("Email atau kata sandi salah");if(!user.isActive)throw new UnauthorizedException("Akun nonaktif");return user;}
 async login(email:string,password:string):Promise<LoginResult>{const user=await this.validateUser(email,password);if(user.twoFaSecret){const tmpToken=await this.jwt.signAsync({sub:user.id,twofa:true,typ:"mfa_pending"},{expiresIn:"5m"});return{require2fa:true,tmpToken};}return{require2fa:false,...(await this.issueTokens(user.id,user.role))};}
 async verify2fa(tmpToken:string,otp:string):Promise<AuthTokens>{let payload:{sub?:string;twofa?:boolean;typ?:string};try{payload=await this.jwt.verifyAsync(tmpToken);}catch{throw new UnauthorizedException("Sesi 2FA kedaluwarsa");}if(!payload.sub||payload.typ!=="mfa_pending"||!payload.twofa)throw new UnauthorizedException("Sesi 2FA tidak valid");const user=await this.prisma.user.findUnique({where:{id:payload.sub}});if(!user?.isActive||!user.twoFaSecret)throw new UnauthorizedException("Akun atau 2FA tidak aktif");const ok=speakeasy.totp.verify({secret:user.twoFaSecret,encoding:"base32",token:otp,window:1});if(!ok)throw new UnauthorizedException("Kode 2FA tidak valid");return this.issueTokens(user.id,user.role);}
 async refresh(token:string):Promise<AuthTokens>{let payload:{sub?:string;typ?:string};try{payload=await this.jwt.verifyAsync(token,{secret:process.env.JWT_REFRESH_SECRET});}catch{throw new UnauthorizedException("Sesi telah berakhir");}if(!payload.sub||payload.typ!=="refresh")throw new UnauthorizedException("Refresh token tidak valid");const user=await this.prisma.user.findUnique({where:{id:payload.sub},select:{id:true,role:true,isActive:true}});if(!user?.isActive)throw new UnauthorizedException("Akun tidak aktif");return this.issueTokens(user.id,user.role);}
 async me(id:string){return this.prisma.user.findUniqueOrThrow({where:{id},select:{id:true,name:true,email:true,role:true,healthWorkerProfile:{select:{id:true,profession:true,name:true}}}});}
 private async issueTokens(sub:string,role:string):Promise<AuthTokens>{return{accessToken:await this.jwt.signAsync({sub,role,typ:"access"}),refreshToken:await this.jwt.signAsync({sub,typ:"refresh"},{secret:process.env.JWT_REFRESH_SECRET,expiresIn:process.env.JWT_REFRESH_TTL??"7d"})};}
}

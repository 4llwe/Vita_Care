import { Injectable,UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt,Strategy } from "passport-jwt";
import type { Request } from "express";
import { PrismaService } from "../../../common/prisma/prisma.service";
function cookie(req:Request){for(const item of (req?.headers?.cookie??"").split(";")){const[k,...v]=item.trim().split("=");if(k==="vc_access")return decodeURIComponent(v.join("="));}return null;}
@Injectable() export class JwtStrategy extends PassportStrategy(Strategy){constructor(private readonly prisma:PrismaService){super({jwtFromRequest:ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken(),cookie]),ignoreExpiration:false,secretOrKey:process.env.JWT_ACCESS_SECRET as string});}async validate(p:{sub?:string;typ?:string}){if(!p.sub||(p.typ&&p.typ!=="access"))throw new UnauthorizedException("Token tidak valid untuk akses API");const u=await this.prisma.user.findUnique({where:{id:p.sub},select:{id:true,role:true,isActive:true}});if(!u?.isActive)throw new UnauthorizedException("Akun tidak aktif");return{id:u.id,role:u.role};}}

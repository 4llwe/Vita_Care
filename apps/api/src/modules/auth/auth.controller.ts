import { Body,Controller,Get,Post,HttpCode,Req,Res,UnauthorizedException,UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request,Response } from "express";
import { AuthService,AuthTokens } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { Verify2faDto } from "./dto/verify-2fa.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
const ACCESS="vc_access",REFRESH="vc_refresh";
function cookie(req:Request,name:string){for(const item of (req.headers.cookie??"").split(";")){const[k,...v]=item.trim().split("=");if(k===name)return decodeURIComponent(v.join("="));}return undefined;}
@Controller("auth") export class AuthController{
 constructor(private readonly auth:AuthService){}
 private set(res:Response,t:AuthTokens){const o={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/"};res.cookie(ACCESS,t.accessToken,{...o,maxAge:15*60*1000});res.cookie(REFRESH,t.refreshToken,{...o,maxAge:7*24*60*60*1000});}
 @Post("login") @HttpCode(200) @Throttle({default:{ttl:60000,limit:5}}) async login(@Body()d:LoginDto,@Res({passthrough:true})r:Response){const x=await this.auth.login(d.email,d.password);if(x.require2fa)return x;this.set(r,x);return{authenticated:true,accessToken:x.accessToken};}
 @Post("2fa") @HttpCode(200) @Throttle({default:{ttl:60000,limit:5}}) async twofa(@Body()d:Verify2faDto,@Res({passthrough:true})r:Response){const x=await this.auth.verify2fa(d.tmpToken,d.otp);this.set(r,x);return{authenticated:true,accessToken:x.accessToken};}
 @Post("refresh") @HttpCode(200) async refresh(@Req()q:Request,@Res({passthrough:true})r:Response){const t=cookie(q,REFRESH);if(!t)throw new UnauthorizedException("Refresh token tidak tersedia");this.set(r,await this.auth.refresh(t));return{authenticated:true};}
 @Post("logout") @HttpCode(204) logout(@Res({passthrough:true})r:Response){const o={httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict" as const,path:"/"};r.clearCookie(ACCESS,o);r.clearCookie(REFRESH,o);}
 @Get("me") @UseGuards(JwtAuthGuard) me(@CurrentUser()u:{id:string}){return this.auth.me(u.id);}
}

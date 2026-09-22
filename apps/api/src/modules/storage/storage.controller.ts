import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { StorageService } from "./storage.service";
import { PresignDto } from "./dto/presign.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("storage")
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  /** Minta tiket unggah (presigned S3 atau endpoint lokal). Wajib login. */
  @Post("presign")
  @UseGuards(JwtAuthGuard)
  presign(@Body() dto: PresignDto) {
    return this.storage.createUploadTicket(
      dto.folder ?? "documents",
      dto.filename,
      dto.contentType,
    );
  }

  /** Endpoint unggah lokal (mode dev). Diamankan dengan token HMAC dari presign. */
  @Put("local")
  async uploadLocal(
    @Query("key") key: string,
    @Query("token") token: string,
    @Req() req: Request,
  ) {
    if (!key || !token || !this.storage.verifyLocalToken(key, token)) {
      throw new UnauthorizedException("Token unggah tidak valid");
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    if (chunks.length === 0) throw new BadRequestException("Body kosong");
    await this.storage.saveLocal(key, Buffer.concat(chunks));
    return { ok: true, key };
  }

  /** Sajikan berkas lokal (mode dev). */
  @Get("files/*")
  @UseGuards(JwtAuthGuard)
  async serveLocal(
    @Param() params: Record<string, string>,
    @Res() res: Response,
  ) {
    const key = params["0"];
    try {
      const data = await this.storage.readLocal(key);
      res.send(data);
    } catch {
      res.status(404).json({ message: "Berkas tidak ditemukan" });
    }
  }
}

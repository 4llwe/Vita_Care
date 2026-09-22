import { Injectable } from "@nestjs/common";
import { createHmac, randomUUID } from "crypto";
import { promises as fs } from "fs";
import { join, normalize } from "path";
import {
  loadS3Config,
  presignS3,
  publicS3Url,
  S3Config,
} from "../../common/storage/sigv4";

export type UploadTicket = {
  key: string;
  uploadUrl: string;
  method: "PUT";
  fileUrl: string;
  headers: Record<string, string>;
  storage: "s3" | "local";
};

@Injectable()
export class StorageService {
  private readonly s3: S3Config | null = loadS3Config();
  private readonly apiUrl = process.env.API_URL ?? "http://localhost:3001";
  private readonly localDir =
    process.env.STORAGE_DIR ?? join(process.cwd(), "storage");

  isS3Enabled(): boolean {
    return this.s3 !== null;
  }

  /** Bentuk key objek yang aman & unik. */
  buildKey(folder: string, filename: string): string {
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const cleanFolder =
      folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "") ||
      "misc";
    return `${cleanFolder}/${randomUUID()}-${safe}`;
  }

  /** HMAC token untuk endpoint unggah lokal (mode dev tanpa S3). */
  private localToken(key: string): string {
    const secret =
      process.env.ENCRYPTION_KEY ??
      process.env.JWT_ACCESS_SECRET ??
      "dev_secret";
    return createHmac("sha256", secret).update(key).digest("hex").slice(0, 32);
  }
  verifyLocalToken(key: string, token: string): boolean {
    return this.localToken(key) === token;
  }

  /** Buat tiket unggah: presigned S3 bila dikonfigurasi, jika tidak fallback ke endpoint lokal. */
  createUploadTicket(
    folder: string,
    filename: string,
    contentType: string,
  ): UploadTicket {
    if (process.env.NODE_ENV === "production" && !this.s3)
      throw new Error("S3 wajib dikonfigurasi pada produksi");
    const key = this.buildKey(folder, filename);
    const headers = {
      "Content-Type": contentType || "application/octet-stream",
    };
    if (this.s3) {
      return {
        key,
        uploadUrl: presignS3(this.s3, { method: "PUT", key, expiresSec: 900 }),
        method: "PUT",
        fileUrl: publicS3Url(this.s3, key),
        headers,
        storage: "s3",
      };
    }
    const token = this.localToken(key);
    return {
      key,
      uploadUrl: `${this.apiUrl}/api/storage/local?key=${encodeURIComponent(key)}&token=${token}`,
      method: "PUT",
      fileUrl: `${this.apiUrl}/api/storage/files/${key}`,
      headers,
      storage: "local",
    };
  }

  /** Presigned GET (S3) untuk berkas privat; untuk lokal kembalikan URL apa adanya. */
  getDownloadUrl(fileUrl: string): string {
    if (this.s3 && fileUrl.startsWith(this.s3.endpoint)) {
      const prefix = `${this.s3.endpoint.replace(/\/$/, "")}/${this.s3.bucket}/`;
      if (fileUrl.startsWith(prefix)) {
        const key = decodeURIComponent(
          fileUrl.slice(prefix.length).split("?")[0],
        );
        return presignS3(this.s3, { method: "GET", key, expiresSec: 900 });
      }
    }
    return fileUrl;
  }

  private resolveLocalPath(key: string): string {
    const target = normalize(join(this.localDir, key));
    if (!target.startsWith(normalize(this.localDir))) {
      throw new Error("Path traversal terdeteksi");
    }
    return target;
  }

  async saveLocal(key: string, data: Buffer): Promise<void> {
    const target = this.resolveLocalPath(key);
    await fs.mkdir(join(target, ".."), { recursive: true });
    await fs.writeFile(target, data);
  }

  async readLocal(key: string): Promise<Buffer> {
    return fs.readFile(this.resolveLocalPath(key));
  }
}

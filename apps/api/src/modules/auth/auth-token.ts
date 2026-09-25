import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const MAX_TOKEN_LENGTH = 512;

export type RefreshTokenMaterial = {
  value: string;
  tokenIdHash: string;
  secretHash: string;
};

function pepper(): string {
  const value = process.env.REFRESH_TOKEN_PEPPER?.trim();
  if (!value) throw new Error("REFRESH_TOKEN_PEPPER belum dikonfigurasi");
  return value;
}

export function hashRefreshPart(value: string): string {
  return createHmac("sha256", pepper()).update(value, "utf8").digest("hex");
}

export function createRefreshToken(): RefreshTokenMaterial {
  const tokenId = randomBytes(24).toString("base64url");
  const secret = randomBytes(32).toString("base64url");
  return {
    value: `${tokenId}.${secret}`,
    tokenIdHash: hashRefreshPart(tokenId),
    secretHash: hashRefreshPart(secret),
  };
}

export function parseRefreshToken(value: string): { tokenId: string; secret: string } | null {
  if (!value || value.length > MAX_TOKEN_LENGTH) return null;
  const parts = value.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { tokenId: parts[0], secret: parts[1] };
}

export function hashesMatch(expected: string, actual: string): boolean {
  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

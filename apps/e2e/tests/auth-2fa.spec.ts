import { expect, request as playwrightRequest, test } from "@playwright/test";
import { createHmac } from "node:crypto";
import { API_URL } from "./helpers";
import { testTotpSecret } from "../global-setup";

function currentTotp(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = secret
    .split("")
    .map((character) => alphabet.indexOf(character))
    .flatMap((value) => Array.from({ length: 5 }, (_, index) => (value >> (4 - index)) & 1));
  const key = Buffer.alloc(Math.floor(bits.length / 8));
  for (let index = 0; index < key.length; index += 1) {
    key[index] = bits.slice(index * 8, index * 8 + 8).reduce((value, bit) => (value << 1) | bit, 0);
  }
  const counter = Math.floor(Date.now() / 1000 / 30);
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(message).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code = ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

test("2FA creates one persistent session only after valid OTP", async () => {
  const email = process.env.E2E_2FA_EMAIL ?? "ci-2fa@vitacare.invalid";
  const password = process.env.E2E_2FA_PASSWORD ?? process.env.E2E_ADMIN_PASSWORD ?? "";
  const request = await playwrightRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { "x-forwarded-for": "127.0.0.2" },
  });

  const passwordLogin = await request.post("/api/auth/login", { data: { email, password } });
  expect(passwordLogin.ok()).toBeTruthy();
  const pending = (await passwordLogin.json()) as { require2fa?: boolean; tmpToken?: string };
  expect(pending.require2fa).toBe(true);
  expect(pending.tmpToken).toBeTruthy();

  const invalidOtp = await request.post("/api/auth/2fa", {
    data: { tmpToken: pending.tmpToken, otp: "000000" },
  });
  expect(invalidOtp.status()).toBe(401);

  const secondPasswordLogin = await request.post("/api/auth/login", { data: { email, password } });
  const secondPending = (await secondPasswordLogin.json()) as { tmpToken: string };
  const validOtp = currentTotp(testTotpSecret);
  const verified = await request.post("/api/auth/2fa", {
    data: { tmpToken: secondPending.tmpToken, otp: validOtp },
  });
  expect(verified.ok()).toBeTruthy();
  const accessToken = ((await verified.json()) as { accessToken: string }).accessToken;

  const sessions = await request.get("/api/auth/sessions", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(sessions.ok()).toBeTruthy();
  expect((await sessions.json()) as unknown[]).toHaveLength(1);

  const refresh = await request.post("/api/auth/refresh");
  expect(refresh.status()).toBe(200);
  const logout = await request.post("/api/auth/logout");
  expect(logout.status()).toBe(204);
  expect((await request.post("/api/auth/refresh")).status()).toBe(401);
  await request.dispose();
});

import { APIRequestContext, expect, Page } from "@playwright/test";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001";
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
if (!ADMIN_EMAIL || !ADMIN_PASSWORD)
  throw new Error("E2E_ADMIN_EMAIL dan E2E_ADMIN_PASSWORD wajib diisi");

/** Login via API dan kembalikan access token. Mendukung akun tanpa 2FA. */
export async function loginApi(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API_URL}/api/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(res.ok(), `Login gagal: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  const token = body.accessToken ?? body.access_token ?? body.token;
  expect(token, "Token tidak ditemukan pada respons login").toBeTruthy();
  return token as string;
}

/** Suntikkan token ke localStorage agar UI dianggap sudah login. */
export async function seedAuth(page: Page, token: string): Promise<void> {
  await page.addInitScript((t) => {
    window.localStorage.setItem("vitacare.token", t as string);
  }, token);
}

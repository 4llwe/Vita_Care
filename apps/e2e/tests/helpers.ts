import { APIRequestContext, expect, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { authStatePath } from "../global-setup";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:3001";
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
export const AUTH_EMAIL = process.env.E2E_AUTH_EMAIL ?? "ci-auth-isolated@vitacare.invalid";
export const AUTH_PASSWORD = process.env.E2E_AUTH_PASSWORD ?? ADMIN_PASSWORD;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD)
  throw new Error("E2E_ADMIN_EMAIL dan E2E_ADMIN_PASSWORD wajib diisi");

type LoginOptions = { fresh?: boolean; isolated?: boolean };
type CachedAuth = { token: string; cookies: Awaited<ReturnType<APIRequestContext["storageState"]>>["cookies"] };

let cachedAuth: CachedAuth | null = null;

function globalAuthState(): CachedAuth | null {
  try {
    const state = JSON.parse(readFileSync(authStatePath, "utf8")) as Awaited<ReturnType<APIRequestContext["storageState"]>>;
    const accessCookie = state.cookies.find((cookie) => cookie.name === "vc_access");
    return accessCookie ? { token: accessCookie.value, cookies: state.cookies } : null;
  } catch {
    return null;
  }
}

/** Login via the real API/session flow and reuse the worker's authenticated state when safe. */
export async function loginApi(request: APIRequestContext, options: LoginOptions = {}): Promise<string> {
  if (!options.isolated && !options.fresh && cachedAuth) return cachedAuth.token;
  if (!options.isolated && !options.fresh) {
    const globalAuth = globalAuthState();
    if (globalAuth) {
      cachedAuth = globalAuth;
      return globalAuth.token;
    }
    const state = await request.storageState();
    const accessCookie = state.cookies.find((cookie) => cookie.name === "vc_access");
    if (accessCookie) {
      cachedAuth = { token: accessCookie.value, cookies: state.cookies };
      return accessCookie.value;
    }
  }
  const res = await request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: options.isolated ? AUTH_EMAIL : ADMIN_EMAIL,
      password: options.isolated ? AUTH_PASSWORD : ADMIN_PASSWORD,
    },
  });
  expect(res.ok(), `Login gagal: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  const token = body.accessToken ?? body.access_token ?? body.token;
  expect(token, "Token tidak ditemukan pada respons login").toBeTruthy();
  if (!options.isolated) {
    cachedAuth = { token: token as string, cookies: (await request.storageState()).cookies };
  }
  return token as string;
}

/** Authenticate a browser context with cookies produced by the real login flow. */
export async function authenticatePage(page: Page, request: APIRequestContext, options: LoginOptions = {}): Promise<string> {
  const token = await loginApi(request, options);
  expect(cachedAuth).not.toBeNull();
  await page.context().addCookies(cachedAuth!.cookies);
  await page.addInitScript((accessToken) => {
    window.localStorage.setItem("vitacare.token", accessToken as string);
  }, token);
  return token;
}

export function invalidateAuthCache(): void {
  cachedAuth = null;
}

import { test, expect } from "@playwright/test";
import { authStatePath } from "../global-setup";
import { readFileSync } from "node:fs";

test("two tabs share one refresh rotation and both recover", async ({ browser }) => {
  const state = JSON.parse(readFileSync(authStatePath, "utf8")) as {
    cookies: Array<Record<string, unknown> & { name: string; value: string }>;
    origins: unknown[];
  };
  const accessCookie = state.cookies.find((cookie) => cookie.name === "vc_access");
  expect(accessCookie).toBeTruthy();
  const context = await browser.newContext({
    storageState: {
      origins: state.origins,
      cookies: state.cookies.map((cookie) =>
        cookie.name === "vc_access" ? { ...cookie, value: "invalid.access.token" } : cookie,
      ),
    },
  });
  const first = await context.newPage();
  const second = await context.newPage();
  let refreshRequests = 0;
  let successfulMeResponses = 0;
  for (const page of [first, second]) {
    page.on("request", (request) => {
      if (request.url().endsWith("/api/auth/refresh")) refreshRequests += 1;
    });
    page.on("response", (response) => {
      if (response.url().endsWith("/api/auth/me") && response.status() === 200) successfulMeResponses += 1;
    });
  }

  await Promise.all([first.goto("/dashboard"), second.goto("/dashboard")]);
  await expect.poll(() => refreshRequests).toBe(1);
  await expect.poll(() => successfulMeResponses).toBeGreaterThanOrEqual(2);
  await expect.poll(async () =>
    first.evaluate(async () => {
      const response = await fetch("http://127.0.0.1:3001/api/auth/sessions", { credentials: "include" });
      return response.status;
    }),
  ).toBe(200);

  await context.close();
});
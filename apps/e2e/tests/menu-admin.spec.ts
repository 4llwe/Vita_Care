import { test, expect } from "@playwright/test";
import { authenticatePage } from "./helpers";
test("superadmin can open menu CMS", async ({ page, request }) => {
  await authenticatePage(page, request);
  await page.goto("/menu-management");
  await expect(
    page.getByRole("heading", { name: /Manajemen Menu Terintegrasi/ }),
  ).toBeVisible();
  await expect(page.getByText(/Kelompok menu/)).toBeVisible();
});
test("public menu API returns 14 seeded groups", async ({ request }) => {
  const response = await request.get("/api/menus");
  expect(response.ok()).toBeTruthy();
  const groups = await response.json();
  expect(groups.length).toBeGreaterThanOrEqual(14);
});

import { test, expect } from "@playwright/test";
test("mobile emergency action remains visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const b = page.getByRole("button", { name: /buka bantuan darurat/i });
  await expect(b).toBeVisible();
  await b.click();
  await expect(page.getByRole("dialog")).toContainText(/mengancam nyawa/i);
});
test("clinical protocol requires authentication", async ({ page }) => {
  await page.goto("/clinical-protocol");
  await page.waitForURL(/\/login/);
});

test("mobile header keeps login action visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("link", { name: /masuk atau login/i })).toBeVisible();
});

test("desktop mega menu exposes every main navigation group", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByText("Semua Menu", { exact: true }).click();
  await expect(page.getByRole("link", { name: /Keluarga & Caregiver/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Pembayaran/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Kontak/i })).toBeVisible();
});

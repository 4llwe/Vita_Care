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

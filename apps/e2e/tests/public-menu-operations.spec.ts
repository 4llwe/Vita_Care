import { test, expect } from "@playwright/test";
test("all directory submenu links resolve", async ({ page }) => {
  await page.goto("/direktori");
  const links = page.locator('a[href^="/informasi/"]');
  expect(await links.count()).toBeGreaterThanOrEqual(117);
  const hrefs = await links.evaluateAll((xs) =>
    [...new Set(xs.map((x) => (x as HTMLAnchorElement).getAttribute("href")))].slice(
      0,
      117,
    ),
  );
  for (const href of hrefs) {
    const response = await page.request.get(String(href));
    expect(response.status(), String(href)).toBeLessThan(400);
  }
});
test("service request form creates ticket", async ({ page }) => {
  await page.goto("/informasi/layanan/kunjungan-dokter");
  await page.getByPlaceholder("Nama lengkap").fill("QA Operasional");
  await page.getByPlaceholder("Nomor telepon").fill("0800000000");
  await page
    .getByPlaceholder(/Jelaskan kebutuhan/)
    .fill("Permintaan asesmen layanan untuk pengujian operasional.");
  await page.getByRole("button", { name: /Kirim dan buat tiket/ }).click();
  await expect(page.getByRole("status")).toContainText(/Nomor tiket/);
});

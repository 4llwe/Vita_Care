import { test, expect } from "@playwright/test";
test("all directory submenu links resolve", async ({ page }) => {
  await page.goto("/direktori");
  const links = page.locator('main a[href^="/informasi/"], main a[href^="/#"]');
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

test("homepage directory entries target real sections", async ({ page }) => {
  await page.goto("/direktori");
  await page.getByRole("link", { name: "Alur Pelayanan", exact: true }).click();
  await expect(page).toHaveURL(/\/#alur-pelayanan$/);
  await expect(page.locator("#alur-pelayanan")).toBeVisible();
});

test("secure public entry preserves its operational destination", async ({ page }) => {
  await page.goto("/informasi/pasien/jadwal-kunjungan");
  await expect(page.getByRole("link", { name: "Masuk ke layanan aman" })).toHaveAttribute(
    "href",
    "/login?next=%2Fbookings",
  );
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

test("service pages present specific scope and safety guidance", async ({ page }) => {
  await page.goto("/informasi/layanan/perawatan-luka");
  await expect(page.getByRole("heading", { name: "Perawatan Luka" })).toBeVisible();
  await expect(page.getByText(/asesmen, tindakan sesuai kompetensi/i)).toBeVisible();
  await expect(page.getByText(/kondisi gawat darurat/i)).toBeVisible();
});

test("homepage exposes verified featured service routes", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Layanan unggulan", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Kunjungan Dokter/i })).toHaveAttribute(
    "href",
    "/informasi/layanan/kunjungan-dokter",
  );
  await expect(page.getByRole("link", { name: /Telekonsultasi/i })).toHaveAttribute(
    "href",
    "/informasi/layanan/telekonsultasi",
  );
});

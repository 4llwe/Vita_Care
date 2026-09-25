import { test, expect, request as playwrightRequest } from '@playwright/test';
import { authenticatePage } from './helpers';

test.describe('UI smoke', () => {
  test('halaman login tampil', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/masuk|login/i).first()).toBeVisible();
  });

  test('route terproteksi redirect ke /login bila belum login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('dashboard tampil setelah sesi autentikasi valid disiapkan', async ({ page }) => {
    const request = await playwrightRequest.newContext();
    await authenticatePage(page, request);
    await request.dispose();
    await page.goto('/dashboard');
    await expect(page.getByText('Dashboard Manajemen')).toBeVisible();
    await expect(page.getByText(/Laporan Manajemen/i)).toBeVisible();
  });
});

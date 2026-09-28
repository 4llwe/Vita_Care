import { test, expect, request as playwrightRequest } from '@playwright/test';
import { API_URL, ADMIN_PASSWORD } from './helpers';

const cases = [
  ['doctor', 'Dashboard Dokter', 'Pasien'],
  ['nurse', 'Dashboard Perawat', 'Tugas'],
  ['finance', 'Dashboard Keuangan', 'Tagihan'],
  ['patient', 'Dashboard Pasien', 'Layanan'],
  ['caregiver', 'Dashboard Keluarga & Caregiver', 'Pasien'],
] as const;

for (const [role, title, mobileLabel] of cases) {
  test(`role ${role} receives its scoped dashboard and mobile navigation`, async ({ browser }) => {
    const request = await playwrightRequest.newContext({ baseURL: API_URL });
    const response = await request.post('/api/auth/login', {
      data: { email: `ci-${role}@vitacare.invalid`, password: ADMIN_PASSWORD },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const state = await request.storageState();
    await request.dispose();

    const context = await browser.newContext({ storageState: state, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.addInitScript((token) => localStorage.setItem('vitacare.token', token), body.accessToken);
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navigasi utama mobile' }).getByText(mobileLabel, { exact: true })).toBeVisible();
    await context.close();
  });
}

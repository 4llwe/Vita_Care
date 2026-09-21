import { test, expect, request as playwrightRequest } from '@playwright/test';
import { API_URL, loginApi } from './helpers';

test.describe('Autentikasi & export laporan (API)', () => {
  test('login admin & ambil dashboard', async () => {
    const request = await playwrightRequest.newContext();
    const token = await loginApi(request);

    const res = await request.get(`${API_URL}/api/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('bookings');
    expect(body).toHaveProperty('revenue');
    expect(body).toHaveProperty('risks');
    await request.dispose();
  });

  test('endpoint dashboard menolak akses tanpa token', async () => {
    const request = await playwrightRequest.newContext();
    const res = await request.get(`${API_URL}/api/analytics/dashboard`);
    expect(res.status()).toBe(401);
    await request.dispose();
  });

  test('export laporan manajemen menghasilkan PDF', async () => {
    const request = await playwrightRequest.newContext();
    const token = await loginApi(request);
    const res = await request.get(`${API_URL}/api/reports/management.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('application/pdf');
    const buf = await res.body();
    // Berkas PDF valid diawali dengan tanda tangan %PDF
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    await request.dispose();
  });

  test('export register risiko menghasilkan file Excel', async () => {
    const request = await playwrightRequest.newContext();
    const token = await loginApi(request);
    const res = await request.get(`${API_URL}/api/reports/risks.xlsx`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('spreadsheetml');
    const buf = await res.body();
    // File .xlsx adalah arsip ZIP, diawali 'PK'
    expect(buf.subarray(0, 2).toString()).toBe('PK');
    await request.dispose();
  });
});

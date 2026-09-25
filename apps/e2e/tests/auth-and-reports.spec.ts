import { test, expect, request as playwrightRequest } from '@playwright/test';
import { API_URL, authenticatePage, invalidateAuthCache, loginApi } from './helpers';

test.describe('Autentikasi & export laporan (API)', () => {
  test.describe.configure({ mode: 'serial' });
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

  test('session list is owner-scoped and targeted logout revokes the current session', async () => {
    const request = await playwrightRequest.newContext();
    const token = await loginApi(request, { fresh: true, isolated: true });
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as { sid: string };

    const list = await request.get(`${API_URL}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(list.ok()).toBeTruthy();
    const sessions = (await list.json()) as Array<{ id: string }>;
    expect(sessions.some((session) => session.id === payload.sid)).toBeTruthy();

    const revoke = await request.delete(`${API_URL}/api/auth/sessions/${payload.sid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(revoke.status()).toBe(204);

    const after = await request.get(`${API_URL}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(after.status()).toBe(401);
    invalidateAuthCache();
    await request.dispose();
  });

  test('logout-all revokes the access session family', async () => {
    const request = await playwrightRequest.newContext();
    const token = await loginApi(request, { fresh: true, isolated: true });
    const logout = await request.post(`${API_URL}/api/auth/logout-all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logout.status()).toBe(204);

    const after = await request.get(`${API_URL}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(after.status()).toBe(401);
    invalidateAuthCache();
    await request.dispose();
  });

  test('refresh rotates the cookie and current logout invalidates it', async () => {
    const request = await playwrightRequest.newContext();
    await loginApi(request, { fresh: true, isolated: true });
    const refreshed = await request.post(`${API_URL}/api/auth/refresh`);
    expect(refreshed.status()).toBe(200);

    const logout = await request.post(`${API_URL}/api/auth/logout`);
    expect(logout.status()).toBe(204);
    const after = await request.post(`${API_URL}/api/auth/refresh`);
    expect(after.status()).toBe(401);
    invalidateAuthCache();
    await request.dispose();
  });

  test('reusing a rotated refresh cookie revokes the complete family', async () => {
    const request = await playwrightRequest.newContext();
    await loginApi(request, { fresh: true, isolated: true });
    const state = await request.storageState();
    const staleCookie = state.cookies.find((cookie) => cookie.name === 'vc_refresh');
    expect(staleCookie).toBeTruthy();

    const rotated = await request.post(`${API_URL}/api/auth/refresh`);
    expect(rotated.status()).toBe(200);

    const staleRequest = await playwrightRequest.newContext({
      storageState: { cookies: [staleCookie!], origins: [] },
    });
    const reused = await staleRequest.post(`${API_URL}/api/auth/refresh`);
    expect(reused.status()).toBe(401);
    await staleRequest.dispose();

    const familyAfterReuse = await request.post(`${API_URL}/api/auth/refresh`);
    expect(familyAfterReuse.status()).toBe(401);
    invalidateAuthCache();
    await request.dispose();
  });

  test('unknown session revocation does not reveal another session', async () => {
    const request = await playwrightRequest.newContext();
    const token = await loginApi(request);
    const revoke = await request.delete(`${API_URL}/api/auth/sessions/not-owned-by-this-user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(revoke.status()).toBe(204);

    const list = await request.get(`${API_URL}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(list.ok()).toBeTruthy();
    await request.dispose();
  });

  test('browser transparently refreshes an invalid access cookie', async ({ page, context, request }) => {
    const webUrl = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
    await authenticatePage(page, request);
    await page.goto(`${webUrl}/dashboard`);

    const accessCookie = (await context.cookies()).find((cookie) => cookie.name === 'vc_access');
    expect(accessCookie).toBeTruthy();
    await context.addCookies([{ ...accessCookie!, value: 'invalid.access.token' }]);
    await page.goto(`${webUrl}/dashboard`);
    await expect(page).toHaveURL(/dashboard/);
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

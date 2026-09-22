import { test, expect, request as playwrightRequest } from '@playwright/test';
import { API_URL } from './helpers';

test.describe('API health', () => {
  test('liveness mengembalikan ok', async () => {
    const request = await playwrightRequest.newContext();
    const res = await request.get(`${API_URL}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('vitacare-api');
    await request.dispose();
  });

  test('readiness melaporkan status DB', async () => {
    const request = await playwrightRequest.newContext();
    const res = await request.get(`${API_URL}/api/health/ready`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(['ready', 'degraded']).toContain(body.status);
    await request.dispose();
  });
});

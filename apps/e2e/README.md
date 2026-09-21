# E2E Tests (Playwright)

Pengujian end-to-end untuk Vita Care Lombok: health check API, autentikasi, export laporan (PDF/Excel), dan smoke UI.

## Menjalankan

```bash
# 1) Pastikan API (:3001) & Web (:3000) berjalan, DB sudah di-seed
pnpm --filter e2e install:browsers   # sekali saja, unduh Chromium
pnpm --filter e2e test               # jalankan semua tes
pnpm --filter e2e test:ui            # mode UI interaktif
pnpm --filter e2e report             # buka laporan HTML
```

## Variabel lingkungan

| Var | Default | Keterangan |
|---|---|---|
| `E2E_WEB_URL` | `http://localhost:3000` | Base URL frontend |
| `E2E_API_URL` | `http://localhost:3001` | Base URL API |
| `E2E_ADMIN_EMAIL` | `admin@vitacare.id` | Akun seed |
| `E2E_ADMIN_PASSWORD` | wajib diisi | Password akun uji staging yang disimpan di secret manager |

## Cakupan

- `health.spec.ts` — liveness & readiness `/api/health`.
- `auth-and-reports.spec.ts` — login, proteksi 401, export PDF (`%PDF`) & Excel (`PK`).
- `ui-smoke.spec.ts` — halaman login, redirect route terproteksi, render dashboard.

> Catatan: akun seed `admin@vitacare.id` tidak mengaktifkan 2FA agar e2e dapat login lewat API. Bila 2FA diaktifkan untuk admin, sediakan akun uji khusus tanpa 2FA via `E2E_ADMIN_*`.

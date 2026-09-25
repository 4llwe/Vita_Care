# Panduan & Checklist Deployment Produksi — Vita Care Lombok

Dokumen ini melengkapi `README.md` dengan langkah rilis ke produksi yang aman.

## 1. Prasyarat

- Node.js 20, pnpm 9, Docker + Docker Compose.
- Domain & TLS (mis. `app.vitacarelombok.com`, `api.vitacarelombok.com`).
- PostgreSQL 16 terkelola (atau container), Redis 7, dan S3/MinIO untuk berkas.

## 2. Variabel lingkungan (`.env`)

Salin `.env.example` → `.env`, lalu **ganti semua kredensial default**:

```bash
cp .env.example .env
```

| Variabel | Wajib | Catatan |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host:5432/vitacare` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `REFRESH_TOKEN_PEPPER` | ✅ | string acak ≥ 32 char (`openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | ✅ | kunci enkripsi 2FA/secret |
| `WEB_ORIGIN` | ✅ | origin frontend, mis. `https://app.vitacarelombok.com` |
| `API_URL` / `NEXT_PUBLIC_API_URL` | ✅ | URL API yang diakses browser |
| `S3_ENDPOINT` `S3_BUCKET` `S3_REGION` `S3_ACCESS_KEY` `S3_SECRET_KEY` | ⭐ | isi untuk S3/MinIO; bila kosong fallback ke `STORAGE_DIR` lokal |
| `MIDTRANS_SERVER_KEY` / `MIDTRANS_CLIENT_KEY` | ✅ untuk billing | Transaksi ditolak bila provider belum dikonfigurasi |
| `WHATSAPP_*` `SMTP_*` | ⭐ | notifikasi rujukan darurat & email |

> Seed tidak membuat akun demo. Isi `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` (minimal 12 karakter) melalui secret manager sebelum menjalankan seed.

## 3. Migrasi database

```bash
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy   # terapkan migrasi (idempoten, aman diulang)
pnpm seed                    # opsional: data awal (layanan, zona, admin demo)
```

- Gunakan `migrate deploy` (bukan `migrate dev`) di produksi.
- Backup DB sebelum tiap rilis: `pg_dump`.
- Pada compose produksi, `api` otomatis menjalankan `prisma migrate deploy` saat start.

## 4. CORS untuk unggah langsung browser → S3

Unggah memakai **presigned URL**, sehingga bucket harus mengizinkan `PUT` dari origin frontend.

```bash
# sunting AllowedOrigins di infra/s3-cors.json lalu:
S3_BUCKET=vitacare-evidence S3_REGION=ap-southeast-1 bash infra/setup-s3-cors.sh
# MinIO: tambahkan S3_ENDPOINT=http://minio:9000
```

- API sudah meng-`exposedHeaders: Content-Disposition` agar nama berkas unduhan terbaca lintas origin.
- Pastikan `AllowedMethods` mencakup `PUT`, `GET`, `HEAD`.

## 5. Build & jalankan (Docker)

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Layanan: `db` (internal), `redis` (internal), `minio` (opsional), `api` (:3001), `web` (:3000).
Taruh reverse proxy (Nginx/Caddy/Traefik) di depan untuk TLS & routing domain.

## 6. Health check & smoke test

```bash
curl -fsS http://localhost:3001/api/health        # {"status":"ok"}
curl -fsS http://localhost:3001/api/health/ready  # {"status":"ready","db":"up"}
```

Jalankan e2e terhadap lingkungan staging:

```bash
E2E_WEB_URL=https://staging.vitacarelombok.com \
E2E_API_URL=https://api-staging.vitacarelombok.com \
pnpm --filter e2e test
```

## 7. Reverse proxy (contoh Nginx)

```nginx
server {
  server_name app.vitacarelombok.com;
  location / { proxy_pass http://127.0.0.1:3000; }
}
server {
  server_name api.vitacarelombok.com;
  location / { proxy_pass http://127.0.0.1:3001; }
}
```

## 8. Checklist rilis (centang sebelum go-live)

- [ ] Semua secret default sudah diganti (JWT, ENCRYPTION_KEY, DB, S3, admin).
- [ ] `REFRESH_TOKEN_PEPPER` sudah disimpan di secret manager dan tidak pernah diganti tanpa rencana invalidasi sesi.
- [ ] `WEB_ORIGIN` & `NEXT_PUBLIC_API_URL` menunjuk domain produksi (bukan localhost).
- [ ] `prisma migrate deploy` sukses; backup DB terjadwal.
- [ ] CORS bucket S3 diterapkan & unggah berkas teruji dari browser.
- [ ] TLS aktif (HTTPS) di web & api; HSTS via reverse proxy.
- [ ] `helmet`, rate limit (`ThrottlerModule`), dan validasi input aktif (default sudah ON).
- [ ] Health check `/api/health` & `/api/health/ready` 200.
- [ ] Cron CAPA (pengingat & eskalasi) berjalan (cek log).
- [ ] Midtrans webhook URL terdaftar & signature terverifikasi (bila pembayaran live).
- [ ] Notifikasi WhatsApp/SMTP rujukan darurat teruji.
- [ ] e2e Playwright hijau di staging.
- [ ] Administrator produksi dibuat melalui secret manager; 2FA dan recovery diuji.
- [ ] Monitoring & log terpusat (mis. Grafana/Loki / penyedia cloud).

## 9. Rollback

- Simpan tag image sebelumnya; `docker compose ... up -d` dengan tag lama.
- Restore DB dari `pg_dump` terakhir bila migrasi bermasalah (uji di staging dulu).

Kontak: +62 822-2742-0800 · Jl. Kecubung No. 20, Gomong, Selaparang, Mataram · vitacare87@gmail.com

# Vita Care Hospital At Home — Production Monorepo

Monorepo siap-jalan untuk sistem **platform digital Vita Care Hospital At Home** (web + API + database). Mencakup **13 modul backend**, frontend Next.js dengan **11 halaman fungsional + form input**, RBAC, audit trail, cron otomasi, notifikasi multi-channel, seed data layanan/tarif asli, dan CI/CD.

## Struktur
```
vitacare/
├─ .github/workflows/ci.yml  # CI: lint + test + build + docker image
├─ apps/
│  ├─ api/                   # NestJS + Dockerfile
│  └─ web/                   # Next.js 14 + Tailwind + Dockerfile
├─ prisma/
│  ├─ schema.prisma          # 22 model + 13 enum
│  └─ seed.ts                # 9 layanan + tarif + super admin + contoh nakes + checklist audit
├─ docker-compose.yml        # postgres + redis + api + web
├─ pnpm-workspace.yaml · turbo.json · tsconfig.base.json · .env.example
```

## Modul Backend (13)
| Modul | Isi |
|-------|-----|
| **auth** | login + **2FA (TOTP)**, JWT access+refresh, rate-limit, argon2 |
| **booking** | CRUD + **state machine** + **auto-dispatch** (geo haversine) + test |
| **findings** | penomoran `TM-2026-031`, matriks risiko P×I + test |
| **medical-record** | SOAP + vitals + **EWS (NEWS2 ringkas)** + tanda tangan & **locking** + test |
| **capa** | rencana tindakan, progress%, evidence, **cron** pengingat + **eskalasi** + test |
| **billing** | invoice + pajak, **Midtrans Snap**, **webhook** terverifikasi signature + test |
| **risk** | risk register, skor P×I, **heatmap 5×5**, status mitigasi + test |
| **analytics** | **dashboard agregat** + export **CSV** (findings/invoices/risks) + **PDF/Excel berbranding** (laporan manajemen, surat rujukan, register risiko) |
| **document** | **versioning** + alur **approval** (DRAFT→IN_REVIEW→APPROVED/REJECTED) + test |
| **referral** | rujukan ke RS mitra, state machine, alert WhatsApp untuk DARURAT + test |
| **master** | CRUD penuh layanan, tarif, & tenaga kesehatan (admin) + endpoint read-only untuk dropdown frontend |
| **audit** | **checklist audit** (template berbobot) + **pelaksanaan audit** (`AU-2026-001`) + jawaban kepatuhan + **skor tertimbang otomatis** + **Evidence Capture** (foto + geolokasi + timestamp) |
| **storage** | unggah berkas via **presigned URL S3 (SigV4, tanpa dependensi)** + fallback penyimpanan lokal dev + test |
| **notification** | layanan multi-channel: in-app / email / WhatsApp |
| common | `RolesGuard` (RBAC), `@Roles`, `JwtAuthGuard`, `AuditTrailInterceptor`, `PrismaService`, `computeRiskLevel` |

## Frontend (13 halaman + form input)
`/login` (2FA) · `/dashboard` (KPI) · `/portal` (Portal Pasien: self-booking + pelacakan kunjungan) · `/bookings` · `/medical-records/new` (form SOAP+EWS) · `/referrals` · `/findings` · `/audits` (checklist + pelaksanaan + Evidence Capture) · `/risks` (heatmap) · `/capa` (kanban) · `/documents` · `/invoices` (bayar Snap)
- Proteksi route via `RequireAuth` (redirect ke /login bila belum login).
- Proxy `/api/*` → NestJS untuk tautan unduhan CSV.
- **Form input via modal**: Booking (dropdown layanan/zona dari master data), Risiko (preview skor+level live), Dokumen, Rujukan — daftar otomatis ter-refresh setelah simpan.
- **Unggah berkas**: detail Dokumen (unggah versi + alur Ajukan/Setujui/Tolak) & CAPA (unggah evidence + update progress) via presigned URL.
- **Aksi status inline dari tabel**: Booking (konfirmasi/batal, tugaskan nakes manual atau Auto-dispatch, lanjutkan alur kunjungan) & Rujukan (Terima/Tolak/Selesaikan) langsung dari daftar tanpa membuka detail — tervalidasi state machine backend.
- **Dashboard & navigasi per-peran**: tampilan dashboard, KPI, tautan cepat, menu sidebar, dan tombol export menyesuaikan peran pengguna (Direktur, Dewan Pengawas, Auditor, Kepala Unit, Koordinator, Tenaga Kesehatan, Pasien, Super Admin). Peran dibaca dari JWT di klien & diverifikasi server via `GET /api/auth/me`.
- **Export berbranding**: Laporan Manajemen (PDF, dari Dashboard), Surat Rujukan (PDF per baris, kop surat resmi), Register Risiko (Excel berwarna). Unduhan menyertakan token via `DownloadButton`.
- **Audit & Evidence Capture**: buat template checklist berbobot, mulai pelaksanaan audit per unit/zona, nilai tiap butir (Patuh/Sebagian/Tidak Patuh/N-A) dengan **skor kepatuhan tertimbang otomatis**, lampirkan **foto bukti dengan geolokasi + timestamp** (via `navigator.geolocation`), lalu kunci saat diselesaikan.
- **Portal Pasien**: pasien memesan layanan sendiri (`/bookings/me`) dengan identitas dari akun login + **tangkap lokasi rumah via `navigator.geolocation`**, lalu **melacak kunjungan** lewat timeline status (Dipesan → Dikonfirmasi → Nakes Ditugaskan → Dalam Perjalanan → Berlangsung → Selesai), melihat nakes yang ditugaskan, **peta lokasi (Google Maps embed)**, status tagihan, dan membatalkan pesanan selama masih diizinkan. Kepemilikan data divalidasi server (nama/telepon akun).

### Endpoint Master Data (admin: SUPER_ADMIN, COORDINATOR)

- `GET /master/services` — daftar layanan (termasuk nonaktif) + tarif + jumlah pemesanan
- `POST /master/services` · `PATCH /master/services/:id` · `DELETE /master/services/:id` (soft-delete bila ada pemesanan)
- `POST /master/tariffs` · `PATCH /master/tariffs/:id` · `DELETE /master/tariffs/:id`
- `GET /master/health-workers` — daftar nakes (termasuk nonaktif)
- `POST /master/health-workers` · `PATCH /master/health-workers/:id` · `DELETE /master/health-workers/:id` (soft-delete bila ada pemesanan)

Halaman `/master` menyediakan tab **Layanan & Tarif** dan **Tenaga Kesehatan** dengan form modal create/edit dan aksi hapus/nonaktifkan.

### Endpoint Portal Pasien
- `POST /api/bookings/me` (pesan mandiri) · `GET /api/bookings/me` (booking saya) · `GET /api/bookings/me/:id` (detail pelacakan) · `PATCH /api/bookings/me/:id/cancel` (batalkan)

### Endpoint Audit
- `POST /api/audits/checklists` · `GET /api/audits/checklists` · `GET /api/audits/checklists/:id`
- `POST /api/audits/executions` · `GET /api/audits/executions` · `GET /api/audits/executions/:id`
- `PATCH /api/audits/executions/:id/answers` (simpan jawaban + hitung skor) · `PATCH /api/audits/executions/:id/complete` (finalisasi)
- `POST /api/audits/executions/:id/evidence` · `GET /api/audits/executions/:id/evidence` · `DELETE /api/audits/executions/:id/evidence/:evidenceId`

## Siklus Tata Kelola Mutu (lengkap)
`Audit → Temuan → Risk Register (heatmap) → CAPA (cron + eskalasi) → Verifikasi → Laporan/Export`

## Siklus Layanan Pasien (lengkap)
`Login → Booking → Auto-dispatch nakes → Rekam Medis (EWS) → (Rujukan bila perlu) → Invoice → Bayar (Midtrans)`

## Menjalankan (lokal)
```bash
cp .env.example .env            # isi DATABASE_URL & secret
docker compose up -d db redis   # PostgreSQL & Redis
pnpm install
pnpm prisma:generate
pnpm prisma:migrate             # buat tabel
pnpm seed                       # isi layanan, tarif, super admin
pnpm --filter api start:dev     # API di http://localhost:3001/api
pnpm --filter web dev           # Web di http://localhost:3000
pnpm --filter api test          # unit test (findings, booking, ews, billing, risk, document, referral)
```

## Menjalankan (Docker penuh)
```bash
cp .env.example .env
docker compose up -d --build    # db + redis + api + web
```

## Bootstrap administrator
Jalankan seed hanya dengan `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` yang kuat. Project tidak membuat akun demo atau tenaga kesehatan fiktif.

## Layanan & Tarif Dasar (profil Vita Care)
| Kode | Layanan | Tarif Dasar |
|------|---------|-------------|
| DOC | Kunjungan Dokter | Rp 250.000 |
| NRS | Nursing Care | Rp 180.000 |
| ELD | Elderly Care | Rp 200.000 |
| MNB | Mother & Baby Care | Rp 220.000 |
| LAB | Lab di Rumah | Rp 150.000 |
| PHY | Fisioterapi | Rp 190.000 |
| IVT | IV Therapy | Rp 230.000 |
| TEL | Telemedicine | Rp 75.000 |
| EMR | Darurat 24 Jam | Rp 350.000 |

> Master layanan hanya dimuat bila `SEED_MASTER_DATA=true`; tarif wajib ditinjau sebelum produksi.

## Catatan
- Penyimpanan berkas: isi `S3_*` untuk memakai S3/MinIO (presigned URL SigV4). Bila kosong, sistem otomatis memakai penyimpanan lokal (`STORAGE_DIR`) untuk dev.
- Endpoint unggah lokal membaca raw body PUT; di produksi gunakan S3 agar unggahan langsung dari browser ke bucket.
- Export PDF/Excel memakai `pdfkit` + `exceljs` (sudah terdaftar di `apps/api/package.json`). PDF SigV4 storage tetap tanpa dependensi tambahan.
- Endpoint export: `GET /api/reports/management.pdf`, `GET /api/reports/risks.xlsx`, `GET /api/reports/referral/:id.pdf` (selain `*.csv`).
- **Health check**: `GET /api/health` (liveness) & `GET /api/health/ready` (readiness DB) untuk load balancer/orchestrator.
- **Pengujian e2e**: lihat `apps/e2e` (Playwright) — `pnpm --filter e2e test`.
- **Deployment produksi**: ikuti `DEPLOYMENT.md` (migrasi, CORS S3, compose produksi, checklist go-live). Compose produksi: `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`.
- Tambahkan `pnpm-lock.yaml` saat pertama `pnpm install` agar build Docker memakai `--frozen-lockfile`.

Kontak: +62 822-2742-0800 · Jl. Kecubung No.20, Gomong Lama, Kota Mataram, NTB · vitacare87@gmail.com


## Hospital at Home v0.2

Fondasi episode akut, eligibility, care plan, observasi lengkap, clinical alert SLA, transfer SBAR, dan command center tersedia. Lihat `HOSPITAL_AT_HOME.md` untuk batasan keselamatan dan persyaratan sebelum go-live.

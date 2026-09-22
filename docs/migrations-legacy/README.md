# Prisma V2 Baseline

## Baseline aktif

Migrasi aktif dimulai dari `20260922090000_baseline_v2`.

Baseline dibuat dari `prisma/schema.prisma` dan telah diuji pada database
PostgreSQL kosong menggunakan perintah `pnpm exec prisma migrate deploy`.
Hasil pengujian menunjukkan `No difference detected`.

## Migrasi lama

Folder `pre-baseline-v2` berisi migrasi incremental historis yang sebelumnya
mengasumsikan tabel dan enum dasar sudah tersedia.

File tersebut disimpan untuk audit dan tidak boleh dipindahkan kembali ke
`prisma/migrations`.

## Database baru dan kosong

Jalankan `pnpm exec prisma migrate deploy`.

Prisma akan menerapkan baseline dan membuat seluruh schema.

## Database existing yang sudah berisi tabel

Jangan menjalankan SQL baseline langsung pada database existing.

Prosedur adopsi:

1. Buat backup database yang dapat dipulihkan.
2. Bandingkan database dengan `prisma/schema.prisma`.
3. Lanjutkan hanya jika hasilnya `No difference detected`.
4. Tandai baseline sebagai sudah diterapkan dengan:
   `pnpm exec prisma migrate resolve --applied 20260922090000_baseline_v2`
5. Periksa dengan `pnpm exec prisma migrate status`.

Jika terdapat perbedaan schema, hentikan proses dan buat migration
rekonsiliasi. Jangan menggunakan `prisma db push` pada production.

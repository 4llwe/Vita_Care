import { PrismaClient, Role } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

// Kandidat katalog. Seluruh layanan dibuat nonaktif sampai diverifikasi operator.
const SERVICES = [
  {
    code: "DOC",
    name: "Kunjungan Dokter",
    category: "Medis",
    durationMin: 45,
    price: 250_000,
  },
  {
    code: "NRS",
    name: "Nursing Care (luka/infus/injeksi)",
    category: "Keperawatan",
    durationMin: 60,
    price: 180_000,
  },
  {
    code: "ELD",
    name: "Elderly Care",
    category: "Perawatan Lansia",
    durationMin: 240,
    price: 200_000,
  },
  {
    code: "MNB",
    name: "Mother & Baby Care",
    category: "Ibu & Bayi",
    durationMin: 60,
    price: 220_000,
  },
  {
    code: "LAB",
    name: "Layanan Laboratorium di Rumah",
    category: "Penunjang",
    durationMin: 30,
    price: 150_000,
  },
  {
    code: "PHY",
    name: "Fisioterapi & Terapi Pemulihan",
    category: "Rehabilitasi",
    durationMin: 60,
    price: 190_000,
  },
  {
    code: "IVT",
    name: "IV Therapy",
    category: "Keperawatan",
    durationMin: 40,
    price: 230_000,
  },
  {
    code: "TEL",
    name: "Telemedicine (chat/telepon/video)",
    category: "Konsultasi",
    durationMin: 30,
    price: 75_000,
  },
  {
    code: "EMR",
    name: "Layanan Darurat 24 Jam",
    category: "Emergency",
    durationMin: 60,
    price: 350_000,
  },
];

const ZONES = ["Mataram", "Lombok Barat", "Lombok Tengah"];

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Administrator Vita Care";
  if (!email || !password || password.length < 12) {
    throw new Error(
      "SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD (minimal 12 karakter) wajib diisi",
    );
  }
  await prisma.user.upsert({
    where: { email },
    update: { name, isActive: true },
    create: {
      email,
      name,
      passwordHash: await argon2.hash(password),
      role: Role.SUPER_ADMIN,
    },
  });

  if (process.env.SEED_MASTER_DATA === "true") {
    console.warn("Katalog kandidat dibuat NONAKTIF dan memerlukan persetujuan operator.");
    for (const item of SERVICES) {
      const service = await prisma.service.upsert({
        where: { code: item.code },
        update: {
          name: item.name,
          category: item.category,
          durationMin: item.durationMin,
        },
        create: {
          code: item.code,
          name: item.name,
          category: item.category,
          durationMin: item.durationMin,
          isActive: false,
        },
      });
      const existing = await prisma.tariff.findFirst({
        where: { serviceId: service.id, name: `${item.name} — Tarif Dasar` },
      });
      if (!existing)
        await prisma.tariff.create({
          data: {
            serviceId: service.id,
            name: `${item.name} — Tarif Dasar`,
            basePrice: item.price,
          },
        });
    }
  }
  console.log(
    "Seed produksi selesai. Tidak ada akun atau tenaga kesehatan demo yang dibuat.",
  );
}
main().finally(() => prisma.$disconnect());

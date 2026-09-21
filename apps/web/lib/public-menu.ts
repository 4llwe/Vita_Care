export type PublicMenuGroup = { key: string; label: string; items: string[] };
export const PUBLIC_MENU: PublicMenuGroup[] = [
  {
    key: "beranda",
    label: "Beranda",
    items: [
      "Ringkasan Hospital at Home",
      "Keunggulan Layanan",
      "Alur Pelayanan",
      "Layanan Unggulan",
      "Statistik Layanan",
      "Testimoni",
      "Call to Action",
    ],
  },
  {
    key: "tentang-kami",
    label: "Tentang Kami",
    items: [
      "Profil Hospital at Home",
      "Visi & Misi",
      "Tujuan",
      "Nilai Pelayanan",
      "Tim Kesehatan",
      "Legalitas & Akreditasi",
      "Mitra Fasilitas Kesehatan",
    ],
  },
  {
    key: "layanan",
    label: "Layanan",
    items: [
      "Kunjungan Dokter",
      "Home Nursing / Keperawatan di Rumah",
      "Pemeriksaan Laboratorium di Rumah",
      "Farmasi & Pengantaran Obat",
      "Fisioterapi",
      "Rehabilitasi",
      "Perawatan Luka",
      "Perawatan Paliatif",
      "Manajemen Penyakit Kronis",
      "Perawatan Pasca-Rawat Inap",
      "Perawatan Lansia",
      "Perawatan Ibu & Anak",
      "Telekonsultasi",
    ],
  },
  {
    key: "tim-kesehatan",
    label: "Tim Kesehatan",
    items: [
      "Dokter",
      "Perawat",
      "Bidan",
      "Fisioterapis",
      "Ahli Gizi",
      "Farmasis",
      "Koordinator Perawatan",
    ],
  },
  {
    key: "pasien",
    label: "Pasien",
    items: [
      "Profil Pasien",
      "Jadwal Kunjungan",
      "Rencana Perawatan",
      "Rekam Medis",
      "Hasil Laboratorium",
      "Resep & Obat",
      "Monitoring Kondisi",
      "Riwayat Pelayanan",
      "Tagihan",
      "Edukasi Pasien",
    ],
  },
  {
    key: "keluarga-caregiver",
    label: "Keluarga & Caregiver",
    items: [
      "Dashboard Keluarga",
      "Kondisi Pasien",
      "Jadwal Perawatan",
      "Instruksi Perawatan",
      "Pengingat Obat",
      "Edukasi Caregiver",
      "Komunikasi dengan Tenaga Kesehatan",
      "Kontak Darurat",
    ],
  },
  {
    key: "monitoring-pasien",
    label: "Monitoring Pasien",
    items: [
      "Tanda Vital",
      "Tekanan Darah",
      "Denyut Jantung",
      "Saturasi Oksigen",
      "Suhu",
      "Gula Darah",
      "Frekuensi Napas",
      "Skala Nyeri",
      "Berat Badan",
      "Kepatuhan Obat",
      "Early Warning System",
    ],
  },
  {
    key: "pemesanan",
    label: "Pemesanan",
    items: [
      "Pesan Kunjungan Rumah",
      "Pesan Dokter",
      "Pesan Perawat",
      "Pesan Laboratorium",
      "Pesan Fisioterapi",
      "Telekonsultasi",
      "Jadwal Saya",
      "Riwayat Pemesanan",
    ],
  },
  {
    key: "farmasi-obat",
    label: "Farmasi & Obat",
    items: [
      "Daftar Obat",
      "Resep",
      "Jadwal Obat",
      "Pengingat Obat",
      "Pengisian Ulang Obat",
      "Pengantaran Obat",
      "Riwayat Obat",
    ],
  },
  {
    key: "pembayaran",
    label: "Pembayaran",
    items: [
      "Paket Layanan",
      "Daftar Tarif",
      "Tagihan",
      "Pembayaran",
      "Asuransi",
      "BPJS/JKN",
      "Riwayat Pembayaran",
    ],
  },
  {
    key: "edukasi-kesehatan",
    label: "Edukasi Kesehatan",
    items: [
      "Artikel Kesehatan",
      "Video Edukasi",
      "Panduan Perawatan di Rumah",
      "Panduan Obat",
      "Panduan Nutrisi",
      "Perawatan Lansia",
      "Diabetes",
      "Hipertensi",
      "Stroke",
      "Gagal Jantung",
      "PPOK",
      "Perawatan Luka",
    ],
  },
  {
    key: "mitra",
    label: "Mitra",
    items: [
      "Rumah Sakit",
      "Puskesmas",
      "Klinik",
      "Laboratorium",
      "Apotek",
      "Asuransi",
      "Institusi Pendidikan",
      "Mitra Perusahaan",
    ],
  },
  {
    key: "informasi",
    label: "Informasi",
    items: [
      "Berita",
      "Kegiatan",
      "Program Kesehatan",
      "FAQ",
      "Pusat Unduhan",
      "Pengumuman",
    ],
  },
  {
    key: "kontak",
    label: "Kontak",
    items: [
      "Hubungi Kami",
      "WhatsApp",
      "Email",
      "Lokasi",
      "Kritik & Saran",
      "Pengaduan",
    ],
  },
];
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function publicHref(section: string, item: string) {
  return `/informasi/${section}/${slugify(item)}`;
}
export function findPublicItem(section: string, slug: string) {
  const group = PUBLIC_MENU.find((x) => x.key === section);
  const item = group?.items.find((x) => slugify(x) === slug);
  const placeholder = slug.split("-").map((x) => x ? x[0].toUpperCase() + x.slice(1) : x).join(" " );
  return group ? { group, item: item ?? placeholder } : null;
}

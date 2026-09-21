export type MenuOperation = {
  kind: "secure" | "request" | "contact" | "complaint" | "partnership" | "information";
  requestType?:
    "SERVICE" | "BOOKING" | "PARTNERSHIP" | "CONTACT" | "COMPLAINT" | "DOWNLOAD_SUPPORT";
  headline: string;
  steps: string[];
  sla: string;
};
const secure = new Set([
  "pasien",
  "keluarga-caregiver",
  "monitoring-pasien",
  "farmasi-obat",
  "pembayaran",
]);
export function menuOperation(section: string, slug: string): MenuOperation {
  if (secure.has(section))
    return {
      kind: "secure",
      headline: "Akses layanan aman",
      steps: [
        "Masuk menggunakan akun terverifikasi",
        "Pilih episode atau layanan",
        "Lanjutkan sesuai hak akses",
      ],
      sla: "Tersedia 24/7 sesuai status sistem",
    };
  if (section === "pemesanan")
    return {
      kind: "request",
      requestType: "BOOKING",
      headline: "Ajukan pemesanan",
      steps: [
        "Isi identitas dan kebutuhan",
        "Koordinator melakukan asesmen awal",
        "Jadwal dikonfirmasi melalui kanal resmi",
      ],
      sla: "Konfirmasi awal maksimal 2 jam operasional",
    };
  if (section === "layanan")
    return {
      kind: "request",
      requestType: "SERVICE",
      headline: "Minta asesmen layanan",
      steps: [
        "Jelaskan kebutuhan pasien",
        "Tim memeriksa indikasi dan cakupan",
        "Koordinator menghubungi untuk tindak lanjut",
      ],
      sla: "Respons maksimal 2 jam operasional",
    };
  if (section === "mitra")
    return {
      kind: "partnership",
      requestType: "PARTNERSHIP",
      headline: "Ajukan kerja sama",
      steps: [
        "Isi profil institusi",
        "Tim kemitraan melakukan verifikasi",
        "Pertemuan awal dijadwalkan",
      ],
      sla: "Respons maksimal 2 hari kerja",
    };
  if (section === "kontak" && (slug.includes("pengaduan") || slug.includes("kritik")))
    return {
      kind: "complaint",
      requestType: "COMPLAINT",
      headline: "Kirim pengaduan resmi",
      steps: [
        "Jelaskan kejadian dengan faktual",
        "Nomor tiket diterbitkan",
        "Petugas menindaklanjuti dan menutup laporan",
      ],
      sla: "Tanda terima langsung; respons maksimal 1 hari kerja",
    };
  if (section === "kontak")
    return {
      kind: "contact",
      requestType: "CONTACT",
      headline: "Hubungi tim layanan",
      steps: [
        "Pilih kebutuhan komunikasi",
        "Isi kanal balasan",
        "Tim layanan menghubungi kembali",
      ],
      sla: "Respons maksimal 2 jam operasional",
    };
  if (section === "informasi" && slug === "pusat-unduhan")
    return {
      kind: "request",
      requestType: "DOWNLOAD_SUPPORT",
      headline: "Minta dokumen resmi",
      steps: [
        "Sebutkan dokumen yang dibutuhkan",
        "Petugas memverifikasi versi",
        "Dokumen dikirim melalui email",
      ],
      sla: "Maksimal 1 hari kerja",
    };
  return {
    kind: "information",
    headline: "Informasi terverifikasi",
    steps: [
      "Baca ruang lingkup",
      "Periksa persyaratan dan tanda bahaya",
      "Gunakan kanal resmi untuk tindak lanjut",
    ],
    sla: "Ditinjau berkala oleh pengelola konten",
  };
}

export function operationFromItem(
  item: {
    operationKind?: string;
    requestType?: string;
    headline?: string;
    steps?: string[];
    sla?: string;
  },
  section: string,
  slug: string,
): MenuOperation {
  const fallback = menuOperation(section, slug);
  if (!item.operationKind) return fallback;
  return {
    kind: item.operationKind as MenuOperation["kind"],
    requestType: item.requestType as MenuOperation["requestType"],
    headline: item.headline ?? fallback.headline,
    steps: Array.isArray(item.steps) && item.steps.length ? item.steps : fallback.steps,
    sla: item.sla ?? fallback.sla,
  };
}

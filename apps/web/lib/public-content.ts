export type PublicContent = {
  reviewStatus: string;
  summary: string;
  suitability: string[];
  scope: string[];
  process: Array<{
    title: string;
    description: string;
  }>;
  preparation: string[];
  emergencySigns: string[];
  governance: string[];
};

const CONTENT: Record<string, PublicContent> = {
  "layanan/kunjungan-dokter": {
    reviewStatus:
      "Draf operasional — wajib disahkan penanggung jawab medis sebelum publikasi production.",

    summary:
      "Kunjungan Dokter adalah layanan asesmen dan tindak lanjut medis di lokasi pasien untuk kondisi yang dinilai layak ditangani di rumah. Ketersediaan mengikuti hasil skrining, area pelayanan, kompetensi dokter, jadwal, jejaring rujukan, dan ketentuan perizinan yang berlaku.",

    suitability: [
      "Pasien dengan keterbatasan mobilitas yang membutuhkan pemeriksaan dokter.",
      "Tindak lanjut terencana setelah perawatan di fasilitas kesehatan.",
      "Pemantauan penyakit kronis yang memerlukan evaluasi klinis langsung.",
      "Keluhan non-kegawatdaruratan yang dinilai aman untuk pelayanan di rumah.",
      "Pasien paliatif atau lanjut usia sesuai rencana perawatan.",
    ],

    scope: [
      "Konfirmasi identitas, keluhan utama, riwayat kesehatan, obat, dan alergi.",
      "Pemeriksaan klinis sesuai kebutuhan dan kewenangan dokter.",
      "Penilaian kebutuhan pemeriksaan penunjang, terapi, atau rujukan.",
      "Penyusunan atau penyesuaian rencana perawatan.",
      "Edukasi pasien dan keluarga mengenai pemantauan serta tanda bahaya.",
      "Dokumentasi hasil kunjungan pada rekam medis.",
    ],

    process: [
      {
        title: "Permintaan dan skrining",
        description:
          "Pasien atau keluarga menyampaikan kebutuhan, lokasi, kondisi, dan kontak yang dapat dihubungi. Tim melakukan skrining awal tanpa menghasilkan diagnosis otomatis.",
      },
      {
        title: "Konfirmasi kelayakan",
        description:
          "Tim mengonfirmasi area pelayanan, jadwal, kebutuhan klinis, tenaga yang sesuai, estimasi biaya, serta persetujuan pasien.",
      },
      {
        title: "Kunjungan dan pemeriksaan",
        description:
          "Dokter memverifikasi identitas pasien, melakukan asesmen, menjelaskan temuan, dan mendokumentasikan pelayanan.",
      },
      {
        title: "Rencana tindak lanjut",
        description:
          "Pasien memperoleh instruksi pemantauan, terapi atau pemeriksaan yang diperlukan, jadwal evaluasi, dan rujukan bila dibutuhkan.",
      },
    ],

    preparation: [
      "Identitas pasien dan kontak keluarga/caregiver.",
      "Daftar obat, suplemen, dan riwayat alergi.",
      "Ringkasan perawatan, hasil laboratorium, atau surat pulang bila tersedia.",
      "Catatan gejala, tanda vital, dan perubahan kondisi terbaru.",
      "Ruangan yang cukup aman dan menjaga privasi pemeriksaan.",
      "Persetujuan pasien atau perwakilan yang sah.",
    ],

    emergencySigns: [
      "Penurunan kesadaran atau kejang.",
      "Nyeri dada berat atau sesak napas berat.",
      "Tanda stroke mendadak, seperti wajah mencong atau kelemahan satu sisi.",
      "Perdarahan yang tidak terkendali.",
      "Reaksi alergi berat.",
      "Kondisi lain yang dinilai mengancam nyawa.",
    ],

    governance: [
      "Dokter hanya ditugaskan setelah identitas, kompetensi, STR, dan SIP yang relevan diverifikasi.",
      "Persetujuan pasien diperoleh sebelum pemeriksaan dan tindakan.",
      "Informasi kesehatan dicatat dan diproses sesuai kewenangan serta kebijakan privasi.",
      "Tindakan hanya dilakukan sesuai indikasi, kompetensi, sarana, dan batas pelayanan di rumah.",
      "Dokter dapat merekomendasikan rujukan atau transfer apabila pelayanan di rumah tidak lagi aman.",
      "Halaman ini tidak menggantikan konsultasi atau keputusan klinis individual.",
    ],
  },
};

export function getPublicContent(
  section: string,
  slug: string,
): PublicContent | null {
  return CONTENT[`${section}/${slug}`] ?? null;
}

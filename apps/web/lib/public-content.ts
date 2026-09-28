export type PublicPageContent = {
  summary: string;
  highlights: string[];
  safety?: string;
  audience?: string;
};

const sectionContent: Record<string, PublicPageContent> = {
  "tentang-kami": {
    summary: "Informasi mengenai tata kelola, nilai pelayanan, jejaring, serta komitmen mutu penyelenggaraan Hospital at Home.",
    highlights: ["Tata kelola dan akuntabilitas", "Keselamatan serta pengalaman pasien", "Kolaborasi lintas profesi dan fasilitas"],
  },
  layanan: {
    summary: "Layanan diberikan setelah kebutuhan pasien, kondisi klinis, lokasi, dan dukungan keluarga dinilai oleh tim yang berwenang.",
    highlights: ["Asesmen kebutuhan sebelum penjadwalan", "Tenaga kesehatan sesuai kompetensi", "Dokumentasi dan tindak lanjut terkoordinasi"],
    safety: "Kelayakan perawatan di rumah ditentukan oleh tenaga kesehatan. Kondisi gawat darurat harus ditangani melalui layanan kegawatdaruratan.",
  },
  "tim-kesehatan": {
    summary: "Tim multidisiplin bekerja sesuai kewenangan, kredensial, penugasan, dan rencana perawatan pasien.",
    highlights: ["Kredensial dan izin praktik diverifikasi", "Penugasan berbasis kebutuhan pasien", "Handover dan eskalasi terdokumentasi"],
  },
  pasien: {
    summary: "Ruang pasien menyatukan jadwal, rencana perawatan, hasil pemeriksaan, obat, monitoring, dan tagihan dalam akses yang dilindungi.",
    highlights: ["Akses data berdasarkan identitas", "Riwayat pelayanan terhubung", "Kontrol privasi dan audit akses"],
  },
  "keluarga-caregiver": {
    summary: "Caregiver dapat mendampingi pasien berdasarkan persetujuan, ruang lingkup akses, dan masa berlaku yang ditetapkan.",
    highlights: ["Kondisi dan jadwal pasien", "Instruksi perawatan serta obat", "Komunikasi aman dengan tim kesehatan"],
    safety: "Akses caregiver tidak menggantikan keputusan pasien atau penilaian klinis tenaga kesehatan.",
  },
  "monitoring-pasien": {
    summary: "Monitoring menampilkan tren tanda vital dan kondisi pasien untuk mendukung penilaian klinis serta eskalasi yang tepat waktu.",
    highlights: ["Grafik berdasarkan waktu", "Indikator perubahan kondisi", "Early Warning System berbasis protokol"],
    safety: "Satu nilai tidak digunakan untuk membuat diagnosis otomatis. Alert harus dinilai bersama kondisi klinis pasien.",
  },
  pemesanan: {
    summary: "Permintaan layanan diteruskan kepada koordinator untuk verifikasi kebutuhan, cakupan wilayah, tenaga tersedia, dan jadwal.",
    highlights: ["Permintaan tercatat", "Asesmen dan konfirmasi", "Jadwal serta status dapat dipantau"],
  },
  "farmasi-obat": {
    summary: "Informasi obat terhubung dengan order, jadwal pemberian, riwayat administrasi, dan instruksi tim klinis.",
    highlights: ["Order dan resep terverifikasi", "Jadwal serta riwayat pemberian", "Koordinasi pengantaran dan pengisian ulang"],
    safety: "Jangan mengubah dosis, menghentikan, atau menambah obat tanpa instruksi tenaga kesehatan yang berwenang.",
  },
  pembayaran: {
    summary: "Pasien dapat melihat tarif, tagihan, status pembayaran, dan informasi penjamin melalui kanal yang transparan dan terlindungi.",
    highlights: ["Rincian biaya", "Status transaksi", "Informasi asuransi dan BPJS/JKN"],
  },
  "edukasi-kesehatan": {
    summary: "Materi edukasi membantu pasien dan keluarga memahami perawatan di rumah, penggunaan obat, nutrisi, serta tanda bahaya.",
    highlights: ["Bahasa praktis dan mudah dipahami", "Tanda bahaya dan tindak lanjut", "Materi sesuai kebutuhan pasien"],
    safety: "Materi edukasi bersifat pendukung dan tidak menggantikan konsultasi atau instruksi individual tenaga kesehatan.",
  },
  mitra: {
    summary: "Kemitraan mendukung kesinambungan rujukan, diagnostik, farmasi, pendidikan, pembiayaan, dan mutu pelayanan.",
    highlights: ["Ruang lingkup kerja sama jelas", "Perlindungan data", "Koordinasi dan evaluasi mutu"],
  },
  informasi: {
    summary: "Berita, kegiatan, pengumuman, FAQ, dan dokumen resmi dikelola melalui kanal informasi terverifikasi.",
    highlights: ["Sumber dan versi jelas", "Pembaruan berkala", "Kanal tindak lanjut resmi"],
  },
  kontak: {
    summary: "Gunakan kanal resmi untuk pertanyaan layanan, lokasi, kritik, saran, atau pengaduan.",
    highlights: ["Nomor tiket untuk permintaan", "SLA respons transparan", "Eskalasi pengaduan terdokumentasi"],
  },
};

const serviceSummaries: Record<string, string> = {
  "kunjungan-dokter": "Dokter melakukan asesmen, evaluasi terapi, dan tindak lanjut di rumah sesuai kebutuhan serta kewenangan klinis.",
  "home-nursing-keperawatan-di-rumah": "Perawat memberikan asesmen keperawatan, pemantauan, tindakan, edukasi, dan dokumentasi berdasarkan rencana asuhan.",
  "pemeriksaan-laboratorium-di-rumah": "Pengambilan spesimen dan koordinasi hasil dilakukan dengan identifikasi pasien, pelabelan, serta alur hasil kritis yang aman.",
  "farmasi-dan-pengantaran-obat": "Obat disiapkan dari order yang terverifikasi dan dikoordinasikan bersama instruksi penggunaan serta pengantaran.",
  fisioterapi: "Program fisioterapi disusun berdasarkan penilaian fungsi, tujuan pasien, keamanan lingkungan, dan evaluasi berkala.",
  rehabilitasi: "Rehabilitasi mengoordinasikan tujuan fungsi, aktivitas, latihan, edukasi, dan tindak lanjut lintas profesi.",
  "perawatan-luka": "Perawatan luka mencakup asesmen, tindakan sesuai kompetensi, dokumentasi perkembangan, edukasi, dan eskalasi tanda infeksi.",
  "perawatan-paliatif": "Pendampingan paliatif berfokus pada kenyamanan, pengendalian gejala, tujuan perawatan, serta dukungan pasien dan keluarga.",
  "manajemen-penyakit-kronis": "Pemantauan kondisi kronis menghubungkan target individual, obat, gaya hidup, pemeriksaan, dan evaluasi berkala.",
  "perawatan-pasca-rawat-inap": "Transisi dari rumah sakit ke rumah mencakup rekonsiliasi informasi, obat, jadwal kontrol, dan pemantauan tanda bahaya.",
  "perawatan-lansia": "Perawatan lansia mempertimbangkan fungsi, risiko jatuh, nutrisi, obat, kognisi, dukungan keluarga, dan tujuan pasien.",
  "perawatan-ibu-dan-anak": "Pelayanan ibu dan anak diberikan sesuai usia, kondisi, kebutuhan keluarga, serta indikasi rujukan yang aman.",
  telekonsultasi: "Telekonsultasi menyediakan komunikasi terjadwal dengan tenaga kesehatan dan tidak digunakan sebagai pengganti penanganan darurat.",
};

export function publicPageContent(section: string, slug: string, item: string): PublicPageContent {
  const base = sectionContent[section] ?? {
    summary: `${item} merupakan bagian dari layanan Hospital at Home yang terkoordinasi.`,
    highlights: ["Informasi layanan", "Alur dan persyaratan", "Kanal tindak lanjut"],
  };
  const serviceSummary = section === "layanan" ? serviceSummaries[slug] : undefined;
  return { ...base, summary: serviceSummary ?? base.summary };
}

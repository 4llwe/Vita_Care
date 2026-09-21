import { publicHref } from "./public-menu";

export type MegaColumn = { title: string; description?: string; items: { label: string; href: string; note?: string }[] };
export type MegaMenu = { key: string; label: string; icon: string; columns: MegaColumn[]; action?: { label: string; href: string }; notice?: string };
const i=(section:string,labels:string[])=>labels.map(label=>({label,href:publicHref(section,label)}));
export const MEGA_MENUS: MegaMenu[] = [
 {key:"beranda",label:"Beranda",icon:"⌂",columns:[
  {title:"Ringkasan",description:"Kenali model pelayanan Vita Care.",items:i("beranda",["Tentang Vita Care","Cara Kerja","Keunggulan Layanan","Alur Pelayanan"])},
  {title:"Informasi",description:"Informasi mutu dan pengalaman layanan.",items:i("beranda",["Layanan Unggulan","Statistik Layanan","Testimoni","FAQ"])},
  {title:"Aksi Cepat",description:"Mulai kebutuhan Anda.",items:[{label:"Pesan Layanan",href:"/informasi/pemesanan/pesan-layanan-sekarang"},{label:"Konsultasi",href:"/informasi/layanan/telekonsultasi"},{label:"Hubungi Kami",href:"/informasi/kontak/hubungi-kami"}]}
 ]},
 {key:"tentang-kami",label:"Tentang Kami",icon:"✦",columns:[
  {title:"Profil Vita Care",items:i("tentang-kami",["Profil Vita Care Hospital At Home","Visi & Misi","Tujuan","Nilai Pelayanan"])},
  {title:"Organisasi",items:i("tentang-kami",["Tim Kesehatan","Koordinator Pelayanan","Struktur Organisasi"])},
  {title:"Kredibilitas",items:i("tentang-kami",["Legalitas","Akreditasi","Keselamatan Pasien","Mitra Fasilitas Kesehatan"])},
  {title:"Lokasi",description:"Mataram, Lombok, Nusa Tenggara Barat",items:[{label:"Lihat lokasi pelayanan",href:"/informasi/kontak/lokasi"}]}
 ]},
 {key:"layanan",label:"Layanan",icon:"✚",columns:[
  {title:"Pelayanan Medis",items:i("layanan",["Kunjungan Dokter","Home Nursing","Telekonsultasi","Manajemen Penyakit Kronis","Perawatan Pasca-Rawat Inap"])},
  {title:"Keperawatan",items:i("layanan",["Perawatan Luka","Perawatan Lansia","Perawatan Paliatif","Monitoring Kondisi Pasien","Edukasi Kesehatan"])},
  {title:"Penunjang",items:i("layanan",["Laboratorium di Rumah","Farmasi & Pengantaran Obat","Fisioterapi","Rehabilitasi","Konsultasi Gizi"])},
  {title:"Ibu & Anak",items:i("layanan",["Perawatan Ibu","Perawatan Bayi","Perawatan Anak","Edukasi Keluarga"])}
 ],action:{label:"Lihat semua layanan →",href:"/direktori#layanan"}},
 {key:"tim-kesehatan",label:"Tim Kesehatan",icon:"♙",columns:[
  {title:"Tenaga Medis",items:i("tim-kesehatan",["Dokter","Dokter Spesialis"])},
  {title:"Tenaga Keperawatan",items:i("tim-kesehatan",["Perawat","Care Coordinator"])},
  {title:"Tenaga Kesehatan Lainnya",items:i("tim-kesehatan",["Bidan","Fisioterapis","Ahli Gizi","Farmasis"])}
 ],notice:"Profil menampilkan foto, gelar, profesi, kompetensi, jadwal, dan ringkasan profesional."},
 {key:"pasien",label:"Pasien & Keluarga",icon:"♡",columns:[
  {title:"Pasien",items:i("pasien",["Profil Pasien","Rekam Medis","Rencana Perawatan","Jadwal Kunjungan","Hasil Laboratorium","Resep & Obat","Riwayat Pelayanan"])},
  {title:"Keluarga & Caregiver",items:i("keluarga-caregiver",["Kondisi Pasien","Jadwal Perawatan","Instruksi Perawatan","Pengingat Obat","Edukasi Caregiver","Komunikasi dengan Tim Kesehatan"])},
  {title:"Akses Cepat",items:[{label:"Pesan Layanan",href:"/informasi/pemesanan/pesan-layanan-sekarang"},{label:"Chat Tenaga Kesehatan",href:"/login"},{label:"Kontak Darurat",href:"/informasi/kontak/kontak-darurat"}]}
 ]},
 {key:"monitoring-pasien",label:"Monitoring",icon:"⌁",columns:[
  {title:"Monitoring Klinis",items:i("monitoring-pasien",["Tanda Vital","Tekanan Darah","Denyut Jantung","SpO₂","Suhu","Frekuensi Napas","Gula Darah","Berat Badan","Skala Nyeri"])},
  {title:"Clinical Monitoring",items:i("monitoring-pasien",["Status Pasien","Grafik Perkembangan","Early Warning System","Clinical Alert","Riwayat Monitoring"])},
  {title:"Status Pasien",items:[{label:"🟢 Stabil",href:"/informasi/monitoring-pasien/status-pasien"},{label:"🟡 Perlu Pemantauan",href:"/informasi/monitoring-pasien/status-pasien"},{label:"🟠 Perlu Perhatian",href:"/informasi/monitoring-pasien/status-pasien"},{label:"🔴 Darurat",href:"/informasi/kontak/kontak-darurat"}]}
 ],notice:"Clinical alert adalah alat bantu pemantauan, bukan diagnosis otomatis. Keputusan klinis tetap pada tenaga kesehatan."},
 {key:"pemesanan",label:"Pemesanan",icon:"▣",columns:[
  {title:"Pesan Layanan",items:i("pemesanan",["Kunjungan Dokter","Kunjungan Perawat","Laboratorium","Fisioterapi","Telekonsultasi","Pengantaran Obat"])},
  {title:"Jadwal",items:i("pemesanan",["Jadwal Mendatang","Ubah Jadwal","Batalkan Jadwal","Riwayat Pemesanan"])},
  {title:"Siap memulai?",description:"Tim kami membantu memilih layanan yang tepat.",items:[{label:"Pesan layanan sekarang",href:"/informasi/pemesanan/pesan-layanan-sekarang"}]}
 ],action:{label:"Pesan layanan sekarang",href:"/informasi/pemesanan/pesan-layanan-sekarang"}},
 {key:"edukasi-kesehatan",label:"Edukasi",icon:"◫",columns:[
  {title:"Penyakit Kronis",items:i("edukasi-kesehatan",["Diabetes","Hipertensi","Stroke","Gagal Jantung","PPOK","Penyakit Ginjal"])},
  {title:"Perawatan di Rumah",items:i("edukasi-kesehatan",["Perawatan Luka","Penggunaan Obat","Nutrisi","Mobilisasi","Pencegahan Jatuh","Perawatan Lansia"])},
  {title:"Media",items:i("edukasi-kesehatan",["Artikel","Video","Infografis","Panduan PDF"])}
 ]},
 {key:"informasi",label:"Informasi",icon:"i",columns:[
  {title:"Informasi Vita Care",items:i("informasi",["Berita","Kegiatan","Program Kesehatan","Pengumuman","FAQ"])},
  {title:"Pusat Informasi",items:i("informasi",["Panduan Pasien","Pusat Unduhan","Kebijakan Privasi","Syarat & Ketentuan"])}
 ]},
 {key:"kontak",label:"Kontak",icon:"☎",columns:[
  {title:"Vita Care Hospital At Home",description:"Mataram, Lombok, Nusa Tenggara Barat, Indonesia",items:i("kontak",["Alamat","Telepon","WhatsApp","Email"])},
  {title:"Pelayanan",items:i("kontak",["Jam Pelayanan","Lokasi","Kontak Darurat","Kritik & Saran","Pengaduan"])},
  {title:"Hubungi Vita Care",description:"Gunakan kanal resmi untuk informasi dan koordinasi pelayanan.",items:[{label:"Hubungi Vita Care",href:"/informasi/kontak/hubungi-kami"}]}
 ],action:{label:"Hubungi Vita Care",href:"/informasi/kontak/hubungi-kami"}}
];

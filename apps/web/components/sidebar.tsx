"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe, personaFor, ROLE_LABEL, type ClinicalPersona, type Session } from "../lib/session";

type Item = { href: string; label: string };
const asItems = (rows: string[][]): Item[] => rows.map(([href, label]) => ({ href, label }));

const menus: Record<ClinicalPersona, Item[]> = {
  admin: asItems([
    ["/dashboard", "Dashboard"], ["/notifications", "Notifikasi Klinis"],
    ["/hah", "Manajemen Pasien"], ["/master", "Tenaga Kesehatan & Layanan"],
    ["/bookings", "Jadwal"], ["/workspace/farmasi", "Farmasi"],
    ["/workspace/laboratorium", "Laboratorium"], ["/invoices", "Pembayaran"],
    ["/referrals", "Rujukan"], ["/workspace/laporan", "Laporan"],
    ["/workspace/pengguna", "Manajemen Pengguna"], ["/workspace/pengaturan", "Pengaturan Sistem"],
    ["/clinical-protocol", "Protokol EWS"], ["/service-requests", "Permintaan Layanan"],
    ["/menu-management", "Manajemen Menu"],
  ]),
  doctor: asItems([
    ["/dashboard", "Dashboard Dokter"], ["/notifications", "Notifikasi Klinis"],
    ["/hah", "Daftar Pasien"], ["/monitoring", "Monitoring Pasien"],
    ["/medical-records/new", "Rekam Medis"], ["/workspace/rencana-terapi", "Rencana Terapi"],
    ["/workspace/resep", "Resep"], ["/workspace/hasil-laboratorium", "Hasil Laboratorium"],
    ["/bookings", "Jadwal Kunjungan"], ["/workspace/telekonsultasi", "Telekonsultasi"],
    ["/referrals", "Rujukan"], ["/workspace/laporan", "Laporan"],
  ]),
  nurse: asItems([
    ["/dashboard", "Dashboard Perawat"], ["/notifications", "Notifikasi Klinis"],
    ["/hah", "Pasien Tugas"], ["/bookings", "Jadwal Kunjungan"],
    ["/workspace/asesmen-keperawatan", "Asesmen Keperawatan"], ["/monitoring", "Tanda Vital"],
    ["/workspace/rencana-asuhan", "Rencana Asuhan"], ["/workspace/pemberian-obat", "Pemberian Obat"],
    ["/workspace/perawatan-luka", "Perawatan Luka"], ["/workspace/edukasi-pasien", "Edukasi Pasien"],
    ["/hah?focus=alerts", "Eskalasi Klinis"], ["/workspace/laporan", "Laporan"],
  ]),
  finance: asItems([
    ["/dashboard", "Dashboard Keuangan"], ["/invoices", "Tagihan & Pembayaran"],
    ["/master", "Paket & Daftar Tarif"], ["/workspace/asuransi", "Asuransi"],
    ["/workspace/bpjs", "BPJS / JKN"], ["/workspace/laporan", "Laporan Keuangan"],
  ]),
  patient: asItems([
    ["/dashboard", "Dashboard Pasien"], ["/portal", "Pesan Layanan"],
    ["/workspace/profil-pasien", "Profil Pasien"], ["/bookings", "Jadwal Kunjungan"],
    ["/workspace/rencana-perawatan", "Rencana Perawatan"], ["/workspace/rekam-medis", "Rekam Medis"],
    ["/workspace/hasil-laboratorium", "Hasil Laboratorium"], ["/workspace/resep-obat", "Resep & Obat"],
    ["/monitoring", "Monitoring Kondisi"], ["/workspace/riwayat-pelayanan", "Riwayat Pelayanan"],
    ["/invoices", "Tagihan"], ["/workspace/edukasi-pasien", "Edukasi Pasien"],
  ]),
  caregiver: asItems([
    ["/dashboard", "Dashboard Keluarga"], ["/workspace/keluarga", "Kondisi Pasien"],
    ["/bookings", "Jadwal Perawatan"], ["/workspace/rencana-perawatan", "Instruksi Perawatan"],
    ["/workspace/resep-obat", "Pengingat Obat"], ["/workspace/edukasi-pasien", "Edukasi Caregiver"],
    ["/monitoring", "Monitoring Kondisi"], ["/workspace/keluarga", "Komunikasi Tim"],
  ]),
  governance: asItems([
    ["/dashboard", "Dashboard"], ["/hah", "Hospital at Home"],
    ["/findings", "Temuan"], ["/audits", "Audit & Checklist"],
    ["/risks", "Risiko"], ["/capa", "CAPA"], ["/documents", "Dokumen"],
    ["/referrals", "Rujukan"], ["/workspace/laporan", "Laporan"],
  ]),
};

export function Sidebar() {
  const path = usePathname();
  const [me, setMe] = useState<Session | null>(null);
  useEffect(() => { fetchMe().then(setMe).catch(() => setMe(null)); }, []);
  const items = menus[personaFor(me)];
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 border-b px-3 pb-3">
          <p className="truncate text-sm font-extrabold text-slate-900">{me?.name ?? "Memuat profil…"}</p>
          <p className="text-xs font-semibold text-slate-500">
            {me?.healthWorkerProfile?.profession ?? (me ? ROLE_LABEL[me.role] : "Sesi aman")}
          </p>
        </div>
        <nav className="max-h-[calc(100vh-11rem)] space-y-1 overflow-y-auto" aria-label="Navigasi dashboard">
          {items.map((item, index) => {
            const target = item.href.split("?")[0];
            const active = path === target || path.startsWith(`${target}/`);
            return (
              <Link key={`${item.href}-${index}`} href={item.href}
                className={`block rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

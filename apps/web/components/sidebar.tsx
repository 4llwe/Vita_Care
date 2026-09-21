"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe, type Session } from "../lib/session";
type Item = { href: string; label: string };
const admin: Item[] = [
  ["/dashboard", "Dashboard"],
  ["/notifications", "Notifikasi Klinis"],
  ["/hah", "Manajemen Pasien"],
  ["/master", "Manajemen Tenaga Kesehatan"],
  ["/bookings", "Jadwal"],
  ["/master", "Layanan"],
  ["/workspace/farmasi", "Farmasi"],
  ["/workspace/laboratorium", "Laboratorium"],
  ["/invoices", "Pembayaran"],
  ["/referrals", "Rujukan"],
  ["/workspace/laporan", "Laporan"],
  ["/workspace/pengguna", "Manajemen Pengguna"],
  ["/workspace/pengaturan", "Pengaturan Sistem"],
  ["/clinical-protocol", "Protokol EWS"],
  ["/service-requests", "Permintaan Layanan"],
  ["/menu-management", "Manajemen Menu"],
].map(([href, label]) => ({ href, label }));
const doctor: Item[] = [
  ["/dashboard", "Dashboard"],
  ["/notifications", "Notifikasi Klinis"],
  ["/hah", "Daftar Pasien"],
  ["/monitoring", "Monitoring Pasien"],
  ["/medical-records/new", "Rekam Medis"],
  ["/workspace/rencana-terapi", "Rencana Terapi"],
  ["/workspace/resep", "Resep"],
  ["/workspace/hasil-laboratorium", "Hasil Laboratorium"],
  ["/bookings", "Jadwal Kunjungan"],
  ["/workspace/telekonsultasi", "Telekonsultasi"],
  ["/referrals", "Rujukan"],
  ["/workspace/laporan", "Laporan"],
].map(([href, label]) => ({ href, label }));
const nurse: Item[] = [
  ["/dashboard", "Dashboard"],
  ["/notifications", "Notifikasi Klinis"],
  ["/hah", "Pasien Tugas"],
  ["/bookings", "Jadwal Kunjungan"],
  ["/workspace/asesmen-keperawatan", "Asesmen Keperawatan"],
  ["/monitoring", "Tanda Vital"],
  ["/workspace/rencana-asuhan", "Rencana Asuhan"],
  ["/workspace/pemberian-obat", "Pemberian Obat"],
  ["/workspace/perawatan-luka", "Perawatan Luka"],
  ["/workspace/edukasi-pasien", "Edukasi Pasien"],
  ["/hah?focus=alerts", "Eskalasi Klinis"],
  ["/workspace/laporan", "Laporan"],
].map(([href, label]) => ({ href, label }));
const patient: Item[] = [
  ["/portal", "Ringkasan Pasien"],
  ["/workspace/profil-pasien", "Profil Pasien"],
  ["/bookings", "Jadwal Kunjungan"],
  ["/workspace/rencana-perawatan", "Rencana Perawatan"],
  ["/workspace/rekam-medis", "Rekam Medis"],
  ["/workspace/hasil-laboratorium", "Hasil Laboratorium"],
  ["/workspace/resep-obat", "Resep & Obat"],
  ["/monitoring", "Monitoring Kondisi"],
  ["/workspace/riwayat-pelayanan", "Riwayat Pelayanan"],
  ["/invoices", "Tagihan"],
  ["/workspace/edukasi-pasien", "Edukasi Pasien"],
  ["/workspace/keluarga", "Keluarga & Caregiver"],
].map(([href, label]) => ({ href, label }));
const governance: Item[] = [
  ["/dashboard", "Dashboard"],
  ["/hah", "Vita Care Hospital At Home"],
  ["/findings", "Temuan"],
  ["/audits", "Audit & Checklist"],
  ["/risks", "Risiko"],
  ["/capa", "CAPA"],
  ["/documents", "Dokumen"],
  ["/referrals", "Rujukan"],
  ["/workspace/laporan", "Laporan"],
].map(([href, label]) => ({ href, label }));
export function Sidebar() {
  const path = usePathname();
  const [me, setMe] = useState<Session | null>(null);
  useEffect(() => {
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);
  let items: Item[] = [{ href: "/dashboard", label: "Dashboard" }];
  if (me?.role === "SUPER_ADMIN" || me?.role === "COORDINATOR") items = admin;
  else if (me?.role === "PATIENT" || me?.role === "CAREGIVER") items = patient;
  else if (me?.role === "HEALTH_WORKER")
    items = (me.healthWorkerProfile?.profession ?? "").toLowerCase().includes("perawat")
      ? nurse
      : doctor;
  else if (me) items = governance;
  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-3 border-b px-3 pb-3">
          <p className="truncate text-sm font-extrabold text-slate-900">
            {me?.name ?? "Memuat profil…"}
          </p>
          <p className="text-xs font-semibold text-slate-500">
            {me?.healthWorkerProfile?.profession ??
              me?.role?.replace(/_/g, " ") ??
              "Sesi aman"}
          </p>
        </div>
        <nav className="max-h-[calc(100vh-11rem)] space-y-1 overflow-y-auto">
          {items.map((n, i) => {
            const active =
              path === n.href.split("?")[0] ||
              path.startsWith(n.href.split("?")[0] + "/");
            return (
              <Link
                key={`${n.href}-${i}`}
                href={n.href}
                className={`block rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-teal-50 hover:text-teal-800"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

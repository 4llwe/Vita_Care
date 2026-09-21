"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const label: Record<string, string> = {
  dashboard: "Dashboard",
  hah: "Vita Care Hospital At Home",
  monitoring: "Monitoring Pasien",
  workspace: "Ruang Kerja",
  bookings: "Pemesanan",
  invoices: "Pembayaran",
  master: "Master Data",
  referrals: "Rujukan",
  notifications: "Notifikasi Klinis",
  "clinical-protocol": "Protokol EWS",
  "service-requests": "Permintaan Layanan",
  "menu-management": "Manajemen Menu",
};
export function Breadcrumbs() {
  const p = usePathname().split("/").filter(Boolean);
  return (
    <nav className="mb-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
      <Link href="/dashboard">Beranda kerja</Link>
      {p
        .filter((x) => x !== "dashboard")
        .map((x, i) => (
          <span key={`${x}-${i}`} className="flex gap-2">
            <span>/</span>
            <span className="text-slate-700">{label[x] ?? x.replace(/-/g, " ")}</span>
          </span>
        ))}
    </nav>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe, personaFor, type ClinicalPersona, type Session } from "../lib/session";
import { EmergencyButton } from "./emergency-button";

const menu: Record<ClinicalPersona, readonly (readonly [string, string])[]> = {
  admin: [["/dashboard", "Beranda"], ["/hah", "Pasien"], ["/bookings", "Jadwal"], ["/master", "Kelola"]],
  doctor: [["/dashboard", "Beranda"], ["/hah", "Pasien"], ["/monitoring", "Monitor"], ["/diagnostics", "Lab"]],
  nurse: [["/dashboard", "Beranda"], ["/tasks", "Tugas"], ["/monitoring", "Vital"], ["/diagnostics", "Lab"]],
  finance: [["/dashboard", "Beranda"], ["/invoices", "Tagihan"], ["/master", "Tarif"], ["/reports", "Laporan"]],
  patient: [["/dashboard", "Beranda"], ["/portal", "Layanan"], ["/monitoring", "Kondisi"], ["/pharmacy", "Obat"]],
  caregiver: [["/dashboard", "Beranda"], ["/workspace/keluarga", "Pasien"], ["/monitoring", "Kondisi"], ["/pharmacy", "Obat"]],
  governance: [["/dashboard", "Beranda"], ["/findings", "Temuan"], ["/risks", "Risiko"], ["/documents", "Dokumen"]],
};

export function MobileNav() {
  const path = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { fetchMe().then(setSession).catch(() => setSession(null)); }, []);
  const items = menu[personaFor(session)];
  const link = ([href, label]: readonly [string, string]) => (
    <Link key={href} href={href}
      className={`grid min-h-11 place-items-center rounded-lg text-center text-[11px] font-bold ${path.startsWith(href) ? "bg-teal-50 text-teal-800" : "text-slate-500"}`}>
      {label}
    </Link>
  );
  return (
    <nav aria-label="Navigasi utama mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t bg-white px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,.08)] md:hidden">
      {items.slice(0, 2).map(link)}
      <div className="-mt-7 flex justify-center"><EmergencyButton compact /></div>
      {items.slice(2).map(link)}
    </nav>
  );
}

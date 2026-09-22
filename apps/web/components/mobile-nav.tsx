"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMe, personaFor, type Session } from "../lib/session";
import { EmergencyButton } from "./emergency-button";

const menu = {
  admin: [
    ["/dashboard", "Beranda"],
    ["/hah", "Pasien"],
    ["/bookings", "Jadwal"],
    ["/master", "Kelola"],
  ],
  doctor: [
    ["/dashboard", "Beranda"],
    ["/hah", "Pasien"],
    ["/monitoring", "Monitor"],
    ["/bookings", "Jadwal"],
  ],
  nurse: [
    ["/dashboard", "Beranda"],
    ["/hah", "Tugas"],
    ["/monitoring", "Vital"],
    ["/bookings", "Jadwal"],
  ],
  patient: [
    ["/dashboard", "Beranda"],
    ["/portal", "Layanan"],
    ["/monitoring", "Kondisi"],
    ["/workspace/keluarga", "Keluarga"],
  ],
  governance: [
    ["/dashboard", "Beranda"],
    ["/findings", "Temuan"],
    ["/risks", "Risiko"],
    ["/documents", "Dokumen"],
  ],
} as const;

export function MobileNav() {
  const path = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    fetchMe()
      .then(setSession)
      .catch(() => setSession(null));
  }, []);
  const items = menu[personaFor(session)];
  return (
    <nav
      aria-label="Navigasi utama mobile"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 items-end border-t bg-white px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_30px_rgba(15,23,42,.08)] md:hidden"
    >
      {items.slice(0, 2).map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`grid min-h-11 place-items-center rounded-lg text-center text-[11px] font-bold ${path.startsWith(href) ? "bg-teal-50 text-teal-800" : "text-slate-500"}`}
        >
          {label}
        </Link>
      ))}
      <div className="-mt-7 flex justify-center">
        <EmergencyButton compact />
      </div>
      {items.slice(2).map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={`grid min-h-11 place-items-center rounded-lg text-center text-[11px] font-bold ${path.startsWith(href) ? "bg-teal-50 text-teal-800" : "text-slate-500"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

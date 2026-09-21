"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
const actions = [
  ["Hubungi Tim Medis Vita Care", "NEXT_PUBLIC_MEDICAL_TEAM_PHONE"],
  ["Hubungi Rumah Sakit", "NEXT_PUBLIC_HOSPITAL_PHONE"],
  ["Panggil Ambulans", "NEXT_PUBLIC_AMBULANCE_PHONE"],
] as const;
export function EmergencyButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false),
    [location, setLocation] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null),
    triggerRef = useRef<HTMLButtonElement>(null);
  const numbers: Record<string, string | undefined> = {
    NEXT_PUBLIC_MEDICAL_TEAM_PHONE: process.env.NEXT_PUBLIC_MEDICAL_TEAM_PHONE,
    NEXT_PUBLIC_HOSPITAL_PHONE: process.env.NEXT_PUBLIC_HOSPITAL_PHONE,
    NEXT_PUBLIC_AMBULANCE_PHONE: process.env.NEXT_PUBLIC_AMBULANCE_PHONE,
  };
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  function close() {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  }
  function locate() {
    if (!navigator.geolocation) return setLocation("Lokasi tidak didukung perangkat.");
    setLocation("Mengambil lokasi…");
    navigator.geolocation.getCurrentPosition(
      (p) =>
        setLocation(`${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)}`),
      () => setLocation("Izin lokasi tidak diberikan."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
  async function shareLocation() {
    if (!location.includes(",")) return locate();
    const url = "https:" + "//maps.google.com/?q=" + encodeURIComponent(location);
    if (navigator.share)
      await navigator
        .share({
          title: "Lokasi pasien",
          text: "Lokasi pasien saat meminta bantuan",
          url,
        })
        .catch(() => undefined);
    else await navigator.clipboard?.writeText(url);
  }
  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 font-extrabold text-white shadow-sm hover:bg-red-700 focus:ring-4 focus:ring-red-200 ${compact ? "px-3" : "px-4"}`}
        aria-label="Buka bantuan darurat"
        aria-haspopup="dialog"
      >
        {compact ? "🚨" : "🚨 DARURAT"}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-end bg-slate-950/60 backdrop-blur-sm sm:place-items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-title"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) close();
          }}
        >
          <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-red-600">
                  Pusat bantuan cepat
                </p>
                <h2
                  id="emergency-title"
                  className="mt-1 text-2xl font-extrabold text-slate-950"
                >
                  KONDISI DARURAT?
                </h2>
              </div>
              <button
                ref={closeRef}
                onClick={close}
                className="min-h-11 rounded-full border px-4 text-slate-600"
                aria-label="Tutup bantuan darurat"
              >
                Tutup
              </button>
            </div>
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-900">
              Jika pasien mengalami kondisi yang mengancam nyawa, segera gunakan layanan
              kegawatdaruratan.
            </div>
            <div className="mt-5 grid gap-3">
              {actions.map(([label, key]) => {
                const number = numbers[key];
                return number ? (
                  <a
                    key={key}
                    href={`tel:${number}`}
                    className="min-h-14 rounded-2xl border border-slate-200 p-4 font-bold text-slate-800 hover:border-red-300 hover:bg-red-50"
                  >
                    {label}
                    <span className="block text-sm font-medium text-slate-500">
                      {number}
                    </span>
                  </a>
                ) : (
                  <div
                    key={key}
                    className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500"
                  >
                    <b className="block text-slate-700">{label}</b>Nomor belum
                    dikonfigurasi oleh administrator.
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={location ? shareLocation : locate}
                className="min-h-20 rounded-2xl border p-4 text-left text-sm font-bold text-slate-700"
              >
                Bagikan Lokasi Pasien
                <span className="mt-1 block break-all text-xs font-medium text-slate-500">
                  {location || "Ambil dan bagikan koordinat"}
                </span>
              </button>
              <Link
                href="/workspace/rekam-medis"
                onClick={close}
                className="min-h-20 rounded-2xl border p-4 text-sm font-bold text-slate-700"
              >
                Tampilkan Ringkasan Medis
                <span className="mt-1 block text-xs font-medium text-slate-500">
                  Diagnosis, obat, alergi, dan alert
                </span>
              </Link>
              <Link
                href="/workspace/keluarga"
                onClick={close}
                className="col-span-2 min-h-16 rounded-2xl border p-4 text-sm font-bold text-slate-700"
              >
                Hubungi Keluarga
                <span className="mt-1 block text-xs font-medium text-slate-500">
                  Caregiver dan rencana darurat pasien
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

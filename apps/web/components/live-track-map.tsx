"use client";

import type { MyBooking } from "../lib/types";

function relTime(iso?: string | null): string {
  if (!iso) return "—";
  const s = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (s < 60) return `${s} detik lalu`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} menit lalu`;
  const h = Math.round(m / 60);
  return `${h} jam lalu`;
}

/**
 * Peta pelacakan posisi nakes secara real-time untuk pasien.
 * Bila lokasi nakes & alamat tersedia, tampilkan rute; jika belum,
 * tampilkan pesan menunggu.
 */
export function LiveTrackMap({ detail }: { detail: MyBooking }) {
  const hasWorker = detail.workerLat != null && detail.workerLng != null;
  const hasAddr = detail.addressLat != null && detail.addressLng != null;

  if (!hasWorker) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
        <span className="mr-1">🚗</span> Menunggu nakes membagikan lokasi
        perjalanan...
      </div>
    );
  }

  const worker = `${detail.workerLat},${detail.workerLng}`;
  const src = hasAddr
    ? `https://maps.google.com/maps?saddr=${worker}&daddr=${detail.addressLat},${detail.addressLng}&z=14&output=embed`
    : `https://maps.google.com/maps?q=${worker}&z=15&output=embed`;
  const openUrl = `https://www.google.com/maps?q=${worker}`;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{" "}
          Posisi nakes live
        </span>
        <span className="text-[11px] text-slate-400">
          Diperbarui {relTime(detail.workerLocAt)}
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-emerald-200">
        <iframe
          title="Posisi nakes"
          className="h-56 w-full"
          loading="lazy"
          src={src}
        />
        <a
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          className="block bg-emerald-50 px-3 py-2 text-xs font-bold text-vita-blue hover:underline"
        >
          Buka posisi nakes di Google Maps ↗
        </a>
      </div>
    </div>
  );
}

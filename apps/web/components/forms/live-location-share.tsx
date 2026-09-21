"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";

/**
 * Kontrol nakes untuk membagikan posisi secara berkala saat "Dalam Perjalanan".
 * Menggunakan watchPosition + throttle ~10 detik agar tidak membanjiri API.
 */
export function LiveLocationShare({ id }: { id: string }) {
  const [sharing, setSharing] = useState(false);
  const [last, setLast] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  function stop() {
    if (watchRef.current != null && "geolocation" in navigator) {
      navigator.geolocation.clearWatch(watchRef.current);
    }
    watchRef.current = null;
    setSharing(false);
  }

  // Bersihkan watcher saat komponen di-unmount.
  useEffect(() => () => stop(), []);

  function start() {
    if (!("geolocation" in navigator)) {
      setError("Perangkat tidak mendukung geolokasi.");
      return;
    }
    setError(null);
    setSharing(true);
    lastSentRef.current = 0;
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        if (now - lastSentRef.current < 10_000) return; // throttle ~10 detik
        lastSentRef.current = now;
        try {
          await api(`/bookings/${id}/location`, {
            token: getToken(),
            method: "PATCH",
            body: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            },
          });
          setLast(new Date());
        } catch (e) {
          setError(e instanceof Error ? e.message : "Gagal mengirim lokasi");
        }
      },
      (err) => setError(`Lokasi: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sharing ? (
        <button
          type="button"
          onClick={stop}
          className="flex items-center gap-1 rounded-lg bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-700"
        >
          ⏹ Stop lokasi
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          className="flex items-center gap-1 rounded-lg bg-vita-blue px-2 py-1 text-xs font-bold text-white hover:bg-vita-blueDark"
        >
          📍 Bagikan lokasi
        </button>
      )}
      {sharing ? (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />{" "}
          Live
        </span>
      ) : null}
      {last ? (
        <span className="text-[11px] text-slate-400">
          Terkirim {last.toLocaleTimeString("id-ID")}
        </span>
      ) : null}
      {error ? <span className="text-[11px] text-red-600">{error}</span> : null}
    </div>
  );
}

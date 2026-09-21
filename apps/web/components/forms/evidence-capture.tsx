"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { uploadFile } from "../../lib/upload";

type Geo = { latitude: number; longitude: number; accuracy?: number };

/**
 * Tangkap bukti audit: foto (kamera/galeri) + geolokasi + timestamp.
 * Alur: ambil lokasi -> unggah berkas -> daftarkan evidence ke pelaksanaan audit.
 */
export function EvidenceCapture({
  executionId,
  answerId,
  onAdded,
}: {
  executionId: string;
  answerId?: string;
  onAdded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      setError("Perangkat tidak mendukung geolokasi.");
      return;
    }
    setGeoBusy(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoBusy(false);
      },
      (err) => {
        setError(`Gagal mengambil lokasi: ${err.message}`);
        setGeoBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Pilih atau ambil foto terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fileUrl = await uploadFile(file, `audit-evidence/${executionId}`);
      await api(`/audits/executions/${executionId}/evidence`, {
        token: getToken(),
        method: "POST",
        body: {
          fileUrl,
          answerId,
          caption: caption || undefined,
          latitude: geo?.latitude,
          longitude: geo?.longitude,
          accuracy: geo?.accuracy,
          capturedAt: new Date().toISOString(),
        },
      });
      setFile(null);
      setCaption("");
      setGeo(null);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah bukti");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block text-xs"
        />
        <button
          type="button"
          onClick={captureLocation}
          disabled={geoBusy}
          className="rounded-lg bg-vita-blue px-2 py-1 text-xs font-bold text-white hover:bg-vita-blueDark disabled:opacity-50"
        >
          {geoBusy
            ? "Mengambil…"
            : geo
              ? "✓ Lokasi terekam"
              : "📍 Rekam lokasi"}
        </button>
      </div>
      {geo ? (
        <p className="text-[11px] text-slate-500">
          {geo.latitude.toFixed(5)}, {geo.longitude.toFixed(5)}
          {geo.accuracy ? ` · ±${Math.round(geo.accuracy)} m` : ""}
        </p>
      ) : null}
      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Keterangan bukti (opsional)"
        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-vita-green focus:outline-none"
      />
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || !file}
        className="w-full rounded-lg bg-vita-green px-2 py-1.5 text-xs font-bold text-white hover:bg-vita-greenDark disabled:opacity-50"
      >
        {busy ? "Mengunggah…" : "Unggah Bukti"}
      </button>
    </form>
  );
}

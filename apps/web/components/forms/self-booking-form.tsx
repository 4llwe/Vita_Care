"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { rupiah } from "../../lib/format";
import { Modal, PrimaryButton } from "../modal";
import { Field, Select, TextInput, FormError } from "../form-controls";

type Service = {
  id: string;
  code: string;
  name: string;
  tariffs?: { basePrice: number }[];
};
type Zone = { name: string };
type Geo = { lat: number; lng: number; accuracy?: number };

/** Form pemesanan layanan mandiri untuk pasien (identitas dari akun login). */
export function SelfBookingForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [zone, setZone] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const token = getToken();
    api<Service[]>("/services", { token })
      .then(setServices)
      .catch(() => setServices([]));
    api<Zone[]>("/zones", { token })
      .then(setZones)
      .catch(() => setZones([]));
  }, [open]);

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
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
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
    setBusy(true);
    setError(null);
    try {
      await api("/bookings/me", {
        token: getToken(),
        method: "POST",
        body: {
          serviceId,
          zone,
          lat: geo?.lat,
          lng: geo?.lng,
          scheduledAt: new Date(scheduledAt).toISOString(),
        },
      });
      onSaved();
      onClose();
      setServiceId("");
      setZone("");
      setScheduledAt("");
      setGeo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memesan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Pesan Layanan Home Care" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Layanan">
          <Select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
          >
            <option value="" disabled>
              — pilih layanan —
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.tariffs?.[0] ? ` · ${rupiah(s.tariffs[0].basePrice)}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Wilayah Layanan">
          <Select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            required
          >
            <option value="" disabled>
              — pilih wilayah —
            </option>
            {zones.map((z) => (
              <option key={z.name} value={z.name}>
                {z.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Jadwal Kunjungan">
          <TextInput
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
        </Field>
        <div className="space-y-2 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Lokasi Rumah/Kunjungan
            </span>
            <button
              type="button"
              onClick={captureLocation}
              disabled={geoBusy}
              className="rounded-lg bg-vita-blue px-2.5 py-1 text-xs font-bold text-white hover:bg-vita-blueDark disabled:opacity-50"
            >
              {geoBusy
                ? "Mengambil…"
                : geo
                  ? "✓ Lokasi terekam"
                  : "📍 Gunakan lokasi saya"}
            </button>
          </div>
          {geo ? (
            <p className="text-[11px] text-slate-500">
              {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
              {geo.accuracy ? ` · ±${Math.round(geo.accuracy)} m` : ""}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400">
              Opsional, membantu tim menemukan alamat Anda lebih cepat.
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Memesan…" : "Pesan Sekarang"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

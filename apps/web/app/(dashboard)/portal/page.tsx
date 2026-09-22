"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { rupiah, tanggalJam } from "../../../lib/format";
import type { MyBooking } from "../../../lib/types";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";
import { StatusBadge } from "../../../components/status-badge";
import { AddButton } from "../../../components/modal";
import { SelfBookingForm } from "../../../components/forms/self-booking-form";
import { VisitTracker } from "../../../components/visit-tracker";
import { LiveTrackMap } from "../../../components/live-track-map";

const CANCELABLE = ["DIPESAN", "DIKONFIRMASI"];

export default function PortalPage() {
  const [rows, setRows] = useState<MyBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MyBooking | null>(null);
  const [busyCancel, setBusyCancel] = useState(false);

  const load = useCallback(() => {
    api<MyBooking[]>("/bookings/me", { token: getToken() })
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadDetail = useCallback((id: string) => {
    setOpenId(id);
    setDetail(null);
    api<MyBooking>(`/bookings/me/${id}`, { token: getToken() })
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, []);

  // Refresh diam-diam (tanpa mengosongkan tampilan) untuk pelacakan real-time.
  const refreshDetail = useCallback((id: string) => {
    api<MyBooking>(`/bookings/me/${id}`, { token: getToken() })
      .then(setDetail)
      .catch(() => undefined);
  }, []);

  // Saat nakes "Dalam Perjalanan", perbarui posisi tiap 15 detik.
  useEffect(() => {
    if (!openId || detail?.status !== "DALAM_PERJALANAN") return;
    const t = setInterval(() => refreshDetail(openId), 15_000);
    return () => clearInterval(t);
  }, [openId, detail?.status, refreshDetail]);

  async function cancel(id: string) {
    if (!confirm("Batalkan pemesanan ini?")) return;
    setBusyCancel(true);
    try {
      await api(`/bookings/me/${id}/cancel`, {
        token: getToken(),
        method: "PATCH",
      });
      load();
      if (openId === id) loadDetail(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membatalkan");
    } finally {
      setBusyCancel(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">
            Portal Pasien
          </h1>
          <p className="text-sm text-slate-500">
            Pesan layanan home care &amp; pantau kunjungan Anda.
          </p>
        </div>
        <AddButton onClick={() => setShowForm(true)} label="Pesan Layanan" />
      </div>

      {error ? <ErrorBox message={error} /> : null}

      {!rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty label="Belum ada pemesanan. Klik ‘Pesan Layanan’ untuk memulai." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((b) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-vita-greenDark">
                      {b.code}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <h3 className="mt-1 font-bold text-slate-800">
                    {b.service?.name ?? "Layanan"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {b.zone} · {tanggalJam(b.scheduledAt)}
                  </p>
                  {b.healthWorker ? (
                    <p className="mt-1 text-xs text-slate-600">
                      Nakes:{" "}
                      <span className="font-semibold">
                        {b.healthWorker.name}
                      </span>{" "}
                      ({b.healthWorker.profession})
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => loadDetail(b.id)}
                  className="flex-1 rounded-lg bg-vita-green px-3 py-1.5 text-xs font-bold text-white hover:bg-vita-greenDark"
                >
                  Lacak Kunjungan
                </button>
                {CANCELABLE.includes(b.status) ? (
                  <button
                    onClick={() => cancel(b.id)}
                    disabled={busyCancel}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Batalkan
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel pelacakan */}
      {openId ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className="mt-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-800">
                Pelacakan Kunjungan
              </h2>
              <button
                onClick={() => setOpenId(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
            {!detail ? (
              <Loading />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-vita-greenDark">
                      {detail.code}
                    </span>
                    <StatusBadge status={detail.status} />
                  </div>
                  <h3 className="mt-1 font-bold text-slate-800">
                    {detail.service?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {detail.zone} · {tanggalJam(detail.scheduledAt)}
                  </p>
                  {detail.healthWorker ? (
                    <p className="mt-1 text-xs text-slate-600">
                      Nakes:{" "}
                      <span className="font-semibold">
                        {detail.healthWorker.name}
                      </span>{" "}
                      ({detail.healthWorker.profession})
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">
                      Tenaga kesehatan belum ditugaskan.
                    </p>
                  )}
                </div>

                <VisitTracker status={detail.status} />

                {detail.status === "DALAM_PERJALANAN" ? (
                  <LiveTrackMap detail={detail} />
                ) : null}

                {detail.addressLat != null && detail.addressLng != null ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <iframe
                      title="Lokasi kunjungan"
                      className="h-48 w-full"
                      loading="lazy"
                      src={`https://www.google.com/maps?q=${detail.addressLat},${detail.addressLng}&z=15&output=embed`}
                    />
                    <a
                      href={`https://www.google.com/maps?q=${detail.addressLat},${detail.addressLng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block bg-slate-50 px-3 py-2 text-xs font-bold text-vita-blue hover:underline"
                    >
                      Buka di Google Maps ↗
                    </a>
                  </div>
                ) : null}

                {detail.invoice ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-700">
                        Tagihan {detail.invoice.code}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rupiah(detail.invoice.total)}
                      </p>
                    </div>
                    <StatusBadge status={detail.invoice.status} />
                  </div>
                ) : null}

                {CANCELABLE.includes(detail.status) ? (
                  <button
                    onClick={() => cancel(detail.id)}
                    disabled={busyCancel}
                    className="w-full rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {busyCancel ? "Memproses…" : "Batalkan Pemesanan"}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <SelfBookingForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={load}
      />
    </div>
  );
}

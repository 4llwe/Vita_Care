"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { fetchMe, type Session } from "../../../lib/session";
import { tanggalJam } from "../../../lib/format";
import type { Booking } from "../../../lib/types";
import { StatusBadge } from "../../../components/status-badge";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";
import { AddButton } from "../../../components/modal";
import { BookingForm } from "../../../components/forms/booking-form";
import { BookingActions } from "../../../components/forms/booking-actions";

export default function BookingsPage() {
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  const load = useCallback(async () => {
    try {
      const me = session ?? (await fetchMe());
      if (!session) setSession(me);
      const endpoint = me.role === "PATIENT" || me.role === "CAREGIVER" ? "/bookings/me" : me.role === "HEALTH_WORKER" ? "/bookings/assigned/me" : "/bookings";
      setRows(await api<Booking[]>(endpoint, { token: getToken() }));
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat jadwal"); }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">
          Pemesanan Kunjungan
        </h1>
        {session?.role === "COORDINATOR" || session?.role === "SUPER_ADMIN" ? <AddButton onClick={() => setOpen(true)} label="Booking baru" /> : null}
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty label="Belum ada pemesanan." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Pasien</th>
                <th className="px-4 py-3">Layanan</th>
                <th className="px-4 py-3">Zona</th>
                <th className="px-4 py-3">Jadwal</th>
                <th className="px-4 py-3">Nakes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-emerald-50/40">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-vita-greenDark">
                    {b.code}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {b.patientName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.service?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{b.zone}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {tanggalJam(b.scheduledAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.healthWorker?.name ?? (
                      <span className="text-amber-500">Belum ditugaskan</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    {session?.role === "COORDINATOR" || session?.role === "SUPER_ADMIN" || session?.role === "HEALTH_WORKER" ? <BookingActions
                      id={b.id} status={b.status} zone={b.zone} onChanged={load}
                    /> : <span className="text-xs text-slate-400">Lihat status</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BookingForm open={open} onClose={() => setOpen(false)} onSaved={load} />
    </div>
  );
}

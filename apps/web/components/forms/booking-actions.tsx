"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { LiveLocationShare } from "./live-location-share";

type Worker = { id: string; name: string; zone: string; isActive: boolean };

/** Transisi status booking yang diizinkan (selaras dengan state machine backend). */
const NEXT: Record<string, string[]> = {
  DIPESAN: ["DIKONFIRMASI", "DIBATALKAN"],
  DIKONFIRMASI: ["DIBATALKAN"],
  DITUGASKAN: ["DALAM_PERJALANAN"],
  DALAM_PERJALANAN: ["BERLANGSUNG"],
  BERLANGSUNG: ["SELESAI"],
  SELESAI: ["DIEVALUASI"],
  DIEVALUASI: [],
  DIBATALKAN: [],
};

const LABEL: Record<string, string> = {
  DIKONFIRMASI: "Konfirmasi",
  DIBATALKAN: "Batalkan",
  DALAM_PERJALANAN: "Berangkat",
  BERLANGSUNG: "Mulai",
  SELESAI: "Selesai",
  DIEVALUASI: "Evaluasi",
};

export function BookingActions({
  id,
  status,
  zone,
  onChanged,
}: {
  id: string;
  status: string;
  zone: string;
  onChanged: () => void;
}) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [picked, setPicked] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tampilkan kontrol assign saat booking belum/baru terkonfirmasi.
  const canAssign = status === "DIPESAN" || status === "DIKONFIRMASI";

  useEffect(() => {
    if (!canAssign) return;
    api<Worker[]>("/health-workers", { token: getToken() })
      .then((all) =>
        setWorkers(all.filter((w) => w.isActive && w.zone === zone)),
      )
      .catch(() => setWorkers([]));
  }, [canAssign, zone]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  const changeStatus = (next: string) =>
    run(() =>
      api(`/bookings/${id}/status/${next}`, {
        token: getToken(),
        method: "PATCH",
      }),
    );
  const autoAssign = () =>
    run(() =>
      api(`/bookings/${id}/assign`, { token: getToken(), method: "PATCH" }),
    );
  const assignTo = () => {
    if (!picked) return;
    return run(() =>
      api(`/bookings/${id}/assign/${picked}`, {
        token: getToken(),
        method: "PATCH",
      }),
    );
  };

  const nexts = NEXT[status] ?? [];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {nexts.map((n) => (
          <button
            key={n}
            disabled={busy}
            onClick={() => changeStatus(n)}
            className={`rounded-lg px-2 py-1 text-xs font-bold disabled:opacity-50 ${
              n === "DIBATALKAN"
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-emerald-50 text-vita-greenDark hover:bg-emerald-100"
            }`}
          >
            {LABEL[n] ?? n}
          </button>
        ))}
        {nexts.length === 0 && !canAssign ? (
          <span className="text-xs text-slate-300">—</span>
        ) : null}
      </div>

      {status === "DALAM_PERJALANAN" ? <LiveLocationShare id={id} /> : null}

      {canAssign ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <select
            value={picked}
            onChange={(e) => setPicked(e.target.value)}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-2 py-1 text-xs focus:border-vita-green focus:outline-none"
          >
            <option value="">Pilih nakes…</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <button
            disabled={busy || !picked}
            onClick={assignTo}
            className="rounded-lg bg-vita-green px-2 py-1 text-xs font-bold text-white hover:bg-vita-greenDark disabled:opacity-50"
          >
            Tugaskan
          </button>
          <button
            disabled={busy}
            onClick={autoAssign}
            title="Pilih otomatis nakes terdekat yang tersedia"
            className="rounded-lg bg-vita-blue px-2 py-1 text-xs font-bold text-white hover:bg-vita-blueDark disabled:opacity-50"
          >
            Auto
          </button>
        </div>
      ) : null}

      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

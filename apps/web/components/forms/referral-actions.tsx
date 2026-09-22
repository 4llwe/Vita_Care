"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";

/** Transisi status rujukan (selaras backend). */
const NEXT: Record<string, string[]> = {
  REQUESTED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

const LABEL: Record<string, string> = {
  ACCEPTED: "Terima",
  REJECTED: "Tolak",
  COMPLETED: "Selesaikan",
};

export function ReferralActions({
  id,
  status,
  onChanged,
}: {
  id: string;
  status: string;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: string) {
    setBusy(true);
    setError(null);
    try {
      await api(`/referrals/${id}/status/${next}`, {
        token: getToken(),
        method: "PATCH",
      });
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal");
    } finally {
      setBusy(false);
    }
  }

  const nexts = NEXT[status] ?? [];
  if (nexts.length === 0)
    return <span className="text-xs text-slate-300">—</span>;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {nexts.map((n) => (
        <button
          key={n}
          disabled={busy}
          onClick={() => setStatus(n)}
          className={`rounded-lg px-2 py-1 text-xs font-bold disabled:opacity-50 ${
            n === "REJECTED"
              ? "bg-red-50 text-red-700 hover:bg-red-100"
              : "bg-emerald-50 text-vita-greenDark hover:bg-emerald-100"
          }`}
        >
          {LABEL[n] ?? n}
        </button>
      ))}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { tanggal } from "../../../lib/format";
import type { Capa } from "../../../lib/types";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";
import { CapaUpdate } from "../../../components/forms/capa-update";

const COLUMNS: Array<{ key: string; label: string; tone: string }> = [
  { key: "OPEN", label: "Open", tone: "border-slate-300" },
  { key: "IN_PROGRESS", label: "In Progress", tone: "border-blue-300" },
  { key: "VERIFIED", label: "Verified", tone: "border-emerald-300" },
  { key: "OVERDUE", label: "Overdue", tone: "border-red-300" },
];

export default function CapaPage() {
  const [rows, setRows] = useState<Capa[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Capa | null>(null);

  const load = useCallback(() => {
    api<Capa[]>("/capa", { token: getToken() })
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold text-slate-800">Papan CAPA</h1>
      {error ? (
        <ErrorBox message={error} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty label="Belum ada CAPA." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = rows.filter((r) => r.status === col.key);
            return (
              <div
                key={col.key}
                className={`rounded-2xl border-t-4 ${col.tone} bg-white p-3 shadow-sm`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-bold text-slate-700">{col.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-vita-green hover:bg-emerald-50/50"
                    >
                      <div className="text-xs font-mono font-bold text-vita-greenDark">
                        {c.finding?.code ?? "—"}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                        {c.actionPlan}
                      </p>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-vita-green"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{c.progress}%</span>
                        <span>Target: {tanggal(c.targetDate)}</span>
                      </div>
                      {c.evidenceUrl ? (
                        <div className="mt-1 text-[11px] text-emerald-600">
                          ✓ ada bukti
                        </div>
                      ) : null}
                    </button>
                  ))}
                  {items.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-300">
                      Kosong
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CapaUpdate
        capa={selected}
        open={selected !== null}
        onClose={() => setSelected(null)}
        onSaved={load}
      />
    </div>
  );
}

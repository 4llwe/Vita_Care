"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import type { HeatmapCell } from "../../../lib/types";
import { RiskHeatmap } from "../../../components/risk-heatmap";
import { Loading, ErrorBox } from "../../../components/async-state";
import { AddButton } from "../../../components/modal";
import { RiskForm } from "../../../components/forms/risk-form";
import { DownloadButton } from "../../../components/download-button";

type Risk = {
  id: string;
  code: string;
  title: string;
  category: string;
  score: number;
  level: string;
  status: string;
};

export default function RisksPage() {
  const [cells, setCells] = useState<HeatmapCell[] | null>(null);
  const [rows, setRows] = useState<Risk[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    const token = getToken();
    Promise.all([
      api<HeatmapCell[]>("/risks/heatmap", { token }),
      api<Risk[]>("/risks", { token }),
    ])
      .then(([h, r]) => {
        setCells(h);
        setRows(r);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">Risk Register</h1>
        <div className="flex items-center gap-3">
          <DownloadButton
            path="/reports/risks.csv"
            filename="register-risiko.csv"
            label="⬇ CSV"
          />
          <DownloadButton
            path="/reports/risks.xlsx"
            filename="register-risiko.xlsx"
            label="⬇ Excel"
          />
          <AddButton onClick={() => setOpen(true)} label="Risiko baru" />
        </div>
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : !cells || !rows ? (
        <Loading />
      ) : (
        <>
          <RiskHeatmap cells={cells} />
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Judul</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Skor</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-vita-greenDark">
                      {r.code}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {r.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.category}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {r.score}
                    </td>
                    <td className="px-4 py-3">{r.level}</td>
                    <td className="px-4 py-3 text-slate-600">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <RiskForm open={open} onClose={() => setOpen(false)} onSaved={load} />
    </div>
  );
}

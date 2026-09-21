"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { rupiah, tanggal } from "../../../lib/format";
import type { Invoice } from "../../../lib/types";
import { StatusBadge } from "../../../components/status-badge";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";

export default function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Invoice[]>("/invoices", { token: getToken() })
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  async function pay(id: string) {
    try {
      const r = await api<{ redirectUrl: string }>(`/invoices/${id}/pay`, {
        method: "POST",
        token: getToken(),
      });
      if (r.redirectUrl) window.open(r.redirectUrl, "_blank");
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (error) return <ErrorBox message={error} />;
  if (!rows) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">
          Tagihan & Pembayaran
        </h1>
        <a
          href="/api/reports/invoices.csv"
          className="text-sm font-semibold text-vita-blue hover:underline"
        >
          ⬇ Export CSV
        </a>
      </div>
      {rows.length === 0 ? (
        <Empty label="Belum ada tagihan." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Pasien</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Terbit</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((i) => (
                <tr key={i.id} className="hover:bg-emerald-50/40">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-vita-greenDark">
                    {i.code}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {i.patientName}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800">
                    {rupiah(i.total)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {tanggal(i.issuedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={i.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {i.status !== "PAID" ? (
                      <button
                        onClick={() => pay(i.id)}
                        className="rounded-lg bg-vita-green px-3 py-1.5 text-xs font-bold text-white hover:bg-vita-greenDark"
                      >
                        Bayar
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600">Lunas</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

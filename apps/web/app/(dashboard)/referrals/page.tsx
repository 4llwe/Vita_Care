"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { tanggal } from "../../../lib/format";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";
import { AddButton } from "../../../components/modal";
import { ReferralForm } from "../../../components/forms/referral-form";
import { DownloadButton } from "../../../components/download-button";
import { ReferralActions } from "../../../components/forms/referral-actions";

type Referral = {
  id: string;
  code: string;
  patientName: string;
  toHospital: string;
  reason: string;
  urgency: string;
  status: string;
  createdAt: string;
};

const URGENCY: Record<string, string> = {
  ROUTINE: "bg-slate-100 text-slate-700",
  URGENT: "bg-amber-100 text-amber-800",
  EMERGENCY: "bg-red-100 text-red-700",
};
const STATUS: Record<string, string> = {
  REQUESTED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-teal-100 text-teal-800",
};

export default function ReferralsPage() {
  const [rows, setRows] = useState<Referral[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(() => {
    api<Referral[]>("/referrals", { token: getToken() })
      .then(setRows)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-slate-800">
          Rujukan ke RS Mitra
        </h1>
        <AddButton onClick={() => setOpen(true)} label="Rujukan baru" />
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty label="Belum ada rujukan." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Pasien</th>
                <th className="px-4 py-3">Tujuan</th>
                <th className="px-4 py-3">Alasan</th>
                <th className="px-4 py-3">Urgensi</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Surat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-emerald-50/40">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-vita-greenDark">
                    {r.code}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {r.patientName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.toHospital}</td>
                  <td
                    className="px-4 py-3 max-w-xs truncate text-slate-600"
                    title={r.reason}
                  >
                    {r.reason}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${URGENCY[r.urgency] ?? ""}`}
                    >
                      {r.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {tanggal(r.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS[r.status] ?? ""}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ReferralActions
                      id={r.id}
                      status={r.status}
                      onChanged={load}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <DownloadButton
                      path={`/reports/referral/${r.id}.pdf`}
                      filename={`surat-rujukan-${r.code}.pdf`}
                      label="⬇ PDF"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ReferralForm open={open} onClose={() => setOpen(false)} onSaved={load} />
    </div>
  );
}

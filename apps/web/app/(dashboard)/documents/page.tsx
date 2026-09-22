"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { tanggal } from "../../../lib/format";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";
import { AddButton } from "../../../components/modal";
import { DocumentForm } from "../../../components/forms/document-form";
import { DocumentDetail } from "../../../components/forms/document-detail";

type Doc = {
  id: string;
  code: string;
  title: string;
  category: string;
  currentVersion: number;
  status: string;
  owner?: { name: string } | null;
  updatedAt: string;
};

const DOC_STATUS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  IN_REVIEW: "bg-amber-100 text-amber-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-slate-200 text-slate-500",
};

export default function DocumentsPage() {
  const [rows, setRows] = useState<Doc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<Doc[]>("/documents", { token: getToken() })
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
          Manajemen Dokumen
        </h1>
        <AddButton onClick={() => setOpen(true)} label="Dokumen baru" />
      </div>

      {error ? (
        <ErrorBox message={error} />
      ) : !rows ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty label="Belum ada dokumen." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Versi</th>
                <th className="px-4 py-3">Pemilik</th>
                <th className="px-4 py-3">Diperbarui</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((d) => (
                <tr
                  key={d.id}
                  onClick={() => setDetailId(d.id)}
                  className="cursor-pointer hover:bg-emerald-50/40"
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-vita-greenDark">
                    {d.code}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {d.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.category}</td>
                  <td className="px-4 py-3 text-slate-600">
                    v{d.currentVersion}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {d.owner?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {tanggal(d.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${DOC_STATUS[d.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {d.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DocumentForm open={open} onClose={() => setOpen(false)} onSaved={load} />
      <DocumentDetail
        documentId={detailId}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        onChanged={load}
      />
    </div>
  );
}

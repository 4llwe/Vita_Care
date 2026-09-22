"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { tanggal } from "../../../lib/format";
import type { AuditChecklist, AuditExecution } from "../../../lib/types";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";
import { StatusBadge } from "../../../components/status-badge";
import { AddButton } from "../../../components/modal";
import { ChecklistForm } from "../../../components/forms/checklist-form";
import { ExecutionForm } from "../../../components/forms/execution-form";

const CATEGORY_LABEL: Record<string, string> = {
  CLINICAL: "Klinis",
  OPERATIONAL: "Operasional",
  COMPLIANCE: "Kepatuhan",
  SAFETY: "Keselamatan",
  DOCUMENTATION: "Dokumentasi",
};

function scoreTone(pct: number) {
  if (pct >= 85) return "text-emerald-600";
  if (pct >= 70) return "text-amber-600";
  return "text-red-600";
}

export default function AuditsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"executions" | "checklists">("executions");
  const [execs, setExecs] = useState<AuditExecution[] | null>(null);
  const [checklists, setChecklists] = useState<AuditChecklist[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showExec, setShowExec] = useState(false);

  const loadExecs = useCallback(() => {
    api<AuditExecution[]>("/audits/executions", { token: getToken() })
      .then(setExecs)
      .catch((e) => setError(e.message));
  }, []);
  const loadChecklists = useCallback(() => {
    api<AuditChecklist[]>("/audits/checklists", { token: getToken() })
      .then(setChecklists)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    loadExecs();
    loadChecklists();
  }, [loadExecs, loadChecklists]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-extrabold text-slate-800">
          Audit &amp; Checklist
        </h1>
        <div className="flex gap-2">
          <AddButton onClick={() => setShowExec(true)} label="Mulai Audit" />
          <button
            onClick={() => setShowChecklist(true)}
            className="rounded-xl border border-vita-green px-4 py-2 text-sm font-bold text-vita-greenDark hover:bg-emerald-50"
          >
            + Buat Checklist
          </button>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        <button
          onClick={() => setTab("executions")}
          className={`flex-1 rounded-lg px-3 py-1.5 ${tab === "executions" ? "bg-white text-vita-greenDark shadow-sm" : "text-slate-500"}`}
        >
          Pelaksanaan Audit
        </button>
        <button
          onClick={() => setTab("checklists")}
          className={`flex-1 rounded-lg px-3 py-1.5 ${tab === "checklists" ? "bg-white text-vita-greenDark shadow-sm" : "text-slate-500"}`}
        >
          Template Checklist
        </button>
      </div>

      {error ? <ErrorBox message={error} /> : null}

      {tab === "executions" ? (
        !execs ? (
          <Loading />
        ) : execs.length === 0 ? (
          <Empty label="Belum ada pelaksanaan audit. Klik ‘Mulai Audit’." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Checklist</th>
                  <th className="px-4 py-3">Unit/Auditee</th>
                  <th className="px-4 py-3">Skor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Mulai</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {execs.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-vita-greenDark">
                      {ex.code}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {ex.checklist?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {ex.auditeeUnit}
                      {ex.zone ? (
                        <span className="text-slate-400"> · {ex.zone}</span>
                      ) : null}
                    </td>
                    <td
                      className={`px-4 py-3 font-bold ${scoreTone(ex.scorePct)}`}
                    >
                      {ex.scorePct}%
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ex.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {tanggal(ex.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/audits/${ex.id}`}
                        className="font-bold text-vita-blue hover:underline"
                      >
                        Buka →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : !checklists ? (
        <Loading />
      ) : checklists.length === 0 ? (
        <Empty label="Belum ada template checklist. Klik ‘Buat Checklist’." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {checklists.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-vita-greenDark">
                  {c.code}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {CATEGORY_LABEL[c.category] ?? c.category}
                </span>
              </div>
              <h3 className="mt-1 font-bold text-slate-800">{c.title}</h3>
              {c.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {c.description}
                </p>
              ) : null}
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span>{c._count?.items ?? 0} butir</span>
                <span>{c._count?.executions ?? 0} pelaksanaan</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ChecklistForm
        open={showChecklist}
        onClose={() => setShowChecklist(false)}
        onSaved={loadChecklists}
      />
      <ExecutionForm
        open={showExec}
        onClose={() => setShowExec(false)}
        onStarted={(ex) => router.push(`/audits/${ex.id}`)}
      />
    </div>
  );
}

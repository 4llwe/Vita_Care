"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../lib/api";
import { getToken } from "../../../../lib/auth";
import { tanggalJam } from "../../../../lib/format";
import type {
  AuditExecution,
  AuditAnswer,
  ComplianceResult,
} from "../../../../lib/types";
import { Loading, ErrorBox } from "../../../../components/async-state";
import { StatusBadge } from "../../../../components/status-badge";
import { EvidenceCapture } from "../../../../components/forms/evidence-capture";
import { FindingFromAnswer } from "../../../../components/forms/finding-from-answer";

const RESULTS: Array<{ value: ComplianceResult; label: string; cls: string }> =
  [
    { value: "COMPLIANT", label: "Patuh", cls: "bg-emerald-600" },
    { value: "PARTIAL", label: "Sebagian", cls: "bg-amber-500" },
    { value: "NON_COMPLIANT", label: "Tidak Patuh", cls: "bg-red-600" },
    { value: "NOT_APPLICABLE", label: "N/A", cls: "bg-slate-400" },
  ];

type Draft = Record<string, { result: ComplianceResult; note: string }>;

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [exec, setExec] = useState<AuditExecution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);
  const [findingFor, setFindingFor] = useState<AuditAnswer | null>(null);

  const load = useCallback(() => {
    api<AuditExecution>(`/audits/executions/${id}`, { token: getToken() })
      .then((ex) => {
        setExec(ex);
        const d: Draft = {};
        for (const a of ex.answers ?? []) {
          d[a.itemId] = { result: a.result, note: a.note ?? "" };
        }
        setDraft(d);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const locked = exec?.status === "COMPLETED";

  function setResult(itemId: string, result: ComplianceResult) {
    setDraft((p) => ({
      ...p,
      [itemId]: { ...(p[itemId] ?? { note: "" }), result },
    }));
  }
  function setNote(itemId: string, note: string) {
    setDraft((p) => ({
      ...p,
      [itemId]: { ...(p[itemId] ?? { result: "NOT_APPLICABLE" }), note },
    }));
  }

  async function save(complete = false) {
    if (!exec) return;
    setBusy(true);
    setError(null);
    try {
      const answers = (exec.answers ?? []).map((a) => ({
        itemId: a.itemId,
        result: draft[a.itemId]?.result ?? "NOT_APPLICABLE",
        note: draft[a.itemId]?.note || undefined,
      }));
      await api(`/audits/executions/${id}/answers`, {
        token: getToken(),
        method: "PATCH",
        body: { answers },
      });
      if (complete) {
        await api(`/audits/executions/${id}/complete`, {
          token: getToken(),
          method: "PATCH",
        });
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorBox message={error} />;
  if (!exec) return <Loading />;

  return (
    <div className="space-y-4">
      <Link
        href="/audits"
        className="text-sm font-semibold text-slate-500 hover:text-vita-greenDark"
      >
        ← Kembali ke daftar
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-vita-greenDark">
                {exec.code}
              </span>
              <StatusBadge status={exec.status} />
            </div>
            <h1 className="mt-1 text-xl font-extrabold text-slate-800">
              {exec.checklist?.title}
            </h1>
            <p className="text-sm text-slate-500">
              {exec.auditeeUnit}
              {exec.zone ? ` · ${exec.zone}` : ""} · Auditor:{" "}
              {exec.auditor?.name ?? "—"}
            </p>
            <p className="text-xs text-slate-400">
              Mulai: {tanggalJam(exec.startedAt)}
              {exec.completedAt
                ? ` · Selesai: ${tanggalJam(exec.completedAt)}`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Skor Kepatuhan
            </p>
            <p className="text-3xl font-extrabold text-vita-greenDark">
              {exec.scorePct}%
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {(exec.answers ?? []).map((a, idx) => {
          const cur = draft[a.itemId]?.result ?? "NOT_APPLICABLE";
          return (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-xs font-bold text-slate-400">
                  {idx + 1}.
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    {a.item.question}
                  </p>
                  {a.item.guidance ? (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {a.item.guidance}
                    </p>
                  ) : null}
                  <span className="mt-0.5 inline-block text-[11px] text-slate-400">
                    Bobot: {a.item.weight}
                  </span>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {RESULTS.map((r) => (
                      <button
                        key={r.value}
                        disabled={locked}
                        onClick={() => setResult(a.itemId, r.value)}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition disabled:opacity-60 ${
                          cur === r.value
                            ? `${r.cls} text-white`
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <input
                    value={draft[a.itemId]?.note ?? ""}
                    onChange={(e) => setNote(a.itemId, e.target.value)}
                    disabled={locked}
                    placeholder="Catatan temuan (opsional)"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-vita-green focus:outline-none disabled:bg-slate-50"
                  />

                  {/* Bukti per butir */}
                  <div className="mt-2">
                    {(a.evidences ?? []).length > 0 ? (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {(a.evidences ?? []).map((ev) => (
                          <a
                            key={ev.id}
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-vita-blue hover:underline"
                          >
                            📎 {ev.caption || "bukti"}
                            {ev.latitude ? " 📍" : ""}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {!locked ? (
                      openEvidence === a.id ? (
                        <EvidenceCapture
                          executionId={id}
                          answerId={a.id}
                          onAdded={() => {
                            setOpenEvidence(null);
                            load();
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => setOpenEvidence(a.id)}
                          className="text-xs font-bold text-vita-blue hover:underline"
                        >
                          + Tambah bukti
                        </button>
                      )
                    ) : null}
                  </div>

                  {/* Audit -> Temuan: untuk butir Tidak Patuh */}
                  {a.result === "NON_COMPLIANT" || cur === "NON_COMPLIANT" ? (
                    <div className="mt-2 border-t border-dashed border-slate-200 pt-2">
                      {a.finding ? (
                        <Link
                          href="/findings"
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 hover:underline"
                        >
                          ⚑ Temuan dibuat: {a.finding.code} ·{" "}
                          {a.finding.riskLevel}
                        </Link>
                      ) : a.result === "NON_COMPLIANT" ? (
                        <button
                          type="button"
                          onClick={() => setFindingFor(a)}
                          className="rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700"
                        >
                          ⚑ Jadikan Temuan
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Simpan draf dulu untuk menjadikan butir ini sebagai
                          temuan.
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!locked ? (
        <div className="sticky bottom-4 flex justify-end gap-2 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
          <button
            onClick={() => save(false)}
            disabled={busy}
            className="rounded-xl border border-vita-green px-4 py-2 text-sm font-bold text-vita-greenDark hover:bg-emerald-50 disabled:opacity-60"
          >
            {busy ? "Menyimpan…" : "Simpan Draf"}
          </button>
          <button
            onClick={() => save(true)}
            disabled={busy}
            className="rounded-xl bg-vita-green px-5 py-2 text-sm font-bold text-white hover:bg-vita-greenDark disabled:opacity-60"
          >
            Simpan &amp; Selesaikan
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          ✓ Audit telah diselesaikan dan dikunci.
        </div>
      )}

      <FindingFromAnswer
        executionId={id}
        answer={findingFor}
        open={!!findingFor}
        onClose={() => setFindingFor(null)}
        onSaved={() => {
          setFindingFor(null);
          load();
        }}
      />
    </div>
  );
}

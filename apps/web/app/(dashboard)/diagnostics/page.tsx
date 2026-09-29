"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { fetchMe, type Session } from "../../../lib/session";

type Draft = {
  collectionNote?: string;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  resultFlag?: string;
  resultText?: string;
  criticalResult?: boolean;
  acknowledgementNote?: string;
};

const field =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

export default function DiagnosticsPage() {
  const [orders, setOrders] = useState<any[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const roles = [session?.role, ...(session?.roles ?? [])];
  const canAcknowledge = roles.some((role) =>
    ["DOCTOR", "SUPER_ADMIN"].includes(String(role)),
  );

  async function load() {
    setOrders(await api("/hah/diagnostics", { token: getToken() }));
  }

  useEffect(() => {
    Promise.all([load(), fetchMe().then(setSession)]).catch((e) =>
      setError(e.message),
    );
  }, []);

  function setDraft(id: string, patch: Draft) {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], ...patch },
    }));
  }

  async function patch(id: string, path: string, body: object) {
    setError("");
    setBusy(id);
    try {
      await api(`/hah/diagnostics/${id}/${path}`, {
        method: "PATCH",
        token: getToken(),
        body,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pemeriksaan gagal diperbarui");
    } finally {
      setBusy("");
    }
  }

  const pending =
    orders?.filter((order) =>
      ["ORDERED", "COLLECTED", "PROCESSING"].includes(order.status),
    ).length ?? 0;
  const critical =
    orders?.filter(
      (order) => order.criticalResult && order.status === "RESULTED",
    ).length ?? 0;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-black uppercase tracking-[.2em] text-cyan-300">
          Diagnostic safety workflow
        </p>
        <h1 className="mt-2 text-3xl font-black">Laboratorium & Diagnostik</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Lacak order, koleksi spesimen, pemrosesan, hasil terstruktur, nilai
          kritis, dan acknowledgement klinis.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
          <span className="rounded-full bg-white/10 px-4 py-2">
            {pending} pemeriksaan berjalan
          </span>
          <span
            className={`rounded-full px-4 py-2 ${
              critical ? "bg-red-600" : "bg-emerald-700"
            }`}
          >
            {critical} hasil kritis belum diakui
          </span>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}
      {orders === null ? (
        <div className="medical-card text-slate-500">
          Memuat pemeriksaan diagnostik…
        </div>
      ) : null}
      {orders?.length === 0 ? (
        <div className="medical-card">
          <h2 className="font-black">Belum ada order diagnostik</h2>
          <p className="mt-2 text-sm text-slate-500">
            Order baru dibuat oleh dokter dari halaman episode pasien.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {orders?.map((order) => {
          const draft = drafts[order.id] ?? {};
          const urgent = order.priority === "STAT" || order.criticalResult;
          return (
            <article
              key={order.id}
              className={`rounded-2xl border p-5 ${
                urgent
                  ? "border-red-300 bg-red-50"
                  : order.priority === "URGENT"
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-600">
                    {order.category} · {order.priority} · {order.status}
                  </p>
                  <h2 className="mt-1 text-lg font-black">{order.testName}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {order.episode.code} · {order.episode.patient.fullName}
                    {order.specimen ? ` · ${order.specimen}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Dipesan{" "}
                    {new Date(order.orderedAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <Link
                  href={`/hah/${order.episodeId}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-white px-4 text-sm font-bold"
                >
                  Buka pasien
                </Link>
              </div>

              {order.status === "ORDERED" ? (
                <div className="mt-4 grid gap-3 border-t pt-4">
                  <input
                    className={field}
                    placeholder="Catatan koleksi spesimen (opsional)"
                    value={draft.collectionNote ?? ""}
                    onChange={(e) =>
                      setDraft(order.id, { collectionNote: e.target.value })
                    }
                  />
                  <button
                    disabled={busy === order.id}
                    onClick={() =>
                      patch(order.id, "status", {
                        status: "COLLECTED",
                        collectionNote: draft.collectionNote,
                      })
                    }
                    className="min-h-11 w-fit rounded-xl bg-blue-700 px-4 font-bold text-white disabled:opacity-50"
                  >
                    Tandai spesimen dikoleksi
                  </button>
                </div>
              ) : null}

              {order.status === "COLLECTED" ? (
                <button
                  disabled={busy === order.id}
                  onClick={() =>
                    patch(order.id, "status", { status: "PROCESSING" })
                  }
                  className="mt-4 min-h-11 rounded-xl border border-blue-300 bg-white px-4 font-bold text-blue-800 disabled:opacity-50"
                >
                  Mulai pemrosesan
                </button>
              ) : null}

              {["COLLECTED", "PROCESSING"].includes(order.status) ? (
                <div className="mt-4 grid gap-3 border-t pt-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      className={field}
                      placeholder="Nilai hasil"
                      value={draft.resultValue ?? ""}
                      onChange={(e) =>
                        setDraft(order.id, { resultValue: e.target.value })
                      }
                    />
                    <input
                      className={field}
                      placeholder="Satuan"
                      value={draft.resultUnit ?? ""}
                      onChange={(e) =>
                        setDraft(order.id, { resultUnit: e.target.value })
                      }
                    />
                    <input
                      className={field}
                      placeholder="Rentang referensi"
                      value={draft.referenceRange ?? ""}
                      onChange={(e) =>
                        setDraft(order.id, { referenceRange: e.target.value })
                      }
                    />
                  </div>
                  <select
                    className={field}
                    value={draft.resultFlag ?? ""}
                    onChange={(e) =>
                      setDraft(order.id, { resultFlag: e.target.value })
                    }
                  >
                    <option value="">Pilih interpretasi hasil</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Rendah</option>
                    <option value="HIGH">Tinggi</option>
                    <option value="ABNORMAL">Abnormal</option>
                    <option value="INDETERMINATE">Belum dapat ditentukan</option>
                  </select>
                  <textarea
                    className={`${field} min-h-24`}
                    placeholder="Ringkasan hasil dan catatan klinis"
                    value={draft.resultText ?? ""}
                    onChange={(e) =>
                      setDraft(order.id, { resultText: e.target.value })
                    }
                  />
                  <label className="flex min-h-11 items-center gap-3 rounded-xl border bg-white px-3 text-sm font-bold text-red-800">
                    <input
                      type="checkbox"
                      checked={draft.criticalResult ?? false}
                      onChange={(e) =>
                        setDraft(order.id, {
                          criticalResult: e.target.checked,
                        })
                      }
                    />
                    Nilai kritis — buat alert klinis segera
                  </label>
                  <button
                    disabled={
                      busy === order.id ||
                      !draft.resultFlag ||
                      (draft.resultText?.trim().length ?? 0) < 3
                    }
                    onClick={() =>
                      patch(order.id, "result", {
                        resultValue: draft.resultValue || undefined,
                        resultUnit: draft.resultUnit || undefined,
                        referenceRange: draft.referenceRange || undefined,
                        resultFlag: draft.resultFlag,
                        resultText: draft.resultText,
                        criticalResult: draft.criticalResult ?? false,
                      })
                    }
                    className="min-h-11 w-fit rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:opacity-50"
                  >
                    Simpan hasil
                  </button>
                </div>
              ) : null}

              {["RESULTED", "ACKNOWLEDGED"].includes(order.status) ? (
                <div className="mt-4 rounded-xl border bg-white p-4 text-sm">
                  <p
                    className={
                      order.criticalResult
                        ? "font-black text-red-700"
                        : "font-black text-slate-900"
                    }
                  >
                    {order.resultValue || "Hasil tersedia"}{" "}
                    {order.resultUnit || ""} ·{" "}
                    {String(order.resultFlag).replaceAll("_", " ")}
                  </p>
                  {order.referenceRange ? (
                    <p className="mt-1 text-slate-500">
                      Referensi: {order.referenceRange}
                    </p>
                  ) : null}
                  <p className="mt-2">{order.resultText}</p>
                </div>
              ) : null}

              {order.status === "RESULTED" && canAcknowledge ? (
                <div className="mt-4 grid gap-3">
                  <textarea
                    className={`${field} min-h-20`}
                    placeholder="Catatan review dan tindak lanjut dokter"
                    value={draft.acknowledgementNote ?? ""}
                    onChange={(e) =>
                      setDraft(order.id, {
                        acknowledgementNote: e.target.value,
                      })
                    }
                  />
                  <button
                    disabled={
                      busy === order.id ||
                      (draft.acknowledgementNote?.trim().length ?? 0) < 3
                    }
                    onClick={() =>
                      patch(order.id, "acknowledge", {
                        acknowledgementNote: draft.acknowledgementNote,
                      })
                    }
                    className="min-h-11 w-fit rounded-xl bg-slate-900 px-4 font-bold text-white disabled:opacity-50"
                  >
                    Akui dan dokumentasikan review
                  </button>
                </div>
              ) : null}

              {order.status === "ACKNOWLEDGED" ? (
                <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
                  <b>Review klinis:</b> {order.acknowledgementNote}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
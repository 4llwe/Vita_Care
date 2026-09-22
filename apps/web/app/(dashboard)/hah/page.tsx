"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import type { HaHAlert, HaHEpisode } from "../../../lib/types";
import { ErrorBox, Loading } from "../../../components/async-state";

const statusStyle: Record<string, string> = {
  SCREENING: "bg-slate-100 text-slate-700",
  ELIGIBLE: "bg-blue-50 text-blue-700",
  ADMITTED: "bg-indigo-50 text-indigo-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  TRANSFER_REQUESTED: "bg-red-50 text-red-700",
  TRANSFERRED: "bg-orange-50 text-orange-700",
  DISCHARGED: "bg-slate-100 text-slate-600",
  INELIGIBLE: "bg-amber-50 text-amber-700",
};
const alertStyle = {
  CRITICAL: "border-red-200 bg-red-50 text-red-800",
  HIGH: "border-orange-200 bg-orange-50 text-orange-800",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
} as const;

export default function HaHPage() {
  const [episodes, setEpisodes] = useState<HaHEpisode[]>([]);
  const [alerts, setAlerts] = useState<HaHAlert[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const token = getToken() ?? undefined;
      const [e, a] = await Promise.all([
        api<HaHEpisode[]>("/hah/episodes", { token }),
        api<HaHAlert[]>("/hah/alerts/open", { token }),
      ]);
      setEpisodes(e);
      setAlerts(a);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal memuat command center",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const active = useMemo(
    () => episodes.filter((e) => ["ADMITTED", "ACTIVE"].includes(e.status)),
    [episodes],
  );
  const overdue = useMemo(
    () => alerts.filter((a) => new Date(a.responseDueAt) < new Date()),
    [alerts],
  );
  if (loading)
    return <Loading label="Memuat command center Hospital at Home…" />;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Clinical command center
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Hospital at Home
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Pantau episode akut, target respons alert, dan kesiapan discharge
            dalam satu alur klinis.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/hah/intake"
            className="min-h-11 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
          >
            Intake baru
          </Link>
          <button
            onClick={() => void load()}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Perbarui data
          </button>
        </div>
      </header>

      <section
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Ringkasan operasional"
      >
        {[
          ["Episode aktif", active.length, "text-blue-700"],
          ["Alert terbuka", alerts.length, "text-orange-700"],
          ["Melewati SLA", overdue.length, "text-red-700"],
          [
            "Menunggu screening",
            episodes.filter((e) => e.status === "SCREENING").length,
            "text-slate-700",
          ],
        ].map(([label, value, tone]) => (
          <div
            key={String(label)}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${tone}`}>{value}</p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">
            Alert klinis yang perlu respons
          </h2>
          <span className="text-sm text-slate-500">
            Urut berdasarkan urgensi dan tenggat
          </span>
        </div>
        {alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Tidak ada alert klinis terbuka.
          </div>
        ) : (
          <div className="grid gap-3">
            {alerts.map((a) => (
              <article
                key={a.id}
                className={`rounded-xl border p-4 ${alertStyle[a.severity]}`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong>{a.severity}</strong>
                      <span className="text-sm">{a.episode.code}</span>
                    </div>
                    <p className="mt-1 font-semibold">
                      {a.episode.patient.fullName}
                    </p>
                    <p className="mt-1 text-sm">{a.trigger}</p>
                  </div>
                  <div className="text-sm sm:text-right">
                    <p className="font-semibold">Respons sebelum</p>
                    <time>
                      {new Date(a.responseDueAt).toLocaleString("id-ID")}
                    </time>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-800">
          Daftar episode
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {[
                  "Episode",
                  "Pasien",
                  "Diagnosis",
                  "Status",
                  "Eligibility",
                  "Aktivitas",
                ].map((h) => (
                  <th key={h} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {episodes.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-4 font-semibold text-slate-800">
                    <Link
                      href={`/hah/${e.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {e.code}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-800">
                      {e.patient.fullName}
                    </p>
                    <p className="text-xs text-slate-500">{e.patient.mrn}</p>
                  </td>
                  <td className="max-w-xs px-4 py-4 text-slate-600">
                    {e.primaryDiagnosis}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-bold ${statusStyle[e.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {e.status.replaceAll("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {e.eligibility?.decision ?? "Belum dinilai"}
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {e._count?.observations ?? 0} observasi ·{" "}
                    {e._count?.alerts ?? 0} alert · {e._count?.visits ?? 0}{" "}
                    visit
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

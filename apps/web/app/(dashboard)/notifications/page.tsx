"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<any[] | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    api<any[]>("/hah/alerts/open", { token: getToken() })
      .then(setAlerts)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-300">
          Notification center
        </p>
        <h1 className="mt-2 text-3xl font-black">Notifikasi Klinis</h1>
        <p className="mt-2 text-sm text-slate-300">
          Alert aktif diurutkan berdasarkan urgensi dan batas waktu respons.
        </p>
      </section>
      {error && <div className="rounded-xl bg-red-50 p-4 text-red-800">{error}</div>}
      {alerts === null && !error && (
        <div className="medical-card text-slate-500">Memuat notifikasi…</div>
      )}
      {alerts?.length === 0 && (
        <div className="medical-card">
          <h2 className="font-black">Tidak ada alert terbuka</h2>
          <p className="mt-2 text-sm text-slate-500">
            Seluruh alert klinis telah diselesaikan.
          </p>
        </div>
      )}
      <div className="space-y-3">
        {alerts?.map((a) => {
          const overdue = new Date(a.responseDueAt) < new Date();
          return (
            <article
              key={a.id}
              className={`rounded-2xl border p-5 ${a.severity === "CRITICAL" ? "border-red-300 bg-red-50" : a.severity === "HIGH" ? "border-orange-300 bg-orange-50" : "border-amber-300 bg-amber-50"}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide">
                    {a.severity} · {a.status}
                  </p>
                  <h2 className="mt-1 text-lg font-black">
                    {a.episode?.code} · {a.episode?.patient?.fullName}
                  </h2>
                  <p className="mt-2 text-sm">{a.trigger}</p>
                  <p
                    className={`mt-2 text-xs font-bold ${overdue ? "text-red-700" : "text-slate-500"}`}
                  >
                    {overdue ? "Melewati SLA" : "Respons sebelum"}:{" "}
                    {new Date(a.responseDueAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <Link
                  href={`/hah/${a.episodeId}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-4 font-bold text-white"
                >
                  Tindak lanjuti
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

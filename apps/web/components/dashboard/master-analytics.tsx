"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { rupiah } from "../../lib/format";
import type { MasterAnalytics } from "../../lib/types";
import { KpiCard } from "../kpi-card";
import { Loading, ErrorBox, Empty } from "../async-state";

/** Panel analitik Master Data: layanan terlaris, utilisasi nakes, tarif rata-rata per kategori. */
export function MasterAnalyticsPanel() {
  const [data, setData] = useState<MasterAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<MasterAnalytics>("/analytics/master", { token: getToken() })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Loading />;

  const maxBookings = Math.max(1, ...data.topServices.map((s) => s.bookings));
  const maxUtil = Math.max(1, ...data.workerUtilization.map((w) => w.total));
  const maxAvg = Math.max(1, ...data.tariffByCategory.map((c) => c.avgPrice));

  return (
    <div className="space-y-5">
      {/* KPI ringkas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Layanan Aktif"
          value={data.summary.activeServices}
          hint={`dari ${data.summary.totalServices} total`}
          tone="green"
        />
        <KpiCard
          label="Kategori Layanan"
          value={data.summary.categories}
          hint="kategori berbeda"
          tone="blue"
        />
        <KpiCard
          label="Nakes Aktif"
          value={data.summary.activeWorkers}
          hint={`dari ${data.summary.totalWorkers} total`}
          tone="green"
        />
        <KpiCard
          label="Durasi Rata-rata"
          value={`${data.summary.avgDurationMin} mnt`}
          hint="per layanan aktif"
          tone="amber"
        />
      </div>

      {/* Layanan terlaris */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-bold text-slate-800">🏆 Layanan Terlaris</h3>
        {data.topServices.length === 0 ? (
          <Empty label="Belum ada pemesanan." />
        ) : (
          <ul className="space-y-2">
            {data.topServices.map((s, i) => (
              <li key={s.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    <span className="mr-1 text-slate-400">{i + 1}.</span>
                    {s.name}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      · {s.category}
                    </span>
                  </span>
                  <span className="font-bold text-vita-greenDark">
                    {s.bookings}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-vita-green to-vita-greenDark"
                    style={{ width: `${(s.bookings / maxBookings) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Utilisasi nakes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-bold text-slate-800">
          🩺 Utilisasi Tenaga Kesehatan
        </h3>
        {data.workerUtilization.length === 0 ? (
          <Empty label="Belum ada tenaga kesehatan." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2">Nama</th>
                  <th className="py-2">Profesi</th>
                  <th className="py-2">Zona</th>
                  <th className="py-2 text-center">Berjalan</th>
                  <th className="py-2 text-center">Selesai</th>
                  <th className="py-2">Total Ditangani</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.workerUtilization.map((w) => (
                  <tr key={w.id} className={w.isActive ? "" : "opacity-50"}>
                    <td className="py-2 font-semibold text-slate-700">
                      {w.name}
                      {!w.isActive ? (
                        <span className="text-xs font-normal text-slate-400">
                          {" "}
                          (nonaktif)
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 text-slate-600">{w.profession}</td>
                    <td className="py-2 text-slate-600">{w.zone}</td>
                    <td className="py-2 text-center text-slate-600">
                      {w.active}
                    </td>
                    <td className="py-2 text-center text-slate-600">
                      {w.completed}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-vita-blue"
                            style={{ width: `${(w.total / maxUtil) * 100}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">
                          {w.total}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Tarif rata-rata per kategori */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-bold text-slate-800">
          💰 Tarif Rata-rata per Kategori
        </h3>
        {data.tariffByCategory.length === 0 ? (
          <Empty label="Belum ada data tarif." />
        ) : (
          <ul className="space-y-3">
            {data.tariffByCategory.map((c) => (
              <li key={c.category} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">
                    {c.category}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      · {c.services} layanan · {c.tariffs} tarif
                    </span>
                  </span>
                  <span className="font-bold text-vita-greenDark">
                    {rupiah(c.avgPrice)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600"
                    style={{ width: `${(c.avgPrice / maxAvg) * 100}%` }}
                  />
                </div>
                {c.tariffs > 0 ? (
                  <p className="text-[11px] text-slate-400">
                    Rentang {rupiah(c.minPrice)} – {rupiah(c.maxPrice)}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Belum ada tarif terdaftar.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

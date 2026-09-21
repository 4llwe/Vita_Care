"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { rupiah, tanggal } from "../../../lib/format";
import type { Service, Tariff, HealthWorker } from "../../../lib/types";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";
import { AddButton } from "../../../components/modal";
import { ServiceForm } from "../../../components/forms/service-form";
import { TariffForm } from "../../../components/forms/tariff-form";
import { HealthWorkerForm } from "../../../components/forms/health-worker-form";
import { MasterAnalyticsPanel } from "../../../components/dashboard/master-analytics";

type Tab = "services" | "workers" | "analytics";

function Pill({ isActiveData }: { isActiveData: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${isActiveData ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}
    >
      {isActiveData ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function expired(dateStr: string) {
  return new Date(dateStr).getTime() <= Date.now();
}

export default function MasterPage() {
  const [tab, setTab] = useState<Tab>("services");
  const [services, setServices] = useState<Service[] | null>(null);
  const [workers, setWorkers] = useState<HealthWorker[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // modal state
  const [svcForm, setSvcForm] = useState<{
    open: boolean;
    initial: Service | null;
  }>({ open: false, initial: null });
  const [tarForm, setTarForm] = useState<{
    open: boolean;
    service: Service | null;
    initial: Tariff | null;
  }>({ open: false, service: null, initial: null });
  const [hwForm, setHwForm] = useState<{
    open: boolean;
    initial: HealthWorker | null;
  }>({ open: false, initial: null });

  const loadServices = useCallback(() => {
    api<Service[]>("/master/services", { token: getToken() })
      .then(setServices)
      .catch((e) => setError(e.message));
  }, []);
  const loadWorkers = useCallback(() => {
    api<HealthWorker[]>("/master/health-workers", { token: getToken() })
      .then(setWorkers)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    loadServices();
    loadWorkers();
  }, [loadServices, loadWorkers]);

  async function del(path: string, after: () => void, msg: string) {
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      await api(path, { token: getToken(), method: "DELETE" });
      after();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Master Data</h1>
        <p className="text-sm text-slate-500">
          Kelola layanan, tarif, dan tenaga kesehatan.
        </p>
      </div>

      {error ? <ErrorBox message={error} /> : null}

      <div className="flex gap-2">
        {(["services", "workers", "analytics"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${tab === t ? "bg-vita-green text-white" : "bg-white text-slate-600 hover:bg-emerald-50"}`}
          >
            {t === "services"
              ? "Layanan & Tarif"
              : t === "workers"
                ? "Tenaga Kesehatan"
                : "Analitik"}
          </button>
        ))}
      </div>

      {tab === "services" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <AddButton
              onClick={() => setSvcForm({ open: true, initial: null })}
              label="Layanan"
            />
          </div>
          {!services ? (
            <Loading />
          ) : services.length === 0 ? (
            <Empty label="Belum ada layanan." />
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-vita-greenDark">
                          {s.code}
                        </span>
                        <Pill isActiveData={s.isActive} />
                      </div>
                      <h3 className="mt-1 font-bold text-slate-800">
                        {s.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {s.category} · {s.durationMin} menit ·{" "}
                        {s._count?.bookings ?? 0} pemesanan
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSvcForm({ open: true, initial: s })}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() =>
                          del(
                            `/master/services/${s.id}`,
                            loadServices,
                            `Hapus/nonaktifkan layanan “${s.name}”?`,
                          )
                        }
                        disabled={busy}
                        className="rounded-lg border border-red-300 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Tarif
                      </span>
                      <button
                        onClick={() =>
                          setTarForm({ open: true, service: s, initial: null })
                        }
                        className="text-xs font-bold text-vita-green hover:underline"
                      >
                        + Tambah tarif
                      </button>
                    </div>
                    {s.tariffs && s.tariffs.length > 0 ? (
                      <ul className="space-y-1">
                        {s.tariffs.map((t) => (
                          <li
                            key={t.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-slate-700">
                              {t.name} ·{" "}
                              <span className="font-semibold">
                                {rupiah(t.basePrice)}
                              </span>{" "}
                              <span className="text-xs text-slate-400">
                                {t.unit}
                              </span>
                            </span>
                            <span className="flex gap-2">
                              <button
                                onClick={() =>
                                  setTarForm({
                                    open: true,
                                    service: s,
                                    initial: t,
                                  })
                                }
                                className="text-xs font-bold text-slate-500 hover:underline"
                              >
                                Ubah
                              </button>
                              <button
                                onClick={() =>
                                  del(
                                    `/master/tariffs/${t.id}`,
                                    loadServices,
                                    `Hapus tarif “${t.name}”?`,
                                  )
                                }
                                disabled={busy}
                                className="text-xs font-bold text-red-500 hover:underline disabled:opacity-50"
                              >
                                Hapus
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">Belum ada tarif.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === "workers" ? (
        <div className="space-y-3">
          <div className="flex justify-end">
            <AddButton
              onClick={() => setHwForm({ open: true, initial: null })}
              label="Tenaga Kesehatan"
            />
          </div>
          {!workers ? (
            <Loading />
          ) : workers.length === 0 ? (
            <Empty label="Belum ada tenaga kesehatan." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Profesi</th>
                    <th className="px-4 py-3">No. STR/SIP</th>
                    <th className="px-4 py-3">Lisensi s/d</th>
                    <th className="px-4 py-3">Zona</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workers.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {w.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {w.profession}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {w.licenseNo}
                      </td>
                      <td
                        className={`px-4 py-3 text-xs ${expired(w.licenseValidUntil) ? "font-bold text-red-600" : "text-slate-600"}`}
                      >
                        {tanggal(w.licenseValidUntil)}
                        {expired(w.licenseValidUntil) ? " · kedaluwarsa" : ""}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{w.zone}</td>
                      <td className="px-4 py-3">
                        <Pill isActiveData={w.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              setHwForm({ open: true, initial: w })
                            }
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                          >
                            Ubah
                          </button>
                          <button
                            onClick={() =>
                              del(
                                `/master/health-workers/${w.id}`,
                                loadWorkers,
                                `Hapus/nonaktifkan “${w.name}”?`,
                              )
                            }
                            disabled={busy}
                            className="rounded-lg border border-red-300 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <MasterAnalyticsPanel />
      )}

      <ServiceForm
        open={svcForm.open}
        initial={svcForm.initial}
        onClose={() => setSvcForm({ open: false, initial: null })}
        onSaved={loadServices}
      />
      <TariffForm
        open={tarForm.open}
        service={tarForm.service}
        initial={tarForm.initial}
        onClose={() =>
          setTarForm({ open: false, service: null, initial: null })
        }
        onSaved={loadServices}
      />
      <HealthWorkerForm
        open={hwForm.open}
        initial={hwForm.initial}
        onClose={() => setHwForm({ open: false, initial: null })}
        onSaved={loadWorkers}
      />
    </div>
  );
}

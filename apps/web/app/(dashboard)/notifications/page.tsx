"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
export default function NotificationsPage() {
  const [alerts, setAlerts] = useState<any[] | null>(null),
    [emergencies, setEmergencies] = useState<any[] | null>(null),
    [resolutions, setResolutions] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  async function load() {
    const [openAlerts, openEmergencies] = await Promise.all([
      api<any[]>("/hah/alerts/open", { token: getToken() }),
      api<any[]>("/hah/emergency-events/open", { token: getToken() }),
    ]);
    setAlerts(openAlerts);
    setEmergencies(openEmergencies);
  }
  useEffect(() => {
    load()
      .catch((e) => setError(e.message));
  }, []);
  async function patchEmergency(id: string, action: "acknowledge" | "resolve") {
    try {
      await api(`/hah/emergency-events/${id}/${action}`, {
        method: "PATCH",
        token: getToken(),
        body:
          action === "resolve"
            ? { resolution: resolutions[id] }
            : undefined,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tindakan gagal");
    }
  }
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-300">
          Notification center
        </p>
        <h1 className="mt-2 text-3xl font-black">Notifikasi Klinis</h1>
        <p className="mt-2 text-sm text-slate-300">
          Kejadian darurat dan alert aktif diurutkan untuk respons klinis.
        </p>
      </section>
      {error && <div className="rounded-xl bg-red-50 p-4 text-red-800">{error}</div>}
      {alerts === null && !error && (
        <div className="medical-card text-slate-500">Memuat notifikasi…</div>
      )}
      {emergencies?.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-black text-red-800">Respons darurat aktif</h2>
          {emergencies.map((event) => (
            <article
              key={event.id}
              className="rounded-2xl border-2 border-red-300 bg-red-50 p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-red-700">
                    {event.action.replaceAll("_", " ")} · {event.status}
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">
                    {event.episode.code} · {event.episode.patient.fullName}
                  </h3>
                  <p className="mt-2 text-sm text-slate-700">
                    Dibuat {new Date(event.createdAt).toLocaleString("id-ID")}
                  </p>
                  {event.latitude !== null ? (
                    <a
                      className="mt-2 inline-block text-sm font-black text-red-700 underline"
                      href={`https://maps.google.com/?q=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Buka lokasi pasien
                    </a>
                  ) : null}
                </div>
                <div className="flex min-w-72 flex-col gap-2">
                  {event.status === "OPEN" ? (
                    <button
                      onClick={() => patchEmergency(event.id, "acknowledge")}
                      className="min-h-11 rounded-xl bg-orange-600 px-4 font-bold text-white"
                    >
                      Akui dan tangani
                    </button>
                  ) : (
                    <>
                      <textarea
                        value={resolutions[event.id] ?? ""}
                        onChange={(e) =>
                          setResolutions((current) => ({
                            ...current,
                            [event.id]: e.target.value,
                          }))
                        }
                        minLength={5}
                        placeholder="Hasil tindak lanjut"
                        className="min-h-20 rounded-xl border bg-white p-3 text-sm"
                      />
                      <button
                        disabled={(resolutions[event.id]?.length ?? 0) < 5}
                        onClick={() => patchEmergency(event.id, "resolve")}
                        className="min-h-11 rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:opacity-50"
                      >
                        Selesaikan kejadian
                      </button>
                    </>
                  )}
                  <Link
                    href={`/hah/${event.episodeId}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 font-bold"
                  >
                    Buka episode
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : null}
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

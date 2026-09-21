"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { EmergencyButton } from "../emergency-button";
export function PatientClinicalSummary() {
  const [d, setD] = useState<any>(null);
  const [empty, setEmpty] = useState(false);
  useEffect(() => {
    api<any[]>("/hah/episodes", { token: getToken() })
      .then(async (x) => {
        if (!x[0]) {
          setEmpty(true);
          return;
        }
        setD(await api(`/hah/episodes/${x[0].id}`, { token: getToken() }));
      })
      .catch(() => setEmpty(true));
  }, []);
  if (empty)
    return (
      <section className="medical-card">
        <h2 className="text-lg font-black">
          Belum ada episode Vita Care Hospital At Home aktif
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Hubungi koordinator layanan untuk asesmen dan aktivasi episode.
        </p>
        <div className="mt-4">
          <EmergencyButton />
        </div>
      </section>
    );
  if (!d)
    return (
      <div className="medical-card text-sm text-slate-500">
        Memuat kondisi klinis…
      </div>
    );
  const o = d.observations?.[0];
  const risk =
    o?.ewsRisk === "critical"
      ? ["Darurat", "bg-red-100 text-red-800"]
      : o?.ewsRisk === "high"
        ? ["Perlu Perhatian", "bg-orange-100 text-orange-800"]
        : o?.ewsRisk === "medium"
          ? ["Perlu Pemantauan", "bg-amber-100 text-amber-800"]
          : ["Stabil", "bg-emerald-100 text-emerald-800"];
  const visit = d.visits?.find(
    (x: any) => new Date(x.scheduledStart) > new Date(),
  );
  const message =
    d.visits?.find((x: any) => x.handoverNote)?.handoverNote ??
    d.alerts?.find((x: any) => x.resolution)?.resolution ??
    "Belum ada pesan baru dari tenaga kesehatan.";
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-300">Status pasien</p>
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-black ${risk[1]}`}
          >
            {risk[0]}
          </span>
          <h2 className="mt-3 text-2xl font-black">{d.patient.fullName}</h2>
          <p className="text-sm text-slate-400">
            {d.code} · {d.primaryDiagnosis}
          </p>
        </div>
        <EmergencyButton />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Kunjungan berikutnya",
            visit
              ? new Date(visit.scheduledStart).toLocaleString("id-ID")
              : "Belum dijadwalkan",
          ],
          [
            "Tanda vital terbaru",
            o ? `${o.systolic}/${o.diastolic} · SpO₂ ${o.spo2}%` : "Belum ada",
          ],
          [
            "Obat hari ini",
            `${d.medicationOrders?.filter((x: any) => x.status === "ACTIVE").length ?? 0} order aktif`,
          ],
          [
            "Hasil laboratorium",
            `${d.diagnosticOrders?.filter((x: any) => x.status === "RESULTED").length ?? 0} hasil tersedia`,
          ],
        ].map(([a, b]) => (
          <div key={a} className="medical-card">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {a}
            </p>
            <p className="mt-3 font-extrabold text-slate-900">{b}</p>
          </div>
        ))}
      </section>
      <section className="medical-card">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
          Pesan dari tenaga kesehatan
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-700">{message}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/workspace/rencana-perawatan"
          className="medical-card font-extrabold"
        >
          Rencana perawatan
          <span className="mt-2 block text-sm font-medium text-slate-500">
            Review berikutnya:{" "}
            {d.carePlan?.nextReviewAt
              ? new Date(d.carePlan.nextReviewAt).toLocaleString("id-ID")
              : "Belum ditetapkan"}
          </span>
        </Link>
        <Link href="/monitoring" className="medical-card font-extrabold">
          Monitoring kondisi
          <span className="mt-2 block text-sm font-medium text-slate-500">
            Lihat grafik dan status early warning
          </span>
        </Link>
      </section>
    </div>
  );
}

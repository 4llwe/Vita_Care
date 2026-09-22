"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
type Obs = {
  recordedAt: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  respRate: number;
  temperature: number;
  spo2: number;
  glucoseMgDl?: number;
  weightKg?: number;
  painScore?: number;
  ewsScore: number;
  ewsRisk: string;
};
type Episode = {
  id: string;
  code: string;
  patient: { fullName: string; mrn: string };
  status: string;
};
const metrics = [
  { label: "Tekanan darah", keys: ["systolic", "diastolic"], unit: "mmHg", tolerance: 3 },
  { label: "Heart rate", keys: ["heartRate"], unit: "bpm", tolerance: 2 },
  { label: "SpO₂", keys: ["spo2"], unit: "%", tolerance: 1 },
  { label: "Suhu", keys: ["temperature"], unit: "°C", tolerance: 0.2 },
  { label: "Respiratory rate", keys: ["respRate"], unit: "/menit", tolerance: 1 },
  { label: "Gula darah", keys: ["glucoseMgDl"], unit: "mg/dL", tolerance: 5 },
  { label: "Berat badan", keys: ["weightKg"], unit: "kg", tolerance: 0.3 },
  { label: "Skala nyeri", keys: ["painScore"], unit: "/10", tolerance: 1 },
] as const;
function SeriesChart({
  rows,
  keys,
  label,
}: {
  rows: Obs[];
  keys: readonly string[];
  label: string;
}) {
  const series = keys.map((key) =>
    rows
      .map((r) => ({ at: r.recordedAt, value: Number((r as any)[key]) }))
      .filter((x) => Number.isFinite(x.value)),
  );
  const all = series.flatMap((x) => x.map((v) => v.value));
  if (!all.length)
    return (
      <div className="grid h-36 place-items-center rounded-xl bg-slate-50 text-xs text-slate-400">
        Belum ada data
      </div>
    );
  const min = Math.min(...all),
    max = Math.max(...all),
    pad = Math.max((max - min) * 0.15, 1),
    low = min - pad,
    high = max + pad;
  const points = (values: { value: number }[]) =>
    values
      .map(
        (v, i) =>
          `${8 + (i / Math.max(values.length - 1, 1)) * 88},${8 + ((high - v.value) / (high - low)) * 68}`,
      )
      .join(" ");
  return (
    <div>
      <svg
        viewBox="0 0 100 88"
        preserveAspectRatio="none"
        className="h-32 w-full"
        role="img"
        aria-label={`Grafik ${label} berdasarkan waktu`}
      >
        {[0, 1, 2].map((x) => (
          <line
            key={x}
            x1="8"
            y1={8 + x * 34}
            x2="96"
            y2={8 + x * 34}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}
        {series.map((s, i) => (
          <polyline
            key={keys[i]}
            points={points(s)}
            fill="none"
            stroke={i ? "#2563eb" : "#0f766e"}
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {series.map((s, si) =>
          s.map((v, i) => (
            <circle
              key={`${si}-${i}`}
              cx={8 + (i / Math.max(s.length - 1, 1)) * 88}
              cy={8 + ((high - v.value) / (high - low)) * 68}
              r="1.6"
              fill={si ? "#2563eb" : "#0f766e"}
            />
          )),
        )}
      </svg>
      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
        <span>
          {rows[0] ? new Date(rows[0].recordedAt).toLocaleDateString("id-ID") : ""}
        </span>
        {keys.length > 1 && (
          <span>
            <b className="text-teal-700">Sistolik</b> ·{" "}
            <b className="text-blue-700">Diastolik</b>
          </span>
        )}
        <span>
          {rows.at(-1)
            ? new Date(rows.at(-1)!.recordedAt).toLocaleDateString("id-ID")
            : ""}
        </span>
      </div>
    </div>
  );
}
export default function Monitoring() {
  const [episodes, setEpisodes] = useState<Episode[]>([]),
    [id, setId] = useState(""),
    [obs, setObs] = useState<Obs[]>([]),
    [range, setRange] = useState("20"),
    [error, setError] = useState("");
  useEffect(() => {
    api<Episode[]>("/hah/episodes", { token: getToken() })
      .then((x) => {
        setEpisodes(x);
        if (x[0]) setId(x[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!id) return;
    api<any>(`/hah/episodes/${id}`, { token: getToken() })
      .then((x) => setObs([...(x.observations ?? [])].reverse()))
      .catch((e) => setError(e.message));
  }, [id]);
  const shown = obs.slice(-Number(range));
  const latest = shown.at(-1);
  const category =
    latest?.ewsRisk === "critical"
      ? ["CRITICAL", "bg-red-100 text-red-800"]
      : latest?.ewsRisk === "high"
        ? ["ATTENTION", "bg-orange-100 text-orange-800"]
        : latest?.ewsRisk === "medium"
          ? ["WARNING", "bg-amber-100 text-amber-800"]
          : ["NORMAL", "bg-emerald-100 text-emerald-800"];
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-300">
              Clinical monitoring
            </p>
            <h1 className="mt-2 text-3xl font-black">Monitoring Pasien</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Tren mendukung penilaian klinis dan tidak merupakan diagnosis. Alert
              mengikuti protokol yang disahkan tenaga kesehatan.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-300">
              Episode
              <select
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl bg-white px-3 text-slate-900"
              >
                <option value="">Pilih episode</option>
                {episodes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.code} · {e.patient.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-300">
              Rentang
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-xl bg-white px-3 text-slate-900"
              >
                <option value="8">8 observasi</option>
                <option value="20">20 observasi</option>
              </select>
            </label>
          </div>
        </div>
      </section>
      {error && <div className="rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const values = shown
            .map((o) => Number((o as any)[m.keys[0]]))
            .filter(Number.isFinite);
          const a = values.at(-1),
            b = values.at(-2);
          const delta = a == null || b == null ? 0 : a - b;
          const trend =
            Math.abs(delta) < m.tolerance
              ? "Stabil"
              : delta > 0
                ? "Meningkat"
                : "Menurun";
          const current =
            m.keys.length === 2 && latest
              ? `${latest.systolic}/${latest.diastolic}`
              : (a ?? "—");
          return (
            <article key={m.label} className="medical-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-500">{m.label}</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {current} <span className="text-xs text-slate-400">{m.unit}</span>
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase text-slate-600">
                  {trend}
                </span>
              </div>
              <div className="mt-3">
                <SeriesChart rows={shown} keys={m.keys} label={m.label} />
              </div>
            </article>
          );
        })}
      </section>
      <section className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <div className="medical-card">
          <p className="text-sm font-bold text-slate-500">Early Warning System</p>
          <div
            className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-black ${category[1]}`}
          >
            {category[0]}
            {latest ? ` · skor ${latest.ewsScore}` : ""}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Patient Alert → Perawat → Dokter → Eskalasi → Rujukan Rumah Sakit
          </p>
          <p className="mt-3 text-xs text-slate-500">
            Alert, acknowledgement, resolusi, dan tindakan dicatat dalam audit trail.
          </p>
        </div>
        <div className="medical-card">
          <h2 className="text-lg font-black">Tindak lanjut klinis</h2>
          <p className="mt-2 text-sm text-slate-600">
            Nilai di luar pola atau perubahan gejala harus dinilai bersama kondisi pasien,
            bukan satu parameter saja.
          </p>
          <Link
            href={id ? `/hah/${id}` : "/hah"}
            className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-extrabold text-white"
          >
            {id ? "Buka episode pasien" : "Pilih pasien"}
          </Link>
        </div>
      </section>
    </div>
  );
}

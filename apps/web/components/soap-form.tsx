"use client";

import { useState } from "react";
import { api } from "../lib/api";
import { getToken } from "../lib/auth";

type Field = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
};

const VITALS: Field[] = [
  { name: "systolic", label: "Sistolik (mmHg)", type: "number" },
  { name: "diastolic", label: "Diastolik (mmHg)", type: "number" },
  { name: "heartRate", label: "Nadi (x/menit)", type: "number" },
  { name: "respRate", label: "Napas (x/menit)", type: "number" },
  { name: "temperature", label: "Suhu (°C)", type: "number" },
  { name: "spo2", label: "SpO2 (%)", type: "number" },
];

export function SoapForm() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    ewsScore: number;
    ewsRisk: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (k: string) =>
    form[k] === undefined || form[k] === "" ? undefined : Number(form[k]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = {
        bookingId: form.bookingId,
        patientName: form.patientName,
        subjective: form.subjective,
        objective: form.objective,
        assessment: form.assessment,
        plan: form.plan,
        systolic: num("systolic"),
        diastolic: num("diastolic"),
        heartRate: num("heartRate"),
        respRate: num("respRate"),
        temperature: num("temperature"),
        spo2: num("spo2"),
        consciousness: form.consciousness || "A",
      };
      const r = await api<{ ewsScore: number; ewsRisk: string }>(
        "/medical-records",
        { method: "POST", token: getToken(), body },
      );
      setResult({ ewsScore: r.ewsScore, ewsRisk: r.ewsRisk });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const input =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-vita-green focus:outline-none focus:ring-1 focus:ring-vita-green";
  const riskTone: Record<string, string> = {
    low: "bg-emerald-100 text-emerald-800",
    medium: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-700",
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-600">
            Booking ID
          </span>
          <input
            className={input}
            value={form.bookingId ?? ""}
            onChange={(e) => set("bookingId", e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-slate-600">
            Nama Pasien
          </span>
          <input
            className={input}
            value={form.patientName ?? ""}
            onChange={(e) => set("patientName", e.target.value)}
            required
          />
        </label>
      </div>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-bold text-vita-greenDark">
          SOAP
        </legend>
        {(["subjective", "objective", "assessment", "plan"] as const).map(
          (k) => (
            <label key={k} className="mb-3 block text-sm">
              <span className="mb-1 block font-semibold capitalize text-slate-600">
                {k}
              </span>
              <textarea
                className={input}
                rows={2}
                value={form[k] ?? ""}
                onChange={(e) => set(k, e.target.value)}
                required
              />
            </label>
          ),
        )}
      </fieldset>

      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-bold text-vita-greenDark">
          Tanda Vital (untuk EWS)
        </legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {VITALS.map((f) => (
            <label key={f.name} className="text-sm">
              <span className="mb-1 block font-semibold text-slate-600">
                {f.label}
              </span>
              <input
                type={f.type}
                className={input}
                value={form[f.name] ?? ""}
                onChange={(e) => set(f.name, e.target.value)}
              />
            </label>
          ))}
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-600">
              Kesadaran (AVPU)
            </span>
            <select
              className={input}
              value={form.consciousness ?? "A"}
              onChange={(e) => set("consciousness", e.target.value)}
            >
              <option value="A">A — Alert</option>
              <option value="V">V — Voice</option>
              <option value="P">P — Pain</option>
              <option value="U">U — Unresponsive</option>
            </select>
          </label>
        </div>
      </fieldset>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span className="text-sm font-semibold text-slate-600">
            Skor EWS:
          </span>
          <span className="text-2xl font-extrabold text-slate-800">
            {result.ewsScore}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${riskTone[result.ewsRisk] ?? ""}`}
          >
            {result.ewsRisk}
          </span>
        </div>
      ) : null}

      <button
        disabled={saving}
        className="rounded-xl bg-vita-green px-5 py-2.5 font-bold text-white hover:bg-vita-greenDark disabled:opacity-60"
      >
        {saving ? "Menyimpan…" : "Simpan Rekam Medis"}
      </button>
    </form>
  );
}

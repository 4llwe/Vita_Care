"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
const thresholds = {
  resp: [8, 11, 20, 24],
  temperature: [35, 36, 38, 39],
  systolic: [90, 100, 110, 219],
  heartRate: [40, 50, 90, 110, 130],
  spo2Scale1: [91, 93, 95],
  risk: { medium: 3, high: 5, critical: 7 },
};
export default function ClinicalProtocol() {
  const [active, setActive] = useState<any>(null),
    [notice, setNotice] = useState("");
  const load = () =>
    api<any>("/hah/protocols/active", { token: getToken() })
      .then(setActive)
      .catch(() => setActive(null));
  useEffect(() => {
    void load();
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api("/hah/protocols", {
        method: "POST",
        token: getToken(),
        body: {
          name: f.get("name"),
          thresholds: JSON.parse(String(f.get("thresholds"))),
          responseSla: JSON.parse(String(f.get("responseSla"))),
          approvalNote: f.get("approvalNote"),
          activeFrom: new Date(String(f.get("activeFrom"))).toISOString(),
        },
      });
      setNotice("Draft protokol dibuat dan menunggu persetujuan administrator kedua.");
      load();
    } catch (x) {
      setNotice(x instanceof Error ? x.message : "Gagal menyimpan");
    }
  }
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-300">
          Clinical governance
        </p>
        <h1 className="mt-2 text-3xl font-black">Protokol EWS Terversi</h1>
        <p className="mt-2 text-slate-300">
          Hanya Super Admin dapat mengaktifkan versi yang sudah disetujui tata kelola
          klinis.
        </p>
      </section>
      {active && (
        <section className="medical-card">
          <h2 className="text-lg font-black">
            Aktif: v{active.version} · {active.name}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Berlaku {new Date(active.activeFrom).toLocaleString("id-ID")}
          </p>
          <pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-teal-100">
            {JSON.stringify(
              { thresholds: active.thresholds, responseSla: active.responseSla },
              null,
              2,
            )}
          </pre>
        </section>
      )}
      <form onSubmit={save} className="medical-card space-y-4">
        <h2 className="text-lg font-black">Aktifkan versi baru</h2>
        <label className="block text-sm font-bold">
          Nama
          <input
            name="name"
            required
            defaultValue="NEWS2 Lokal HaH"
            className="mt-1 min-h-11 w-full rounded-xl border px-3"
          />
        </label>
        <label className="block text-sm font-bold">
          Threshold JSON
          <textarea
            name="thresholds"
            required
            defaultValue={JSON.stringify(thresholds, null, 2)}
            className="mt-1 min-h-72 w-full rounded-xl border p-3 font-mono text-xs"
          />
        </label>
        <label className="block text-sm font-bold">
          SLA respons JSON
          <textarea
            name="responseSla"
            required
            defaultValue={JSON.stringify({ medium: 60, high: 30, critical: 15 }, null, 2)}
            className="mt-1 min-h-32 w-full rounded-xl border p-3 font-mono text-xs"
          />
        </label>
        <label className="block text-sm font-bold">
          Catatan persetujuan
          <textarea
            name="approvalNote"
            minLength={5}
            required
            className="mt-1 min-h-24 w-full rounded-xl border p-3"
          />
        </label>
        <label className="block text-sm font-bold">
          Mulai berlaku
          <input
            name="activeFrom"
            type="datetime-local"
            required
            className="mt-1 min-h-11 w-full rounded-xl border px-3"
          />
        </label>
        <button className="min-h-11 rounded-xl bg-teal-700 px-5 font-black text-white">
          Ajukan untuk persetujuan kedua
        </button>
        {notice && <p className="rounded-xl bg-slate-100 p-3 text-sm">{notice}</p>}
      </form>
    </div>
  );
}

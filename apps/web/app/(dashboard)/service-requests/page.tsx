"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
export default function ServiceRequests() {
  const [rows, setRows] = useState<any[]>([]),
    [error, setError] = useState("");
  const load = () =>
    api<any[]>("/public-requests", { token: getToken() })
      .then(setRows)
      .catch((e) => setError(e.message));
  useEffect(() => {
    void load();
  }, []);
  async function update(id: string, status: string) {
    await api(`/public-requests/${id}`, {
      method: "PATCH",
      token: getToken(),
      body: { status },
    });
    load();
  }
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-black uppercase tracking-[.2em] text-teal-300">
          Service operations
        </p>
        <h1 className="mt-2 text-3xl font-black">Permintaan Layanan Publik</h1>
        <p className="mt-2 text-slate-300">
          Triage profesional untuk pemesanan, layanan, kemitraan, kontak, dan pengaduan.
        </p>
      </section>
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
      <div className="grid gap-4">
        {rows.map((r) => (
          <article key={r.id} className="medical-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black text-teal-700">
                  {r.type} · {r.status}
                </p>
                <h2 className="mt-1 text-lg font-black">{r.name}</h2>
                <p className="text-sm text-slate-500">
                  {r.section}/{r.slug} · {new Date(r.createdAt).toLocaleString("id-ID")}
                </p>
              </div>
              <select
                value={r.status}
                onChange={(e) => update(r.id, e.target.value)}
                className="min-h-11 rounded-xl border px-3"
              >
                <option>NEW</option>
                <option>CONTACTED</option>
                <option>SCHEDULED</option>
                <option>RESOLVED</option>
                <option>REJECTED</option>
              </select>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm">
              {r.message}
            </p>
            <p className="mt-3 text-sm font-bold">
              {r.phone ?? r.email ?? "Kontak belum tersedia"}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { fetchMe, type Session } from "../../../lib/session";

const nextStatus: Record<string, string> = {
  REQUESTED: "CLINICAL_REVIEW",
  CLINICAL_REVIEW: "APPROVED",
  APPROVED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};
const actionLabel: Record<string, string> = {
  CLINICAL_REVIEW: "Mulai review klinis",
  APPROVED: "Setujui refill",
  PREPARING: "Siapkan obat",
  OUT_FOR_DELIVERY: "Kirim obat",
  DELIVERED: "Konfirmasi diterima",
};

export default function PharmacyPage() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const roles = [session?.role, ...(session?.roles ?? [])];
  const isStaff = roles.some((role) =>
    ["HEALTH_WORKER", "DOCTOR", "NURSE", "COORDINATOR", "SUPER_ADMIN"].includes(
      String(role),
    ),
  );

  async function load() {
    setRows(
      await api("/hah/pharmacy/fulfillments", { token: getToken() }),
    );
  }
  useEffect(() => {
    Promise.all([load(), fetchMe().then(setSession)]).catch((e) =>
      setError(e.message),
    );
  }, []);

  async function advance(row: any) {
    const status = nextStatus[row.status];
    if (!status) return;
    const courierName =
      status === "OUT_FOR_DELIVERY"
        ? window.prompt("Nama kurir/petugas pengantar")
        : undefined;
    if (status === "OUT_FOR_DELIVERY" && !courierName) return;
    setBusy(row.id);
    setError("");
    try {
      await api(`/hah/pharmacy-fulfillments/${row.id}`, {
        method: "PATCH",
        token: getToken(),
        body: { status, courierName },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status farmasi gagal diperbarui");
    } finally {
      setBusy("");
    }
  }

  const active =
    rows?.filter((row) => !["DELIVERED", "CANCELLED"].includes(row.status))
      .length ?? 0;
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-300">
          Medication fulfillment
        </p>
        <h1 className="mt-2 text-3xl font-black">Farmasi & Pengantaran Obat</h1>
        <p className="mt-2 text-sm text-slate-300">
          Review resep, persetujuan refill, penyiapan, pengiriman, dan bukti
          penerimaan dalam satu audit trail.
        </p>
        <p className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
          {active} permintaan aktif
        </p>
      </section>
      {error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}
      {rows === null ? (
        <div className="medical-card text-slate-500">Memuat permintaan…</div>
      ) : null}
      {rows?.length === 0 ? (
        <div className="medical-card">
          <h2 className="font-black">Belum ada permintaan obat</h2>
          <p className="mt-2 text-sm text-slate-500">
            Pasien atau tim dapat meminta pengisian dari medication order aktif.
          </p>
        </div>
      ) : null}
      <div className="space-y-4">
        {rows?.map((row) => {
          const order = row.medicationOrder;
          const episode = order.episode;
          return (
            <article
              key={row.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                    Refill #{row.refillNumber} · {row.status.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-1 text-lg font-black">
                    {order.medicationName} {order.dose}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {episode.code} · {episode.patient.fullName} · {row.quantity}
                  </p>
                  <p className="mt-2 text-sm">
                    <b>Tujuan:</b> {row.deliveryAddress}
                  </p>
                  {row.courierName ? (
                    <p className="mt-1 text-sm">
                      <b>Kurir:</b> {row.courierName}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/hah/${episode.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold"
                >
                  Buka pasien
                </Link>
              </div>
              {isStaff && nextStatus[row.status] ? (
                <button
                  disabled={busy === row.id}
                  onClick={() => advance(row)}
                  className="mt-4 min-h-11 rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:opacity-50"
                >
                  {actionLabel[nextStatus[row.status]]}
                </button>
              ) : null}
              {row.status === "DELIVERED" ? (
                <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
                  Obat diterima pada{" "}
                  {new Date(row.deliveredAt).toLocaleString("id-ID")}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
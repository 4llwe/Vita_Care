"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { api } from "../lib/api";
import type { MenuOperation } from "../lib/menu-operation";
export function OperationalActionPanel({
  section,
  slug,
  operation,
}: {
  section: string;
  slug: string;
  operation: MenuOperation;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      const result = await api<{ id: string }>("/public-requests", {
        method: "POST",
        body: {
          type: operation.requestType,
          section,
          slug,
          name: f.get("name"),
          email: f.get("email") || undefined,
          phone: f.get("phone") || undefined,
          message: f.get("message"),
          preferredAt: f.get("preferredAt")
            ? new Date(String(f.get("preferredAt"))).toISOString()
            : undefined,
        },
      });
      setStatus(`Permintaan diterima. Nomor tiket: ${result.id}`);
      form.reset();
    } catch (x) {
      setStatus(x instanceof Error ? x.message : "Permintaan gagal dikirim");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="mt-8 rounded-3xl border border-teal-100 bg-teal-50 p-5 sm:p-6">
      <h2 className="text-xl font-black text-teal-950">{operation.headline}</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {operation.steps.map((x, i) => (
          <li key={x} className="rounded-xl bg-white p-3 text-sm">
            <b className="text-teal-700">{i + 1}.</b> {x}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm font-semibold text-teal-900">SLA: {operation.sla}</p>
      {operation.kind === "secure" ? (
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-black text-white"
        >
          Masuk ke layanan aman
        </Link>
      ) : operation.requestType ? (
        <form onSubmit={submit} className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            placeholder="Nama lengkap"
            className="min-h-11 rounded-xl border bg-white px-3"
          />
          <input
            name="phone"
            maxLength={30}
            placeholder="Nomor telepon"
            className="min-h-11 rounded-xl border bg-white px-3"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="min-h-11 rounded-xl border bg-white px-3"
          />
          <input
            name="preferredAt"
            type="datetime-local"
            className="min-h-11 rounded-xl border bg-white px-3"
          />
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={2000}
            placeholder="Jelaskan kebutuhan, tanpa memasukkan data klinis sensitif"
            className="min-h-28 rounded-xl border bg-white p-3 md:col-span-2"
          />
          <button
            disabled={busy}
            className="min-h-11 rounded-xl bg-teal-700 px-5 font-black text-white disabled:opacity-50"
          >
            {busy ? "Mengirim…" : "Kirim dan buat tiket"}
          </button>
          {status && (
            <p role="status" className="rounded-xl bg-white p-3 text-sm md:col-span-2">
              {status}
            </p>
          )}
        </form>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/direktori"
            className="rounded-xl bg-teal-700 px-5 py-3 font-black text-white"
          >
            Jelajahi layanan terkait
          </Link>
          <Link
            href="/informasi/kontak/hubungi-kami"
            className="rounded-xl border border-teal-700 px-5 py-3 font-bold text-teal-900"
          >
            Hubungi petugas
          </Link>
        </div>
      )}
    </section>
  );
}

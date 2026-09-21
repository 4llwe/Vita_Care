"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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
  const [minimumPreferredAt, setMinimumPreferredAt] = useState<string>();
  const [preferredAtValue, setPreferredAtValue] = useState("");
  const [wantsPreferredAt, setWantsPreferredAt] = useState(false);

  useEffect(() => {
    const now = new Date();
    const localNow = new Date(
      now.getTime() - now.getTimezoneOffset() * 60_000,
    );

    setMinimumPreferredAt(localNow.toISOString().slice(0, 16));
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const f = new FormData(form);

    const name = String(f.get("name") ?? "").trim();
    const phone = String(f.get("phone") ?? "").trim();
    const email = String(f.get("email") ?? "").trim();
    const message = String(f.get("message") ?? "").trim();
    const preferredAt = String(f.get("preferredAt") ?? "").trim();

    setStatus("");

    if (!phone && !email) {
      setStatus(
        "Isi minimal salah satu kanal yang dapat dihubungi: nomor telepon atau email.",
      );
      form.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
      return;
    }

    if (preferredAt) {
      const preferredDate = new Date(preferredAt);

      if (
        Number.isNaN(preferredDate.getTime()) ||
        preferredDate.getTime() <= Date.now()
      ) {
        setStatus("Pilih waktu yang akan datang atau kosongkan kolom waktu.");
        form
          .querySelector<HTMLInputElement>('[name="preferredAt"]')
          ?.focus();
        return;
      }
    }

    setBusy(true);

    try {
      const result = await api<{ id: string }>("/public-requests", {
        method: "POST",
        body: {
          type: operation.requestType,
          section,
          slug,
          name,
          email: email || undefined,
          phone: phone || undefined,
          message,
          preferredAt: preferredAt
            ? new Date(preferredAt).toISOString()
            : undefined,
        },
      });

      setStatus(`Permintaan diterima. Nomor tiket: ${result.id}`);
      form.reset();
      setPreferredAtValue("");
      setWantsPreferredAt(false);
    } catch (x) {
      setStatus(
        x instanceof Error ? x.message : "Permintaan gagal dikirim",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-3xl border border-teal-100 bg-teal-50 p-5 sm:p-6">
      <h2 className="text-xl font-black text-teal-950">
        {operation.headline}
      </h2>

      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {operation.steps.map((x, i) => (
          <li key={x} className="rounded-xl bg-white p-3 text-sm">
            <b className="text-teal-700">{i + 1}.</b> {x}
          </li>
        ))}
      </ol>

      <p className="mt-3 text-sm font-semibold text-teal-900">
        <span className="font-black">SLA layanan:</span>{" "}
        {operation.sla}. Permintaan tetap melalui verifikasi kelayakan,
        area pelayanan, dan ketersediaan petugas.
      </p>

      {operation.kind === "secure" ? (
        <Link
          href="/login"
          className="mt-5 inline-flex rounded-xl bg-teal-700 px-5 py-3 font-black text-white"
        >
          Masuk ke layanan aman
        </Link>
      ) : operation.requestType ? (
        <form
          onSubmit={submit}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label
              htmlFor="request-name"
              className="mb-1.5 block text-sm font-bold text-teal-950"
            >
              Nama lengkap <span className="text-red-700">*</span>
            </label>
            <input
              id="request-name"
              name="name"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              placeholder="Masukkan nama lengkap"
              className="min-h-11 w-full rounded-xl border bg-white px-3"
            />
          </div>

          <div>
            <label
              htmlFor="request-phone"
              className="mb-1.5 block text-sm font-bold text-teal-950"
            >
              Nomor telepon{" "}
              <span className="font-normal text-slate-600">
                (telepon atau email wajib diisi)
              </span>
            </label>
            <input
              id="request-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              maxLength={30}
              autoComplete="tel"
              placeholder="Contoh: 0812 3456 7890"
              className="min-h-11 w-full rounded-xl border bg-white px-3"
            />
          </div>

          <div>
            <label
              htmlFor="request-email"
              className="mb-1.5 block text-sm font-bold text-teal-950"
            >
              Email{" "}
              <span className="font-normal text-slate-600">
                (telepon atau email wajib diisi)
              </span>
            </label>
            <input
              id="request-email"
              name="email"
              type="email"
              maxLength={254}
              autoComplete="email"
              placeholder="nama@email.com"
              className="min-h-11 w-full rounded-xl border bg-white px-3"
            />
          </div>

          <div className="rounded-xl border border-teal-200 bg-white p-4">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={wantsPreferredAt}
                onChange={(event) => {
                  setWantsPreferredAt(event.target.checked);
                  if (!event.target.checked) {
                    setPreferredAtValue("");
                  }
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
              />
              <span>
                <span className="font-bold text-teal-950">
                  Saya ingin mengusulkan waktu kunjungan
                </span>
                <br />
                <span className="text-xs text-slate-600">
                  Opsional dan belum merupakan konfirmasi jadwal.
                </span>
              </span>
            </label>

            {wantsPreferredAt && (
              <div className="mt-3">
                <label
                  htmlFor="request-preferred-at"
                  className="mb-1.5 block text-sm font-bold text-teal-950"
                >
                  Waktu yang diharapkan
                </label>
                <input
                  id="request-preferred-at"
                  name="preferredAt"
                  type="datetime-local"
                  value={preferredAtValue}
                  onChange={(event) =>
                    setPreferredAtValue(event.target.value)
                  }
                  min={minimumPreferredAt}
                  autoComplete="off"
                  aria-describedby="preferred-at-help"
                  className="min-h-11 w-full rounded-xl border bg-white px-3"
                />
                <p
                  id="preferred-at-help"
                  className="mt-1 text-xs text-slate-600"
                >
                  Tim akan mengonfirmasi waktu melalui kanal resmi.
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="request-message"
              className="mb-1.5 block text-sm font-bold text-teal-950"
            >
              Uraian kebutuhan <span className="text-red-700">*</span>
            </label>
            <textarea
              id="request-message"
              name="message"
              required
              minLength={10}
              maxLength={2000}
              aria-describedby="message-safety-help"
              placeholder="Jelaskan kebutuhan secara singkat"
              className="min-h-28 w-full rounded-xl border bg-white p-3"
            />
            <p
              id="message-safety-help"
              className="mt-1.5 text-sm font-semibold text-red-800"
            >
              Jangan memasukkan NIK, nomor rekam medis, diagnosis,
              hasil laboratorium, foto dokumen, atau data klinis sensitif.
            </p>
          </div>

          <div className="rounded-xl border border-teal-200 bg-white p-4 md:col-span-2">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                name="consent"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 shrink-0 accent-teal-700"
              />
              <span>
                Saya memahami bahwa formulir ini bukan kanal darurat dan
                menyetujui penggunaan data identitas serta kontak untuk
                verifikasi dan tindak lanjut permintaan. Informasi klinis
                rinci hanya disampaikan melalui kanal aman setelah
                identitas diverifikasi.{" "}
                <span className="font-bold text-red-700">*</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="min-h-11 rounded-xl bg-teal-700 px-5 font-black text-white disabled:cursor-not-allowed disabled:opacity-50 md:col-span-2"
          >
            {busy ? "Mengirim…" : "Kirim dan buat tiket"}
          </button>

          {status && (
            <p
              role="status"
              aria-live="polite"
              className="rounded-xl bg-white p-3 text-sm font-semibold md:col-span-2"
            >
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

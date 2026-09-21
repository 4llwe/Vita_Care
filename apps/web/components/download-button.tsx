"use client";

import { useState } from "react";
import { downloadAuth } from "../lib/download";

/** Tombol/link unduh berkas terproteksi (menyertakan token). */
export function DownloadButton({
  path,
  filename,
  label,
  variant = "link",
}: {
  path: string;
  filename: string;
  label: string;
  variant?: "link" | "solid";
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function handle() {
    setBusy(true);
    setError(false);
    try {
      await downloadAuth(path, filename);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const base =
    variant === "solid"
      ? "inline-flex items-center gap-1 rounded-xl bg-vita-green px-3 py-2 text-sm font-bold text-white hover:bg-vita-greenDark disabled:opacity-60"
      : "inline-flex items-center gap-1 text-sm font-semibold text-vita-blue hover:underline disabled:opacity-60";

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className={base}
      title={label}
    >
      {busy ? "Menyiapkan…" : error ? "⚠ Coba lagi" : label}
    </button>
  );
}

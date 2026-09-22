"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Modal, PrimaryButton } from "../modal";
import { Field, TextInput, Select, FormError } from "../form-controls";

const CATEGORIES = ["SOP", "Kebijakan", "Formulir", "Sertifikat", "Panduan"];

export function DocumentForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("SOP");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/documents", {
        token: getToken(),
        method: "POST",
        body: { title, category },
      });
      onSaved();
      onClose();
      setTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Dokumen Baru" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Judul Dokumen">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
          />
        </Field>
        <Field label="Kategori">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Dokumen dibuat sebagai DRAFT. Unggah versi lalu submit untuk review
          &amp; approval.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import type { Service } from "../../lib/types";
import { Modal, PrimaryButton } from "../modal";
import { Field, TextInput, FormError } from "../form-controls";

/** Tambah / ubah layanan home care. */
export function ServiceForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Service | null;
}) {
  const editing = !!initial;
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [durationMin, setDurationMin] = useState("60");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCode(initial?.code ?? "");
    setName(initial?.name ?? "");
    setCategory(initial?.category ?? "");
    setDurationMin(String(initial?.durationMin ?? 60));
    setError(null);
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = { code, name, category, durationMin: Number(durationMin) };
      if (editing) {
        await api(`/master/services/${initial!.id}`, {
          token: getToken(),
          method: "PATCH",
          body,
        });
      } else {
        await api("/master/services", {
          token: getToken(),
          method: "POST",
          body,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? "Ubah Layanan" : "Layanan Baru"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Kode (mis. DOC, NRS)">
          <TextInput
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            minLength={2}
          />
        </Field>
        <Field label="Nama Layanan">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="Kategori (mis. Medis, Perawatan, Lab)">
          <TextInput
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </Field>
        <Field label="Durasi (menit)">
          <TextInput
            type="number"
            min={1}
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
            required
          />
        </Field>
        <div className="flex justify-end">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

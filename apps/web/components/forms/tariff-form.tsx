"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import type { Service, Tariff } from "../../lib/types";
import { Modal, PrimaryButton } from "../modal";
import { Field, TextInput, FormError } from "../form-controls";

/** Tambah / ubah tarif untuk sebuah layanan. */
export function TariffForm({
  open,
  onClose,
  onSaved,
  service,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  service: Service | null;
  initial?: Tariff | null;
}) {
  const editing = !!initial;
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("0");
  const [unit, setUnit] = useState("per kunjungan");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "Tarif Standar");
    setBasePrice(String(initial?.basePrice ?? 0));
    setUnit(initial?.unit ?? "per kunjungan");
    setError(null);
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await api(`/master/tariffs/${initial!.id}`, {
          token: getToken(),
          method: "PATCH",
          body: { name, basePrice: Number(basePrice), unit },
        });
      } else {
        await api("/master/tariffs", {
          token: getToken(),
          method: "POST",
          body: {
            serviceId: service!.id,
            name,
            basePrice: Number(basePrice),
            unit,
          },
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
      title={editing ? "Ubah Tarif" : `Tarif Baru — ${service?.name ?? ""}`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Nama Tarif">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="Harga (IDR)">
          <TextInput
            type="number"
            min={0}
            step={1000}
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            required
          />
        </Field>
        <Field label="Satuan">
          <TextInput
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
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

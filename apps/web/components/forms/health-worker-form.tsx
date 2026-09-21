"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import type { HealthWorker } from "../../lib/types";
import { Modal, PrimaryButton } from "../modal";
import { Field, TextInput, Select, FormError } from "../form-controls";

const PROFESSIONS = ["Dokter", "Perawat", "Fisioterapis", "Analis", "Bidan"];
const ZONES = ["Mataram", "Lombok Barat", "Lombok Tengah"];

/** Tambah / ubah tenaga kesehatan. */
export function HealthWorkerForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: HealthWorker | null;
}) {
  const editing = !!initial;
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("Perawat");
  const [licenseNo, setLicenseNo] = useState("");
  const [licenseValidUntil, setLicenseValidUntil] = useState("");
  const [zone, setZone] = useState("Mataram");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setProfession(initial?.profession ?? "Perawat");
    setLicenseNo(initial?.licenseNo ?? "");
    setLicenseValidUntil(
      initial?.licenseValidUntil ? initial.licenseValidUntil.slice(0, 10) : "",
    );
    setZone(initial?.zone ?? "Mataram");
    setError(null);
  }, [open, initial]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = {
        name,
        profession,
        licenseNo,
        licenseValidUntil: new Date(licenseValidUntil).toISOString(),
        zone,
      };
      if (editing) {
        await api(`/master/health-workers/${initial!.id}`, {
          token: getToken(),
          method: "PATCH",
          body,
        });
      } else {
        await api("/master/health-workers", {
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
      title={editing ? "Ubah Tenaga Kesehatan" : "Tenaga Kesehatan Baru"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Nama">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="Profesi">
          <Select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            required
          >
            {PROFESSIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="No. STR/SIP">
          <TextInput
            value={licenseNo}
            onChange={(e) => setLicenseNo(e.target.value)}
            required
          />
        </Field>
        <Field label="Masa Berlaku Lisensi">
          <TextInput
            type="date"
            value={licenseValidUntil}
            onChange={(e) => setLicenseValidUntil(e.target.value)}
            required
          />
        </Field>
        <Field label="Zona">
          <Select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            required
          >
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </Select>
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

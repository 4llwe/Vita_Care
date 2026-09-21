"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { Modal, PrimaryButton } from "../modal";
import {
  Field,
  TextInput,
  TextArea,
  Select,
  FormError,
} from "../form-controls";

const URGENCY = ["ROUTINE", "URGENT", "EMERGENCY"];

export function ReferralForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientName, setPatientName] = useState("");
  const [toHospital, setToHospital] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState("ROUTINE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/referrals", {
        token: getToken(),
        method: "POST",
        body: { patientName, toHospital, reason, urgency },
      });
      onSaved();
      onClose();
      setPatientName("");
      setToHospital("");
      setReason("");
      setUrgency("ROUTINE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Rujukan Baru" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Nama Pasien">
          <TextInput
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="RS / Faskes Tujuan">
          <TextInput
            value={toHospital}
            onChange={(e) => setToHospital(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="Alasan Rujukan">
          <TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={5}
          />
        </Field>
        <Field label="Urgensi">
          <Select value={urgency} onChange={(e) => setUrgency(e.target.value)}>
            {URGENCY.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

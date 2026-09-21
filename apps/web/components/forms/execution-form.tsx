"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import type { AuditChecklist, AuditExecution } from "../../lib/types";
import { Modal, PrimaryButton } from "../modal";
import { Field, TextInput, Select, FormError } from "../form-controls";

const ZONES = ["Mataram", "Lombok Barat", "Lombok Tengah"];

export function ExecutionForm({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  onStarted: (exec: AuditExecution) => void;
}) {
  const [checklists, setChecklists] = useState<AuditChecklist[]>([]);
  const [checklistId, setChecklistId] = useState("");
  const [auditeeUnit, setAuditeeUnit] = useState("");
  const [zone, setZone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api<AuditChecklist[]>("/audits/checklists", { token: getToken() })
      .then((cs) => {
        const active = cs.filter((c) => c.isActive);
        setChecklists(active);
        if (active[0]) setChecklistId(active[0].id);
      })
      .catch((e) => setError(e.message));
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!checklistId) {
      setError("Pilih checklist terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const exec = await api<AuditExecution>("/audits/executions", {
        token: getToken(),
        method: "POST",
        body: { checklistId, auditeeUnit, zone: zone || undefined },
      });
      onStarted(exec);
      onClose();
      setAuditeeUnit("");
      setZone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai audit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Mulai Pelaksanaan Audit" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Checklist">
          <Select
            value={checklistId}
            onChange={(e) => setChecklistId(e.target.value)}
            required
          >
            <option value="">Pilih checklist…</option>
            {checklists.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Unit/Auditee">
          <TextInput
            value={auditeeUnit}
            onChange={(e) => setAuditeeUnit(e.target.value)}
            required
            minLength={2}
            placeholder="mis. Tim Nakes Zona Mataram"
          />
        </Field>
        <Field label="Zona (opsional)">
          <Select value={zone} onChange={(e) => setZone(e.target.value)}>
            <option value="">—</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex justify-end">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Memulai…" : "Mulai Audit"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

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

const CATEGORIES = [
  "Klinis",
  "Operasional",
  "Kepatuhan",
  "Keuangan",
  "SDM",
  "Reputasi",
];
const SCALE = [1, 2, 3, 4, 5];

function levelOf(p: number, i: number): { label: string; cls: string } {
  const s = p * i;
  if (s <= 4) return { label: "LOW", cls: "text-emerald-700" };
  if (s <= 9) return { label: "MEDIUM", cls: "text-amber-700" };
  if (s <= 15) return { label: "HIGH", cls: "text-orange-700" };
  return { label: "CRITICAL", cls: "text-red-700" };
}

export function RiskForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Klinis");
  const [probability, setProbability] = useState(3);
  const [impact, setImpact] = useState(3);
  const [mitigation, setMitigation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const level = levelOf(probability, impact);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/risks", {
        token: getToken(),
        method: "POST",
        body: {
          title,
          category,
          probability,
          impact,
          mitigation: mitigation || undefined,
        },
      });
      onSaved();
      onClose();
      setTitle("");
      setMitigation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Risiko Baru" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Judul Risiko">
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Probabilitas (1-5)">
            <Select
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
            >
              {SCALE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Dampak (1-5)">
            <Select
              value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
            >
              {SCALE.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="text-sm text-slate-600">
          Skor: <strong>{probability * impact}</strong> · Level:{" "}
          <strong className={level.cls}>{level.label}</strong>
        </p>
        <Field label="Rencana Mitigasi (opsional)">
          <TextArea
            rows={3}
            value={mitigation}
            onChange={(e) => setMitigation(e.target.value)}
          />
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

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
import type { AuditAnswer } from "../../lib/types";

const CATEGORIES = [
  { value: "MINOR", label: "Minor" },
  { value: "MAYOR", label: "Mayor" },
  { value: "CRITICAL", label: "Kritis" },
  { value: "FRAUD_INDICATOR", label: "Indikasi Fraud" },
  { value: "COMPLIANCE_BREACH", label: "Pelanggaran Kepatuhan" },
];
const SCALE = [1, 2, 3, 4, 5];

function levelOf(p: number, i: number): { label: string; cls: string } {
  const s = p * i;
  if (s <= 4) return { label: "LOW", cls: "text-emerald-700" };
  if (s <= 9) return { label: "MEDIUM", cls: "text-amber-700" };
  if (s <= 15) return { label: "HIGH", cls: "text-orange-700" };
  return { label: "CRITICAL", cls: "text-red-700" };
}

/**
 * Modal "Jadikan Temuan": mengubah butir audit NON_COMPLIANT menjadi record
 * Findings. Deskripsi default mengikuti pertanyaan & catatan butir; auditor
 * tinggal menetapkan kategori dan matriks risiko (probabilitas x dampak).
 */
export function FindingFromAnswer({
  executionId,
  answer,
  open,
  onClose,
  onSaved,
}: {
  executionId: string;
  answer: AuditAnswer | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [category, setCategory] = useState("MAYOR");
  const [probability, setProbability] = useState(3);
  const [impact, setImpact] = useState(3);
  const [description, setDescription] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [deadline, setDeadline] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const level = levelOf(probability, impact);
  const defaultDesc = answer
    ? answer.item.question + (answer.note ? ` \u2014 ${answer.note}` : "")
    : "";

  function reset() {
    setCategory("MAYOR");
    setProbability(3);
    setImpact(3);
    setDescription("");
    setRootCause("");
    setDeadline("");
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer) return;
    setBusy(true);
    setError(null);
    try {
      await api(
        `/audits/executions/${executionId}/answers/${answer.id}/finding`,
        {
          token: getToken(),
          method: "POST",
          body: {
            category,
            probability,
            impact,
            description: description.trim() || undefined,
            rootCause: rootCause.trim() || undefined,
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
          },
        },
      );
      onSaved();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat temuan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Jadikan Temuan" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        {answer ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm">
            <p className="font-semibold text-slate-800">
              {answer.item.question}
            </p>
            {answer.note ? (
              <p className="mt-1 text-xs text-slate-500">
                Catatan: {answer.note}
              </p>
            ) : null}
          </div>
        ) : null}

        <Field label="Deskripsi temuan">
          <TextArea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={defaultDesc}
          />
          <span className="mt-1 block text-xs text-slate-400">
            Kosongkan untuk memakai pertanyaan &amp; catatan butir secara
            otomatis.
          </span>
        </Field>

        <Field label="Kategori">
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
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
          Skor: <strong>{probability * impact}</strong>
          {" · "}Level: <strong className={level.cls}>{level.label}</strong>
        </p>

        <Field label="Akar masalah (opsional)">
          <TextArea
            rows={2}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
          />
        </Field>

        <Field label="Deadline tindak lanjut (opsional)">
          <TextInput
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Menyimpan\u2026" : "Buat Temuan"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

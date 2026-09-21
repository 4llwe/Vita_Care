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
  { value: "CLINICAL", label: "Klinis" },
  { value: "OPERATIONAL", label: "Operasional" },
  { value: "COMPLIANCE", label: "Kepatuhan" },
  { value: "SAFETY", label: "Keselamatan" },
  { value: "DOCUMENTATION", label: "Dokumentasi" },
];

type ItemDraft = { question: string; guidance: string; weight: number };

export function ChecklistForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CLINICAL");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([
    { question: "", guidance: "", weight: 1 },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }
  function addItem() {
    setItems((prev) => [...prev, { question: "", guidance: "", weight: 1 }]);
  }
  function removeItem(idx: number) {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev,
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = items
      .map((it, idx) => ({ ...it, order: idx + 1 }))
      .filter((it) => it.question.trim().length >= 3);
    if (cleaned.length === 0) {
      setError("Tambahkan minimal satu butir pertanyaan (min. 3 karakter).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api("/audits/checklists", {
        token: getToken(),
        method: "POST",
        body: {
          title,
          category,
          description: description || undefined,
          items: cleaned.map((it) => ({
            question: it.question.trim(),
            guidance: it.guidance.trim() || undefined,
            weight: it.weight,
            order: it.order,
          })),
        },
      });
      onSaved();
      onClose();
      // reset
      setTitle("");
      setDescription("");
      setItems([{ question: "", guidance: "", weight: 1 }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Buat Checklist Audit" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Judul checklist">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            placeholder="mis. Audit Kepatuhan Kunjungan"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
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
        </div>
        <Field label="Deskripsi (opsional)">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">
              Butir Pertanyaan
            </span>
            <button
              type="button"
              onClick={addItem}
              className="text-sm font-bold text-vita-green hover:underline"
            >
              + Tambah butir
            </button>
          </div>
          {items.map((it, idx) => (
            <div
              key={idx}
              className="space-y-2 rounded-xl border border-slate-200 p-3"
            >
              <div className="flex items-start gap-2">
                <span className="mt-2 text-xs font-bold text-slate-400">
                  {idx + 1}.
                </span>
                <div className="flex-1 space-y-2">
                  <TextInput
                    value={it.question}
                    onChange={(e) =>
                      updateItem(idx, { question: e.target.value })
                    }
                    placeholder="Pertanyaan/kriteria audit"
                  />
                  <div className="flex gap-2">
                    <TextInput
                      value={it.guidance}
                      onChange={(e) =>
                        updateItem(idx, { guidance: e.target.value })
                      }
                      placeholder="Panduan (opsional)"
                    />
                    <select
                      value={it.weight}
                      onChange={(e) =>
                        updateItem(idx, { weight: Number(e.target.value) })
                      }
                      className="w-28 rounded-lg border border-slate-300 px-2 py-2 text-sm focus:border-vita-green focus:outline-none"
                      title="Bobot skor"
                    >
                      {[1, 2, 3, 4, 5].map((w) => (
                        <option key={w} value={w}>
                          Bobot {w}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="mt-1 text-slate-300 hover:text-red-500"
                  aria-label="Hapus butir"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan Checklist"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

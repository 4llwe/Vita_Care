"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { uploadFile } from "../../lib/upload";
import { Modal, PrimaryButton } from "../modal";
import { Field, TextInput, FormError } from "../form-controls";

type Capa = {
  id: string;
  progress: number;
  evidenceUrl?: string | null;
  finding?: { code: string } | null;
  actionPlan: string;
};

export function CapaUpdate({
  capa,
  open,
  onClose,
  onSaved,
}: {
  capa: Capa | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && capa) {
      setProgress(capa.progress);
      setEvidenceUrl(capa.evidenceUrl ?? undefined);
      setFile(null);
      setError(null);
    }
  }, [open, capa]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!capa) return;
    setBusy(true);
    setError(null);
    try {
      let url = evidenceUrl;
      if (file) url = await uploadFile(file, "capa-evidence");
      await api(`/capa/${capa.id}/progress`, {
        token: getToken(),
        method: "PATCH",
        body: { progress, evidenceUrl: url },
      });
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
      title={capa ? `CAPA · ${capa.finding?.code ?? ""}` : "CAPA"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        {capa ? (
          <p className="text-sm text-slate-600">{capa.actionPlan}</p>
        ) : null}
        <Field label={`Progress: ${progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-vita-green"
          />
        </Field>
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-700">
            Bukti Penyelesaian (evidence)
          </p>
          {evidenceUrl ? (
            <a
              href={evidenceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-vita-blue hover:underline"
            >
              Bukti saat ini ↗
            </a>
          ) : null}
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <p className="text-xs text-slate-400">
            Wajib diunggah untuk menyelesaikan CAPA (progress 100%).
          </p>
        </div>
        <div className="flex justify-end">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

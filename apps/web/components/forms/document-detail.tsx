"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { uploadFile } from "../../lib/upload";
import { tanggalJam } from "../../lib/format";
import { Modal, PrimaryButton } from "../modal";
import { Field, TextInput, FormError } from "../form-controls";

type Version = {
  id: string;
  version: number;
  fileUrl: string;
  changeNote?: string | null;
  createdAt: string;
};
type DocDetail = {
  id: string;
  code: string;
  title: string;
  category: string;
  currentVersion: number;
  status: string;
  reviewNote?: string | null;
  versions: Version[];
};

export function DocumentDetail({
  documentId,
  open,
  onClose,
  onChanged,
}: {
  documentId: string | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!documentId) return;
    api<DocDetail>(`/documents/${documentId}`, { token: getToken() })
      .then(setDoc)
      .catch((e) => setError(e.message));
  }, [documentId]);

  useEffect(() => {
    if (open) {
      setError(null);
      setDoc(null);
      load();
    }
  }, [open, load]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      load();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operasi gagal");
    } finally {
      setBusy(false);
    }
  }

  async function uploadVersion() {
    if (!file || !documentId) return;
    await act(async () => {
      const fileUrl = await uploadFile(file, "documents");
      await api(`/documents/${documentId}/versions`, {
        token: getToken(),
        method: "POST",
        body: { fileUrl, changeNote: changeNote || undefined },
      });
      setFile(null);
      setChangeNote("");
    });
  }

  const submit = () =>
    documentId &&
    act(() =>
      api(`/documents/${documentId}/submit`, {
        token: getToken(),
        method: "POST",
      }),
    );
  const approve = () =>
    documentId &&
    act(() =>
      api(`/documents/${documentId}/approve`, {
        token: getToken(),
        method: "POST",
        body: { note },
      }),
    );
  const reject = () =>
    documentId &&
    act(() =>
      api(`/documents/${documentId}/reject`, {
        token: getToken(),
        method: "POST",
        body: { note },
      }),
    );

  return (
    <Modal
      open={open}
      title={doc ? `${doc.code} · ${doc.title}` : "Detail Dokumen"}
      onClose={onClose}
    >
      <div className="space-y-4">
        <FormError message={error} />
        {!doc ? (
          <p className="text-sm text-slate-400">Memuat…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span>
                Kategori: <strong>{doc.category}</strong>
              </span>
              <span>
                Versi: <strong>v{doc.currentVersion}</strong>
              </span>
              <span>
                Status: <strong>{doc.status.replace(/_/g, " ")}</strong>
              </span>
            </div>

            {/* Riwayat versi */}
            <div>
              <p className="mb-1 text-sm font-semibold text-slate-700">
                Riwayat Versi
              </p>
              {doc.versions.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Belum ada versi yang diunggah.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                  {doc.versions.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between px-3 py-2 text-sm"
                    >
                      <span>
                        <strong>v{v.version}</strong>{" "}
                        <span className="text-slate-400">
                          · {tanggalJam(v.createdAt)}
                        </span>
                        {v.changeNote ? (
                          <span className="text-slate-500">
                            {" "}
                            — {v.changeNote}
                          </span>
                        ) : null}
                      </span>
                      <a
                        href={v.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-vita-blue hover:underline"
                      >
                        Lihat
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Unggah versi baru */}
            {doc.status !== "ARCHIVED" && (
              <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-700">
                  Unggah Versi Baru
                </p>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
                <Field label="Catatan perubahan (opsional)">
                  <TextInput
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="mis. revisi bab 3"
                  />
                </Field>
                <PrimaryButton
                  type="button"
                  onClick={uploadVersion}
                  disabled={busy || !file}
                >
                  {busy ? "Memproses…" : "Unggah Versi"}
                </PrimaryButton>
              </div>
            )}

            {/* Aksi alur approval */}
            <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
              {doc.status === "DRAFT" && (
                <PrimaryButton
                  type="button"
                  onClick={submit}
                  disabled={busy || doc.currentVersion < 1}
                >
                  Ajukan Review
                </PrimaryButton>
              )}
              {doc.status === "IN_REVIEW" && (
                <>
                  <div className="flex-1">
                    <Field label="Catatan reviewer">
                      <TextInput
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={approve}
                    disabled={busy}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Setujui
                  </button>
                  <button
                    type="button"
                    onClick={reject}
                    disabled={busy}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Tolak
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

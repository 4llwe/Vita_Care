"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";

export default function ClinicalTasksPage() {
  const [tasks, setTasks] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState<
    Record<string, { outcome?: string; handover?: string }>
  >({});

  async function load() {
    setTasks(await api("/hah/tasks/my", { token: getToken() }));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function update(
    id: string,
    status: "IN_PROGRESS" | "COMPLETED" | "OMITTED",
  ) {
    try {
      await api(`/hah/clinical-tasks/${id}`, {
        method: "PATCH",
        token: getToken(),
        body: {
          status,
          outcomeNote: notes[id]?.outcome,
          handoverNote: notes[id]?.handover,
        },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tugas gagal diperbarui");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-7 text-white">
        <p className="text-xs font-black uppercase tracking-[.2em] text-teal-300">
          Clinical task board
        </p>
        <h1 className="mt-2 text-3xl font-black">Tugas Klinis Saya</h1>
        <p className="mt-2 text-sm text-slate-300">
          Prioritas, batas waktu, hasil tindakan, dan handover dalam satu alur.
        </p>
      </section>
      {error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      {tasks === null ? (
        <div className="medical-card text-slate-500">Memuat tugas…</div>
      ) : null}
      {tasks?.length === 0 ? (
        <div className="medical-card">
          <h2 className="font-black">Tidak ada tugas klinis</h2>
          <p className="mt-2 text-sm text-slate-500">
            Tugas baru akan tampil setelah ditugaskan oleh tim episode.
          </p>
        </div>
      ) : null}
      <div className="space-y-4">
        {tasks?.map((task) => {
          const terminal = ["COMPLETED", "OMITTED", "CANCELLED"].includes(
            task.status,
          );
          const overdue = !terminal && new Date(task.dueAt) < new Date();
          return (
            <article
              key={task.id}
              className={`rounded-2xl border p-5 ${
                task.priority === "STAT" || overdue
                  ? "border-red-300 bg-red-50"
                  : task.priority === "URGENT"
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide">
                    {task.priority} · {task.category.replaceAll("_", " ")} ·{" "}
                    {task.status.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-1 text-lg font-black">{task.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {task.episode.code} · {task.episode.patient.fullName}
                  </p>
                  <p className={overdue ? "mt-2 font-bold text-red-700" : "mt-2 text-sm"}>
                    {overdue ? "Terlambat sejak" : "Batas waktu"}{" "}
                    {new Date(task.dueAt).toLocaleString("id-ID")}
                  </p>
                </div>
                <Link
                  href={`/hah/${task.episodeId}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-white px-4 text-sm font-bold"
                >
                  Buka pasien
                </Link>
              </div>
              {task.description ? (
                <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm">
                  {task.description}
                </p>
              ) : null}
              {task.status === "PLANNED" ? (
                <button
                  onClick={() => update(task.id, "IN_PROGRESS")}
                  className="mt-4 min-h-11 rounded-xl bg-blue-700 px-4 font-bold text-white"
                >
                  Mulai tugas
                </button>
              ) : null}
              {task.status === "IN_PROGRESS" ? (
                <div className="mt-4 grid gap-3 border-t pt-4">
                  <textarea
                    placeholder="Hasil tindakan"
                    value={notes[task.id]?.outcome ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [task.id]: {
                          ...current[task.id],
                          outcome: event.target.value,
                        },
                      }))
                    }
                    className="min-h-20 rounded-xl border bg-white p-3"
                  />
                  <textarea
                    placeholder="Handover untuk petugas berikutnya"
                    value={notes[task.id]?.handover ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [task.id]: {
                          ...current[task.id],
                          handover: event.target.value,
                        },
                      }))
                    }
                    className="min-h-20 rounded-xl border bg-white p-3"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={
                        (notes[task.id]?.outcome?.length ?? 0) < 5 ||
                        (notes[task.id]?.handover?.length ?? 0) < 5
                      }
                      onClick={() => update(task.id, "COMPLETED")}
                      className="min-h-11 rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:opacity-50"
                    >
                      Selesaikan
                    </button>
                    <button
                      disabled={
                        (notes[task.id]?.outcome?.length ?? 0) < 5 ||
                        (notes[task.id]?.handover?.length ?? 0) < 5
                      }
                      onClick={() => update(task.id, "OMITTED")}
                      className="min-h-11 rounded-xl border border-amber-400 bg-white px-4 font-bold text-amber-800 disabled:opacity-50"
                    >
                      Catat tidak dilakukan
                    </button>
                  </div>
                </div>
              ) : null}
              {terminal && (task.outcomeNote || task.handoverNote) ? (
                <div className="mt-4 grid gap-2 border-t pt-4 text-sm">
                  <p>
                    <b>Hasil:</b> {task.outcomeNote ?? "—"}
                  </p>
                  <p>
                    <b>Handover:</b> {task.handoverNote ?? "—"}
                  </p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
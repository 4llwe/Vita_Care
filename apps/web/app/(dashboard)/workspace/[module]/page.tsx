"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "../../../../lib/api";
import { getToken } from "../../../../lib/auth";

const labels: Record<string, string> = {
  farmasi: "Farmasi",
  laboratorium: "Laboratorium",
  laporan: "Laporan klinis",
  pengguna: "Manajemen Pengguna",
  pengaturan: "Pengaturan Sistem",
  "rencana-terapi": "Rencana Terapi",
  resep: "Resep",
  "hasil-laboratorium": "Hasil Laboratorium",
  telekonsultasi: "Telekonsultasi",
  "asesmen-keperawatan": "Asesmen Keperawatan",
  "rencana-asuhan": "Rencana Asuhan",
  "pemberian-obat": "Pemberian Obat",
  "perawatan-luka": "Perawatan Luka",
  "edukasi-pasien": "Edukasi Pasien",
  "profil-pasien": "Profil Pasien",
  "rencana-perawatan": "Rencana Perawatan",
  "rekam-medis": "Rekam Medis",
  "resep-obat": "Resep & Obat",
  "riwayat-pelayanan": "Riwayat Pelayanan",
  keluarga: "Keluarga & Caregiver",
};
const medicationModules = new Set(["farmasi", "resep", "resep-obat", "pemberian-obat"]);
const diagnosticModules = new Set(["laboratorium", "hasil-laboratorium"]);
const careModules = new Set(["rencana-terapi", "rencana-asuhan", "rencana-perawatan"]);
const timelineModules = new Set([
  "rekam-medis",
  "riwayat-pelayanan",
  "asesmen-keperawatan",
  "laporan",
]);
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="medical-card">
      <h2 className="text-lg font-black text-slate-950">{title}</h2>
      <div className="mt-4 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-slate-50 p-4 text-slate-500">{children}</p>;
}

export default function WorkspacePage() {
  const { module } = useParams<{ module: string }>();
  const title = labels[module] ?? module.replace(/-/g, " ");
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [episodeId, setEpisodeId] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<any[]>("/hah/episodes", { token: getToken() })
      .then((rows) => {
        setEpisodes(rows);
        if (rows[0]) setEpisodeId(rows[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    if (!episodeId) return;
    setDetail(null);
    api<any>(`/hah/episodes/${episodeId}`, { token: getToken() })
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, [episodeId]);
  const timeline = useMemo(() => {
    if (!detail) return [];
    return [
      ...(detail.observations ?? []).map((x: any) => ({
        at: x.recordedAt,
        label: `Observasi: TD ${x.systolic}/${x.diastolic}, SpO₂ ${x.spo2}%`,
        tone: x.ewsRisk,
      })),
      ...(detail.visits ?? []).map((x: any) => ({
        at: x.scheduledStart,
        label: `Kunjungan ${x.visitType}: ${x.status}`,
        tone: "visit",
      })),
      ...(detail.diagnosticOrders ?? []).map((x: any) => ({
        at: x.orderedAt,
        label: `${x.testName}: ${x.status}`,
        tone: x.criticalResult ? "critical" : "lab",
      })),
      ...(detail.alerts ?? []).map((x: any) => ({
        at: x.createdAt,
        label: `Alert ${x.severity}: ${x.status}`,
        tone: "critical",
      })),
    ].sort((a, b) => +new Date(b.at) - +new Date(a.at));
  }, [detail]);
  async function sendMessage() {
    if (!episodeId || !message.trim()) return;
    try {
      await api(`/hah/episodes/${episodeId}/messages`, {
        method: "POST",
        token: getToken(),
        body: { body: message.trim(), category: "GENERAL" },
      });
      setMessage("");
      setDetail(await api(`/hah/episodes/${episodeId}`, { token: getToken() }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pesan gagal dikirim");
    }
  }
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-slate-950 p-6 text-white sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-300">
          Ruang kerja terintegrasi
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black capitalize">{title}</h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Data langsung dari episode klinis sesuai penugasan dan hak akses Anda.
            </p>
          </div>
          {episodes.length > 0 && (
            <label className="text-xs font-bold text-slate-300">
              Episode pasien
              <select
                value={episodeId}
                onChange={(e) => setEpisodeId(e.target.value)}
                className="mt-1 block min-h-11 w-full rounded-xl bg-white px-3 text-slate-950 lg:w-72"
              >
                {episodes.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.code} · {x.patient?.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}
      {!episodes.length && !error && (
        <Card title="Belum ada episode yang dapat diakses">
          <p>
            Data hanya muncul jika pasien terhubung ke akun Anda atau Anda ditugaskan pada
            episode tersebut.
          </p>
          <Link
            href="/portal"
            className="mt-4 inline-flex rounded-xl bg-teal-700 px-4 py-3 font-bold text-white"
          >
            Buka layanan pasien
          </Link>
        </Card>
      )}
      {episodes.length > 0 && !detail && (
        <div className="medical-card text-sm text-slate-500">Memuat data klinis…</div>
      )}
      {detail && medicationModules.has(module) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(detail.medicationOrders ?? []).length ? (
            detail.medicationOrders.map((m: any) => (
              <Card key={m.id} title={m.medicationName}>
                <dl className="grid grid-cols-2 gap-2">
                  <dt>Dosis</dt>
                  <dd className="font-bold">{m.dose}</dd>
                  <dt>Rute</dt>
                  <dd className="font-bold">{m.route}</dd>
                  <dt>Frekuensi</dt>
                  <dd className="font-bold">{m.frequency}</dd>
                  <dt>Status</dt>
                  <dd className="font-bold">{m.status}</dd>
                  <dt>Pemberian tercatat</dt>
                  <dd className="font-bold">{m.administrations?.length ?? 0}</dd>
                </dl>
              </Card>
            ))
          ) : (
            <Card title="Belum ada order obat">
              <Empty>Order obat dibuat oleh dokter pada workspace episode.</Empty>
            </Card>
          )}
        </div>
      )}
      {detail && diagnosticModules.has(module) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {(detail.diagnosticOrders ?? []).length ? (
            detail.diagnosticOrders.map((o: any) => (
              <Card key={o.id} title={o.testName}>
                <p>
                  <b>Prioritas:</b> {o.priority}
                </p>
                <p>
                  <b>Status:</b> {o.status}
                </p>
                <p
                  className={
                    o.criticalResult
                      ? "mt-3 rounded-lg bg-red-50 p-3 font-bold text-red-800"
                      : "mt-3 rounded-lg bg-slate-50 p-3"
                  }
                >
                  {o.resultText ?? "Hasil belum tersedia"}
                </p>
              </Card>
            ))
          ) : (
            <Card title="Belum ada pemeriksaan">
              <Empty>Order laboratorium dan hasil akan tampil di sini.</Empty>
            </Card>
          )}
        </div>
      )}
      {detail && careModules.has(module) && (
        <Card title="Rencana Perawatan Individu">
          {detail.carePlan ? (
            <dl className="grid gap-4 md:grid-cols-2">
              <div>
                <dt className="font-bold">Diagnosis</dt>
                <dd>{detail.carePlan.diagnosis ?? detail.primaryDiagnosis}</dd>
              </div>
              <div>
                <dt className="font-bold">Target</dt>
                <dd>
                  {Array.isArray(detail.carePlan.goals)
                    ? detail.carePlan.goals.join("; ")
                    : String(detail.carePlan.goals)}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Intervensi dokter</dt>
                <dd>
                  {Array.isArray(detail.carePlan.doctorInterventions)
                    ? detail.carePlan.doctorInterventions.join("; ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Intervensi keperawatan</dt>
                <dd>
                  {Array.isArray(detail.carePlan.nursingInterventions)
                    ? detail.carePlan.nursingInterventions.join("; ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Obat</dt>
                <dd>{detail.carePlan.medicationPlan ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-bold">Diet & aktivitas</dt>
                <dd>
                  {detail.carePlan.dietPlan ?? "—"} ·{" "}
                  {detail.carePlan.activityPlan ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="font-bold">Monitoring</dt>
                <dd>{detail.carePlan.monitoringFrequency}</dd>
              </div>
              <div>
                <dt className="font-bold">Edukasi</dt>
                <dd>{detail.carePlan.educationPlan ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-bold">Follow-up</dt>
                <dd>{detail.carePlan.followUpPlan ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-bold">Target evaluasi</dt>
                <dd>{detail.carePlan.evaluationTarget ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <Empty>Care plan belum disahkan oleh dokter.</Empty>
          )}
        </Card>
      )}
      {detail && timelineModules.has(module) && (
        <Card title="Timeline rekam medis">
          {timeline.length ? (
            <ol className="space-y-3">
              {timeline.map((x, i) => (
                <li
                  key={`${x.at}-${i}`}
                  className="grid gap-1 rounded-xl border border-slate-200 p-3 sm:grid-cols-[10rem_1fr]"
                >
                  <time className="text-xs font-bold text-slate-500">
                    {new Date(x.at).toLocaleString("id-ID")}
                  </time>
                  <span>{x.label}</span>
                </li>
              ))}
            </ol>
          ) : (
            <Empty>Belum ada aktivitas klinis.</Empty>
          )}
        </Card>
      )}
      {detail && module === "profil-pasien" && (
        <Card title="Identitas pasien">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-bold">Nama</dt>
              <dd>{detail.patient.fullName}</dd>
            </div>
            <div>
              <dt className="font-bold">MRN</dt>
              <dd>{detail.patient.mrn}</dd>
            </div>
            <div>
              <dt className="font-bold">Zona</dt>
              <dd>{detail.patient.zone}</dd>
            </div>
            <div>
              <dt className="font-bold">Diagnosis utama</dt>
              <dd>{detail.primaryDiagnosis}</dd>
            </div>
          </dl>
        </Card>
      )}
      {detail && module === "keluarga" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Keluarga & caregiver">
            <p>
              <b>Caregiver:</b> {detail.caregiverName ?? "Belum dicatat"}
            </p>
            <p>
              <b>Kontak:</b> {detail.caregiverPhone ?? "Belum dicatat"}
            </p>
            <p className="mt-3">
              <b>Rencana darurat:</b> {detail.emergencyPlan ?? "Belum disahkan"}
            </p>
          </Card>
          <Card title="Akses penting">
            <div className="grid gap-2">
              <Link className="rounded-xl border p-3 font-bold" href="/monitoring">
                Kondisi dan tanda vital
              </Link>
              <Link className="rounded-xl border p-3 font-bold" href="/bookings">
                Jadwal perawatan
              </Link>
              <Link
                className="rounded-xl border p-3 font-bold"
                href="/workspace/rencana-perawatan"
              >
                Instruksi perawatan
              </Link>
              <Link
                className="rounded-xl border p-3 font-bold"
                href="/workspace/resep-obat"
              >
                Obat pasien
              </Link>
            </div>
          </Card>
          <div className="lg:col-span-2">
            <Card title="Komunikasi aman dengan tim kesehatan">
              <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3">
                {(detail.messages ?? []).length ? (
                  detail.messages.map((item: any) => (
                    <article key={item.id} className="rounded-xl border bg-white p-3">
                      <div className="flex justify-between gap-2 text-xs text-slate-500">
                        <b className="text-slate-800">
                          {item.sender?.name} · {item.sender?.role}
                        </b>
                        <time>{new Date(item.createdAt).toLocaleString("id-ID")}</time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap">{item.body}</p>
                    </article>
                  ))
                ) : (
                  <Empty>Belum ada pesan pada episode ini.</Empty>
                )}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={2000}
                  aria-label="Pesan untuk tim kesehatan"
                  className="min-h-24 flex-1 rounded-xl border p-3"
                  placeholder="Tulis pertanyaan atau laporan gejala…"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  className="min-h-11 rounded-xl bg-teal-700 px-5 font-black text-white"
                >
                  Kirim pesan
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}
      {detail &&
        ["telekonsultasi", "edukasi-pasien", "perawatan-luka"].includes(
          module,
        ) && (
          <Card title={title}>
            <p>
              Modul ini menggunakan episode <b>{detail.code}</b> agar komunikasi, edukasi,
              dan dokumentasi tetap berada pada konteks pasien yang benar.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/hah/${detail.id}`}
                className="rounded-xl bg-teal-700 px-4 py-3 font-bold text-white"
              >
                Buka workspace episode
              </Link>
              <Link href="/bookings" className="rounded-xl border px-4 py-3 font-bold">
                Atur jadwal
              </Link>
            </div>
          </Card>
        )}
      {detail && ["pengguna", "pengaturan"].includes(module) && (
        <Card title={title}>
          <p>
            Pengelolaan administratif dipusatkan agar perubahan pengguna, tenaga
            kesehatan, layanan, dan konfigurasi dapat diaudit.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/master"
              className="rounded-xl bg-teal-700 px-4 py-3 font-bold text-white"
            >
              Buka master data
            </Link>
            <Link href="/audits" className="rounded-xl border px-4 py-3 font-bold">
              Lihat audit
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

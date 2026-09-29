"use client";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../../lib/api";
import { getToken } from "../../../../lib/auth";
import { fetchMe, type Session } from "../../../../lib/session";
import { ErrorBox, Loading } from "../../../../components/async-state";
const input =
  "min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
const btn =
  "min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50";
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}
function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
export default function EpisodePage() {
  const { id } = useParams<{ id: string }>();
  const token = getToken() ?? undefined;
  const [d, setD] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [endReasons, setEndReasons] = useState<Record<string, string>>({});
  const canManageTeam =
    session &&
    [session.role, ...(session.roles ?? [])].some((role) =>
      ["COORDINATOR", "SUPER_ADMIN"].includes(role),
    );
  const canCreateTask =
    session &&
    [session.role, ...(session.roles ?? [])].some((role) =>
      [
        "HEALTH_WORKER",
        "DOCTOR",
        "NURSE",
        "COORDINATOR",
        "SUPER_ADMIN",
      ].includes(role),
    );
  useEffect(() => {
    fetchMe().then(setSession).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!canManageTeam) return;
    api<any[]>("/health-workers", { token })
      .then((rows) =>
        setWorkers(
          rows.filter(
            (worker) =>
              worker.isActive &&
              new Date(worker.licenseValidUntil) > new Date(),
          ),
        ),
      )
      .catch((x) =>
        setError(x instanceof Error ? x.message : "Gagal memuat tenaga kesehatan"),
      );
  }, [canManageTeam, token]);
  async function load() {
    try {
      setD(await api(`/hah/episodes/${id}`, { token }));
      setError("");
    } catch (x) {
      setError(x instanceof Error ? x.message : "Gagal memuat episode");
    }
  }
  useEffect(() => {
    void load();
  }, [id]);
  async function submit(path: string, body: any) {
    setBusy(true);
    try {
      await api(path, { method: "POST", token, body });
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Aksi gagal");
    } finally {
      setBusy(false);
    }
  }
  async function patch(path: string, body?: any) {
    setBusy(true);
    try {
      await api(path, { method: "PATCH", token, body });
      await load();
    } catch (x) {
      setError(x instanceof Error ? x.message : "Aksi gagal");
    } finally {
      setBusy(false);
    }
  }
  if (!d && !error) return <Loading />;
  if (!d) return <ErrorBox message={error} />;
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-blue-600">
          {d.code} · {d.status.replaceAll("_", " ")}
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          {d.patient.fullName}
        </h1>
        <p className="text-sm text-slate-500">
          {d.patient.mrn} · {d.primaryDiagnosis} · {d.patient.zone}
        </p>
      </header>
      {error && <ErrorBox message={error} />}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Tim perawatan">
          <p className="text-sm text-slate-600">
            Penugasan aktif menentukan siapa yang dapat mengakses dan
            mengoordinasikan episode ini.
          </p>
          {canManageTeam && ["ADMITTED", "ACTIVE"].includes(d.status) ? (
            <form
              className="space-y-3 rounded-xl border bg-slate-50 p-4"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                submit(`/hah/episodes/${id}/care-team`, {
                  healthWorkerId: form.get("healthWorkerId"),
                  type: form.get("type"),
                  responsibility: form.get("responsibility"),
                  startsAt: new Date(String(form.get("startsAt"))).toISOString(),
                  endsAt: form.get("endsAt")
                    ? new Date(String(form.get("endsAt"))).toISOString()
                    : undefined,
                });
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tenaga kesehatan">
                  <select name="healthWorkerId" required className={input}>
                    <option value="">Pilih tenaga kesehatan</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} · {worker.profession} · {worker.zone}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Peran tim">
                  <select name="type" className={input}>
                    <option value="CARE_COORDINATOR">Koordinator perawatan</option>
                    <option value="PRIMARY_CLINICIAN">Dokter utama</option>
                  </select>
                </Field>
                <Field label="Mulai penugasan">
                  <input
                    name="startsAt"
                    type="datetime-local"
                    required
                    className={input}
                  />
                </Field>
                <Field label="Selesai (opsional)">
                  <input name="endsAt" type="datetime-local" className={input} />
                </Field>
              </div>
              <Field label="Tanggung jawab">
                <textarea
                  name="responsibility"
                  minLength={5}
                  required
                  className={input}
                />
              </Field>
              <button className={btn} disabled={busy}>
                Simpan penugasan
              </button>
            </form>
          ) : null}
          <div className="space-y-2">
            {d.careAssignments?.length ? (
              d.careAssignments.map((assignment: any) => (
                <article
                  key={assignment.id}
                  className={`rounded-xl border p-3 text-sm ${
                    assignment.isActive ? "bg-emerald-50" : "bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <strong>{assignment.healthWorker.name}</strong>
                      <p className="text-slate-600">
                        {assignment.healthWorker.profession} ·{" "}
                        {assignment.type.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1">{assignment.responsibility ?? "—"}</p>
                    </div>
                    <span className="font-bold">
                      {assignment.isActive ? "Aktif" : "Selesai"}
                    </span>
                  </div>
                  {canManageTeam &&
                  assignment.isActive &&
                  assignment.type !== "PRIMARY_CLINICIAN" ? (
                    <div className="mt-3 flex flex-col gap-2 border-t pt-3 sm:flex-row">
                      <input
                        value={endReasons[assignment.id] ?? ""}
                        onChange={(event) =>
                          setEndReasons((current) => ({
                            ...current,
                            [assignment.id]: event.target.value,
                          }))
                        }
                        placeholder="Alasan mengakhiri penugasan"
                        className="min-h-11 flex-1 rounded-lg border bg-white px-3"
                      />
                      <button
                        disabled={(endReasons[assignment.id]?.length ?? 0) < 5}
                        onClick={() =>
                          patch(`/hah/care-assignments/${assignment.id}/end`, {
                            reason: endReasons[assignment.id],
                          })
                        }
                        className="min-h-11 rounded-lg border border-red-300 px-4 font-bold text-red-700 disabled:opacity-50"
                      >
                        Akhiri penugasan
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                Tim perawatan belum ditetapkan.
              </p>
            )}
          </div>
        </Panel>
        <Panel title="Tugas klinis">
          {canCreateTask && ["ADMITTED", "ACTIVE"].includes(d.status) ? (
            <form
              className="space-y-3 rounded-xl border bg-slate-50 p-4"
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                submit(`/hah/episodes/${id}/tasks`, {
                  title: form.get("title"),
                  description: form.get("description") || undefined,
                  category: form.get("category"),
                  priority: form.get("priority"),
                  assignedToHealthWorkerId: form.get(
                    "assignedToHealthWorkerId",
                  ),
                  dueAt: new Date(String(form.get("dueAt"))).toISOString(),
                });
              }}
            >
              <Field label="Judul tugas">
                <input name="title" required minLength={3} className={input} />
              </Field>
              <Field label="Deskripsi">
                <textarea name="description" className={input} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Kategori">
                  <select name="category" className={input}>
                    <option value="ASSESSMENT">Asesmen</option>
                    <option value="VITALS">Tanda vital</option>
                    <option value="MEDICATION">Obat</option>
                    <option value="WOUND_CARE">Perawatan luka</option>
                    <option value="EDUCATION">Edukasi</option>
                    <option value="FOLLOW_UP">Tindak lanjut</option>
                    <option value="OTHER">Lainnya</option>
                  </select>
                </Field>
                <Field label="Prioritas">
                  <select name="priority" className={input}>
                    <option value="ROUTINE">Rutin</option>
                    <option value="URGENT">Mendesak</option>
                    <option value="STAT">Segera / STAT</option>
                  </select>
                </Field>
                <Field label="Petugas">
                  <select
                    name="assignedToHealthWorkerId"
                    required
                    className={input}
                  >
                    <option value="">Pilih anggota tim</option>
                    {(d.careAssignments ?? [])
                      .filter((assignment: any) => assignment.isActive)
                      .map((assignment: any) => (
                        <option
                          key={assignment.id}
                          value={assignment.healthWorkerId}
                        >
                          {assignment.healthWorker.name} ·{" "}
                          {assignment.healthWorker.profession}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Batas waktu">
                  <input
                    name="dueAt"
                    type="datetime-local"
                    required
                    className={input}
                  />
                </Field>
              </div>
              <button className={btn} disabled={busy}>
                Buat tugas
              </button>
            </form>
          ) : null}
          <div className="space-y-2">
            {d.clinicalTasks?.length ? (
              d.clinicalTasks.map((task: any) => (
                <article
                  key={task.id}
                  className={`rounded-xl border p-3 text-sm ${
                    task.priority === "STAT"
                      ? "border-red-300 bg-red-50"
                      : task.priority === "URGENT"
                        ? "border-orange-300 bg-orange-50"
                        : "bg-slate-50"
                  }`}
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <strong>{task.title}</strong>
                      <p className="text-slate-600">
                        {task.assignedToHealthWorker.name} ·{" "}
                        {task.category.replaceAll("_", " ")}
                      </p>
                    </div>
                    <b>{task.status.replaceAll("_", " ")}</b>
                  </div>
                  <p className="mt-2">
                    Batas: {new Date(task.dueAt).toLocaleString("id-ID")}
                  </p>
                  {task.handoverNote ? (
                    <p className="mt-2 rounded-lg bg-white p-2">
                      <b>Handover:</b> {task.handoverNote}
                    </p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                Belum ada tugas klinis.
              </p>
            )}
          </div>
        </Panel>
        {["SCREENING", "INELIGIBLE"].includes(d.status) && (
          <Panel title="Eligibility screening">
            <form
              className="space-y-3"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                submit(`/hah/episodes/${id}/eligibility`, {
                  age18OrOlder: f.has("age18OrOlder"),
                  acuteHospitalLevelNeed: f.has("acuteHospitalLevelNeed"),
                  clinicallyStableForHome: f.has("clinicallyStableForHome"),
                  noImmediateProcedureNeed: f.has("noImmediateProcedureNeed"),
                  oxygenRequirementLpm: Number(f.get("oxygenRequirementLpm")),
                  homeEnvironmentSafe: f.has("homeEnvironmentSafe"),
                  withinServiceArea: f.has("withinServiceArea"),
                  reliableCommunication: f.has("reliableCommunication"),
                  patientConsents: f.has("patientConsents"),
                  caregiverAvailable: f.has("caregiverAvailable"),
                });
              }}
            >
              {[
                ["age18OrOlder", "Usia ≥18 tahun"],
                [
                  "acuteHospitalLevelNeed",
                  "Membutuhkan perawatan setingkat rawat inap",
                ],
                ["clinicallyStableForHome", "Stabil untuk dirawat di rumah"],
                [
                  "noImmediateProcedureNeed",
                  "Tidak membutuhkan prosedur segera",
                ],
                ["homeEnvironmentSafe", "Rumah aman"],
                ["withinServiceArea", "Dalam area layanan"],
                ["reliableCommunication", "Komunikasi darurat andal"],
                ["patientConsents", "Pasien memberikan persetujuan"],
                ["caregiverAvailable", "Caregiver tersedia"],
              ].map(([n, l]) => (
                <label
                  key={n}
                  className="flex min-h-11 items-center gap-3 rounded-lg bg-slate-50 px-3"
                >
                  <input type="checkbox" name={n} defaultChecked />
                  <span className="text-sm">{l}</span>
                </label>
              ))}
              <Field label="Kebutuhan oksigen (L/menit)">
                <input
                  name="oxygenRequirementLpm"
                  type="number"
                  min="0"
                  max="15"
                  step="0.5"
                  defaultValue="0"
                  className={input}
                />
              </Field>
              <button disabled={busy} className={btn}>
                Simpan assessment
              </button>
            </form>
          </Panel>
        )}
        {d.status === "ELIGIBLE" && (
          <Panel title="Admission">
            <form
              className="space-y-3"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                submit(`/hah/episodes/${id}/admit`, {
                  consentAt: new Date(String(f.get("consentAt"))).toISOString(),
                  consentBy: f.get("consentBy"),
                  emergencyPlan: f.get("emergencyPlan"),
                });
              }}
            >
              <Field label="Waktu consent">
                <input
                  name="consentAt"
                  type="datetime-local"
                  required
                  className={input}
                />
              </Field>
              <Field label="Pemberi consent">
                <input name="consentBy" required className={input} />
              </Field>
              <Field label="Emergency plan">
                <textarea
                  name="emergencyPlan"
                  minLength={20}
                  required
                  className={input}
                />
              </Field>
              <button disabled={busy} className={btn}>
                Admit pasien
              </button>
            </form>
          </Panel>
        )}
        {["ADMITTED", "ACTIVE"].includes(d.status) && (
          <>
            <Panel title="Care plan">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/care-plan`, {
                    diagnosis: f.get("diagnosis") || undefined,
                    goals: String(f.get("goals")).split("\n").filter(Boolean),
                    interventions: String(f.get("interventions"))
                      .split("\n")
                      .filter(Boolean),
                    doctorInterventions: String(
                      f.get("doctorInterventions") || "",
                    )
                      .split("\n")
                      .filter(Boolean),
                    nursingInterventions: String(
                      f.get("nursingInterventions") || "",
                    )
                      .split("\n")
                      .filter(Boolean),
                    dietPlan: f.get("dietPlan") || undefined,
                    activityPlan: f.get("activityPlan") || undefined,
                    educationPlan: f.get("educationPlan") || undefined,
                    followUpPlan: f.get("followUpPlan") || undefined,
                    evaluationTarget: f.get("evaluationTarget") || undefined,
                    visitFrequency: f.get("visitFrequency"),
                    monitoringFrequency: f.get("monitoringFrequency"),
                    escalationPlan: f.get("escalationPlan"),
                    medicationPlan: f.get("medicationPlan") || undefined,
                    equipmentPlan: f.get("equipmentPlan") || undefined,
                    nextReviewAt: new Date(
                      String(f.get("nextReviewAt")),
                    ).toISOString(),
                  });
                }}
              >
                <Field label="Diagnosis klinis">
                  <textarea name="diagnosis" className={input} />
                </Field>
                <Field label="Tujuan / target perawatan (satu per baris)">
                  <textarea name="goals" required className={input} />
                </Field>
                <Field label="Intervensi">
                  <textarea name="interventions" required className={input} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Intervensi dokter">
                    <textarea name="doctorInterventions" className={input} />
                  </Field>
                  <Field label="Intervensi keperawatan">
                    <textarea name="nursingInterventions" className={input} />
                  </Field>
                  <Field label="Diet">
                    <textarea name="dietPlan" className={input} />
                  </Field>
                  <Field label="Aktivitas">
                    <textarea name="activityPlan" className={input} />
                  </Field>
                  <Field label="Edukasi">
                    <textarea name="educationPlan" className={input} />
                  </Field>
                  <Field label="Jadwal follow-up">
                    <textarea name="followUpPlan" className={input} />
                  </Field>
                  <Field label="Target evaluasi">
                    <textarea name="evaluationTarget" className={input} />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Frekuensi kunjungan">
                    <input name="visitFrequency" required className={input} />
                  </Field>
                  <Field label="Frekuensi monitoring">
                    <input
                      name="monitoringFrequency"
                      required
                      className={input}
                    />
                  </Field>
                </div>
                <Field label="Rencana eskalasi">
                  <textarea
                    name="escalationPlan"
                    minLength={20}
                    required
                    className={input}
                  />
                </Field>
                <Field label="Rencana obat">
                  <textarea name="medicationPlan" className={input} />
                </Field>
                <Field label="Rencana alat">
                  <textarea name="equipmentPlan" className={input} />
                </Field>
                <Field label="Review berikutnya">
                  <input
                    name="nextReviewAt"
                    type="datetime-local"
                    required
                    className={input}
                  />
                </Field>
                <button className={btn} disabled={busy}>
                  Simpan care plan
                </button>
              </form>
            </Panel>
            <Panel title="Observasi & early warning">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/observations`, {
                    systolic: Number(f.get("systolic")),
                    diastolic: Number(f.get("diastolic")),
                    heartRate: Number(f.get("heartRate")),
                    respRate: Number(f.get("respRate")),
                    temperature: Number(f.get("temperature")),
                    spo2: Number(f.get("spo2")),
                    supplementalOxygen: f.has("supplementalOxygen"),
                    oxygenFlowLpm: Number(f.get("oxygenFlowLpm")) || undefined,
                    spo2Scale: Number(f.get("spo2Scale")),
                    consciousness: f.get("consciousness"),
                    newConfusion: f.has("newConfusion"),
                    painScore: Number(f.get("painScore")) || undefined,
                    glucoseMgDl: Number(f.get("glucoseMgDl")) || undefined,
                    weightKg: Number(f.get("weightKg")) || undefined,
                    symptomNotes: f.get("symptomNotes") || undefined,
                  });
                }}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    ["systolic", "Sistolik", "120"],
                    ["diastolic", "Diastolik", "80"],
                    ["heartRate", "Nadi", "75"],
                    ["respRate", "Napas", "16"],
                    ["temperature", "Suhu", "36.8"],
                    ["spo2", "SpO₂", "98"],
                  ].map(([n, l, v]) => (
                    <Field key={n} label={l}>
                      <input
                        name={n}
                        type="number"
                        step="0.1"
                        required
                        defaultValue={v}
                        className={input}
                      />
                    </Field>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Skala SpO₂">
                    <select name="spo2Scale" className={input}>
                      <option value="1">Scale 1</option>
                      <option value="2">Scale 2</option>
                    </select>
                  </Field>
                  <Field label="Kesadaran">
                    <select name="consciousness" className={input}>
                      {["A", "V", "P", "U"].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Gula darah (mg/dL)">
                    <input
                      name="glucoseMgDl"
                      type="number"
                      step="0.1"
                      className={input}
                    />
                  </Field>
                  <Field label="Berat badan (kg)">
                    <input
                      name="weightKg"
                      type="number"
                      step="0.1"
                      className={input}
                    />
                  </Field>
                  <Field label="Pain score">
                    <input
                      name="painScore"
                      type="number"
                      min="0"
                      max="10"
                      className={input}
                    />
                  </Field>
                </div>
                <label className="flex gap-2">
                  <input name="supplementalOxygen" type="checkbox" /> Oksigen
                  tambahan
                </label>
                <Field label="Flow oksigen">
                  <input
                    name="oxygenFlowLpm"
                    type="number"
                    step="0.5"
                    className={input}
                  />
                </Field>
                <label className="flex gap-2">
                  <input name="newConfusion" type="checkbox" /> Kebingungan baru
                </label>
                <Field label="Catatan gejala">
                  <textarea name="symptomNotes" className={input} />
                </Field>
                <button className={btn} disabled={busy}>
                  Simpan observasi
                </button>
              </form>
            </Panel>
            <Panel title="Medication order">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/medications`, {
                    medicationName: f.get("medicationName"),
                    dose: f.get("dose"),
                    route: f.get("route"),
                    frequency: f.get("frequency"),
                    indication: f.get("indication"),
                    startAt: new Date(String(f.get("startAt"))).toISOString(),
                    endAt: f.get("endAt")
                      ? new Date(String(f.get("endAt"))).toISOString()
                      : undefined,
                    scheduleAt: String(f.get("scheduleAt") || "")
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .map((value) => new Date(value).toISOString()),
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nama obat">
                    <input name="medicationName" required className={input} />
                  </Field>
                  <Field label="Dosis">
                    <input name="dose" required className={input} />
                  </Field>
                  <Field label="Rute">
                    <input name="route" required className={input} />
                  </Field>
                  <Field label="Frekuensi">
                    <input name="frequency" required className={input} />
                  </Field>
                </div>
                <Field label="Indikasi">
                  <input name="indication" required className={input} />
                </Field>
                <Field label="Mulai">
                  <input
                    name="startAt"
                    type="datetime-local"
                    required
                    className={input}
                  />
                </Field>
                <Field label="Selesai (opsional)">
                  <input name="endAt" type="datetime-local" className={input} />
                </Field>
                <Field label="Jadwal dosis (satu tanggal dan waktu per baris)">
                  <textarea
                    name="scheduleAt"
                    className={input}
                    placeholder={"2026-09-29T08:00\n2026-09-29T20:00"}
                  />
                </Field>
                <button className={btn} disabled={busy}>
                  Buat order
                </button>
              </form>
              {d.medicationOrders?.map((m: any) => (
                <div key={m.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <strong>{m.medicationName}</strong> {m.dose} {m.route} ·{" "}
                  {m.frequency} · {m.status}
                  {m.administrations?.length ? (
                    <div className="mt-3 space-y-2">
                      {m.administrations
                        .slice()
                        .sort(
                          (a: any, b: any) =>
                            new Date(a.scheduledAt).getTime() -
                            new Date(b.scheduledAt).getTime(),
                        )
                        .map((administration: any) => (
                          <div
                            key={administration.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-2"
                          >
                            <span>
                              {new Date(administration.scheduledAt).toLocaleString(
                                "id-ID",
                              )}{" "}
                              · <b>{administration.status}</b>
                            </span>
                            {["PLANNED", "DELAYED"].includes(
                              administration.status,
                            ) && (
                              <button
                                onClick={() =>
                                  submit(
                                    `/hah/medications/${m.id}/administrations`,
                                    {
                                      scheduledAt: administration.scheduledAt,
                                      status: "GIVEN",
                                      administeredAt: new Date().toISOString(),
                                    },
                                  )
                                }
                                className="rounded bg-emerald-600 px-3 py-2 text-white"
                              >
                                Catat diberikan
                              </button>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : null}
                  <div className="mt-2 flex gap-2">
                    {m.status === "ACTIVE" && (
                      <button
                        onClick={() => {
                          const quantity = window.prompt(
                            "Jumlah obat yang diminta",
                          );
                          const deliveryAddress = window.prompt(
                            "Alamat lengkap pengantaran",
                          );
                          if (quantity && deliveryAddress)
                            submit(
                              `/hah/medications/${m.id}/fulfillments`,
                              { quantity, deliveryAddress },
                            );
                        }}
                        className="rounded border border-emerald-500 bg-white px-3 py-2 font-semibold text-emerald-800"
                      >
                        Minta refill
                      </button>
                    )}
                    <button
                      onClick={() =>
                        submit(`/hah/medications/${m.id}/administrations`, {
                          scheduledAt: new Date().toISOString(),
                          status: "GIVEN",
                          administeredAt: new Date().toISOString(),
                        })
                      }
                      className="rounded bg-emerald-600 px-3 py-2 text-white"
                    >
                      Catat dosis sekarang
                    </button>
                    <button
                      onClick={() =>
                        patch(`/hah/medications/${m.id}/status`, {
                          status: "HELD",
                        })
                      }
                      className="rounded border px-3 py-2"
                    >
                      Hold
                    </button>
                  </div>
                </div>
              ))}
            </Panel>
            <Panel title="Fungsi, risiko jatuh & rehabilitasi">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/functional-assessments`, {
                    mobilityLevel: f.get("mobilityLevel"),
                    adlScore: Number(f.get("adlScore")),
                    fallRisk: f.get("fallRisk"),
                    fallsLast30Days: Number(f.get("fallsLast30Days")),
                    gaitAid: f.get("gaitAid") || undefined,
                    transferAbility: f.get("transferAbility"),
                    enduranceNotes: f.get("enduranceNotes") || undefined,
                    homeHazards: f.get("homeHazards") || undefined,
                    rehabilitationGoals: f.get("rehabilitationGoals"),
                    exercisePlan: f.get("exercisePlan"),
                    caregiverTraining: f.get("caregiverTraining") || undefined,
                    progress: f.get("functionalProgress"),
                    nextReviewAt: new Date(
                      String(f.get("functionalReviewAt")),
                    ).toISOString(),
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Tingkat mobilitas"><input name="mobilityLevel" required className={input} placeholder="Mandiri / bantuan 1 orang / bed rest" /></Field>
                  <Field label="Skor ADL 0–100"><input name="adlScore" type="number" min="0" max="100" required className={input} /></Field>
                  <Field label="Risiko jatuh">
                    <select name="fallRisk" className={input}><option value="LOW">Rendah</option><option value="MODERATE">Sedang</option><option value="HIGH">Tinggi</option></select>
                  </Field>
                  <Field label="Jatuh dalam 30 hari"><input name="fallsLast30Days" type="number" min="0" max="30" defaultValue="0" required className={input} /></Field>
                  <Field label="Alat bantu jalan"><input name="gaitAid" className={input} /></Field>
                  <Field label="Kemampuan transfer"><input name="transferAbility" required className={input} /></Field>
                </div>
                <Field label="Daya tahan/aktivitas"><textarea name="enduranceNotes" className={input} /></Field>
                <Field label="Bahaya di lingkungan rumah"><textarea name="homeHazards" className={input} /></Field>
                <Field label="Tujuan rehabilitasi"><textarea name="rehabilitationGoals" required className={input} /></Field>
                <Field label="Rencana latihan"><textarea name="exercisePlan" required className={input} /></Field>
                <Field label="Pelatihan caregiver"><textarea name="caregiverTraining" className={input} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Perkembangan">
                    <select name="functionalProgress" className={input}><option value="IMPROVING">Membaik</option><option value="STABLE">Stabil</option><option value="DECLINING">Menurun</option><option value="GOAL_ACHIEVED">Target tercapai</option></select>
                  </Field>
                  <Field label="Review berikutnya"><input name="functionalReviewAt" type="datetime-local" required className={input} /></Field>
                </div>
                <button className={btn} disabled={busy}>Simpan asesmen fungsi</button>
              </form>
              {d.functionalAssessments?.map((a: any) => (
                <div key={a.id} className={`rounded-xl border p-3 text-sm ${a.fallRisk === "HIGH" || a.progress === "DECLINING" ? "border-orange-300 bg-orange-50" : "bg-slate-50"}`}>
                  <strong>{a.mobilityLevel}</strong> · ADL {a.adlScore}/100 · Risiko jatuh {a.fallRisk}
                  <p className="mt-1">{a.progress} · {a.fallsLast30Days} kejadian jatuh/30 hari</p>
                  <p className="mt-1"><b>Target:</b> {a.rehabilitationGoals}</p>
                  <p className="mt-1 text-xs text-slate-500">Review {new Date(a.nextReviewAt).toLocaleString("id-ID")}</p>
                </div>
              ))}
            </Panel>
            <Panel title="Asesmen & perkembangan luka">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const number = (name: string) =>
                    f.get(name) === "" ? undefined : Number(f.get(name));
                  submit(`/hah/episodes/${id}/wounds`, {
                    woundLabel: f.get("woundLabel"),
                    location: f.get("location"),
                    woundType: f.get("woundType"),
                    lengthCm: number("lengthCm"),
                    widthCm: number("widthCm"),
                    depthCm: number("depthCm"),
                    tissueDescription: f.get("tissueDescription"),
                    exudate: f.get("exudate"),
                    odor: f.get("odor") === "on",
                    surroundingSkin: f.get("surroundingSkin"),
                    painScore: Number(f.get("painScore")),
                    infectionSigns: f.get("infectionSigns") === "on",
                    progress: f.get("progress"),
                    cleansing: f.get("cleansing") || undefined,
                    dressing: f.get("dressing"),
                    education: f.get("education") || undefined,
                    nextReviewAt: new Date(
                      String(f.get("nextReviewAt")),
                    ).toISOString(),
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Identitas luka">
                    <input name="woundLabel" required className={input} placeholder="Luka tumit kanan" />
                  </Field>
                  <Field label="Lokasi anatomis">
                    <input name="location" required className={input} />
                  </Field>
                  <Field label="Jenis luka">
                    <input name="woundType" required className={input} />
                  </Field>
                  <Field label="Perkembangan">
                    <select name="progress" className={input}>
                      <option value="IMPROVING">Membaik</option>
                      <option value="STABLE">Stabil</option>
                      <option value="DETERIORATING">Memburuk</option>
                      <option value="HEALED">Sembuh</option>
                    </select>
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Panjang (cm)"><input name="lengthCm" type="number" min="0" step="0.1" className={input} /></Field>
                  <Field label="Lebar (cm)"><input name="widthCm" type="number" min="0" step="0.1" className={input} /></Field>
                  <Field label="Kedalaman (cm)"><input name="depthCm" type="number" min="0" step="0.1" className={input} /></Field>
                </div>
                <Field label="Jaringan dasar luka"><input name="tissueDescription" required className={input} /></Field>
                <Field label="Eksudat"><input name="exudate" required className={input} /></Field>
                <Field label="Kulit sekitar"><input name="surroundingSkin" required className={input} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Skala nyeri 0–10"><input name="painScore" type="number" min="0" max="10" required className={input} /></Field>
                  <Field label="Review berikutnya"><input name="nextReviewAt" type="datetime-local" required className={input} /></Field>
                </div>
                <label className="flex gap-2"><input name="odor" type="checkbox" /> Terdapat bau</label>
                <label className="flex gap-2 font-semibold text-red-700"><input name="infectionSigns" type="checkbox" /> Terdapat tanda infeksi</label>
                <Field label="Pembersihan"><input name="cleansing" className={input} /></Field>
                <Field label="Balutan/tindakan"><input name="dressing" required className={input} /></Field>
                <Field label="Edukasi pasien/caregiver"><textarea name="education" className={input} /></Field>
                <button className={btn} disabled={busy}>Simpan asesmen luka</button>
              </form>
              {d.woundAssessments?.map((w: any) => (
                <div key={w.id} className={`rounded-xl border p-3 text-sm ${w.infectionSigns || w.progress === "DETERIORATING" ? "border-red-300 bg-red-50" : "bg-slate-50"}`}>
                  <strong>{w.woundLabel}</strong> · {w.location} · {w.progress}
                  <p className="mt-1">{[w.lengthCm, w.widthCm, w.depthCm].filter((x: any) => x != null).join(" × ")} cm · Nyeri {w.painScore}/10 · {w.exudate}</p>
                  <p className="mt-1"><b>Balutan:</b> {w.dressing}</p>
                  <p className="mt-1 text-xs text-slate-500">Review {new Date(w.nextReviewAt).toLocaleString("id-ID")}</p>
                </div>
              ))}
            </Panel>
            <Panel title="Jadwal kunjungan">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/visits`, {
                    healthWorkerId: f.get("healthWorkerId"),
                    visitType: f.get("visitType"),
                    scheduledStart: new Date(
                      String(f.get("scheduledStart")),
                    ).toISOString(),
                    scheduledEnd: new Date(
                      String(f.get("scheduledEnd")),
                    ).toISOString(),
                  });
                }}
              >
                <Field label="ID tenaga kesehatan">
                  <input name="healthWorkerId" required className={input} />
                </Field>
                <Field label="Jenis kunjungan">
                  <input name="visitType" required className={input} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Mulai">
                    <input
                      name="scheduledStart"
                      type="datetime-local"
                      required
                      className={input}
                    />
                  </Field>
                  <Field label="Selesai">
                    <input
                      name="scheduledEnd"
                      type="datetime-local"
                      required
                      className={input}
                    />
                  </Field>
                </div>
                <button className={btn} disabled={busy}>
                  Jadwalkan
                </button>
              </form>
              {d.visits?.map((v: any) => (
                <div key={v.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  {v.visitType} ·{" "}
                  {new Date(v.scheduledStart).toLocaleString("id-ID")} ·{" "}
                  {v.status}
                </div>
              ))}
            </Panel>
            <Panel title="Diagnostik & hasil kritis">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/diagnostics`, {
                    category: f.get("category"),
                    testName: f.get("testName"),
                    specimen: f.get("specimen") || undefined,
                    priority: f.get("priority"),
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Kategori">
                    <select name="category" className={input}>
                      <option>LAB</option>
                      <option>IMAGING</option>
                      <option>POINT_OF_CARE</option>
                    </select>
                  </Field>
                  <Field label="Prioritas">
                    <select name="priority" className={input}>
                      <option>ROUTINE</option>
                      <option>URGENT</option>
                      <option>STAT</option>
                    </select>
                  </Field>
                </div>
                <Field label="Pemeriksaan">
                  <input name="testName" required className={input} />
                </Field>
                <Field label="Spesimen">
                  <input name="specimen" className={input} />
                </Field>
                <button className={btn} disabled={busy}>
                  Buat order diagnostik
                </button>
              </form>
              {d.diagnosticOrders?.map((o: any) => (
                <div key={o.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <strong>{o.testName}</strong> · {o.priority} · {o.status}
                  {o.resultText && (
                    <p
                      className={
                        o.criticalResult
                          ? "mt-1 font-semibold text-red-700"
                          : "mt-1"
                      }
                    >
                      {o.resultText}
                    </p>
                  )}
                  {o.status === "ORDERED" && (
                    <button
                      className="mt-2 rounded border px-3 py-2"
                      onClick={() =>
                        patch(`/hah/diagnostics/${o.id}/status`, {
                          status: "COLLECTED",
                        })
                      }
                    >
                      Tandai spesimen dikoleksi
                    </button>
                  )}
                  {o.status === "COLLECTED" && (
                    <button
                      className="mt-2 rounded border px-3 py-2"
                      onClick={() =>
                        patch(`/hah/diagnostics/${o.id}/status`, {
                          status: "PROCESSING",
                        })
                      }
                    >
                      Mulai pemrosesan
                    </button>
                  )}
                  {["COLLECTED", "PROCESSING"].includes(o.status) && (
                    <a
                      href="/diagnostics"
                      className="ml-2 mt-2 inline-flex min-h-11 items-center rounded border px-3 py-2 font-semibold text-blue-700"
                    >
                      Input hasil terstruktur
                    </a>
                  )}
                  {o.status === "RESULTED" && (
                    <a
                      href="/diagnostics"
                      className="mt-2 inline-flex min-h-11 items-center rounded border px-3 py-2 font-semibold text-blue-700"
                    >
                      Review dan acknowledge
                    </a>
                  )}
                </div>
              ))}
            </Panel>
            <Panel title="Peralatan & oksigen">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/equipment`, {
                    equipmentType: f.get("equipmentType"),
                    serialNumber: f.get("serialNumber") || undefined,
                    supplier: f.get("supplier") || undefined,
                    instructions: f.get("instructions") || undefined,
                  });
                }}
              >
                <Field label="Jenis alat">
                  <input name="equipmentType" required className={input} />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nomor seri">
                    <input name="serialNumber" className={input} />
                  </Field>
                  <Field label="Supplier">
                    <input name="supplier" className={input} />
                  </Field>
                </div>
                <Field label="Instruksi">
                  <textarea name="instructions" className={input} />
                </Field>
                <button className={btn} disabled={busy}>
                  Minta alat
                </button>
              </form>
              {d.equipmentAssignments?.map((x: any) => (
                <div key={x.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <strong>{x.equipmentType}</strong> · {x.status}
                  <div className="mt-2 flex gap-2">
                    {x.status === "REQUESTED" && (
                      <button
                        onClick={() =>
                          patch(`/hah/equipment/${x.id}/status`, {
                            status: "DELIVERED",
                          })
                        }
                        className="rounded border px-3 py-2"
                      >
                        Tandai delivered
                      </button>
                    )}
                    {x.status !== "RETURNED" && (
                      <button
                        onClick={() =>
                          patch(`/hah/equipment/${x.id}/status`, {
                            status: "RETURNED",
                          })
                        }
                        className="rounded border px-3 py-2"
                      >
                        Return
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </Panel>
            <Panel title="Evaluasi klinis">
              <p className="text-sm leading-6 text-slate-600">
                Dokter menilai perkembangan terhadap target care plan. Status siap
                discharge hanya dapat dipilih setelah alert dan pemeriksaan tertunda
                diselesaikan.
              </p>
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/evaluations`, {
                    clinicalSummary: f.get("clinicalSummary"),
                    progressNotes: f.get("progressNotes"),
                    goalsMet: String(f.get("goalsMet"))
                      .split("\n")
                      .filter(Boolean),
                    unmetGoals: String(f.get("unmetGoals") || "")
                      .split("\n")
                      .filter(Boolean),
                    disposition: f.get("disposition"),
                    followUpRequired: f.get("followUpRequired") || undefined,
                  });
                }}
              >
                <Field label="Ringkasan klinis">
                  <textarea
                    name="clinicalSummary"
                    minLength={20}
                    required
                    className={input}
                  />
                </Field>
                <Field label="Perkembangan pasien">
                  <textarea
                    name="progressNotes"
                    minLength={20}
                    required
                    className={input}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Target tercapai (satu per baris)">
                    <textarea name="goalsMet" required className={input} />
                  </Field>
                  <Field label="Target belum tercapai">
                    <textarea name="unmetGoals" className={input} />
                  </Field>
                </div>
                <Field label="Keputusan evaluasi">
                  <select name="disposition" className={input}>
                    <option value="CONTINUE_CARE">Lanjutkan perawatan</option>
                    <option value="MODIFY_CARE_PLAN">Ubah rencana perawatan</option>
                    <option value="DISCHARGE_READY">Siap discharge</option>
                    <option value="TRANSFER_RECOMMENDED">Rekomendasikan transfer</option>
                  </select>
                </Field>
                <Field label="Tindak lanjut">
                  <textarea name="followUpRequired" className={input} />
                </Field>
                <button className={btn} disabled={busy}>
                  Simpan evaluasi
                </button>
              </form>
              {d.clinicalEvaluations?.length ? (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="font-bold text-slate-900">Riwayat evaluasi</h3>
                  {d.clinicalEvaluations.map((evaluation: any) => (
                    <article
                      key={evaluation.id}
                      className="rounded-lg border border-slate-200 p-3 text-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <strong>{evaluation.disposition.replaceAll("_", " ")}</strong>
                        <time className="text-slate-500">
                          {new Date(evaluation.evaluatedAt).toLocaleString("id-ID")}
                        </time>
                      </div>
                      <p className="mt-2 text-slate-700">
                        {evaluation.clinicalSummary}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                  Belum ada evaluasi klinis.
                </p>
              )}
            </Panel>
            <Panel title="Transfer / discharge">
              {(() => {
                const openAlerts =
                  d.alerts?.filter((x: any) => x.status !== "RESOLVED").length ?? 0;
                const pendingDiagnostics =
                  d.diagnosticOrders?.filter((x: any) =>
                    ["ORDERED", "COLLECTED", "PROCESSING"].includes(x.status),
                  ).length ?? 0;
                const criticalResults =
                  d.diagnosticOrders?.filter(
                    (x: any) => x.criticalResult && !x.acknowledgedAt,
                  ).length ?? 0;
                const latest = d.clinicalEvaluations?.[0];
                const evaluationCurrent =
                  latest?.disposition === "DISCHARGE_READY" &&
                  (!d.carePlan ||
                    new Date(latest.evaluatedAt) >= new Date(d.carePlan.updatedAt));
                const ready =
                  !openAlerts &&
                  !pendingDiagnostics &&
                  !criticalResults &&
                  evaluationCurrent;
                return (
                  <aside
                    className={`rounded-lg p-3 text-sm font-semibold ${
                      ready
                        ? "bg-emerald-50 text-emerald-900"
                        : "bg-amber-50 text-amber-950"
                    }`}
                  >
                    {ready
                      ? "Siap discharge berdasarkan evaluasi dan pemeriksaan keselamatan terbaru."
                      : `Belum siap discharge: ${[
                          openAlerts && `${openAlerts} alert terbuka`,
                          pendingDiagnostics &&
                            `${pendingDiagnostics} diagnostik berjalan`,
                          criticalResults &&
                            `${criticalResults} hasil kritis belum diakui`,
                          !evaluationCurrent && "evaluasi DISCHARGE_READY belum berlaku",
                        ]
                          .filter(Boolean)
                          .join("; ")}.`}
                  </aside>
                );
              })()}
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/transfer`, {
                    destination: f.get("destination"),
                    reason: f.get("reason"),
                    urgency: f.get("urgency"),
                    sbarHandover: f.get("sbarHandover"),
                    transportProvider: f.get("transportProvider") || undefined,
                  });
                }}
              >
                <Field label="Tujuan">
                  <input name="destination" required className={input} />
                </Field>
                <Field label="Urgensi">
                  <select name="urgency" className={input}>
                    <option>URGENT</option>
                    <option>EMERGENCY</option>
                  </select>
                </Field>
                <Field label="Alasan">
                  <input name="reason" required className={input} />
                </Field>
                <Field label="SBAR handover">
                  <textarea
                    name="sbarHandover"
                    minLength={20}
                    required
                    className={input}
                  />
                </Field>
                <Field label="Transportasi">
                  <input name="transportProvider" className={input} />
                </Field>
                <button
                  disabled={busy}
                  className="min-h-11 rounded-lg bg-red-600 px-4 font-semibold text-white"
                >
                  Minta transfer
                </button>
              </form>
              <form
                className="space-y-3 border-t pt-4"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/discharge`, {
                    dischargeDisposition: f.get("dischargeDisposition"),
                    dischargeSummary: f.get("dischargeSummary"),
                  });
                }}
              >
                <Field label="Disposition">
                  <input
                    name="dischargeDisposition"
                    required
                    className={input}
                  />
                </Field>
                <Field label="Discharge summary">
                  <textarea
                    name="dischargeSummary"
                    minLength={30}
                    required
                    className={input}
                  />
                </Field>
                <button className={btn} disabled={busy}>
                  Discharge
                </button>
              </form>
            </Panel>
          </>
        )}
        <Panel title="Clinical alerts">
          {d.alerts?.length ? (
            d.alerts.map((a: any) => (
              <article
                key={a.id}
                className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm"
              >
                <strong>
                  {a.severity} · {a.status}
                </strong>
                <p>{a.trigger}</p>
                <div className="mt-2 flex gap-2">
                  {a.status === "OPEN" && (
                    <button
                      onClick={() => patch(`/hah/alerts/${a.id}/acknowledge`)}
                      className="rounded bg-orange-600 px-3 py-2 text-white"
                    >
                      Acknowledge
                    </button>
                  )}
                  {a.status !== "RESOLVED" && (
                    <button
                      onClick={() => {
                        const r = window.prompt("Resolusi klinis");
                        if (r)
                          patch(`/hah/alerts/${a.id}/resolve`, {
                            resolution: r,
                          });
                      }}
                      className="rounded border border-orange-400 px-3 py-2"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-500">Belum ada alert.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

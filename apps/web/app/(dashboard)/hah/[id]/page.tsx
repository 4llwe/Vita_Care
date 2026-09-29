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
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <h3 className="font-bold text-red-950">Alergi dan reaksi obat</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ...(Array.isArray(d.patient.allergies)
                      ? d.patient.allergies.map((substance: string) => ({
                          id: `legacy-${substance}`,
                          substance,
                          reaction: "Detail reaksi belum terstruktur",
                          severity: "UNKNOWN",
                          verifiedAt: null,
                        }))
                      : []),
                    ...(d.patient.allergyRecords ?? []),
                  ].length ? (
                    [
                      ...(Array.isArray(d.patient.allergies)
                        ? d.patient.allergies.map((substance: string) => ({
                            id: `legacy-${substance}`,
                            substance,
                            reaction: "Detail reaksi belum terstruktur",
                            severity: "UNKNOWN",
                            verifiedAt: null,
                          }))
                        : []),
                      ...(d.patient.allergyRecords ?? []),
                    ].map((allergy: any) => (
                      <span
                        key={allergy.id}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-900"
                        title={allergy.reaction}
                      >
                        <b>{allergy.substance}</b> · {allergy.severity}
                        {allergy.verifiedAt ? " · terverifikasi" : " · belum terverifikasi"}
                      </span>
                    ))
                  ) : (
                    <b className="text-sm text-slate-600">
                      Belum ada alergi yang tercatat — tetap lakukan verifikasi.
                    </b>
                  )}
                </div>
              </div>
              <form
                className="space-y-3 rounded-xl border border-red-100 p-4"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/allergies`, {
                    substance: f.get("allergySubstance"),
                    category: f.get("allergyCategory"),
                    reaction: f.get("allergyReaction"),
                    severity: f.get("allergySeverity"),
                    verified: f.get("allergyVerified") === "on",
                    note: f.get("allergyNote") || undefined,
                  });
                }}
              >
                <h3 className="font-bold">Catat alergi terstruktur</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Zat / obat">
                    <input name="allergySubstance" required className={input} />
                  </Field>
                  <Field label="Kategori">
                    <select name="allergyCategory" className={input}>
                      <option value="DRUG">Obat</option>
                      <option value="FOOD">Makanan</option>
                      <option value="ENVIRONMENT">Lingkungan</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </Field>
                  <Field label="Reaksi yang dialami">
                    <input name="allergyReaction" required className={input} />
                  </Field>
                  <Field label="Keparahan">
                    <select name="allergySeverity" className={input}>
                      <option value="UNKNOWN">Belum diketahui</option>
                      <option value="MILD">Ringan</option>
                      <option value="MODERATE">Sedang</option>
                      <option value="SEVERE">Berat</option>
                    </select>
                  </Field>
                </div>
                <Field label="Catatan">
                  <textarea name="allergyNote" className={input} />
                </Field>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input name="allergyVerified" type="checkbox" />
                  Riwayat alergi telah diverifikasi tenaga kesehatan
                </label>
                <button className={btn} disabled={busy}>Simpan alergi</button>
              </form>
              <form
                className="space-y-3 rounded-xl border border-blue-100 p-4"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const lines = (name: string) =>
                    String(f.get(name) || "")
                      .split("\n")
                      .map((value) => value.trim())
                      .filter(Boolean);
                  submit(`/hah/episodes/${id}/medication-reconciliations`, {
                    transitionType: f.get("reconciliationTransition"),
                    informationSources: lines("reconciliationSources"),
                    homeMedications: lines("homeMedications"),
                    discrepancies: lines("medicationDiscrepancies"),
                    actionsTaken: f.get("reconciliationActions"),
                    patientOrCaregiverInvolved:
                      f.get("patientOrCaregiverInvolved") === "on",
                  });
                }}
              >
                <h3 className="font-bold">Rekonsiliasi obat</h3>
                <Field label="Tahap transisi">
                  <select name="reconciliationTransition" className={input}>
                    <option value="ADMISSION">Masuk program</option>
                    <option value="ROUTINE">Peninjauan rutin</option>
                    <option value="TRANSFER">Transfer / rujukan</option>
                    <option value="DISCHARGE">Pulang / discharge</option>
                  </select>
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Sumber informasi (satu per baris)">
                    <textarea
                      name="reconciliationSources"
                      required
                      placeholder={"Pasien\nCaregiver\nDaftar obat sebelumnya"}
                      className={input}
                    />
                  </Field>
                  <Field label="Obat yang digunakan di rumah (satu per baris)">
                    <textarea
                      name="homeMedications"
                      placeholder="Nama · dosis · rute · frekuensi"
                      className={input}
                    />
                  </Field>
                  <Field label="Ketidaksesuaian (satu per baris)">
                    <textarea
                      name="medicationDiscrepancies"
                      placeholder="Kosongkan bila tidak ada"
                      className={input}
                    />
                  </Field>
                  <Field label="Tindakan penyelesaian">
                    <textarea
                      name="reconciliationActions"
                      minLength={3}
                      required
                      className={input}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input name="patientOrCaregiverInvolved" type="checkbox" />
                  Pasien/caregiver dilibatkan dan daftar obat dikonfirmasi
                </label>
                <button className={btn} disabled={busy}>
                  Selesaikan rekonsiliasi
                </button>
              </form>
              {d.medicationReconciliations?.length ? (
                <div className="space-y-2">
                  <h3 className="font-bold">Riwayat rekonsiliasi</h3>
                  {d.medicationReconciliations.map((record: any) => (
                    <article
                      key={record.id}
                      className="rounded-lg bg-blue-50 p-3 text-sm"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <b>{record.transitionType}</b>
                        <time>
                          {new Date(record.completedAt).toLocaleString("id-ID")}
                        </time>
                      </div>
                      <p className="mt-2">{record.actionsTaken}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Ketidaksesuaian:{" "}
                        {Array.isArray(record.discrepancies) &&
                        record.discrepancies.length
                          ? record.discrepancies.join("; ")
                          : "Tidak ada"}
                      </p>
                    </article>
                  ))}
                </div>
              ) : null}
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
            <Panel title="Edukasi pasien/caregiver & teach-back">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/education-records`, {
                    topic: f.get("educationTopic"),
                    audience: f.get("educationAudience"),
                    contentSummary: f.get("educationContent"),
                    deliveryMethod: f.get("deliveryMethod"),
                    language: f.get("educationLanguage"),
                    teachBackResponse: f.get("teachBackResponse"),
                    comprehension: f.get("educationComprehension"),
                    barriers: f.get("educationBarriers") || undefined,
                    reinforcementPlan:
                      f.get("reinforcementPlan") || undefined,
                    educationalMaterial:
                      f.get("educationalMaterial") || undefined,
                    nextReviewAt: f.get("educationReviewAt")
                      ? new Date(
                          String(f.get("educationReviewAt")),
                        ).toISOString()
                      : undefined,
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Topik edukasi"><input name="educationTopic" required className={input} /></Field>
                  <Field label="Sasaran">
                    <select name="educationAudience" className={input}><option value="PATIENT">Pasien</option><option value="CAREGIVER">Caregiver</option><option value="BOTH">Pasien & caregiver</option></select>
                  </Field>
                  <Field label="Metode"><input name="deliveryMethod" required className={input} placeholder="Demonstrasi / verbal / video" /></Field>
                  <Field label="Bahasa"><input name="educationLanguage" required defaultValue="Bahasa Indonesia" className={input} /></Field>
                </div>
                <Field label="Materi yang diberikan"><textarea name="educationContent" required className={input} /></Field>
                <Field label="Respons teach-back"><textarea name="teachBackResponse" required className={input} placeholder="Tuliskan kembali apa yang pasien/caregiver demonstrasikan atau jelaskan" /></Field>
                <Field label="Tingkat pemahaman">
                  <select name="educationComprehension" className={input}><option value="UNDERSTOOD">Dipahami</option><option value="PARTIAL">Sebagian</option><option value="NEEDS_REINFORCEMENT">Perlu penguatan</option></select>
                </Field>
                <Field label="Hambatan belajar"><textarea name="educationBarriers" className={input} /></Field>
                <Field label="Rencana penguatan"><textarea name="reinforcementPlan" className={input} /></Field>
                <Field label="Materi/link pendukung"><input name="educationalMaterial" className={input} /></Field>
                <Field label="Review berikutnya"><input name="educationReviewAt" type="datetime-local" className={input} /></Field>
                <button className={btn} disabled={busy}>Simpan edukasi</button>
              </form>
              {d.educationRecords?.map((r: any) => (
                <div key={r.id} className={`rounded-xl border p-3 text-sm ${r.comprehension === "NEEDS_REINFORCEMENT" ? "border-amber-300 bg-amber-50" : "bg-slate-50"}`}>
                  <strong>{r.topic}</strong> · {r.audience} · {r.comprehension.replaceAll("_", " ")}
                  <p className="mt-1"><b>Teach-back:</b> {r.teachBackResponse}</p>
                  {r.reinforcementPlan ? <p className="mt-1"><b>Penguatan:</b> {r.reinforcementPlan}</p> : null}
                </div>
              ))}
            </Panel>
            <Panel title="Perawatan paliatif & tujuan perawatan">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/palliative-assessments`, {
                    ppsScore: Number(f.get("ppsScore")),
                    painScore: Number(f.get("palliativePain")),
                    dyspneaScore: Number(f.get("dyspneaScore")),
                    nauseaScore: Number(f.get("nauseaScore")),
                    anxietyScore: Number(f.get("anxietyScore")),
                    consciousnessNotes: f.get("consciousnessNotes"),
                    otherSymptoms: f.get("otherSymptoms") || undefined,
                    goalsOfCare: f.get("goalsOfCare"),
                    preferredPlaceOfCare: f.get("preferredPlaceOfCare"),
                    escalationPreferences: f.get("escalationPreferences"),
                    comfortPlan: f.get("comfortPlan"),
                    familyDiscussionSummary:
                      f.get("familyDiscussionSummary") || undefined,
                    spiritualPsychosocialNeed:
                      f.get("spiritualPsychosocialNeed") || undefined,
                    nextReviewAt: new Date(
                      String(f.get("palliativeReviewAt")),
                    ).toISOString(),
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="PPS 0–100"><input name="ppsScore" type="number" min="0" max="100" step="10" required className={input} /></Field>
                  <Field label="Nyeri 0–10"><input name="palliativePain" type="number" min="0" max="10" required className={input} /></Field>
                  <Field label="Sesak 0–10"><input name="dyspneaScore" type="number" min="0" max="10" required className={input} /></Field>
                  <Field label="Mual 0–10"><input name="nauseaScore" type="number" min="0" max="10" required className={input} /></Field>
                  <Field label="Kecemasan 0–10"><input name="anxietyScore" type="number" min="0" max="10" required className={input} /></Field>
                </div>
                <Field label="Kesadaran/kognisi"><input name="consciousnessNotes" required className={input} /></Field>
                <Field label="Gejala lain"><textarea name="otherSymptoms" className={input} /></Field>
                <Field label="Tujuan perawatan"><textarea name="goalsOfCare" required className={input} /></Field>
                <Field label="Tempat perawatan yang diutamakan"><input name="preferredPlaceOfCare" required className={input} /></Field>
                <Field label="Preferensi eskalasi dan rujukan"><textarea name="escalationPreferences" required className={input} /></Field>
                <Field label="Rencana kenyamanan"><textarea name="comfortPlan" required className={input} /></Field>
                <Field label="Ringkasan diskusi keluarga"><textarea name="familyDiscussionSummary" className={input} /></Field>
                <Field label="Kebutuhan psikososial/spiritual"><textarea name="spiritualPsychosocialNeed" className={input} /></Field>
                <Field label="Review berikutnya"><input name="palliativeReviewAt" type="datetime-local" required className={input} /></Field>
                <button className={btn} disabled={busy}>Simpan asesmen paliatif</button>
              </form>
              {d.palliativeAssessments?.map((p: any) => {
                const severe = Math.max(p.painScore, p.dyspneaScore, p.nauseaScore, p.anxietyScore) >= 7;
                return (
                  <div key={p.id} className={`rounded-xl border p-3 text-sm ${severe ? "border-red-300 bg-red-50" : "bg-slate-50"}`}>
                    <strong>PPS {p.ppsScore}</strong> · Nyeri {p.painScore} · Sesak {p.dyspneaScore} · Mual {p.nauseaScore} · Cemas {p.anxietyScore}
                    <p className="mt-1"><b>Tujuan:</b> {p.goalsOfCare}</p>
                    <p className="mt-1"><b>Kenyamanan:</b> {p.comfortPlan}</p>
                    <p className="mt-1 text-xs text-slate-500">Review {new Date(p.nextReviewAt).toLocaleString("id-ID")}</p>
                  </div>
                );
              })}
            </Panel>
            <Panel title="Asesmen nutrisi & intervensi gizi">
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const optionalNumber = (name: string) =>
                    f.get(name) === "" ? undefined : Number(f.get(name));
                  submit(`/hah/episodes/${id}/nutrition-assessments`, {
                    weightKg: Number(f.get("nutritionWeightKg")),
                    heightCm: Number(f.get("nutritionHeightCm")),
                    weightChangePercent: optionalNumber("weightChangePercent"),
                    intakePercent: Number(f.get("intakePercent")),
                    appetite: f.get("appetite"),
                    swallowingDifficulty: f.get("swallowingDifficulty") === "on",
                    nauseaVomiting: f.get("nauseaVomiting") === "on",
                    nutritionRisk: f.get("nutritionRisk"),
                    dietPlan: f.get("nutritionDietPlan"),
                    proteinTargetG: optionalNumber("proteinTargetG"),
                    fluidTargetMl: optionalNumber("fluidTargetMl"),
                    supplements: f.get("supplements") || undefined,
                    education: f.get("nutritionEducation") || undefined,
                    nextReviewAt: new Date(
                      String(f.get("nutritionReviewAt")),
                    ).toISOString(),
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Berat badan (kg)"><input name="nutritionWeightKg" type="number" min="1" step="0.1" required className={input} /></Field>
                  <Field label="Tinggi badan (cm)"><input name="nutritionHeightCm" type="number" min="30" step="0.1" required className={input} /></Field>
                  <Field label="Perubahan berat (%)"><input name="weightChangePercent" type="number" step="0.1" className={input} /></Field>
                  <Field label="Asupan makanan (%)"><input name="intakePercent" type="number" min="0" max="100" required className={input} /></Field>
                  <Field label="Nafsu makan"><input name="appetite" required className={input} /></Field>
                  <Field label="Risiko nutrisi">
                    <select name="nutritionRisk" className={input}><option value="LOW">Rendah</option><option value="MODERATE">Sedang</option><option value="HIGH">Tinggi</option></select>
                  </Field>
                </div>
                <label className="flex gap-2 font-semibold text-orange-800"><input name="swallowingDifficulty" type="checkbox" /> Kesulitan menelan</label>
                <label className="flex gap-2"><input name="nauseaVomiting" type="checkbox" /> Mual atau muntah</label>
                <Field label="Rencana diet"><textarea name="nutritionDietPlan" required className={input} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Target protein (g/hari)"><input name="proteinTargetG" type="number" min="0" step="0.1" className={input} /></Field>
                  <Field label="Target cairan (ml/hari)"><input name="fluidTargetMl" type="number" min="0" className={input} /></Field>
                </div>
                <Field label="Suplemen"><input name="supplements" className={input} /></Field>
                <Field label="Edukasi gizi"><textarea name="nutritionEducation" className={input} /></Field>
                <Field label="Review berikutnya"><input name="nutritionReviewAt" type="datetime-local" required className={input} /></Field>
                <button className={btn} disabled={busy}>Simpan asesmen nutrisi</button>
              </form>
              {d.nutritionAssessments?.map((n: any) => (
                <div key={n.id} className={`rounded-xl border p-3 text-sm ${n.nutritionRisk === "HIGH" || n.intakePercent < 50 ? "border-orange-300 bg-orange-50" : "bg-slate-50"}`}>
                  <strong>Risiko {n.nutritionRisk}</strong> · BMI {n.bmi} · Asupan {n.intakePercent}%
                  <p className="mt-1"><b>Rencana:</b> {n.dietPlan}</p>
                  <p className="mt-1 text-xs text-slate-500">Review {new Date(n.nextReviewAt).toLocaleString("id-ID")}</p>
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
            <Panel title="Telekonsultasi klinis">
              <p className="text-sm text-slate-600">
                Untuk konsultasi terjadwal non-darurat. Gunakan tombol DARURAT
                bila kondisi mengancam nyawa.
              </p>
              <form
                className="space-y-3"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/teleconsultations`, {
                    clinicianId: f.get("teleconsultClinicianId"),
                    reason: f.get("teleconsultReason"),
                    scheduledStart: new Date(
                      String(f.get("teleconsultStart")),
                    ).toISOString(),
                    scheduledEnd: new Date(
                      String(f.get("teleconsultEnd")),
                    ).toISOString(),
                    meetingUrl: f.get("meetingUrl") || undefined,
                    consentAt: new Date().toISOString(),
                    consentBy: f.get("teleconsultConsentBy"),
                  });
                }}
              >
                <Field label="Klinisi">
                  <select name="teleconsultClinicianId" required className={input}>
                    <option value="">Pilih anggota tim aktif</option>
                    {d.careAssignments
                      ?.filter((a: any) => a.isActive)
                      .map((a: any) => (
                        <option key={a.id} value={a.healthWorkerId}>
                          {a.healthWorker?.name} · {a.healthWorker?.profession}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Alasan konsultasi"><textarea name="teleconsultReason" required className={input} /></Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Mulai"><input name="teleconsultStart" type="datetime-local" required className={input} /></Field>
                  <Field label="Selesai"><input name="teleconsultEnd" type="datetime-local" required className={input} /></Field>
                </div>
                <Field label="Tautan pertemuan aman"><input name="meetingUrl" type="url" className={input} /></Field>
                <Field label="Pemberi consent"><input name="teleconsultConsentBy" required className={input} /></Field>
                <button className={btn} disabled={busy}>Jadwalkan telekonsultasi</button>
              </form>
              {d.teleconsultations?.map((t: any) => (
                <div key={t.id} className="rounded-xl border bg-slate-50 p-3 text-sm">
                  <strong>{t.reason}</strong> · {t.status}
                  <p className="mt-1">{new Date(t.scheduledStart).toLocaleString("id-ID")}</p>
                  {t.meetingUrl && t.status === "SCHEDULED" ? (
                    <a href={t.meetingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center font-semibold text-blue-700">Buka ruang konsultasi</a>
                  ) : null}
                  {t.status === "SCHEDULED" ? (
                    <button
                      onClick={() =>
                        patch(`/hah/teleconsultations/${t.id}`, {
                          status: "IN_PROGRESS",
                          identityVerified: true,
                        })
                      }
                      className="ml-2 mt-2 rounded border px-3 py-2"
                    >
                      Verifikasi identitas & mulai
                    </button>
                  ) : null}
                  {t.status === "IN_PROGRESS" ? (
                    <form
                      className="mt-3 space-y-3 border-t pt-3"
                      onSubmit={(e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        patch(`/hah/teleconsultations/${t.id}`, {
                          status: "COMPLETED",
                          clinicalSummary: f.get("teleSummary"),
                          advice: f.get("teleAdvice"),
                          followUpPlan: f.get("teleFollowUp"),
                          escalationRequired:
                            f.get("teleEscalation") === "on",
                          escalationPlan:
                            f.get("teleEscalationPlan") || undefined,
                        });
                      }}
                    >
                      <Field label="Ringkasan klinis"><textarea name="teleSummary" required className={input} /></Field>
                      <Field label="Saran/instruksi"><textarea name="teleAdvice" required className={input} /></Field>
                      <Field label="Tindak lanjut"><textarea name="teleFollowUp" required className={input} /></Field>
                      <label className="flex gap-2 font-semibold text-orange-800"><input name="teleEscalation" type="checkbox" /> Memerlukan eskalasi klinis</label>
                      <Field label="Rencana eskalasi"><textarea name="teleEscalationPlan" className={input} /></Field>
                      <button className={btn} disabled={busy}>Selesaikan & dokumentasikan</button>
                    </form>
                  ) : null}
                  {t.status === "COMPLETED" ? (
                    <div className="mt-3 rounded-lg bg-white p-3">
                      <p><b>Ringkasan:</b> {t.clinicalSummary}</p>
                      <p><b>Tindak lanjut:</b> {t.followUpPlan}</p>
                    </div>
                  ) : null}
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
                  {v.status === "PLANNED" ? (
                    <button
                      onClick={() =>
                        patch(`/hah/visits/${v.id}/status`, {
                          status: "EN_ROUTE",
                        })
                      }
                      className="ml-2 rounded border px-3 py-2"
                    >
                      Berangkat
                    </button>
                  ) : null}
                  {v.status === "EN_ROUTE" ? (
                    <button
                      onClick={() =>
                        patch(`/hah/visits/${v.id}/status`, {
                          status: "IN_PROGRESS",
                          identityVerified: true,
                        })
                      }
                      className="ml-2 rounded border px-3 py-2"
                    >
                      Verifikasi pasien & mulai
                    </button>
                  ) : null}
                  {["PLANNED", "EN_ROUTE"].includes(v.status) ? (
                    <button
                      onClick={() => {
                        const cancellationReason = window.prompt(
                          "Alasan pembatalan kunjungan",
                        );
                        if (cancellationReason)
                          patch(`/hah/visits/${v.id}/status`, {
                            status: "CANCELLED",
                            cancellationReason,
                          });
                      }}
                      className="ml-2 rounded border border-red-300 px-3 py-2 text-red-700"
                    >
                      Batalkan
                    </button>
                  ) : null}
                  {v.status === "IN_PROGRESS" ? (
                    <form
                      className="mt-3 space-y-3 border-t pt-3"
                      onSubmit={(e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        patch(`/hah/visits/${v.id}/status`, {
                          status: "COMPLETED",
                          clinicalNote: f.get("visitClinicalNote"),
                          interventions: f.get("visitInterventions"),
                          patientResponse: f.get("visitPatientResponse"),
                          nextPlan: f.get("visitNextPlan"),
                          handoverNote: f.get("visitHandover"),
                        });
                      }}
                    >
                      <Field label="Catatan klinis"><textarea name="visitClinicalNote" required className={input} /></Field>
                      <Field label="Tindakan/intervensi"><textarea name="visitInterventions" required className={input} /></Field>
                      <Field label="Respons pasien"><textarea name="visitPatientResponse" required className={input} /></Field>
                      <Field label="Rencana berikutnya"><textarea name="visitNextPlan" required className={input} /></Field>
                      <Field label="Handover"><textarea name="visitHandover" required className={input} /></Field>
                      <button className={btn} disabled={busy}>Selesaikan kunjungan</button>
                    </form>
                  ) : null}
                  {v.status === "COMPLETED" ? (
                    <div className="mt-3 rounded-lg bg-white p-3">
                      <p><b>Catatan:</b> {v.clinicalNote}</p>
                      <p><b>Rencana:</b> {v.nextPlan}</p>
                      <p><b>Handover:</b> {v.handoverNote}</p>
                    </div>
                  ) : null}
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
                  {["DELIVERED", "IN_USE"].includes(x.status) && (
                    <form
                      className="mt-4 space-y-3 border-t pt-4"
                      onSubmit={(e: FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const f = new FormData(e.currentTarget);
                        submit(`/hah/equipment/${x.id}/checks`, {
                          operational: f.get("operational") === "on",
                          powerSupply: f.get("powerSupply") || undefined,
                          batteryPercent:
                            f.get("batteryPercent") === ""
                              ? undefined
                              : Number(f.get("batteryPercent")),
                          consumableLevel:
                            f.get("consumableLevel") || undefined,
                          cleanliness: f.get("cleanliness"),
                          alarmTested: f.get("alarmTested") === "on",
                          issueDescription:
                            f.get("issueDescription") || undefined,
                          actionTaken: f.get("actionTaken") || undefined,
                          nextCheckAt: new Date(
                            String(f.get("equipmentNextCheck")),
                          ).toISOString(),
                        });
                      }}
                    >
                      <p className="font-bold">Pemeriksaan keselamatan alat</p>
                      <label className="flex gap-2"><input name="operational" type="checkbox" defaultChecked /> Alat operasional</label>
                      <label className="flex gap-2"><input name="alarmTested" type="checkbox" /> Alarm diuji</label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Sumber daya"><input name="powerSupply" className={input} /></Field>
                        <Field label="Baterai (%)"><input name="batteryPercent" type="number" min="0" max="100" className={input} /></Field>
                        <Field label="Level consumable/oksigen"><input name="consumableLevel" className={input} /></Field>
                        <Field label="Kebersihan"><input name="cleanliness" required className={input} /></Field>
                      </div>
                      <Field label="Masalah ditemukan"><textarea name="issueDescription" className={input} /></Field>
                      <Field label="Tindakan"><textarea name="actionTaken" className={input} /></Field>
                      <Field label="Pemeriksaan berikutnya"><input name="equipmentNextCheck" type="datetime-local" required className={input} /></Field>
                      <button className={btn} disabled={busy}>Simpan pemeriksaan alat</button>
                    </form>
                  )}
                  {x.safetyChecks?.slice(0, 3).map((check: any) => (
                    <div key={check.id} className={`mt-3 rounded-lg border p-2 ${check.operational ? "bg-white" : "border-red-300 bg-red-50"}`}>
                      <b>{check.operational ? "Operasional" : "Tidak operasional"}</b> · {check.cleanliness}
                      {check.issueDescription ? <p className="mt-1">{check.issueDescription}</p> : null}
                    </div>
                  ))}
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
                  !!d.dischargeChecklist &&
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
                          !d.dischargeChecklist &&
                            "checklist transisi pulang belum selesai",
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
                    destinationUnit: f.get("destinationUnit") || undefined,
                    reason: f.get("reason"),
                    urgency: f.get("urgency"),
                    sbarHandover: f.get("sbarHandover"),
                    latestClinicalStatus: f.get("latestClinicalStatus"),
                    medicationSummary: f.get("transferMedicationSummary"),
                    risksPrecautions: f.get("risksPrecautions"),
                    familyNotified: f.get("familyNotified") === "on",
                    transportProvider: f.get("transportProvider") || undefined,
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="RS / faskes tujuan">
                    <input name="destination" required className={input} />
                  </Field>
                  <Field label="Unit tujuan (bila diketahui)">
                    <input name="destinationUnit" className={input} />
                  </Field>
                </div>
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
                <Field label="Status klinis terkini">
                  <textarea
                    name="latestClinicalStatus"
                    minLength={10}
                    required
                    className={input}
                  />
                </Field>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Ringkasan obat">
                    <textarea
                      name="transferMedicationSummary"
                      minLength={5}
                      required
                      className={input}
                    />
                  </Field>
                  <Field label="Risiko / tindakan pencegahan">
                    <textarea
                      name="risksPrecautions"
                      minLength={5}
                      required
                      className={input}
                    />
                  </Field>
                </div>
                <Field label="Transportasi">
                  <input name="transportProvider" className={input} />
                </Field>
                <label className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                  <input name="familyNotified" type="checkbox" />
                  Keluarga/caregiver telah diberi tahu
                </label>
                <button
                  disabled={busy}
                  className="min-h-11 rounded-lg bg-red-600 px-4 font-semibold text-white"
                >
                  Minta transfer
                </button>
              </form>
              {d.transfers?.length ? (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="font-bold text-slate-900">
                    Perjalanan rujukan
                  </h3>
                  {d.transfers.map((transfer: any) => (
                    <article
                      key={transfer.id}
                      className="space-y-3 rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <strong>{transfer.destination}</strong>
                          {transfer.destinationUnit
                            ? ` · ${transfer.destinationUnit}`
                            : ""}
                          <p className="text-sm text-slate-600">
                            {transfer.reason}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                          {transfer.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <details className="rounded-lg bg-slate-50 p-3 text-sm">
                        <summary className="cursor-pointer font-semibold">
                          Ringkasan handover klinis
                        </summary>
                        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div><dt className="font-semibold">SBAR</dt><dd>{transfer.sbarHandover}</dd></div>
                          <div><dt className="font-semibold">Status klinis</dt><dd>{transfer.latestClinicalStatus}</dd></div>
                          <div><dt className="font-semibold">Obat</dt><dd>{transfer.medicationSummary}</dd></div>
                          <div><dt className="font-semibold">Risiko</dt><dd>{transfer.risksPrecautions}</dd></div>
                        </dl>
                      </details>
                      {transfer.status === "REQUESTED" && (
                        <div className="grid gap-3 lg:grid-cols-2">
                          <form
                            className="space-y-2 rounded-lg bg-emerald-50 p-3"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const f = new FormData(e.currentTarget);
                              patch(`/hah/transfers/${transfer.id}`, {
                                status: "ACCEPTED",
                                receivingContact: f.get("receivingContact"),
                                acceptingClinician: f.get("acceptingClinician"),
                                destinationUnit: f.get("acceptedUnit") || undefined,
                              });
                            }}
                          >
                            <strong className="text-sm">Konfirmasi penerimaan</strong>
                            <input name="receivingContact" required placeholder="Kontak penerima" className={input} />
                            <input name="acceptingClinician" required placeholder="Klinisi penerima" className={input} />
                            <input name="acceptedUnit" placeholder="Unit / ruang" className={input} />
                            <button className={btn} disabled={busy}>Diterima faskes</button>
                          </form>
                          <form
                            className="space-y-2 rounded-lg bg-red-50 p-3"
                            onSubmit={(e) => {
                              e.preventDefault();
                              const f = new FormData(e.currentTarget);
                              patch(`/hah/transfers/${transfer.id}`, {
                                status: "REJECTED",
                                rejectionReason: f.get("rejectionReason"),
                              });
                            }}
                          >
                            <strong className="text-sm">Penolakan faskes</strong>
                            <textarea name="rejectionReason" required minLength={5} placeholder="Alasan penolakan dan kebutuhan alternatif" className={input} />
                            <button className="min-h-11 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white" disabled={busy}>Catat penolakan</button>
                          </form>
                        </div>
                      )}
                      {transfer.status === "ACCEPTED" && (
                        <form
                          className="grid gap-2 rounded-lg bg-amber-50 p-3 sm:grid-cols-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            patch(`/hah/transfers/${transfer.id}`, {
                              status: "DEPARTED",
                              transportProvider: f.get("departureTransport"),
                              transportReference: f.get("transportReference"),
                            });
                          }}
                        >
                          <input name="departureTransport" required defaultValue={transfer.transportProvider ?? ""} placeholder="Penyedia transportasi" className={input} />
                          <input name="transportReference" required placeholder="Nomor ambulans / referensi" className={input} />
                          <button className={`${btn} sm:col-span-2`} disabled={busy}>Konfirmasi keberangkatan</button>
                        </form>
                      )}
                      {transfer.status === "DEPARTED" && (
                        <form
                          className="grid gap-2 rounded-lg bg-blue-50 p-3 sm:grid-cols-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            patch(`/hah/transfers/${transfer.id}`, {
                              status: "ARRIVED",
                              receivedBy: f.get("receivedBy"),
                              arrivalHandoverNote: f.get("arrivalHandoverNote"),
                            });
                          }}
                        >
                          <input name="receivedBy" required placeholder="Nama penerima pasien" className={input} />
                          <textarea name="arrivalHandoverNote" required minLength={5} placeholder="Konfirmasi handover saat tiba" className={input} />
                          <button className={`${btn} sm:col-span-2`} disabled={busy}>Pasien tiba dan diterima</button>
                        </form>
                      )}
                      {["REQUESTED", "ACCEPTED"].includes(transfer.status) && (
                        <form
                          className="flex flex-col gap-2 rounded-lg border border-red-100 p-3 sm:flex-row"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            patch(`/hah/transfers/${transfer.id}`, {
                              status: "CANCELLED",
                              cancellationReason: f.get("cancellationReason"),
                            });
                          }}
                        >
                          <input
                            name="cancellationReason"
                            required
                            minLength={5}
                            placeholder="Alasan pembatalan dan rencana alternatif"
                            className={input}
                          />
                          <button
                            className="min-h-11 shrink-0 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-700"
                            disabled={busy}
                          >
                            Batalkan transfer
                          </button>
                        </form>
                      )}
                    </article>
                  ))}
                </div>
              ) : null}
              <form
                className="space-y-3 border-t pt-4"
                onSubmit={(e: FormEvent<HTMLFormElement>) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  submit(`/hah/episodes/${id}/discharge-checklist`, {
                    medicationReconciled:
                      f.get("medicationReconciled") === "on",
                    medicationSummary: f.get("dischargeMedicationSummary"),
                    pendingResultsReviewed:
                      f.get("pendingResultsReviewed") === "on",
                    pendingResultsPlan: f.get("pendingResultsPlan"),
                    equipmentReturnPlanned:
                      f.get("equipmentReturnPlanned") === "on",
                    equipmentReturnPlan: f.get("equipmentReturnPlan"),
                    followUpBooked: f.get("followUpBooked") === "on",
                    followUpAt: new Date(
                      String(f.get("dischargeFollowUpAt")),
                    ).toISOString(),
                    followUpProvider: f.get("followUpProvider"),
                    redFlagsReviewed: f.get("redFlagsReviewed") === "on",
                    caregiverTeachBackPassed:
                      f.get("caregiverTeachBackPassed") === "on",
                    documentsDelivered:
                      f.get("documentsDelivered") === "on",
                    contactInstructions: f.get("contactInstructions"),
                  });
                }}
              >
                <h3 className="font-bold">Checklist transisi pulang</h3>
                <label className="flex gap-2"><input name="medicationReconciled" type="checkbox" required /> Rekonsiliasi obat selesai</label>
                <Field label="Ringkasan obat saat pulang"><textarea name="dischargeMedicationSummary" minLength={10} required className={input} /></Field>
                <label className="flex gap-2"><input name="pendingResultsReviewed" type="checkbox" required /> Hasil tertunda telah ditinjau</label>
                <Field label="Rencana hasil tertunda"><textarea name="pendingResultsPlan" required className={input} /></Field>
                <label className="flex gap-2"><input name="equipmentReturnPlanned" type="checkbox" required /> Pengembalian alat direncanakan</label>
                <Field label="Rencana pengembalian alat"><textarea name="equipmentReturnPlan" required className={input} /></Field>
                <label className="flex gap-2"><input name="followUpBooked" type="checkbox" required /> Tindak lanjut telah dijadwalkan</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Waktu tindak lanjut"><input name="dischargeFollowUpAt" type="datetime-local" required className={input} /></Field>
                  <Field label="Pemberi layanan tindak lanjut"><input name="followUpProvider" required className={input} /></Field>
                </div>
                <label className="flex gap-2"><input name="redFlagsReviewed" type="checkbox" required /> Tanda bahaya telah dijelaskan</label>
                <label className="flex gap-2"><input name="caregiverTeachBackPassed" type="checkbox" required /> Teach-back pasien/caregiver berhasil</label>
                <label className="flex gap-2"><input name="documentsDelivered" type="checkbox" required /> Dokumen pulang telah diserahkan</label>
                <Field label="Instruksi kontak dan bantuan"><textarea name="contactInstructions" minLength={10} required className={input} /></Field>
                <button className={btn} disabled={busy}>Selesaikan checklist discharge</button>
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
        {d.status === "DISCHARGED" && (
          <Panel title="Follow-up pasca-discharge">
            <form
              className="space-y-3"
              onSubmit={(e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                submit(`/hah/episodes/${id}/post-discharge-followups`, {
                  scheduledAt: new Date(
                    String(f.get("postDischargeScheduledAt")),
                  ).toISOString(),
                  outcome: f.get("postDischargeOutcome"),
                  respondent: f.get("postDischargeRespondent") || undefined,
                  symptomUpdate: f.get("postDischargeSymptoms") || undefined,
                  medicationAvailable:
                    f.get("medicationAvailable") === "on",
                  medicationQuestions:
                    f.get("medicationQuestions") || undefined,
                  followUpAttended: f.get("followUpAttended") === "on",
                  newCareNeeds: f.get("newCareNeeds") || undefined,
                  clinicalStatus: f.get("postDischargeClinicalStatus"),
                  escalationRequired:
                    f.get("postDischargeEscalation") === "on",
                  escalationPlan:
                    f.get("postDischargeEscalationPlan") || undefined,
                  advice: f.get("postDischargeAdvice") || undefined,
                  nextContactAt: f.get("postDischargeNextContact")
                    ? new Date(
                        String(f.get("postDischargeNextContact")),
                      ).toISOString()
                    : undefined,
                });
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Jadwal kontak"><input name="postDischargeScheduledAt" type="datetime-local" required className={input} /></Field>
                <Field label="Hasil kontak">
                  <select name="postDischargeOutcome" className={input}><option value="REACHED">Terhubung</option><option value="NOT_REACHED">Tidak terhubung</option><option value="RESCHEDULED">Dijadwalkan ulang</option></select>
                </Field>
                <Field label="Responden"><input name="postDischargeRespondent" className={input} /></Field>
                <Field label="Status klinis">
                  <select name="postDischargeClinicalStatus" className={input}><option value="STABLE">Stabil</option><option value="CONCERNING">Perlu perhatian</option><option value="EMERGENCY">Darurat</option></select>
                </Field>
              </div>
              <Field label="Pembaruan gejala"><textarea name="postDischargeSymptoms" className={input} /></Field>
              <label className="flex gap-2"><input name="medicationAvailable" type="checkbox" /> Semua obat tersedia</label>
              <Field label="Pertanyaan/kendala obat"><textarea name="medicationQuestions" className={input} /></Field>
              <label className="flex gap-2"><input name="followUpAttended" type="checkbox" /> Kunjungan lanjutan dihadiri</label>
              <Field label="Kebutuhan perawatan baru"><textarea name="newCareNeeds" className={input} /></Field>
              <label className="flex gap-2 font-semibold text-red-700"><input name="postDischargeEscalation" type="checkbox" /> Memerlukan eskalasi</label>
              <Field label="Rencana eskalasi"><textarea name="postDischargeEscalationPlan" className={input} /></Field>
              <Field label="Saran yang diberikan"><textarea name="postDischargeAdvice" className={input} /></Field>
              <Field label="Kontak berikutnya"><input name="postDischargeNextContact" type="datetime-local" className={input} /></Field>
              <button className={btn} disabled={busy}>Catat follow-up</button>
            </form>
            {d.postDischargeFollowUps?.map((f: any) => (
              <div key={f.id} className={`rounded-xl border p-3 text-sm ${f.clinicalStatus === "STABLE" ? "bg-slate-50" : "border-red-300 bg-red-50"}`}>
                <strong>{f.outcome}</strong> · {f.clinicalStatus}
                <p className="mt-1">{f.symptomUpdate ?? "Belum ada pembaruan gejala"}</p>
                {f.escalationPlan ? <p className="mt-1"><b>Eskalasi:</b> {f.escalationPlan}</p> : null}
              </div>
            ))}
          </Panel>
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

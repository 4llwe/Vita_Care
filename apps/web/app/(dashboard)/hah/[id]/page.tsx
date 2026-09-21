"use client";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../../../lib/api";
import { getToken } from "../../../../lib/auth";
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
                <button className={btn} disabled={busy}>
                  Buat order
                </button>
              </form>
              {d.medicationOrders?.map((m: any) => (
                <div key={m.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <strong>{m.medicationName}</strong> {m.dose} {m.route} ·{" "}
                  {m.frequency} · {m.status}
                  <div className="mt-2 flex gap-2">
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
                      Catat diberikan
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
                      onClick={() => {
                        const result = window.prompt("Masukkan hasil");
                        if (result)
                          patch(`/hah/diagnostics/${o.id}/result`, {
                            resultText: result,
                            criticalResult: window.confirm(
                              "Apakah hasil kritis?",
                            ),
                          });
                      }}
                    >
                      Input hasil
                    </button>
                  )}
                  {o.status === "RESULTED" && (
                    <button
                      className="mt-2 rounded border px-3 py-2"
                      onClick={() =>
                        patch(`/hah/diagnostics/${o.id}/acknowledge`)
                      }
                    >
                      Acknowledge hasil
                    </button>
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
            <Panel title="Transfer / discharge">
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

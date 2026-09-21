"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import { getToken } from "../../../../lib/auth";
import type { HaHPatient } from "../../../../lib/types";

const input =
  "min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
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
export default function IntakePage() {
  const router = useRouter();
  const token = getToken() ?? undefined;
  const [patients, setPatients] = useState<HaHPatient[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() {
    setPatients(await api<HaHPatient[]>("/hah/patients", { token }));
  }
  useEffect(() => {
    void load();
  }, []);
  async function createPatient(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      await api("/hah/patients", {
        method: "POST",
        token,
        body: {
          fullName: f.get("fullName"),
          dateOfBirth: f.get("dateOfBirth"),
          sexAtBirth: f.get("sexAtBirth"),
          phone: f.get("phone") || undefined,
          address: f.get("address"),
          zone: f.get("zone"),
          emergencyContactName: f.get("emergencyContactName") || undefined,
          emergencyContactPhone: f.get("emergencyContactPhone") || undefined,
          allergies: String(f.get("allergies") || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        },
      });
      e.currentTarget.reset();
      await load();
      setMessage("Pasien berhasil dibuat.");
    } catch (x) {
      setMessage(x instanceof Error ? x.message : "Gagal membuat pasien");
    } finally {
      setBusy(false);
    }
  }
  async function createEpisode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const ep = await api<{ id: string }>("/hah/episodes", {
        method: "POST",
        token,
        body: {
          patientId: f.get("patientId"),
          admissionSource: f.get("admissionSource"),
          referringFacility: f.get("referringFacility") || undefined,
          referringClinician: f.get("referringClinician") || undefined,
          attendingPhysicianId: f.get("attendingPhysicianId"),
          primaryDiagnosis: f.get("primaryDiagnosis"),
          comorbidities: String(f.get("comorbidities") || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          acuityLevel: f.get("acuityLevel"),
          zone: f.get("zone"),
          expectedLengthOfStayDays:
            Number(f.get("expectedLengthOfStayDays")) || undefined,
          caregiverName: f.get("caregiverName") || undefined,
          caregiverPhone: f.get("caregiverPhone") || undefined,
        },
      });
      router.push(`/hah/${ep.id}`);
    } catch (x) {
      setMessage(x instanceof Error ? x.message : "Gagal membuat episode");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-blue-600">Clinical intake</p>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Registrasi pasien & episode HaH
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Identitas pasien dibuat sekali; setiap perawatan akut dibuat sebagai
          episode baru.
        </p>
      </header>
      {message && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          {message}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <form
          onSubmit={createPatient}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-bold">1. Pasien baru</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama lengkap">
              <input name="fullName" required className={input} />
            </Field>
            <Field label="Tanggal lahir">
              <input
                name="dateOfBirth"
                type="date"
                required
                className={input}
              />
            </Field>
            <Field label="Jenis kelamin saat lahir">
              <select name="sexAtBirth" className={input}>
                <option value="MALE">Laki-laki</option>
                <option value="FEMALE">Perempuan</option>
                <option value="INTERSEX">Interseks</option>
                <option value="UNKNOWN">Tidak diketahui</option>
              </select>
            </Field>
            <Field label="Telepon">
              <input name="phone" className={input} />
            </Field>
          </div>
          <Field label="Alamat rumah">
            <textarea name="address" required className={input} />
          </Field>
          <Field label="Zona layanan">
            <input
              name="zone"
              required
              className={input}
              placeholder="Mataram"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Kontak darurat">
              <input name="emergencyContactName" className={input} />
            </Field>
            <Field label="Telepon darurat">
              <input name="emergencyContactPhone" className={input} />
            </Field>
          </div>
          <Field label="Alergi (pisahkan koma)">
            <input name="allergies" className={input} />
          </Field>
          <button
            disabled={busy}
            className="min-h-11 rounded-lg bg-blue-600 px-4 font-semibold text-white disabled:opacity-50"
          >
            Simpan pasien
          </button>
        </form>
        <form
          onSubmit={createEpisode}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-bold">2. Episode akut</h2>
          <Field label="Pasien">
            <select name="patientId" required className={input}>
              <option value="">Pilih pasien</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.mrn} — {p.fullName}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sumber admission">
              <select name="admissionSource" className={input}>
                <option>IGD</option>
                <option>RAWAT_INAP</option>
                <option>KLINIK</option>
              </select>
            </Field>
            <Field label="Zona">
              <input name="zone" required className={input} />
            </Field>
            <Field label="Fasilitas perujuk">
              <input name="referringFacility" className={input} />
            </Field>
            <Field label="Klinisi perujuk">
              <input name="referringClinician" className={input} />
            </Field>
          </div>
          <Field label="ID dokter penanggung jawab (User)">
            <input name="attendingPhysicianId" required className={input} />
          </Field>
          <Field label="Diagnosis utama">
            <input name="primaryDiagnosis" required className={input} />
          </Field>
          <Field label="Komorbiditas (pisahkan koma)">
            <input name="comorbidities" className={input} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Acuity">
              <select name="acuityLevel" className={input}>
                <option>ACUTE_STABLE</option>
                <option>MODERATE</option>
              </select>
            </Field>
            <Field label="Perkiraan LOS (hari)">
              <input
                name="expectedLengthOfStayDays"
                type="number"
                min="1"
                max="30"
                className={input}
              />
            </Field>
            <Field label="Caregiver">
              <input name="caregiverName" className={input} />
            </Field>
            <Field label="Telepon caregiver">
              <input name="caregiverPhone" className={input} />
            </Field>
          </div>
          <button
            disabled={busy || patients.length === 0}
            className="min-h-11 rounded-lg bg-blue-600 px-4 font-semibold text-white disabled:opacity-50"
          >
            Buat episode & mulai screening
          </button>
        </form>
      </div>
    </div>
  );
}

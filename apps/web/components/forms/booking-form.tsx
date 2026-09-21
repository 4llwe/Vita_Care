"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getToken } from "../../lib/auth";
import { rupiah } from "../../lib/format";
import { Modal, PrimaryButton } from "../modal";
import { Field, TextInput, Select, FormError } from "../form-controls";

type Service = {
  id: string;
  code: string;
  name: string;
  tariffs?: { basePrice: number }[];
};
type Zone = { name: string };

export function BookingForm({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [patientName, setPatientName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [zone, setZone] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const token = getToken();
    api<Service[]>("/services", { token })
      .then(setServices)
      .catch(() => setServices([]));
    api<Zone[]>("/zones", { token })
      .then(setZones)
      .catch(() => setZones([]));
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/bookings", {
        token: getToken(),
        method: "POST",
        body: {
          patientName,
          serviceId,
          zone,
          scheduledAt: new Date(scheduledAt).toISOString(),
        },
      });
      onSaved();
      onClose();
      setPatientName("");
      setServiceId("");
      setZone("");
      setScheduledAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title="Booking Baru" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={error} />
        <Field label="Nama Pasien">
          <TextInput
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="Layanan">
          <Select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            required
          >
            <option value="" disabled>
              — pilih layanan —
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.tariffs?.[0] ? ` · ${rupiah(s.tariffs[0].basePrice)}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Zona">
          <Select
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            required
          >
            <option value="" disabled>
              — pilih zona —
            </option>
            {zones.map((z) => (
              <option key={z.name} value={z.name}>
                {z.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Jadwal Kunjungan">
          <TextInput
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? "Menyimpan…" : "Simpan"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

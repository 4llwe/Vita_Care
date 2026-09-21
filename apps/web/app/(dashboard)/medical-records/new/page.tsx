import { SoapForm } from "../../../../components/soap-form";

export default function NewMedicalRecordPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-extrabold text-slate-800">
          Rekam Medis Baru (SOAP)
        </h1>
        <p className="text-sm text-slate-500">
          Skor EWS dihitung otomatis dari tanda vital saat disimpan.
        </p>
      </div>
      <SoapForm />
    </div>
  );
}

"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import { fetchMe, type Session } from "../../../lib/session";
import { rupiah, tanggal } from "../../../lib/format";
import type { Invoice } from "../../../lib/types";
import { StatusBadge } from "../../../components/status-badge";
import { Loading, ErrorBox, Empty } from "../../../components/async-state";

const payerLabel: Record<string, string> = {
  SELF_PAY: "Mandiri",
  PRIVATE_INSURANCE: "Asuransi",
  BPJS_JKN: "BPJS / JKN",
  CORPORATE: "Perusahaan",
};

export default function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const me = await fetchMe();
    setSession(me);
    setRows(await api<Invoice[]>(me.role === "PATIENT" ? "/invoices/me" : "/invoices", { token: getToken() }));
  }
  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : "Gagal memuat tagihan")); }, []);

  async function pay(id: string) {
    try {
      const result = await api<{ redirectUrl: string }>(`/invoices/${id}/pay`, { method: "POST", token: getToken() });
      if (result.redirectUrl) window.open(result.redirectUrl, "_blank");
    } catch (e) { setError((e as Error).message); }
  }

  async function updateCoverage(event: FormEvent<HTMLFormElement>, invoice: Invoice) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/invoices/${invoice.id}/coverage`, {
        method: "PATCH",
        token: getToken(),
        body: {
          payerType: form.get("payerType"),
          insurerName: form.get("insurerName") || undefined,
          memberNumber: form.get("memberNumber") || undefined,
          claimNumber: form.get("claimNumber") || undefined,
          claimStatus: form.get("claimStatus"),
          coveredAmount: Number(form.get("coveredAmount") || 0),
        },
      });
      setMessage(`Pertanggungan ${invoice.code} diperbarui dan tercatat di audit trail.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memperbarui klaim"); }
  }

  if (error && !rows) return <ErrorBox message={error} />;
  if (!rows) return <Loading />;
  const canManageCoverage = ["FINANCE", "COORDINATOR", "SUPER_ADMIN"].some((role) => session?.roles?.includes(role as any) || session?.role === role);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow">Pembayaran</p><h1 className="mt-2 text-2xl font-extrabold text-slate-900">Tagihan, Asuransi & BPJS/JKN</h1></div>
        {session?.role !== "PATIENT" ? <a href="/api/reports/invoices.csv" className="text-sm font-semibold text-vita-blue hover:underline">Unduh CSV</a> : null}
      </div>
      <p className="text-sm text-slate-600">Nilai pertanggungan dan tanggung jawab pasien ditampilkan terpisah. Persetujuan klaim tetap mengikuti keputusan penjamin.</p>
      {error ? <ErrorBox message={error} /> : null}
      {message ? <p role="status" className="rounded-xl bg-teal-50 p-4 text-sm font-semibold text-teal-900">{message}</p> : null}
      {rows.length === 0 ? <Empty label="Belum ada tagihan." /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
              <th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Pasien</th><th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Penjamin</th><th className="px-4 py-3">Ditanggung</th><th className="px-4 py-3">Tanggung jawab pasien</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3">Tindakan</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">{rows.map((invoice) => {
              const outstanding = Math.max(0, invoice.total - (invoice.coveredAmount ?? 0));
              return <tr key={invoice.id} className="align-top hover:bg-emerald-50/40">
                <td className="px-4 py-3"><b className="font-mono text-xs text-vita-greenDark">{invoice.code}</b><span className="mt-1 block text-xs text-slate-500">{tanggal(invoice.issuedAt)}</span></td>
                <td className="px-4 py-3 font-semibold text-slate-700">{invoice.patientName}</td>
                <td className="px-4 py-3 font-bold">{rupiah(invoice.total)}</td>
                <td className="px-4 py-3"><b>{payerLabel[invoice.payerType] ?? invoice.payerType}</b><span className="block text-xs text-slate-500">{invoice.insurerName ?? invoice.claimNumber ?? "—"}</span></td>
                <td className="px-4 py-3">{rupiah(invoice.coveredAmount ?? 0)}<span className="block text-xs text-slate-500">{invoice.claimStatus}</span></td>
                <td className="px-4 py-3 font-bold">{rupiah(outstanding)}</td>
                <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                <td className="px-4 py-3">
                  {invoice.status !== "PAID" && outstanding > 0 ? <button onClick={() => pay(invoice.id)} className="rounded-lg bg-vita-green px-3 py-2 text-xs font-bold text-white">Bayar</button> : <span className="text-xs font-semibold text-emerald-700">Selesai</span>}
                  {canManageCoverage ? <details className="mt-2"><summary className="cursor-pointer text-xs font-bold text-teal-700">Kelola klaim</summary>
                    <form onSubmit={(event) => updateCoverage(event, invoice)} className="mt-2 grid w-72 gap-2 rounded-xl border bg-white p-3 shadow-lg">
                      <select name="payerType" defaultValue={invoice.payerType} className="min-h-10 rounded-lg border px-2"><option value="SELF_PAY">Mandiri</option><option value="PRIVATE_INSURANCE">Asuransi</option><option value="BPJS_JKN">BPJS/JKN</option><option value="CORPORATE">Perusahaan</option></select>
                      <input name="insurerName" defaultValue={invoice.insurerName ?? ""} placeholder="Nama penjamin" className="min-h-10 rounded-lg border px-2" />
                      <input name="memberNumber" defaultValue={invoice.memberNumber ?? ""} placeholder="Nomor peserta" className="min-h-10 rounded-lg border px-2" />
                      <input name="claimNumber" defaultValue={invoice.claimNumber ?? ""} placeholder="Nomor klaim/SEP" className="min-h-10 rounded-lg border px-2" />
                      <select name="claimStatus" defaultValue={invoice.claimStatus} className="min-h-10 rounded-lg border px-2">{["NOT_APPLICABLE","DRAFT","SUBMITTED","UNDER_REVIEW","APPROVED","PARTIALLY_APPROVED","REJECTED","PAID"].map((status) => <option key={status}>{status}</option>)}</select>
                      <input name="coveredAmount" type="number" min="0" max={invoice.total} defaultValue={invoice.coveredAmount ?? 0} className="min-h-10 rounded-lg border px-2" />
                      <button className="min-h-10 rounded-lg bg-teal-700 px-3 font-bold text-white">Simpan klaim</button>
                    </form>
                  </details> : null}
                </td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

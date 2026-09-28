"use client";
import { useEffect, useState } from "react";
import { DownloadButton } from "../../../components/download-button";
import { fetchMe, type Session } from "../../../lib/session";

export default function ReportsPage() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => { fetchMe().then(setSession).catch(() => undefined); }, []);
  const effective = new Set([session?.role, ...(session?.roles ?? [])]);
  const management = ["DIRECTOR", "SUPER_ADMIN", "SUPERVISORY_BOARD"].some((role) => effective.has(role as any));
  const risk = ["AUDITOR", "DIRECTOR", "SUPER_ADMIN"].some((role) => effective.has(role as any));
  const finance = ["FINANCE", "DIRECTOR", "SUPER_ADMIN", "COORDINATOR"].some((role) => effective.has(role as any));
  return <div className="space-y-6"><header><p className="eyebrow">Pelaporan terkontrol</p><h1 className="mt-2 text-3xl font-black">Pusat Laporan</h1><p className="mt-2 text-sm text-slate-600">Hanya laporan yang sesuai kewenangan Anda yang ditampilkan. Setiap unduhan menggunakan data server terkini.</p></header><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
    {management ? <ReportCard title="Laporan Manajemen" copy="Ringkasan operasional, pendapatan, mutu, CAPA, dan risiko."><DownloadButton path="/reports/management.pdf" filename="laporan-manajemen.pdf" label="Unduh PDF" /></ReportCard> : null}
    {risk ? <ReportCard title="Register Risiko" copy="Daftar risiko untuk audit, direktur, dan Super Admin."><DownloadButton path="/reports/risks.xlsx" filename="register-risiko.xlsx" label="Unduh Excel" /></ReportCard> : null}
    {finance ? <ReportCard title="Tagihan & Pembayaran" copy="Ekspor tagihan untuk rekonsiliasi keuangan."><DownloadButton path="/reports/invoices.csv" filename="tagihan.csv" label="Unduh CSV" /></ReportCard> : null}
    {!management && !risk && !finance ? <ReportCard title="Laporan episode" copy="Ringkasan pasien tersedia pada workspace episode sesuai penugasan dan consent."><a href="/hah" className="inline-flex rounded-xl bg-teal-700 px-4 py-3 font-bold text-white">Buka episode</a></ReportCard> : null}
  </section></div>;
}
function ReportCard({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) { return <article className="medical-card"><h2 className="text-lg font-black">{title}</h2><p className="my-4 text-sm leading-6 text-slate-600">{copy}</p>{children}</article>; }

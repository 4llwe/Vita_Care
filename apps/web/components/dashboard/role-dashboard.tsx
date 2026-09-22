"use client";

import Link from "next/link";
import { rupiah } from "../../lib/format";
import type { DashboardSummary } from "../../lib/types";
import type { Role } from "../../lib/session";
import { KpiCard } from "../kpi-card";
import { DownloadButton } from "../download-button";
import { PatientClinicalSummary } from "./patient-clinical-summary";

function QuickLinks({
  links,
}: {
  links: Array<{ href: string; label: string; icon: string }>;
}) {
  if (links.length === 0) return null;
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 font-semibold text-slate-700 transition hover:border-vita-green hover:bg-emerald-50/50"
        >
          <span className="text-xl">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </section>
  );
}

function FindingsByCategory({ data }: { data: DashboardSummary }) {
  const entries = Object.entries(data.findings.perKategori);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-bold text-slate-700">Temuan per Kategori</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">Belum ada temuan.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{k.replace(/_/g, " ")}</span>
              <span className="font-bold text-slate-800">{v}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CapaStatus({ data }: { data: DashboardSummary }) {
  const cells = [
    { label: "Open", value: data.capa.open, danger: false },
    { label: "In Progress", value: data.capa.inProgress, danger: false },
    { label: "Verified", value: data.capa.verified, danger: false },
    {
      label: "Overdue",
      value: data.capa.overdue,
      danger: data.capa.overdue > 0,
    },
  ];
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 font-bold text-slate-700">Status CAPA</h2>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl bg-slate-50 p-3">
            <div className="text-xs text-slate-500">{c.label}</div>
            <div
              className={`text-2xl font-extrabold ${c.danger ? "text-red-600" : "text-slate-800"}`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Render dashboard sesuai peran pengguna. */
export function RoleDashboard({
  role,
  data,
}: {
  role: Role;
  data: DashboardSummary;
}) {
  // DIREKTUR & SUPER ADMIN — pandangan menyeluruh
  if (role === "DIRECTOR" || role === "SUPER_ADMIN") {
    return (
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Booking Aktif"
            value={data.bookings.aktif}
            hint={`${data.bookings.total} total`}
            tone="blue"
          />
          <KpiCard
            label="Booking Selesai"
            value={data.bookings.selesai}
            tone="green"
          />
          <KpiCard
            label="Pendapatan Lunas"
            value={rupiah(data.revenue.lunas)}
            tone="green"
          />
          <KpiCard
            label="Tertunda"
            value={rupiah(data.revenue.tertunda)}
            tone="amber"
          />
          <KpiCard
            label="Total Temuan"
            value={data.findings.total}
            tone="amber"
          />
          <KpiCard
            label="CAPA Terlambat"
            value={data.capa.overdue}
            tone={data.capa.overdue > 0 ? "red" : "green"}
          />
          <KpiCard
            label="Risiko Tinggi"
            value={data.risks.tinggi}
            hint={`${data.risks.total} total`}
            tone={data.risks.tinggi > 0 ? "red" : "green"}
          />
          <KpiCard
            label="CAPA Terverifikasi"
            value={data.capa.verified}
            tone="green"
          />
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <FindingsByCategory data={data} />
          <CapaStatus data={data} />
        </div>
      </div>
    );
  }

  // DEWAN PENGAWAS — tata kelola mutu, tanpa data keuangan/operasional rinci
  if (
    role === "SUPERVISORY_BOARD" ||
    role === "AUDITOR" ||
    role === "UNIT_HEAD"
  ) {
    return (
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Total Temuan"
            value={data.findings.total}
            tone="amber"
          />
          <KpiCard
            label="CAPA Terlambat"
            value={data.capa.overdue}
            tone={data.capa.overdue > 0 ? "red" : "green"}
          />
          <KpiCard
            label="Risiko Tinggi"
            value={data.risks.tinggi}
            hint={`${data.risks.total} total`}
            tone={data.risks.tinggi > 0 ? "red" : "green"}
          />
          <KpiCard
            label="CAPA Terverifikasi"
            value={data.capa.verified}
            tone="green"
          />
        </section>
        <div className="grid gap-6 lg:grid-cols-2">
          <FindingsByCategory data={data} />
          <CapaStatus data={data} />
        </div>
        <QuickLinks
          links={[
            { href: "/findings", label: "Temuan", icon: "🔍" },
            { href: "/risks", label: "Peta Risiko", icon: "⚠️" },
            { href: "/capa", label: "Papan CAPA", icon: "✅" },
            { href: "/documents", label: "Dokumen", icon: "📄" },
          ]}
        />
      </div>
    );
  }

  // KOORDINATOR — fokus operasional kunjungan
  if (role === "COORDINATOR") {
    return (
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Booking Aktif"
            value={data.bookings.aktif}
            hint={`${data.bookings.total} total`}
            tone="blue"
          />
          <KpiCard
            label="Booking Selesai"
            value={data.bookings.selesai}
            tone="green"
          />
          <KpiCard
            label="Tagihan Tertunda"
            value={rupiah(data.revenue.tertunda)}
            tone="amber"
          />
          <KpiCard
            label="Pendapatan Lunas"
            value={rupiah(data.revenue.lunas)}
            tone="green"
          />
        </section>
        <QuickLinks
          links={[
            { href: "/bookings", label: "Kelola Pemesanan", icon: "🗓️" },
            { href: "/master", label: "Master Data", icon: "🗄️" },
            { href: "/referrals", label: "Rujukan", icon: "🏥" },
            { href: "/invoices", label: "Billing", icon: "💳" },
            { href: "/documents", label: "Dokumen", icon: "📄" },
          ]}
        />
      </div>
    );
  }

  // TENAGA KESEHATAN — tugas kunjungan & dokumentasi klinis
  if (role === "HEALTH_WORKER") {
    return (
      <div className="space-y-6">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <KpiCard
            label="Kunjungan Aktif"
            value={data.bookings.aktif}
            tone="blue"
          />
          <KpiCard
            label="Kunjungan Selesai"
            value={data.bookings.selesai}
            tone="green"
          />
          <KpiCard
            label="Total Kunjungan"
            value={data.bookings.total}
            tone="green"
          />
        </section>
        <QuickLinks
          links={[
            { href: "/bookings", label: "Jadwal Kunjungan", icon: "🗓️" },
            {
              href: "/medical-records/new",
              label: "Isi Rekam Medis",
              icon: "🩺",
            },
            { href: "/referrals", label: "Buat Rujukan", icon: "🏥" },
          ]}
        />
      </div>
    );
  }

  // PASIEN / KELUARGA — status klinis dan akses perawatan
  return (
    <div className="space-y-6">
      <PatientClinicalSummary />
      <QuickLinks
        links={[
          { href: "/portal", label: "Portal Pasien", icon: "P" },
          { href: "/bookings", label: "Jadwal Saya", icon: "J" },
          { href: "/invoices", label: "Tagihan Saya", icon: "T" },
          {
            href: "/workspace/keluarga",
            label: "Keluarga & Caregiver",
            icon: "K",
          },
        ]}
      />
    </div>
  );
}

/** Tombol export khusus peran yang berwenang. */
export function DashboardExports({ role }: { role: Role }) {
  const canManagement =
    role === "DIRECTOR" ||
    role === "SUPER_ADMIN" ||
    role === "SUPERVISORY_BOARD";
  const canRisks =
    role === "AUDITOR" || role === "DIRECTOR" || role === "SUPER_ADMIN";
  if (!canManagement && !canRisks) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManagement ? (
        <DownloadButton
          path="/reports/management.pdf"
          filename="laporan-manajemen.pdf"
          label="⬇ Laporan Manajemen (PDF)"
          variant="solid"
        />
      ) : null}
      {canRisks ? (
        <DownloadButton
          path="/reports/risks.xlsx"
          filename="register-risiko.xlsx"
          label="⬇ Register Risiko (Excel)"
        />
      ) : null}
    </div>
  );
}

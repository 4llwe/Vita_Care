"use client";

import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { getToken } from "../../../lib/auth";
import type { DashboardSummary } from "../../../lib/types";
import {
  fetchMe,
  getRole,
  ROLE_LABEL,
  type Role,
  type Session,
} from "../../../lib/session";
import { Loading, ErrorBox } from "../../../components/async-state";
import {
  RoleDashboard,
  DashboardExports,
} from "../../../components/dashboard/role-dashboard";

const TITLE: Partial<Record<Role, string>> = {
  DIRECTOR: "Dashboard Direktur",
  SUPER_ADMIN: "Dashboard Manajemen",
  SUPERVISORY_BOARD: "Dashboard Dewan Pengawas",
  AUDITOR: "Dashboard Auditor",
  UNIT_HEAD: "Dashboard Kepala Unit",
  COORDINATOR: "Dashboard Koordinator",
  HEALTH_WORKER: "Dashboard Tenaga Kesehatan",
  PATIENT: "Dashboard Pasien",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [me, setMe] = useState<Session | null>(null);
  // Peran cepat dari JWT agar tampilan tidak menunggu /auth/me.
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRole());
    api<DashboardSummary>("/analytics/dashboard", { token: getToken() })
      .then(setData)
      .catch((e) => setError(e.message));
    fetchMe()
      .then(setMe)
      .catch(() => undefined);
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!data || !role) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">
            {TITLE[role] ?? "Dashboard"}
          </h1>
          <p className="text-sm text-slate-500">
            {me ? `Halo, ${me.name} · ` : ""}
            <span className="font-semibold text-vita-green">
              {ROLE_LABEL[role] ?? role}
            </span>
          </p>
        </div>
        <DashboardExports role={role} />
      </div>

      <RoleDashboard role={role} data={data} />
    </div>
  );
}

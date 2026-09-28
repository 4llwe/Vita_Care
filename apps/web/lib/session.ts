"use client";

import { api } from "./api";
import { getToken } from "./auth";

export type Role =
  | "SUPER_ADMIN"
  | "COORDINATOR"
  | "HEALTH_WORKER"
  | "DOCTOR"
  | "NURSE"
  | "FINANCE"
  | "AUDITOR"
  | "UNIT_HEAD"
  | "DIRECTOR"
  | "SUPERVISORY_BOARD"
  | "PATIENT"
  | "CAREGIVER";

export type Session = {
  id: string;
  name: string;
  email: string;
  role: Role;
  roles?: Role[];
  healthWorkerProfile?: { id: string; profession: string; name: string } | null;
};

export type AuthSession = {
  id: string;
  deviceName?: string | null;
  userAgent?: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
};

export type ClinicalPersona =
  | "admin"
  | "doctor"
  | "nurse"
  | "finance"
  | "patient"
  | "caregiver"
  | "governance";

export function personaFor(session: Session | null): ClinicalPersona {
  if (!session) return "patient";
  const roles = new Set([session.role, ...(session.roles ?? [])]);
  if (roles.has("SUPER_ADMIN") || roles.has("COORDINATOR")) return "admin";
  if (session.role === "CAREGIVER") return "caregiver";
  if (session.role === "PATIENT") return "patient";
  if (roles.has("NURSE")) return "nurse";
  if (roles.has("DOCTOR")) return "doctor";
  if (roles.has("FINANCE")) return "finance";
  if (session.role === "HEALTH_WORKER") {
    const profession = (session.healthWorkerProfile?.profession ?? "").toLowerCase();
    return profession.includes("perawat") || profession.includes("bidan")
      ? "nurse"
      : "doctor";
  }
  if (roles.has("CAREGIVER")) return "caregiver";
  if (roles.has("PATIENT")) return "patient";
  return "governance";
}

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COORDINATOR: "Koordinator",
  HEALTH_WORKER: "Tenaga Kesehatan",
  DOCTOR: "Dokter",
  NURSE: "Perawat",
  FINANCE: "Keuangan",
  AUDITOR: "Auditor",
  UNIT_HEAD: "Kepala Unit",
  DIRECTOR: "Direktur",
  SUPERVISORY_BOARD: "Dewan Pengawas",
  PATIENT: "Pasien",
  CAREGIVER: "Keluarga / Caregiver",
};

/** Dekode payload JWT (base64url) tanpa verifikasi — hanya untuk membaca peran di klien. */
export function getRole(): Role | null {
  const token = getToken();
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { role?: Role };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

/** Ambil identitas pengguna terkini dari server (otoritatif). */
export async function fetchMe(): Promise<Session> {
  return api<Session>("/auth/me", { token: getToken() });
}

export function fetchSessions(): Promise<AuthSession[]> {
  return api<AuthSession[]>("/auth/sessions", { token: getToken() });
}

export function revokeSession(id: string): Promise<void> {
  return api<void>(`/auth/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token: getToken(),
  });
}

"use client";

import { api } from "./api";
import { getToken } from "./auth";

export type Role =
  | "SUPER_ADMIN"
  | "COORDINATOR"
  | "HEALTH_WORKER"
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

export type ClinicalPersona = "admin" | "doctor" | "nurse" | "patient" | "governance";

export function personaFor(session: Session | null): ClinicalPersona {
  if (!session) return "patient";
  if (session.role === "SUPER_ADMIN" || session.role === "COORDINATOR") return "admin";
  if (session.role === "PATIENT" || session.role === "CAREGIVER") return "patient";
  if (session.role !== "HEALTH_WORKER") return "governance";
  const p = (session.healthWorkerProfile?.profession ?? "").toLowerCase();
  return p.includes("perawat") || p.includes("bidan") ? "nurse" : "doctor";
}

export const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  COORDINATOR: "Koordinator",
  HEALTH_WORKER: "Tenaga Kesehatan",
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

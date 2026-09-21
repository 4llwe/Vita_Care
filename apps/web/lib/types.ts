export type DashboardSummary = {
  bookings: { total: number; aktif: number; selesai: number };
  revenue: { lunas: number; tertunda: number };
  findings: { total: number; perKategori: Record<string, number> };
  capa: { open: number; inProgress: number; verified: number; overdue: number };
  risks: { total: number; tinggi: number };
};

export type MasterAnalytics = {
  summary: {
    totalServices: number;
    activeServices: number;
    totalWorkers: number;
    activeWorkers: number;
    categories: number;
    avgDurationMin: number;
  };
  topServices: Array<{
    id: string;
    code: string;
    name: string;
    category: string;
    bookings: number;
  }>;
  workerUtilization: Array<{
    id: string;
    name: string;
    profession: string;
    zone: string;
    isActive: boolean;
    total: number;
    completed: number;
    active: number;
  }>;
  tariffByCategory: Array<{
    category: string;
    services: number;
    tariffs: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
  }>;
};

export type Tariff = {
  id: string;
  serviceId: string;
  name: string;
  basePrice: number;
  unit: string;
};

export type Service = {
  id: string;
  code: string;
  name: string;
  category: string;
  durationMin: number;
  isActive: boolean;
  tariffs?: Tariff[];
  _count?: { bookings: number };
};

export type HealthWorker = {
  id: string;
  name: string;
  profession: string;
  licenseNo: string;
  licenseValidUntil: string;
  zone: string;
  isActive: boolean;
  _count?: { bookings: number };
};

export type BookingStatus =
  | "DIPESAN"
  | "DIKONFIRMASI"
  | "DITUGASKAN"
  | "DALAM_PERJALANAN"
  | "BERLANGSUNG"
  | "SELESAI"
  | "DIEVALUASI"
  | "DIBATALKAN";

export type Booking = {
  id: string;
  code: string;
  patientName: string;
  zone: string;
  status: string;
  scheduledAt: string;
  service?: { name: string } | null;
  healthWorker?: { name: string } | null;
};

export type MyBooking = {
  id: string;
  code: string;
  patientName: string;
  zone: string;
  status: BookingStatus;
  scheduledAt: string;
  addressLat?: number | null;
  addressLng?: number | null;
  workerLat?: number | null;
  workerLng?: number | null;
  workerLocAt?: string | null;
  service?: { name: string } | null;
  healthWorker?: { name: string; profession: string; zone: string } | null;
  invoice?: { code: string; status: string; total: number } | null;
};

export type Invoice = {
  id: string;
  code: string;
  patientName: string;
  total: number;
  status: string;
  issuedAt: string;
  paidAt?: string | null;
};

export type Capa = {
  id: string;
  actionPlan: string;
  progress: number;
  status: string;
  targetDate: string;
  finding?: { code: string } | null;
  pic?: { name: string } | null;
  evidenceUrl?: string | null;
};

export type HeatmapCell = {
  probability: number;
  impact: number;
  count: number;
  level: string;
};

// ----- Audit (Checklist & Evidence) -----
export type ComplianceResult =
  "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT" | "NOT_APPLICABLE";
export type AuditExecStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETED";

export type ChecklistItem = {
  id: string;
  order: number;
  question: string;
  guidance?: string | null;
  weight: number;
};

export type AuditChecklist = {
  id: string;
  code: string;
  title: string;
  category: string;
  description?: string | null;
  isActive: boolean;
  items?: ChecklistItem[];
  _count?: { items: number; executions: number };
};

export type Evidence = {
  id: string;
  fileUrl: string;
  caption?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  capturedAt?: string | null;
  answerId?: string | null;
  createdAt: string;
};

export type AuditAnswer = {
  id: string;
  itemId: string;
  result: ComplianceResult;
  note?: string | null;
  item: ChecklistItem;
  evidences?: Evidence[];
  finding?: {
    id: string;
    code: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  } | null;
};

export type AuditExecution = {
  id: string;
  code: string;
  auditeeUnit: string;
  zone?: string | null;
  status: AuditExecStatus;
  scorePct: number;
  note?: string | null;
  startedAt: string;
  completedAt?: string | null;
  checklist?: { code: string; title: string; category: string } | null;
  auditor?: { name: string } | null;
  answers?: AuditAnswer[];
  evidences?: Evidence[];
  _count?: { evidences: number; answers: number };
};

// ----- Hospital at Home -----
export type HaHEpisode = {
  id: string;
  code: string;
  status: string;
  primaryDiagnosis: string;
  acuityLevel: string;
  admissionAt?: string | null;
  expectedLengthOfStayDays?: number | null;
  patient: { id: string; mrn: string; fullName: string; zone: string };
  eligibility?: { decision: string } | null;
  carePlan?: { nextReviewAt: string } | null;
  _count?: { alerts: number; observations: number; visits: number };
};

export type HaHAlert = {
  id: string;
  severity: "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  trigger: string;
  responseDueAt: string;
  episode: { code: string; patient: { fullName: string } };
};

export type HaHPatient = {
  id: string;
  mrn: string;
  fullName: string;
  dateOfBirth: string;
  sexAtBirth: string;
  phone?: string | null;
  address: string;
  zone: string;
  allergies?: string[];
};

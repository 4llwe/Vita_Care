const STYLES: Record<string, string> = {
  // booking
  DIPESAN: "bg-slate-100 text-slate-700",
  DIKONFIRMASI: "bg-blue-100 text-blue-800",
  DITUGASKAN: "bg-indigo-100 text-indigo-800",
  DALAM_PERJALANAN: "bg-amber-100 text-amber-800",
  BERLANGSUNG: "bg-purple-100 text-purple-800",
  SELESAI: "bg-emerald-100 text-emerald-800",
  DIEVALUASI: "bg-teal-100 text-teal-800",
  DIBATALKAN: "bg-red-100 text-red-700",
  // invoice
  UNPAID: "bg-slate-100 text-slate-700",
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  FAILED: "bg-red-100 text-red-700",
  // capa
  OPEN: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  OVERDUE: "bg-red-100 text-red-700",
  // audit execution
  DRAFT: "bg-slate-100 text-slate-700",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  // compliance result
  COMPLIANT: "bg-emerald-100 text-emerald-800",
  PARTIAL: "bg-amber-100 text-amber-800",
  NON_COMPLIANT: "bg-red-100 text-red-700",
  NOT_APPLICABLE: "bg-slate-100 text-slate-500",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STYLES[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

"use client";

type Finding = {
  id: string;
  code: string;
  description: string;
  category: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  pic?: { name: string } | null;
  deadline?: string | null;
};

const RISK_STYLE: Record<Finding["riskLevel"], string> = {
  LOW: "bg-emerald-100 text-emerald-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-amber-100 text-amber-800",
  CRITICAL: "bg-red-100 text-red-700",
};

export function FindingTable({ findings }: { findings: Finding[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-4 py-3">No</th>
            <th className="px-4 py-3">Deskripsi</th>
            <th className="px-4 py-3">Kategori</th>
            <th className="px-4 py-3">Risiko</th>
            <th className="px-4 py-3">PIC</th>
            <th className="px-4 py-3">Deadline</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-bold">{f.code}</td>
              <td className="px-4 py-3">{f.description}</td>
              <td className="px-4 py-3">{f.category}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${RISK_STYLE[f.riskLevel]}`}
                >
                  {f.riskLevel}
                </span>
              </td>
              <td className="px-4 py-3">{f.pic?.name ?? "—"}</td>
              <td className="px-4 py-3">
                {f.deadline
                  ? new Date(f.deadline).toLocaleDateString("id-ID")
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

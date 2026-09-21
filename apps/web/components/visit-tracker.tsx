"use client";

import type { BookingStatus } from "../lib/types";

const STEPS: Array<{ key: BookingStatus; label: string; icon: string }> = [
  { key: "DIPESAN", label: "Dipesan", icon: "📝" },
  { key: "DIKONFIRMASI", label: "Dikonfirmasi", icon: "✅" },
  { key: "DITUGASKAN", label: "Nakes Ditugaskan", icon: "👩‍⚕️" },
  { key: "DALAM_PERJALANAN", label: "Dalam Perjalanan", icon: "🚗" },
  { key: "BERLANGSUNG", label: "Kunjungan Berlangsung", icon: "🩺" },
  { key: "SELESAI", label: "Selesai", icon: "🏁" },
];

/** Timeline pelacakan status kunjungan untuk pasien. */
export function VisitTracker({ status }: { status: BookingStatus }) {
  if (status === "DIBATALKAN") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
        Pemesanan ini telah dibatalkan.
      </div>
    );
  }
  const order = STEPS.map((s) => s.key);
  // DIEVALUASI dianggap setara/selepas SELESAI untuk progres pasien.
  const effective = status === "DIEVALUASI" ? "SELESAI" : status;
  const currentIdx = order.indexOf(effective as BookingStatus);

  return (
    <ol className="space-y-3">
      {STEPS.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-vita-green text-white ring-4 ring-emerald-100"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? "✓" : s.icon}
            </span>
            <div>
              <p
                className={`text-sm font-semibold ${active ? "text-vita-greenDark" : done ? "text-slate-700" : "text-slate-400"}`}
              >
                {s.label}
              </p>
              {active ? (
                <p className="text-xs text-vita-green">Status saat ini</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

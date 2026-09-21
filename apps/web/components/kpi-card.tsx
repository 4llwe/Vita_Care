export function KpiCard({
  label,
  value,
  hint,
  tone = "green",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "green" | "blue" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    green: "from-vita-green to-vita-greenDark",
    blue: "from-vita-blue to-vita-blueDark",
    amber: "from-amber-500 to-amber-700",
    red: "from-red-500 to-red-700",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`mb-2 inline-block rounded-lg bg-gradient-to-br ${tones[tone]} px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white`}
      >
        {label}
      </div>
      <div className="text-2xl font-extrabold text-slate-800">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

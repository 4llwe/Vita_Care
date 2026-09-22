import type { HeatmapCell } from "../lib/types";

const LEVEL_BG: Record<string, string> = {
  LOW: "bg-emerald-200",
  MEDIUM: "bg-yellow-200",
  HIGH: "bg-orange-300",
  CRITICAL: "bg-red-400",
};

/** Heatmap 5x5: sumbu X = Impact (1..5), sumbu Y = Probability (5..1). */
export function RiskHeatmap({ cells }: { cells: HeatmapCell[] }) {
  const probs = [5, 4, 3, 2, 1];
  const impacts = [1, 2, 3, 4, 5];
  const at = (p: number, i: number) =>
    cells.find((c) => c.probability === p && c.impact === i);

  return (
    <div className="inline-block rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex">
        <div className="flex flex-col justify-center pr-2 text-[10px] font-bold uppercase text-slate-400">
          <span className="[writing-mode:vertical-rl] rotate-180">
            Probability
          </span>
        </div>
        <div>
          <table className="border-collapse">
            <tbody>
              {probs.map((p) => (
                <tr key={p}>
                  <td className="pr-2 text-right text-xs font-bold text-slate-500">
                    {p}
                  </td>
                  {impacts.map((i) => {
                    const cell = at(p, i);
                    const level = cell?.level ?? "LOW";
                    return (
                      <td key={i} className="p-0.5">
                        <div
                          className={`grid h-12 w-12 place-items-center rounded-lg ${LEVEL_BG[level]} text-sm font-extrabold text-slate-800`}
                          title={`P${p} × I${i} — ${level}`}
                        >
                          {cell?.count ?? 0}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td></td>
                {impacts.map((i) => (
                  <td
                    key={i}
                    className="pt-1 text-center text-xs font-bold text-slate-500"
                  >
                    {i}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="mt-1 text-center text-[10px] font-bold uppercase text-slate-400">
            Impact
          </div>
        </div>
      </div>
    </div>
  );
}

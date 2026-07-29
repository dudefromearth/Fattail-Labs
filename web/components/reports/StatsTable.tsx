"use client";

import type { StatRow } from "@/lib/reportsBook";

export default function StatsTable({
  stats,
  startingCapital,
  onCapital,
}: {
  stats: StatRow[];
  startingCapital: number;
  onCapital: (n: number) => void;
}) {
  const rowClass = (tone?: StatRow["tone"]) => {
    switch (tone) {
      case "capital":
        return "bg-[var(--color-warning)]/25 text-[var(--color-label)]";
      case "key":
        return "bg-[var(--color-tint)] text-[var(--color-on-tint)]";
      case "balance":
        return "bg-[var(--color-success)]/15 text-[var(--color-label)]";
      case "loss":
        return "bg-[var(--color-surface)] text-[var(--color-label)]";
      default:
        return "bg-[var(--color-surface)] text-[var(--color-label)]";
    }
  };

  const valueExtra = (tone?: StatRow["tone"]) => {
    if (tone === "loss") return "text-[var(--color-destructive)]";
    if (tone === "balance") return "font-semibold text-[var(--color-success)]";
    if (tone === "key") return "font-semibold";
    if (tone === "capital") return "font-semibold";
    return "font-medium";
  };

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-1)]"
      data-testid="reports-stats-table"
    >
      <table className="w-full border-collapse text-left text-[13px]">
        <tbody>
          {stats.map((row) => (
            <tr
              key={row.key}
              className={`border-b border-[var(--color-separator)] last:border-b-0 ${rowClass(row.tone)}`}
            >
              <th
                scope="row"
                className={[
                  "whitespace-nowrap px-3 py-2 font-semibold",
                  row.tone === "key"
                    ? "text-[var(--color-on-tint)]"
                    : "text-inherit",
                ].join(" ")}
              >
                {row.label}
              </th>
              <td
                className={`px-3 py-2 text-right tabular-nums ${valueExtra(row.tone)}`}
              >
                {row.key === "capital" ? (
                  <label className="inline-flex min-h-8 items-center justify-end gap-1">
                    <span className="sr-only">Starting capital</span>
                    <span className="opacity-70">$</span>
                    <input
                      type="number"
                      min={1}
                      step={1000}
                      className="w-[6.5rem] rounded-[var(--radius-sm)] border border-[var(--color-separator)] bg-[var(--color-surface)]/80 px-2 py-1 text-right font-semibold text-[var(--color-label)] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-tint)]"
                      value={startingCapital}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (Number.isFinite(n) && n > 0) onCapital(n);
                      }}
                    />
                  </label>
                ) : (
                  row.value
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

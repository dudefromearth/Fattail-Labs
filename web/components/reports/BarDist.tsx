"use client";

import type { DistBin } from "@/lib/reportsBook";

export default function BarDist({
  bins,
  title,
  subtitle,
  dense = false,
}: {
  bins: DistBin[];
  title: string;
  subtitle?: string;
  /** High-resolution histogram (e.g. 100 outcome bins). */
  dense?: boolean;
}) {
  const max = Math.max(...bins.map((b) => b.count), 1);
  const plotH = dense ? 180 : 112;
  const binCount = bins.length;
  // ~4px per bar at 100 bins ≈ 400px min; grow with viewport via flex
  const minTrack = dense ? Math.max(400, binCount * 4) : undefined;

  return (
    <div>
      <h3
        className="font-semibold text-[var(--color-label)]"
        style={{ fontSize: "var(--text-headline)" }}
      >
        {title}
      </h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
          {subtitle}
        </p>
      )}
      <div className={["mt-4", dense ? "overflow-x-auto pb-2" : ""].join(" ")}>
        <div
          className={[
            "flex items-end",
            dense ? "gap-px" : "gap-2 sm:gap-3",
          ].join(" ")}
          style={{
            minHeight: plotH + (dense ? 28 : 36),
            minWidth: minTrack,
          }}
        >
          {bins.map((b, i) => {
            const h = b.count > 0 ? Math.max(2, (b.count / max) * plotH) : 1;
            const color =
              b.tone < 0
                ? "var(--color-destructive)"
                : b.tone > 0
                  ? "var(--color-tint)"
                  : "var(--color-label-tertiary)";
            return (
              <div
                key={`${i}-${b.label}`}
                className={[
                  "flex flex-col items-center justify-end",
                  dense ? "min-w-0 flex-1" : "min-w-0 flex-1 gap-1",
                ].join(" ")}
                title={`${b.label || `bin ${i + 1}`}: ${b.count}`}
              >
                {!dense && (
                  <span className="text-[11px] tabular-nums text-[var(--color-label-secondary)]">
                    {b.count > 0 ? b.count : ""}
                  </span>
                )}
                <div
                  className={dense ? "w-full rounded-t-[1px]" : "w-full rounded-t-[3px]"}
                  style={{
                    height: h,
                    background: color,
                    opacity: b.count === 0 ? 0.12 : 0.92,
                    maxWidth: dense ? undefined : 44,
                  }}
                />
                {(!dense || b.label) && (
                  <span
                    className={[
                      "max-w-full text-center text-[var(--color-label-tertiary)]",
                      dense
                        ? "mt-1 text-[8px] leading-none tabular-nums"
                        : "truncate text-[10px]",
                    ].join(" ")}
                  >
                    {b.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {dense && (
        <p className="mt-2 text-[11px] text-[var(--color-label-tertiary)]">
          {binCount} bins · axis labeled every 10th edge · hover a bar for count
        </p>
      )}
    </div>
  );
}

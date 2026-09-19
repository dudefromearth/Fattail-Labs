"use client";

import { HeatmapHoverTip } from "@/components/options-lab/HeatmapHoverTip";
import type { GexCalCell, GexCalResult } from "@/lib/options-lab/templates/gexCal";
import {
  fmtGexCalDollars,
  gexCalCellFill,
  gexCalColorT,
  gexCalStickyScale,
} from "@/lib/options-lab/templates/gexCal";
import type { HeatmapTipModel } from "@/lib/options-lab/heatmapTip";
import { toneForSigned } from "@/lib/options-lab/heatmapTip";
import { useEffect, useRef, useState, type UIEvent } from "react";

const ROW = "h-9";
const HEADER = "h-11";
const BAR = "h-7";
const STRIKE_COL =
  "w-[4.75rem] min-w-[4.75rem] max-w-[4.75rem] pl-2 pr-[10px]";

function cellTip(cell: GexCalCell, colLabel: string): HeatmapTipModel {
  const note =
    cell.mark === "gold"
      ? "Largest |GEX| in this window"
      : cell.mark === "green"
        ? "Highest in this expiration"
        : cell.mark === "red"
          ? "Largest negative in this expiration"
          : undefined;
  if (!cell.valid) {
    return {
      title: `${cell.strike} · ${colLabel}`,
      kicker: "Term Mass",
      rows: [{ label: "GEX", value: "Not available", tone: "muted" }],
    };
  }
  return {
    title: `${cell.strike} · ${colLabel}`,
    kicker: "Term Mass",
    rows: [
      {
        label: "Net",
        value: cell.display ?? "—",
        tone: toneForSigned(cell.value),
      },
      {
        label: "Call",
        value: cell.call != null ? fmtGexCalDollars(cell.call) : "—",
        tone: "call",
      },
      {
        label: "Put",
        value: cell.put != null ? fmtGexCalDollars(cell.put) : "—",
        tone: "put",
      },
    ],
    note,
  };
}

export default function HeatmapGexCalendar({
  result,
}: {
  result: GexCalResult;
}) {
  const [sticky, setSticky] = useState(1);
  const [hover, setHover] = useState<{
    model: HeatmapTipModel;
    x: number;
    y: number;
  } | null>(null);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);
  const profScrollRef = useRef<HTMLDivElement | null>(null);
  const syncingRef = useRef(false);
  const scale = gexCalStickyScale(result, sticky);
  useEffect(() => {
    if (scale !== sticky) setSticky(scale);
  }, [scale, sticky]);

  const syncScroll = (from: "grid" | "prof") => (e: UIEvent<HTMLDivElement>) => {
    if (syncingRef.current) return;
    const other =
      from === "grid" ? profScrollRef.current : gridScrollRef.current;
    if (!other) return;
    syncingRef.current = true;
    other.scrollTop = e.currentTarget.scrollTop;
    syncingRef.current = false;
  };

  if (result.empty) {
    return (
      <div
        className="flex min-h-[20rem] items-center justify-center px-6 text-center text-[15px] text-white/55"
        data-testid="term-mass-empty"
      >
        {result.emptyReason === "fake"
          ? "Term Mass needs a real expiration pack — not one book copied across dates."
          : "Term Mass pack is not available."}
      </div>
    );
  }

  const peak = result.peakStrike;
  const maxAbs = Math.max(
    1,
    ...result.profile.map((p) => (p.value != null ? Math.abs(p.value) : 0)),
  );
  const colGrid = {
    display: "grid" as const,
    gridTemplateColumns: `4.75rem repeat(${result.cols.length}, minmax(0, 1fr))`,
  };

  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col bg-[#050508] text-white"
      data-testid="term-mass"
    >
      <p className="shrink-0 px-3 py-1.5 text-[12px] text-white/40">
        Chain GEX (estimate) at this snapshot, not a direction.
      </p>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            className={`${HEADER} shrink-0 border-b border-white/10 bg-[#050508]`}
            style={colGrid}
            data-testid="term-mass-exp-header"
          >
            <div
              className={`${STRIKE_COL} flex items-center text-[13px] font-semibold uppercase tracking-wide text-white/50`}
            >
              Strike
            </div>
            {result.cols.map((c) => (
              <div
                key={c.expiration}
                className="flex items-center justify-center px-1 text-center text-[16px] font-semibold tabular-nums text-white"
              >
                {c.label}
              </div>
            ))}
          </div>
          <div
            ref={gridScrollRef}
            className="min-h-0 flex-1 overflow-y-auto"
            onScroll={syncScroll("grid")}
          >
            {result.rows.map((row, i) => (
              <div
                key={row.strike}
                data-peak={row.strike === peak ? "1" : "0"}
                className={ROW}
                style={colGrid}
              >
                <div
                  className={`${STRIKE_COL} flex items-center text-[16px] font-semibold tabular-nums ${
                    row.isSpot
                      ? "border-l-2 border-teal-400 text-teal-200"
                      : "text-white/80"
                  }`}
                >
                  {row.label}
                </div>
                {result.cells[i].map((cell) => {
                  const col = result.cols.find(
                    (c) => c.expiration === cell.expiration,
                  );
                  const dark =
                    cell.mark === "green" || cell.mark === "gold";
                  return (
                    <button
                      key={cell.expiration}
                      type="button"
                      className="flex h-9 w-full cursor-default items-center justify-center px-1 text-center text-[11px] font-semibold tabular-nums"
                      style={{
                        background:
                          cell.valid && cell.value != null
                            ? gexCalCellFill(
                                cell.mark,
                                gexCalColorT(cell.value, scale),
                              )
                            : "#0a0a0e",
                        color: dark ? "#111" : "#fff",
                        textShadow: dark
                          ? "none"
                          : "0 1px 1px rgba(0,0,0,0.55)",
                      }}
                      onMouseEnter={(e) => {
                        setHover({
                          model: cellTip(
                            cell,
                            col?.label ?? cell.expiration,
                          ),
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseMove={(e) => {
                        setHover((prev) =>
                          prev
                            ? { ...prev, x: e.clientX, y: e.clientY }
                            : prev,
                        );
                      }}
                      onMouseLeave={() => setHover(null)}
                    >
                      {cell.valid ? cell.display : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div
            className={`${HEADER} shrink-0 border-t border-white/10 bg-[#050508]`}
            style={colGrid}
            data-testid="term-mass-net-footer"
          >
            <div
              className={`${STRIKE_COL} flex items-center text-[16px] font-semibold uppercase tracking-wide text-white/70`}
            >
              NET
            </div>
            {result.netFooter.map((n) => (
              <div
                key={n.expiration}
                className="flex items-center justify-center px-1 text-center text-[16px] font-semibold tabular-nums text-white"
              >
                {n.display ?? ""}
              </div>
            ))}
          </div>
        </div>
        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-white/10"
          data-testid="term-mass-profile"
        >
          <div className={`${HEADER} shrink-0 border-b border-white/10 bg-[#050508]`}>
            {"\u00a0"}
          </div>
          <div
            ref={profScrollRef}
            className="min-h-0 flex-1 overflow-y-auto"
            onScroll={syncScroll("prof")}
          >
            {result.profile.map((p) => {
              const mag =
                p.valid && p.value != null ? Math.abs(p.value) / maxAbs : 0;
              const neg = (p.value ?? 0) < 0;
              const gold = p.strike === peak;
              const fill = gold
                ? "#e8a317"
                : neg
                  ? "#00d4dc"
                  : "#e040c0";
              const label =
                p.valid && p.value != null ? fmtGexCalDollars(p.value) : "";
              return (
                <div
                  key={p.strike}
                  className={`${ROW} grid grid-cols-[1fr_2.75rem_1fr] items-center gap-x-[5px] px-1`}
                >
                  <div className={`relative ${BAR}`}>
                    {neg ? (
                      <div
                        className={`absolute top-0 right-0 ${BAR} rounded-l`}
                        style={{
                          width: `${Math.round(mag * 100)}%`,
                          background: fill,
                        }}
                      />
                    ) : null}
                    {neg && label ? (
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums text-white">
                        {label}
                      </span>
                    ) : null}
                  </div>
                  <div
                    className={`text-center text-[16px] font-semibold tabular-nums ${
                      result.rows.find((r) => r.strike === p.strike)?.isSpot
                        ? "text-teal-200"
                        : "text-white/80"
                    }`}
                  >
                    {p.strike}
                  </div>
                  <div className={`relative ${BAR}`}>
                    {!neg && p.valid ? (
                      <div
                        className={`absolute top-0 left-0 ${BAR} rounded-r`}
                        style={{
                          width: `${Math.round(mag * 100)}%`,
                          background: fill,
                        }}
                      />
                    ) : null}
                    {!neg && label ? (
                      <span
                        className={`absolute left-1.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums ${
                          gold ? "text-black" : "text-white"
                        }`}
                      >
                        {label}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <div className={`${HEADER} shrink-0 border-t border-white/10 bg-[#050508]`}>
            {"\u00a0"}
          </div>
        </div>
      </div>
      <HeatmapHoverTip
        model={hover?.model ?? null}
        x={hover?.x ?? 0}
        y={hover?.y ?? 0}
      />
    </div>
  );
}

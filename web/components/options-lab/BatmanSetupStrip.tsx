"use client";

import {
  additivePayoffCanvas,
  batmanReady,
  stagedFlyLabel,
  type StagedFly,
} from "@/lib/options-lab/templates/batmanMode";

export default function BatmanSetupStrip({
  call,
  put,
  onClear,
  onSend,
}: {
  call: StagedFly | null;
  put: StagedFly | null;
  onClear: (side: "call" | "put") => void;
  onSend: () => void;
}) {
  const ready = batmanReady(call, put);
  const spot = call?.inspect?.spot ?? put?.inspect?.spot ?? null;
  const canvas = additivePayoffCanvas(
    call?.inspect?.payoff ?? null,
    put?.inspect?.payoff ?? null,
    spot,
  );
  const debitSum =
    (call?.debit != null ? call.debit : 0) + (put?.debit != null ? put.debit : 0);
  const showSum = !!(call && put);
  return (
    <div
      className="flex h-36 shrink-0 items-stretch gap-3 bg-black px-3 py-1"
      data-testid="heatmap-batman-strip"
      role="region"
      aria-label="Batman setup"
    >
      <StageChip
        fly={put}
        empty="Click a put fly"
        tone="put"
        onClear={() => onClear("put")}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SharedTent
          canvas={canvas}
          spot={spot}
          showCall={!!call && !put}
          showPut={!!put && !call}
          showSum={showSum}
        />
        {showSum ? (
          <div
            className="text-center text-[11px] tabular-nums text-white/55"
            data-testid="batman-debit-sum"
          >
            Combined debit {debitSum.toFixed(2)}
          </div>
        ) : (
          <div className="text-center text-[11px] text-white/35">
            One call, one put — same canvas
          </div>
        )}
      </div>
      <StageChip
        fly={call}
        empty="Click a call fly"
        tone="call"
        onClear={() => onClear("call")}
      />
      <div className="flex w-[9.5rem] shrink-0 flex-col items-end justify-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
          Batman
        </span>
        <button
          type="button"
          disabled={!ready}
          onClick={onSend}
          data-testid="heatmap-batman-send"
          className={[
            "inline-flex min-h-9 w-full items-center justify-center rounded-full px-3 text-xs font-medium",
            ready
              ? "bg-[var(--color-tint)] text-white hover:brightness-110"
              : "cursor-not-allowed bg-white/10 text-white/35",
          ].join(" ")}
        >
          Send to Analyzer
        </button>
        <span className="text-center text-[10px] leading-snug text-white/35">
          {ready ? "Two cards" : "Select both sides"}
        </span>
      </div>
    </div>
  );
}

function StageChip({
  fly,
  empty,
  tone,
  onClear,
}: {
  fly: StagedFly | null;
  empty: string;
  tone: "call" | "put";
  onClear: () => void;
}) {
  const side = tone;
  return (
    <div
      className="flex w-[9.5rem] shrink-0 flex-col justify-center"
      data-testid={`batman-stage-pane-${side}`}
    >
      {fly ? (
        <div className="flex items-start gap-1">
          <span
            className={
              "min-w-0 text-[11px] leading-snug tabular-nums " +
              (tone === "put" ? "text-red-300" : "text-sky-300")
            }
            data-testid={`batman-stage-${fly.side}`}
            title={fly.script}
          >
            {stagedFlyLabel(fly)}
          </span>
          <button
            type="button"
            className="shrink-0 text-white/50 hover:text-white"
            aria-label={`Clear ${fly.side} fly`}
            onClick={onClear}
          >
            ×
          </button>
        </div>
      ) : (
        <span
          className="text-[11px] text-white/35"
          data-testid={`batman-stage-${side}-empty`}
        >
          {empty}
        </span>
      )}
    </div>
  );
}

function SharedTent({
  canvas,
  spot,
  showCall,
  showPut,
  showSum,
}: {
  canvas: ReturnType<typeof additivePayoffCanvas>;
  spot: number | null;
  showCall: boolean;
  showPut: boolean;
  showSum: boolean;
}) {
  const series = [
    ...(showPut ? canvas.put : []),
    ...(showCall ? canvas.call : []),
    ...(showSum ? canvas.sum : []),
  ];
  if (series.length < 2) {
    return (
      <div
        className="flex min-h-0 flex-1 items-center justify-center text-[12px] text-white/35"
        data-testid="batman-combo-empty"
      >
        Stage a fly to preview risk
      </div>
    );
  }
  const W = 640;
  const H = 120;
  const pad = 8;
  const ys = series.map((p) => p.y);
  const yMin = Math.min(...ys, 0);
  const yMax = Math.max(...ys, 0);
  const dx = canvas.xMax - canvas.xMin || 1;
  const dy = yMax - yMin || 1;
  const sx = (x: number) => pad + ((x - canvas.xMin) / dx) * (W - 2 * pad);
  const sy = (y: number) => H - pad - ((y - yMin) / dy) * (H - 2 * pad);
  const path = (pts: { x: number; y: number }[]) =>
    pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`,
      )
      .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="min-h-0 w-full flex-1"
      data-testid="batman-combo-tent"
      aria-hidden
    >
      <line
        x1={pad}
        y1={sy(0)}
        x2={W - pad}
        y2={sy(0)}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1"
      />
      {spot != null && Number.isFinite(spot) ? (
        <line
          x1={sx(spot)}
          y1={pad}
          x2={sx(spot)}
          y2={H - pad}
          stroke="#fbbf24"
          strokeWidth="1.4"
          strokeDasharray="3 3"
        />
      ) : null}
      {showPut && canvas.put.length > 1 ? (
        <path d={path(canvas.put)} fill="none" stroke="#f87171" strokeWidth="2" />
      ) : null}
      {showCall && canvas.call.length > 1 ? (
        <path d={path(canvas.call)} fill="none" stroke="#38bdf8" strokeWidth="2" />
      ) : null}
      {showSum && canvas.sum.length > 1 ? (
        <path d={path(canvas.sum)} fill="none" stroke="#f8fafc" strokeWidth="2.2" />
      ) : null}
    </svg>
  );
}

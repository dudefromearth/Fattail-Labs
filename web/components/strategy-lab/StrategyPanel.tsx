"use client";

/**
 * Design tab 1 — Position Builder.
 * Compact Options Lab grammar: strategy dropdown + debit/credit icon,
 * Long/Short, width + short-strike gap in strikes.
 * Definition and Risk graph stay together — same shape, two languages.
 * R2R is not set here — it is chosen on the convexity heatmap.
 */

import type { StrategyConfig } from "@/lib/strategyPacks";
import ShapeRiskGraph from "@/components/strategy-lab/ShapeRiskGraph";
import {
  DEFAULT_WING_STRIKES,
  asStrikes,
  batmanDefaultShorts,
  strikesToPts,
} from "@/lib/options-lab/designRelativeShape";
import {
  FLY_TYPES,
  OTHER_STRATEGIES,
  STRATEGY_DIAGRAMS,
  TEMPLATE_LABELS,
  familyFromTemplate,
  flyTypeById,
  flyTypeFromConfig,
  hasSpreadWidth,
  isDesignStrategy,
  isFlyTypeId,
  type DesignStrategyId,
  type FlyTypeId,
} from "@/lib/options-lab/strategyCatalog";

type Props = {
  config: StrategyConfig;
  setField: (name: string, value: unknown) => void;
};

const group =
  "overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)]";
const row =
  "flex items-center gap-3 border-b border-[var(--color-separator)] px-3 py-2 last:border-b-0";
const labelCls =
  "w-[5.75rem] shrink-0 text-[13px] text-[var(--color-label-secondary)]";
const fieldCls =
  "min-h-9 w-11 bg-transparent text-right text-[15px] font-semibold tabular-nums text-[var(--color-label)] outline-none";
const selectCls =
  "min-h-9 min-w-0 flex-1 bg-transparent text-right text-[15px] font-medium text-[var(--color-label)] outline-none";

function currentTemplate(config: StrategyConfig): DesignStrategyId {
  const raw = config.strategy_template;
  if (isDesignStrategy(raw)) return raw;
  const fam = String(config.butterfly_family || "");
  if (fam === "batman" || fam === "symmetric") return "batman";
  if (fam === "broken_wing") return "bwb";
  if (fam === "single") return "butterfly";
  return "batman";
}

function StrategyIcon({
  id,
  side,
  size = 72,
  diagram,
}: {
  id: DesignStrategyId;
  side: "buy" | "sell";
  size?: number;
  diagram?: string;
}) {
  const debit = side === "buy";
  const d = diagram || STRATEGY_DIAGRAMS[id];
  return (
    <svg
      viewBox="0 0 60 24"
      width={size}
      height={Math.round(size * 0.4)}
      className="shrink-0"
      style={debit ? undefined : { transform: "scaleY(-1)" }}
      aria-label={debit ? "Debit" : "Credit"}
    >
      <path
        d={d}
        fill="none"
        stroke={debit ? "#22c55e" : "#ef4444"}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Num({
  value,
  min,
  max,
  step = 1,
  onCommit,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onCommit: (n: number) => void;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={Number.isFinite(value) ? value : ""}
      className={fieldCls}
      onChange={(e) => {
        const n = parseFloat(e.target.value);
        if (!Number.isFinite(n)) return;
        onCommit(Math.min(max, Math.max(min, n)));
      }}
    />
  );
}

export default function StrategyPanel({ config, setField }: Props) {
  const template = currentTemplate(config);
  const side = config.trade_side === "sell" ? "sell" : "buy";
  const placement = config.placement === "otm" ? "otm" : "atm";
  const right = config.option_right === "put" ? "put" : "call";
  const wing = asStrikes(config.wing_width);
  const shorts = Math.max(
    template === "batman" ? 1 : 0,
    Math.round(
      Number(config.short_gap) ||
        (template === "batman" ? batmanDefaultShorts(wing) : 0),
    ),
  );
  const dteGap = Number(config.dte_gap) > 0 ? Number(config.dte_gap) : 1;
  const showWidth = hasSpreadWidth(template);
  const showGap = template === "calendar" || template === "diagonal";
  const batmanStyle =
    config.batman_style === "broken" ? "broken" : "symmetric";
  const brokenSide = config.broken_side === "near" ? "near" : "far";
  const fly = flyTypeFromConfig(config);
  const outer = asStrikes(
    config.outer_width,
    brokenSide === "near" ? wing + 2 : Math.max(1, wing - 2),
  );

  function applyFly(id: FlyTypeId) {
    const t = flyTypeById(id);
    setField("strategy_template", t.template);
    setField("butterfly_family", familyFromTemplate(t.template));
    setField("placement", t.placement);
    setField("batman_style", t.style);
    setField("broken_side", t.brokenSide ?? "");
    if (t.right) {
      setField("option_right", t.right);
      setField("direction", t.right);
      setField("bias", t.right === "put" ? "bearish" : "bullish");
    } else if (t.template === "batman") {
      setField("direction", "both");
      setField("bias", "neutral");
    }
    if (!config.wing_width) {
      setField("wing_width", DEFAULT_WING_STRIKES);
      setField("width_points_min", strikesToPts(DEFAULT_WING_STRIKES));
      setField("width_points_max", strikesToPts(DEFAULT_WING_STRIKES));
    }
    if (t.template === "batman") {
      const w = asStrikes(config.wing_width);
      const g = Number(config.short_gap);
      if (!(g > 0) || g === w) setField("short_gap", batmanDefaultShorts(w));
    }
    if (t.style === "broken" && !(Number(config.outer_width) > 0)) {
      setField("outer_width", t.brokenSide === "near" ? 6 : 2);
    }
  }

  function applyTemplate(next: DesignStrategyId) {
    setField("strategy_template", next);
    setField("butterfly_family", familyFromTemplate(next));
    if (next === "batman") {
      setField("direction", "both");
      setField("placement", "atm");
      setField("bias", "neutral");
      const w = asStrikes(config.wing_width);
      const g = Number(config.short_gap);
      if (!(g > 0) || g === w) setField("short_gap", batmanDefaultShorts(w));
      if (!config.batman_style) setField("batman_style", "symmetric");
    } else if (placement === "otm") {
      setField("direction", right);
    } else {
      setField("direction", "both");
    }
    if (!config.wing_width) {
      setField("wing_width", DEFAULT_WING_STRIKES);
      setField("width_points_min", strikesToPts(DEFAULT_WING_STRIKES));
      setField("width_points_max", strikesToPts(DEFAULT_WING_STRIKES));
    }
    if (next !== "batman" && config.short_gap == null) setField("short_gap", 0);
  }

  function applyWidth(n: number) {
    const strikes = Math.round(n);
    const prevWing = wing;
    setField("wing_width", strikes);
    setField("width_points_min", strikesToPts(strikes));
    setField("width_points_max", strikesToPts(strikes));
    setField("width_style", "variable");
    if (template === "batman") {
      const g = Number(config.short_gap);
      if (!g || g === prevWing || g === 2 * prevWing) {
        setField("short_gap", batmanDefaultShorts(strikes));
      }
    }
    if (batmanStyle === "broken" || fly?.style === "broken") {
      const o = asStrikes(config.outer_width, strikes);
      if (brokenSide === "far" && o >= strikes) {
        setField("outer_width", Math.max(1, strikes - 1));
      }
      if (brokenSide === "near" && o <= strikes) {
        setField("outer_width", strikes + 2);
      }
    }
  }

  function applyPlacement(next: "atm" | "otm") {
    setField("placement", next);
    if (next === "atm") {
      setField("bias", "neutral");
      if (template === "batman") setField("direction", "both");
    } else {
      setField("bias", right === "put" ? "bearish" : "bullish");
      setField("option_right", right);
      setField("direction", right);
    }
  }

  function applyRight(next: "call" | "put") {
    setField("option_right", next);
    setField("bias", next === "put" ? "bearish" : "bullish");
    setField("direction", next);
  }

  return (
    <div className="space-y-3" data-testid="design-strategy-panel">
      <div className={group}>
        <div className={row}>
          <span className={labelCls}>Strategy</span>
          <select
            className={selectCls}
            value={fly?.id ?? template}
            aria-label="Strategy"
            onChange={(e) => {
              const v = e.target.value;
              if (isFlyTypeId(v)) applyFly(v);
              else applyTemplate(v as DesignStrategyId);
            }}
          >
            <optgroup label="Butterflies">
              {FLY_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Other">
              {OTHER_STRATEGIES.map((t) => (
                <option key={t} value={t}>
                  {TEMPLATE_LABELS[t]}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className={row + " justify-between"}>
          <span className={labelCls}>Side</span>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full bg-[var(--color-fill)] p-0.5">
              <button
                type="button"
                className={
                  "min-h-9 rounded-full px-4 text-[13px] font-semibold " +
                  (side === "buy"
                    ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                    : "text-[var(--color-label-secondary)]")
                }
                onClick={() => setField("trade_side", "buy")}
              >
                Long
              </button>
              <button
                type="button"
                className={
                  "min-h-9 rounded-full px-4 text-[13px] font-semibold " +
                  (side === "sell"
                    ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                    : "text-[var(--color-label-secondary)]")
                }
                onClick={() => setField("trade_side", "sell")}
              >
                Short
              </button>
            </div>
            <StrategyIcon
              id={template}
              side={side}
              diagram={fly?.diagram}
            />
          </div>
        </div>

        {showWidth ||
        fly?.style === "broken" ||
        template === "batman" ||
        showGap ? (
          <div className={row + " flex-wrap justify-end gap-x-4 gap-y-1"}>
            {showWidth ? (
              <label className="flex items-center gap-1.5">
                <span className="text-[13px] text-[var(--color-label-secondary)]">
                  {fly?.style === "broken" || template === "batman"
                    ? "Inner"
                    : "Width"}
                </span>
                <Num value={wing} min={1} max={20} onCommit={applyWidth} />
              </label>
            ) : null}
            {fly?.style === "broken" ? (
              <label className="flex items-center gap-1.5">
                <span className="text-[13px] text-[var(--color-label-secondary)]">
                  Outer
                </span>
                <Num
                  value={outer}
                  min={brokenSide === "near" ? wing + 1 : 1}
                  max={brokenSide === "near" ? 20 : Math.max(1, wing - 1)}
                  onCommit={(n) => setField("outer_width", Math.round(n))}
                />
              </label>
            ) : null}
            {template === "batman" ? (
              <label className="flex items-center gap-1.5">
                <span className="text-[13px] text-[var(--color-label-secondary)]">
                  Shorts
                </span>
                <Num
                  value={shorts}
                  min={1}
                  max={20}
                  onCommit={(n) => {
                    const g = Math.round(n);
                    setField("short_gap", g);
                    setField("body_width", g > 0 ? strikesToPts(g) : undefined);
                  }}
                />
              </label>
            ) : null}
            {showGap ? (
              <label className="flex items-center gap-1.5">
                <span className="text-[13px] text-[var(--color-label-secondary)]">
                  DTE
                </span>
                <Num
                  value={dteGap}
                  min={1}
                  max={6}
                  onCommit={(n) => setField("dte_gap", Math.round(n))}
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {fly ? null : (
          <>
            <div className={row + " justify-between"}>
              <span className={labelCls}>Center</span>
              <div className="inline-flex rounded-full bg-[var(--color-fill)] p-0.5">
                <button
                  type="button"
                  className={
                    "min-h-9 rounded-full px-4 text-[13px] font-semibold " +
                    (placement === "atm"
                      ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                      : "text-[var(--color-label-secondary)]")
                  }
                  onClick={() => applyPlacement("atm")}
                >
                  ATM
                </button>
                <button
                  type="button"
                  className={
                    "min-h-9 rounded-full px-4 text-[13px] font-semibold " +
                    (placement === "otm"
                      ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                      : "text-[var(--color-label-secondary)]")
                  }
                  onClick={() => applyPlacement("otm")}
                >
                  OTM
                </button>
              </div>
            </div>

            {placement === "otm" ? (
              <>
                <div className={row + " justify-between"}>
                  <span className={labelCls}>Right</span>
                  <div className="inline-flex rounded-full bg-[var(--color-fill)] p-0.5">
                    <button
                      type="button"
                      className={
                        "min-h-9 rounded-full px-4 text-[13px] font-semibold " +
                        (right === "put"
                          ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                          : "text-[var(--color-label-secondary)]")
                      }
                      onClick={() => applyRight("put")}
                    >
                      Put
                    </button>
                    <button
                      type="button"
                      className={
                        "min-h-9 rounded-full px-4 text-[13px] font-semibold " +
                        (right === "call"
                          ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                          : "text-[var(--color-label-secondary)]")
                      }
                      onClick={() => applyRight("call")}
                    >
                      Call
                    </button>
                  </div>
                </div>

              </>
            ) : null}
          </>
        )}
      </div>

      <ShapeRiskGraph config={config} setField={setField} />
    </div>
  );
}

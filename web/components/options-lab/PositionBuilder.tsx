"use client";

/**
 * Live Position Builder for Options Lab Analyzer.
 * Modeled on MSC Risk Graph PositionBuilder; mids/IV from dual-side chain.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChainAccessors,
  LegInput,
  OptionRight,
  PositionInput,
  TemplateType,
  TradeDirection,
} from "@/lib/options-lab/positionTypes";
import {
  butterflyLegs,
  bwbLegs,
  calendarLegs,
  condorLegs,
  diagonalLegs,
  diagonalWidthFromLadder,
  flipLegs,
  ironCondorLegs,
  ironFlyLegs,
  singleLeg,
  straddleLegs,
  strangleLegs,
  verticalLegs,
} from "@/lib/options-lab/positionTemplates";
import {
  buildLabel,
  buildNotation,
} from "@/lib/options-lab/positionLabels";
import { generateTosScript } from "@/lib/options-lab/tosGenerator";
import { positionNetPremium } from "@/lib/options-lab/positionToTrade";

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  single: "Single",
  vertical: "Vertical",
  butterfly: "Butterfly",
  bwb: "BWB",
  condor: "Condor",
  straddle: "Straddle",
  strangle: "Strangle",
  iron_fly: "Iron Fly",
  iron_condor: "Iron Condor",
  calendar: "Calendar",
  diagonal: "Diagonal",
};

const STRATEGY_GROUPS: { label: string; items: TemplateType[] }[] = [
  { label: "Basic", items: ["single", "vertical"] },
  { label: "Spreads", items: ["butterfly", "bwb", "condor"] },
  {
    label: "Volatility",
    items: ["straddle", "strangle", "iron_fly", "iron_condor"],
  },
  { label: "Time", items: ["calendar", "diagonal"] },
];

const TEMPLATE_HAS_SIDE: Record<TemplateType, boolean> = {
  single: true,
  vertical: true,
  butterfly: true,
  bwb: true,
  condor: true,
  straddle: false,
  strangle: false,
  iron_fly: false,
  iron_condor: false,
  calendar: true,
  diagonal: true,
};

const STRATEGY_DIAGRAMS: Record<TemplateType, string> = {
  single: "M2,22 L58,6",
  vertical: "M2,22 L20,22 L40,6 L58,6",
  butterfly: "M2,18 L12,18 L30,4 L48,18 L58,18",
  bwb: "M2,18 L12,18 L28,4 L52,18 L58,18",
  condor: "M2,18 L10,18 L20,6 L40,6 L50,18 L58,18",
  straddle: "M2,6 L30,22 L58,6",
  strangle: "M2,6 L18,18 L42,18 L58,6",
  iron_fly: "M2,6 L10,18 L30,4 L50,18 L58,6",
  iron_condor: "M2,6 L15,18 L45,18 L58,6",
  calendar: "M2,16 L20,10 L30,6 L40,10 L58,16",
  diagonal: "M2,18 L20,12 L32,6 L44,10 L58,16",
};

function defaultWidth(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s === "NDX" || s.startsWith("NQ")) return 50;
  return 20;
}

function defaultBackExpiration(front: string): string {
  const d = new Date(front + "T12:00:00");
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 10);
}

function defaultDiagonalWidth(symbol: string): number {
  const s = symbol.toUpperCase();
  if (s === "NDX" || s.startsWith("NQ")) return 75;
  return 15;
}

const field =
  "w-full rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] " +
  "px-2 py-1.5 text-sm text-[var(--color-label)]";
const labelCls =
  "mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]";
const btn =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-label)] hover:bg-[var(--color-fill)] disabled:opacity-45";
const btnPrimary =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-transparent " +
  "bg-[var(--color-tint)] px-4 text-sm font-semibold text-white disabled:opacity-45";

export type PositionBuilderProps = {
  open: boolean;
  mode: "create" | "edit";
  symbol: string;
  spotPrice: number;
  chain: ChainAccessors;
  initial?: PositionInput | null;
  onSave: (position: PositionInput, label: string, notation: string) => void;
  onCancel: () => void;
};

export default function PositionBuilder({
  open,
  mode,
  symbol,
  spotPrice,
  chain,
  initial,
  onSave,
  onCancel,
}: PositionBuilderProps) {
  const hasChain = chain.expirations.length > 0;
  const frontDefault =
    initial?.expiration ||
    chain.expirations[0] ||
    new Date().toISOString().slice(0, 10);

  const [position, setPosition] = useState<PositionInput>(() =>
    initial
      ? { ...initial, legs: initial.legs.map((l) => ({ ...l })) }
      : {
          underlying: symbol,
          expiration: frontDefault,
          contracts: 1,
          legs: [],
          direction: "buy",
          net_debit_override: null,
        },
  );

  const [template, setTemplate] = useState<TemplateType>("butterfly");
  const [direction, setDirection] = useState<TradeDirection>("buy");
  const [optionSide, setOptionSide] = useState<OptionRight>("call");
  const [centerStrike, setCenterStrike] = useState(() =>
    Math.round(spotPrice || 5000),
  );
  const [wingWidth, setWingWidth] = useState(() => defaultWidth(symbol));
  const [backExpiration, setBackExpiration] = useState("");
  const [copied, setCopied] = useState(false);
  const didInit = useRef(false);

  // Reset init gate each time dialog opens
  useEffect(() => {
    if (open) didInit.current = false;
  }, [open]);

  // Keep underlying in sync with symbol prop
  useEffect(() => {
    setPosition((p) =>
      p.underlying === symbol ? p : { ...p, underlying: symbol },
    );
  }, [symbol]);

  const isTimeSpread = template === "calendar" || template === "diagonal";

  const priceLegs = useCallback(
    (legs: LegInput[], frontExp: string): LegInput[] => {
      if (!hasChain) return legs;
      return legs.map((leg) => {
        const exp = leg.expiration || frontExp;
        const strike = chain.nearestStrike(exp, leg.strike);
        const c = chain.getContract(exp, strike, leg.type);
        return {
          ...leg,
          strike,
          entry_price: c?.mid ?? leg.entry_price ?? 0,
          volatility: c?.iv ?? leg.volatility,
        };
      });
    },
    [chain, hasChain],
  );

  const regenerate = useCallback(
    (
      tmpl: TemplateType,
      center: number,
      width: number,
      side: OptionRight,
      dir: TradeDirection,
      frontExp: string,
      backExp?: string,
    ) => {
      let legs: LegInput[];
      switch (tmpl) {
        case "single":
          legs = singleLeg(center, side);
          break;
        case "vertical":
          legs = verticalLegs(center, center + width, side);
          break;
        case "butterfly":
          legs = butterflyLegs(center, width, side);
          break;
        case "bwb":
          legs = bwbLegs(center, width, side);
          break;
        case "condor":
          legs = condorLegs(center, width, side);
          break;
        case "straddle":
          legs = straddleLegs(center);
          break;
        case "strangle":
          legs = strangleLegs(center, width || 20);
          break;
        case "iron_fly":
          legs = ironFlyLegs(center, width || 20);
          break;
        case "iron_condor":
          legs = ironCondorLegs(
            center - width * 2,
            center - width,
            center + width,
            center + width * 2,
          );
          break;
        case "calendar":
          legs = calendarLegs(center, side);
          break;
        case "diagonal":
          legs = diagonalLegs(center, width, side);
          break;
        default:
          legs = butterflyLegs(center, width, side);
      }

      if (tmpl === "calendar" || tmpl === "diagonal") {
        const front = frontExp;
        const back = backExp || defaultBackExpiration(front);
        legs = legs.map((leg) => ({
          ...leg,
          expiration: leg.side === "short" ? front : back,
        }));
      }

      legs = priceLegs(legs, frontExp);
      if (dir === "sell") legs = flipLegs(legs);

      setPosition((prev) => ({
        ...prev,
        expiration: frontExp,
        legs,
        direction: dir,
        // clear override so live mid shows
        net_debit_override: null,
      }));
    },
    [priceLegs],
  );

  // Init create
  useEffect(() => {
    if (!open || didInit.current) return;
    didInit.current = true;
    if (mode === "edit" && initial?.legs.length) {
      setPosition({
        ...initial,
        legs: initial.legs.map((l) => ({ ...l })),
      });
      setDirection(initial.direction || "buy");
      return;
    }
    const front = chain.expirations[0] || frontDefault;
    let center = Math.round(spotPrice || chain.spot || 5000);
    if (hasChain) center = chain.nearestStrike(front, center);
    setCenterStrike(center);
    setPosition((p) => ({ ...p, expiration: front, underlying: symbol }));
    regenerate(
      "butterfly",
      center,
      defaultWidth(symbol),
      "call",
      "buy",
      front,
    );
  }, [
    open,
    mode,
    initial,
    chain,
    frontDefault,
    hasChain,
    spotPrice,
    symbol,
    regenerate,
  ]);

  // Live reprice when chain updates
  useEffect(() => {
    if (!open || !hasChain || position.legs.length === 0) return;
    setPosition((prev) => {
      const next = priceLegs(prev.legs, prev.expiration);
      const same = next.every(
        (l, i) =>
          l.entry_price === prev.legs[i]?.entry_price &&
          l.strike === prev.legs[i]?.strike &&
          l.volatility === prev.legs[i]?.volatility,
      );
      return same ? prev : { ...prev, legs: next };
    });
  }, [open, hasChain, chain, position.legs.length, position.expiration, priceLegs]);

  const net = useMemo(() => positionNetPremium(position), [position]);
  // debit when we pay (net < 0 in our sign convention: long pays → negative contribution)
  // Actually positionNetPremium: long * -1 * qty * price → long pay is negative; credit is positive
  const liveAbs = Math.abs(net);
  const isCredit = net > 1e-9;
  const displayCost =
    position.net_debit_override != null
      ? Math.abs(position.net_debit_override)
      : liveAbs;
  const costLabel =
    position.net_debit_override != null
      ? direction === "sell" || isCredit
        ? "CREDIT"
        : "DEBIT"
      : isCredit
        ? "CREDIT"
        : "DEBIT";

  const previewLabel = useMemo(
    () => buildLabel(position.underlying, position.legs, position.expiration),
    [position],
  );
  const previewNotation = useMemo(
    () => buildNotation(position.legs),
    [position.legs],
  );

  const tosScript = useMemo(() => {
    if (!position.legs.length) return "";
    return generateTosScript({
      symbol: position.underlying,
      legs: position.legs.map((leg) => ({
        strike: leg.strike,
        expiration: leg.expiration || position.expiration,
        right: leg.type,
        quantity: leg.side === "long" ? leg.quantity : -leg.quantity,
      })),
      costBasis: displayCost > 0 ? displayCost : null,
    });
  }, [position, displayCost]);

  const strikes = hasChain ? chain.getStrikes(position.expiration) : [];

  const handleTemplate = (tmpl: TemplateType) => {
    setTemplate(tmpl);
    const side = TEMPLATE_HAS_SIDE[tmpl] ? optionSide : "call";
    let width = wingWidth;
    let back = backExpiration;
    if (tmpl === "calendar" || tmpl === "diagonal") {
      const exps = chain.expirations;
      const idx = exps.indexOf(position.expiration);
      back =
        idx >= 0 && idx + 1 < exps.length
          ? exps[idx + 1]
          : defaultBackExpiration(position.expiration);
      setBackExpiration(back);
    }
    if (tmpl === "diagonal") {
      const ladder = chain.getStrikes(position.expiration);
      width =
        diagonalWidthFromLadder(centerStrike, ladder, 2) ??
        defaultDiagonalWidth(symbol);
      setWingWidth(width);
    }
    regenerate(
      tmpl,
      centerStrike,
      width,
      side,
      direction,
      position.expiration,
      back,
    );
  };

  const handleDirection = (dir: TradeDirection) => {
    if (dir === direction) return;
    setDirection(dir);
    setPosition((prev) => ({
      ...prev,
      direction: dir,
      legs: flipLegs(prev.legs),
    }));
  };

  const updateLeg = (index: number, patch: Partial<LegInput>) => {
    setPosition((prev) => {
      const legs = prev.legs.map((l, i) => {
        if (i !== index) return l;
        const next = { ...l, ...patch };
        if (hasChain && (patch.strike != null || patch.type != null)) {
          const exp = next.expiration || prev.expiration;
          const c = chain.getContract(exp, next.strike, next.type);
          if (c) {
            next.entry_price = c.mid ?? next.entry_price;
            next.volatility = c.iv ?? next.volatility;
          }
        }
        return next;
      });
      return { ...prev, legs, net_debit_override: null };
    });
  };

  const addLeg = () => {
    setPosition((prev) => ({
      ...prev,
      legs: [
        ...prev.legs,
        {
          strike: centerStrike,
          type: "call",
          quantity: 1,
          side: "long",
          entry_price: 0,
        },
      ],
    }));
  };

  const removeLeg = (i: number) => {
    setPosition((prev) => ({
      ...prev,
      legs: prev.legs.filter((_, j) => j !== i),
    }));
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "edit" ? "Edit position" : "Create position"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="flex max-h-[min(92vh,780px)] w-full max-w-[740px] flex-col overflow-hidden rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-2xl"
        data-testid="position-builder"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-separator)] px-4 py-3">
          <h3 className="text-base font-semibold text-[var(--color-label)]">
            {mode === "edit" ? "Edit Position" : "Create Position"}
          </h3>
          <button type="button" className={btn} onClick={onCancel}>
            Close
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Symbol</span>
              <input className={field} value={position.underlying} readOnly />
            </label>
            <label className="block">
              <span className={labelCls}>Strategy</span>
              <select
                className={field}
                value={template}
                onChange={(e) => handleTemplate(e.target.value as TemplateType)}
              >
                {STRATEGY_GROUPS.map((g) => (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((t) => (
                      <option key={t} value={t}>
                        {TEMPLATE_LABELS[t]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <svg
              viewBox="0 0 60 24"
              width={60}
              height={24}
              style={
                direction === "sell" ? { transform: "scaleY(-1)" } : undefined
              }
            >
              <path
                d={STRATEGY_DIAGRAMS[template]}
                fill="none"
                stroke={direction === "buy" ? "#22c55e" : "#ef4444"}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <div className="inline-flex rounded-full border border-[var(--color-separator)] p-0.5">
              <button
                type="button"
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold " +
                  (direction === "buy"
                    ? "bg-emerald-600 text-white"
                    : "text-[var(--color-label-secondary)]")
                }
                onClick={() => handleDirection("buy")}
              >
                Buy
              </button>
              <button
                type="button"
                className={
                  "rounded-full px-3 py-1 text-xs font-semibold " +
                  (direction === "sell"
                    ? "bg-red-600 text-white"
                    : "text-[var(--color-label-secondary)]")
                }
                onClick={() => handleDirection("sell")}
              >
                Sell
              </button>
            </div>
            <span className="text-sm text-[var(--color-label-secondary)]">
              {direction === "buy" ? "Buy" : "Sell"} {TEMPLATE_LABELS[template]}
            </span>
            {TEMPLATE_HAS_SIDE[template] && (
              <select
                className={field + " w-auto"}
                value={optionSide}
                onChange={(e) => {
                  const s = e.target.value as OptionRight;
                  setOptionSide(s);
                  regenerate(
                    template,
                    centerStrike,
                    wingWidth,
                    s,
                    direction,
                    position.expiration,
                    backExpiration,
                  );
                }}
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <label className="block">
              <span className={labelCls}>Center</span>
              {hasChain && strikes.length ? (
                <select
                  className={field}
                  value={centerStrike}
                  onChange={(e) => {
                    const c = parseFloat(e.target.value);
                    setCenterStrike(c);
                    regenerate(
                      template,
                      c,
                      wingWidth,
                      optionSide,
                      direction,
                      position.expiration,
                      backExpiration,
                    );
                  }}
                >
                  {strikes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={field}
                  type="number"
                  value={centerStrike}
                  onChange={(e) => setCenterStrike(parseFloat(e.target.value) || 0)}
                />
              )}
            </label>
            <label className="block">
              <span className={labelCls}>Width</span>
              <input
                className={field}
                type="number"
                value={wingWidth}
                onChange={(e) => {
                  const w = Math.max(0, parseFloat(e.target.value) || 0);
                  setWingWidth(w);
                  regenerate(
                    template,
                    centerStrike,
                    w,
                    optionSide,
                    direction,
                    position.expiration,
                    backExpiration,
                  );
                }}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Front exp</span>
              {hasChain ? (
                <select
                  className={field}
                  value={position.expiration}
                  onChange={(e) => {
                    const exp = e.target.value;
                    let back = backExpiration;
                    if (isTimeSpread) {
                      const exps = chain.expirations;
                      const idx = exps.indexOf(exp);
                      back =
                        idx >= 0 && idx + 1 < exps.length
                          ? exps[idx + 1]
                          : defaultBackExpiration(exp);
                      setBackExpiration(back);
                    }
                    regenerate(
                      template,
                      centerStrike,
                      wingWidth,
                      optionSide,
                      direction,
                      exp,
                      back,
                    );
                  }}
                >
                  {chain.expirations.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={field}
                  type="date"
                  value={position.expiration}
                  onChange={(e) =>
                    setPosition((p) => ({ ...p, expiration: e.target.value }))
                  }
                />
              )}
            </label>
          </div>

          {isTimeSpread && (
            <label className="block max-w-xs">
              <span className={labelCls}>Back exp</span>
              {hasChain ? (
                <select
                  className={field}
                  value={backExpiration}
                  onChange={(e) => {
                    const b = e.target.value;
                    setBackExpiration(b);
                    setPosition((prev) => ({
                      ...prev,
                      legs: prev.legs.map((leg) =>
                        leg.side === "long" ? { ...leg, expiration: b } : leg,
                      ),
                    }));
                  }}
                >
                  {chain.expirations
                    .filter((e) => e > position.expiration)
                    .map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  className={field}
                  type="date"
                  value={backExpiration}
                  onChange={(e) => setBackExpiration(e.target.value)}
                />
              )}
            </label>
          )}

          <div>
            <span className={labelCls}>Legs · live mids</span>
            <div className="overflow-x-auto rounded-lg border border-[var(--color-separator)]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-fill)] text-[10px] uppercase text-[var(--color-label-tertiary)]">
                  <tr>
                    <th className="px-2 py-1.5">Qty</th>
                    <th className="px-2 py-1.5">Strike</th>
                    <th className="px-2 py-1.5">Type</th>
                    <th className="px-2 py-1.5">Exp</th>
                    <th className="px-2 py-1.5">Mid</th>
                    <th className="px-2 py-1.5">IV</th>
                    <th className="px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {position.legs.map((leg, i) => (
                    <tr
                      key={i}
                      className="border-t border-[var(--color-separator)]"
                    >
                      <td className="px-2 py-1">
                        <input
                          className={field + " w-16"}
                          type="number"
                          value={
                            leg.side === "long" ? leg.quantity : -leg.quantity
                          }
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10) || 1;
                            updateLeg(i, {
                              quantity: Math.max(1, Math.abs(v)),
                              side: v >= 0 ? "long" : "short",
                            });
                          }}
                        />
                      </td>
                      <td className="px-2 py-1">
                        {hasChain && strikes.length ? (
                          <select
                            className={field + " min-w-[5rem]"}
                            value={leg.strike}
                            onChange={(e) =>
                              updateLeg(i, {
                                strike: parseFloat(e.target.value),
                              })
                            }
                          >
                            {strikes.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className={field + " w-20"}
                            type="number"
                            value={leg.strike}
                            onChange={(e) =>
                              updateLeg(i, {
                                strike: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        )}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          className={btn + " !min-h-8 !px-2 !text-xs"}
                          onClick={() =>
                            updateLeg(i, {
                              type: leg.type === "call" ? "put" : "call",
                            })
                          }
                        >
                          {leg.type === "call" ? "Call" : "Put"}
                        </button>
                      </td>
                      <td className="px-2 py-1 font-mono text-[11px]">
                        {(leg.expiration || position.expiration).slice(5)}
                      </td>
                      <td className="px-2 py-1 font-mono text-emerald-500">
                        {leg.entry_price > 0
                          ? leg.entry_price.toFixed(2)
                          : "—"}
                      </td>
                      <td className="px-2 py-1 font-mono text-[var(--color-label-tertiary)]">
                        {leg.volatility != null
                          ? (leg.volatility * 100).toFixed(1) + "%"
                          : "—"}
                      </td>
                      <td className="px-2 py-1">
                        <button
                          type="button"
                          className="text-red-400"
                          disabled={position.legs.length <= 1}
                          onClick={() => removeLeg(i)}
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className={btn + " mt-2"} onClick={addLeg}>
              + Add leg
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>
                Package {costLabel} (live mid)
              </span>
              <input
                className={field}
                type="number"
                step="0.01"
                value={
                  position.net_debit_override != null
                    ? position.net_debit_override
                    : displayCost > 0
                      ? Number(displayCost.toFixed(2))
                      : ""
                }
                placeholder={
                  displayCost > 0 ? displayCost.toFixed(2) : "awaiting mids"
                }
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setPosition((p) => ({
                    ...p,
                    net_debit_override: Number.isFinite(v) ? v : null,
                  }));
                }}
              />
              <p className="mt-0.5 text-[10px] text-[var(--color-label-tertiary)]">
                {chain.loading
                  ? "Refreshing chain…"
                  : chain.error
                    ? chain.error
                    : `Natural mid ${costLabel.toLowerCase()} ${displayCost.toFixed(2)} · edit to lock limit`}
              </p>
            </label>
            <label className="block">
              <span className={labelCls}>Packages</span>
              <input
                className={field}
                type="number"
                min={1}
                value={position.contracts}
                onChange={(e) =>
                  setPosition((p) => ({
                    ...p,
                    contracts: Math.max(1, parseInt(e.target.value, 10) || 1),
                  }))
                }
              />
            </label>
          </div>

          <div>
            <span className={labelCls}>ToS script</span>
            <button
              type="button"
              className="block w-full rounded-lg border border-[var(--color-separator)] bg-black/30 px-3 py-2 text-left font-mono text-[11px] text-white/80"
              onClick={() => {
                if (!tosScript) return;
                void navigator.clipboard.writeText(tosScript).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                });
              }}
            >
              {tosScript || "—"}
              <span className="ml-2 text-[10px] text-white/40">
                {copied ? "Copied" : "click to copy"}
              </span>
            </button>
          </div>

          <div className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-3 text-sm">
            <div className="font-semibold text-[var(--color-label)]">
              {previewLabel}
            </div>
            <div className="font-mono text-xs text-[var(--color-label-secondary)]">
              {previewNotation}
            </div>
            <div className="mt-1 text-xs text-[var(--color-label-tertiary)]">
              ${displayCost.toFixed(2)} {costLabel}
              {position.contracts > 1 ? ` × ${position.contracts}` : ""}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-separator)] px-4 py-3">
          <button type="button" className={btn} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={position.legs.length === 0}
            data-testid="position-builder-analyze"
            onClick={() =>
              onSave(
                {
                  ...position,
                  net_debit_override:
                    position.net_debit_override != null
                      ? position.net_debit_override
                      : displayCost > 0
                        ? Number(displayCost.toFixed(2))
                        : null,
                  direction,
                },
                previewLabel,
                previewNotation,
              )
            }
          >
            {mode === "edit" ? "Update" : "Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}

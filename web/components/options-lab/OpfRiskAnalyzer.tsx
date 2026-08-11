"use client";

/**
 * Options Lab Analyzer — full OPF exercise surface.
 *
 * Data: dual-side chain · Pricing: OPF packs only · Render: PnLChart
 * Position Builder (live mids) · position cards · threshold alerts
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  clearAnalyzerTrade,
  loadAnalyzerTrade,
  saveAnalyzerTrade,
  type StoredAnalyzerTrade,
} from "@/lib/options-lab/analyzerTrade";
import {
  createPriceAlert,
  evaluateAlerts,
  loadAlerts,
  loadPositions,
  packageMidFromLegs,
  positionFromInput,
  saveAlerts,
  savePositions,
  type AnalyzerPosition,
  type AnalyzerThresholdAlert,
} from "@/lib/options-lab/analyzerBook";
import {
  DEFAULT_OPF_MODEL,
  OPF_ANALYZER_MODELS,
  findOpfModel,
  type OpfModelOption,
} from "@/lib/options-lab/opfModels";
import { parseTosScript } from "@/lib/options-lab/tosParser";
import { positionToParsedTrade } from "@/lib/options-lab/positionToTrade";
import type { PositionInput } from "@/lib/options-lab/positionTypes";
import { useBuilderChain } from "@/lib/options-lab/useBuilderChain";
import { useOpfRiskGraph } from "@/lib/options-lab/useOpfRiskGraph";
import AnalyzerAlertsSection from "@/components/options-lab/AnalyzerAlertsSection";
import AnalyzerPositionsList from "@/components/options-lab/AnalyzerPositionsList";
import PositionBuilder from "@/components/options-lab/PositionBuilder";
import PnLChart, {
  type PnLChartHandle,
  type PriceAlertType,
} from "@/components/options-lab/msc-risk/PnLChart";

const fieldLabel =
  "mb-1 block text-xs font-medium text-[var(--color-label-secondary)]";
const control =
  "block w-full rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] " +
  "px-3 py-2 text-sm text-[var(--color-label)] shadow-sm " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]";
const btn =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-label)] " +
  "shadow-sm hover:bg-[var(--color-fill)] disabled:opacity-45";

export default function OpfRiskAnalyzer() {
  const { symbol, setSymbol, universe, loading: universeLoading } =
    useOptionsLab();
  const [raw, setRaw] = useState("");
  const [stored, setStored] = useState<StoredAnalyzerTrade | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [spotStr, setSpotStr] = useState("");
  const [vixStr, setVixStr] = useState("");
  const [model, setModel] = useState<OpfModelOption>(DEFAULT_OPF_MODEL);

  const [timeMachineEnabled, setTimeMachineEnabled] = useState(false);
  const [simTimeOffsetHours, setSimTimeOffsetHours] = useState(0);
  const [simVolatilityOffset, setSimVolatilityOffset] = useState(0);
  const [simSpotPct, setSimSpotPct] = useState(0);

  const [positions, setPositions] = useState<AnalyzerPosition[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AnalyzerThresholdAlert[]>([]);

  const chartRef = useRef<PnLChartHandle>(null);

  // Persist book
  useEffect(() => {
    setPositions(loadPositions());
    setAlerts(loadAlerts());
  }, []);
  useEffect(() => {
    savePositions(positions);
  }, [positions]);
  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  const hydrate = useCallback(() => {
    const s = loadAnalyzerTrade();
    setStored(s);
    if (s?.raw) {
      setRaw(s.raw);
      setParseError(null);
    }
  }, []);

  useEffect(() => {
    hydrate();
    const onEvt = () => hydrate();
    window.addEventListener("ft-analyzer-trade", onEvt);
    return () => window.removeEventListener("ft-analyzer-trade", onEvt);
  }, [hydrate]);

  const focused = useMemo(
    () => positions.find((p) => p.id === focusedId) ?? null,
    [positions, focusedId],
  );

  const tradeFromPaste = useMemo(() => {
    if (!raw.trim()) return null;
    return parseTosScript(raw);
  }, [raw]);

  // Focused position book wins over paste for OPF resolve
  const trade = useMemo(() => {
    if (focused && focused.visible) {
      return positionToParsedTrade(focused.position);
    }
    return tradeFromPaste;
  }, [focused, tradeFromPaste]);

  useEffect(() => {
    if (!raw.trim() || focused) {
      setParseError(null);
      return;
    }
    setParseError(tradeFromPaste ? null : "Could not parse ToS line");
  }, [raw, tradeFromPaste, focused]);

  useEffect(() => {
    if (trade?.symbol) {
      const known = universe.some((u) => u.symbol === trade.symbol);
      if (known && trade.symbol !== symbol) setSymbol(trade.symbol);
    }
  }, [trade?.symbol, symbol, universe, setSymbol]);

  const warmExps = useMemo(() => {
    const s = new Set<string>();
    for (const p of positions) {
      s.add(p.position.expiration);
      for (const l of p.position.legs) {
        if (l.expiration) s.add(l.expiration);
      }
    }
    if (trade) {
      s.add(trade.expiration);
      for (const l of trade.legs) s.add(l.expiration);
    }
    return [...s];
  }, [positions, trade]);

  const chain = useBuilderChain(symbol, warmExps, true);

  // Live reprice package mids on cards
  useEffect(() => {
    if (!positions.length || !chain.expirations.length) return;
    setPositions((prev) => {
      let changed = false;
      const next = prev.map((pos) => {
        const mid = packageMidFromLegs(
          pos.position.legs,
          (exp, strike, type) => {
            const c = chain.getContract(exp, strike, type);
            return c?.mid ?? null;
          },
          pos.position.expiration,
        );
        if (mid == null) return pos;
        const abs = Math.abs(mid);
        const side: "debit" | "credit" = mid >= 0 ? "debit" : "credit";
        // long pays → mid sum of qty*sign: our packageMid uses long +1 so debit structure is positive cost
        // Actually packageMidFromLegs: long + mid, short - mid → debit fly natural cost is positive
        const priceSide: "debit" | "credit" =
          mid >= 0 ? "debit" : "credit";
        if (
          pos.livePackagePerShare != null &&
          Math.abs(pos.livePackagePerShare - abs) < 1e-6 &&
          pos.priceSide === priceSide
        ) {
          return pos;
        }
        changed = true;
        return {
          ...pos,
          livePackagePerShare: abs,
          priceSide,
          updatedAt: Date.now(),
        };
      });
      return changed ? next : prev;
    });
  }, [chain, positions.length, chain.spot, warmExps.join("|")]);

  const spotOverride = useMemo(() => {
    const n = Number(spotStr);
    if (Number.isFinite(n) && n > 0) return n;
    return null;
  }, [spotStr]);

  const vix = useMemo(() => {
    const n = Number(vixStr);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [vixStr]);

  const risk = useOpfRiskGraph({
    trade,
    spotOverride,
    vix,
    useCase: model.useCase,
    packId: model.packId,
    timeOffsetHours: timeMachineEnabled ? simTimeOffsetHours : 0,
    volOffsetPts: simVolatilityOffset,
    spotPct: simSpotPct,
    enabled: !!trade,
  });

  const activeModel = findOpfModel(risk.packId ?? model.packId);
  const displaySpot = spotOverride ?? risk.spot ?? chain.spot ?? trade?.body ?? 0;

  // Evaluate alerts against spot
  useEffect(() => {
    if (!(displaySpot > 0)) return;
    setAlerts((prev) => {
      const next = evaluateAlerts(prev, displaySpot, symbol);
      return next === prev ? prev : next;
    });
  }, [displaySpot, symbol]);

  useEffect(() => {
    if (risk.spot != null && !spotStr.trim()) {
      setSpotStr(String(Math.round(risk.spot * 100) / 100));
    } else if (chain.spot != null && !spotStr.trim()) {
      setSpotStr(String(Math.round(chain.spot * 100) / 100));
    }
  }, [risk.spot, chain.spot, spotStr]);

  const resetSim = () => {
    setTimeMachineEnabled(false);
    setSimTimeOffsetHours(0);
    setSimVolatilityOffset(0);
    setSimSpotPct(0);
  };

  const simSpot = displaySpot * (1 + simSpotPct / 100);
  const hasCurves =
    !!trade &&
    risk.expirationPoints.length > 0 &&
    risk.theoreticalPoints.length > 0;

  const alertLines = useMemo(
    () =>
      alerts
        .filter((a) => a.enabled && a.status !== "dismissed")
        .filter((a) => !a.symbol || a.symbol === symbol)
        .map((a) => ({
          price: a.targetPrice,
          color: a.color,
          label: a.type.replace("price_", ""),
          style:
            a.status === "triggered"
              ? ("active" as const)
              : ("dashed" as const),
        })),
    [alerts, symbol],
  );

  const onOpenAlertDialog = useCallback(
    (price: number, type: PriceAlertType) => {
      const a = createPriceAlert({
        type,
        symbol,
        targetPrice: price,
        positionId: focusedId ?? undefined,
      });
      setAlerts((prev) => [a, ...prev]);
    },
    [symbol, focusedId],
  );

  const handleBuilderSave = useCallback(
    (input: PositionInput, label: string, notation: string) => {
      if (editId) {
        setPositions((prev) =>
          prev.map((p) =>
            p.id === editId
              ? {
                  ...p,
                  label,
                  notation,
                  position: {
                    ...input,
                    legs: input.legs.map((l) => ({ ...l })),
                  },
                  livePackagePerShare:
                    input.net_debit_override != null
                      ? Math.abs(input.net_debit_override)
                      : p.livePackagePerShare,
                  priceSide:
                    input.direction === "sell" ? "credit" : p.priceSide,
                  updatedAt: Date.now(),
                }
              : p,
          ),
        );
        setFocusedId(editId);
      } else {
        const pos = positionFromInput(input);
        pos.label = label;
        pos.notation = notation;
        setPositions((prev) => [pos, ...prev]);
        setFocusedId(pos.id);
      }
      // Sync ToS paste buffer for transparency
      const t = positionToParsedTrade(input);
      if (t.raw) {
        setRaw(t.raw);
        saveAnalyzerTrade(t.raw, "builder");
        setStored(loadAnalyzerTrade());
      }
      setBuilderOpen(false);
      setEditId(null);
    },
    [editId],
  );

  const editInitial = useMemo(() => {
    if (!editId) return null;
    return positions.find((p) => p.id === editId)?.position ?? null;
  }, [editId, positions]);

  const legMarks = (risk.result?.marks?.leg_marks || []) as Array<{
    leg_id?: string;
    side?: string;
    strike?: number;
    mid?: number | null;
    iv?: number | null;
    iv_source?: string;
  }>;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
      data-testid="options-lab-opf-risk-analyzer"
    >
      <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-[var(--color-separator)] bg-[var(--color-surface)] p-3 lg:w-[21rem] lg:border-b-0 lg:border-r">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            Risk Graph
          </h2>
          <p className="text-[11px] text-[var(--color-label-tertiary)]">
            OPF only · live builder · position cards · threshold alerts
          </p>
        </div>

        <AnalyzerPositionsList
          positions={positions}
          focusedId={focusedId}
          onFocus={setFocusedId}
          onToggleVisibility={(id) =>
            setPositions((prev) =>
              prev.map((p) =>
                p.id === id ? { ...p, visible: !p.visible } : p,
              ),
            )
          }
          onEdit={(id) => {
            setEditId(id);
            setBuilderOpen(true);
          }}
          onDelete={(id) => {
            setPositions((prev) => prev.filter((p) => p.id !== id));
            if (focusedId === id) setFocusedId(null);
          }}
          onCreate={() => {
            setEditId(null);
            setBuilderOpen(true);
          }}
          onUpdatePrice={(id, value) =>
            setPositions((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      livePackagePerShare: value,
                      position: {
                        ...p.position,
                        net_debit_override: value,
                      },
                      updatedAt: Date.now(),
                    }
                  : p,
              ),
            )
          }
        />

        <AnalyzerAlertsSection
          alerts={alerts}
          symbol={symbol}
          onAck={(id) =>
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === id ? { ...a, status: "acknowledged" } : a,
              ),
            )
          }
          onDismiss={(id) =>
            setAlerts((prev) =>
              prev.map((a) =>
                a.id === id ? { ...a, status: "dismissed" } : a,
              ),
            )
          }
          onDelete={(id) =>
            setAlerts((prev) => prev.filter((a) => a.id !== id))
          }
        />

        <label className="block">
          <span className={fieldLabel}>OPF model pack</span>
          <select
            className={control}
            value={model.packId}
            onChange={(e) => setModel(findOpfModel(e.target.value))}
            data-testid="opf-model-select"
          >
            {OPF_ANALYZER_MODELS.map((m) => (
              <option key={m.packId} value={m.packId}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] leading-snug text-[var(--color-label-tertiary)]">
            {model.description}
          </p>
        </label>

        <label className="block">
          <span className={fieldLabel}>Symbol</span>
          <select
            className={control}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={universeLoading}
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className={fieldLabel}>ToS trade (paste / Heatmap)</span>
          <textarea
            className={control + " min-h-[4.5rem] font-mono text-[11px]"}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setFocusedId(null); // paste overrides focus
            }}
            spellCheck={false}
            placeholder="BUY +1 BUTTERFLY SPX … @1.25 LMT"
            data-testid="analyzer-tos-input"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn}
            onClick={() => {
              setEditId(null);
              setBuilderOpen(true);
            }}
          >
            Builder
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              if (!parseTosScript(raw)) {
                setParseError("Could not parse ToS line");
                return;
              }
              saveAnalyzerTrade(raw.trim(), "paste");
              setStored(loadAnalyzerTrade());
              setFocusedId(null);
              setParseError(null);
              risk.refresh();
            }}
          >
            Load
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => {
              clearAnalyzerTrade();
              setRaw("");
              setStored(null);
              setFocusedId(null);
              resetSim();
            }}
          >
            Clear
          </button>
          <Link href="/app/options-lab/heatmap" className={btn + " no-underline"}>
            Heatmap
          </Link>
          <button
            type="button"
            className={btn}
            onClick={() => chartRef.current?.autoFit()}
            disabled={!hasCurves}
          >
            Auto-fit
          </button>
          <button
            type="button"
            className={btn}
            onClick={() => risk.refresh()}
            disabled={!trade || risk.loading}
          >
            {risk.loading ? "…" : "Refresh"}
          </button>
        </div>

        {stored?.source === "heatmap" && (
          <p className="text-[11px] text-emerald-500">From Heatmap Option-click</p>
        )}
        {focused && (
          <p className="text-[11px] text-[var(--color-tint)]">
            Graph: {focused.label}
          </p>
        )}
        {parseError && (
          <p className="text-xs text-red-400" role="alert">
            {parseError}
          </p>
        )}
        {risk.error && (
          <p className="text-xs text-amber-400" role="status">
            {risk.error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={fieldLabel}>Spot</span>
            <input
              className={control}
              value={spotStr}
              onChange={(e) => setSpotStr(e.target.value)}
              placeholder={
                risk.spot != null
                  ? String(risk.spot)
                  : chain.spot != null
                    ? String(chain.spot)
                    : "chain"
              }
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>VIX (opt)</span>
            <input
              className={control}
              value={vixStr}
              onChange={(e) => setVixStr(e.target.value)}
              placeholder="OC5a"
            />
          </label>
        </div>

        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={timeMachineEnabled}
                onChange={(e) => setTimeMachineEnabled(e.target.checked)}
              />
              What-if (OPF)
            </label>
            <button
              type="button"
              className="text-[11px] text-[var(--color-tint)]"
              onClick={resetSim}
            >
              Reset
            </button>
          </div>
          <label className="mb-2 block text-xs">
            Time {simTimeOffsetHours >= 0 ? "+" : ""}
            {simTimeOffsetHours.toFixed(0)}h
            <input
              type="range"
              className="mt-1 w-full"
              min={0}
              max={72}
              step={1}
              value={simTimeOffsetHours}
              disabled={!timeMachineEnabled}
              onChange={(e) => setSimTimeOffsetHours(Number(e.target.value))}
            />
          </label>
          <label className="mb-2 block text-xs">
            Vol offset {simVolatilityOffset >= 0 ? "+" : ""}
            {simVolatilityOffset.toFixed(0)} pts
            <input
              type="range"
              className="mt-1 w-full"
              min={-30}
              max={30}
              step={1}
              value={simVolatilityOffset}
              onChange={(e) => setSimVolatilityOffset(Number(e.target.value))}
            />
          </label>
          <label className="block text-xs">
            Spot {simSpotPct >= 0 ? "+" : ""}
            {simSpotPct.toFixed(1)}%
            <input
              type="range"
              className="mt-1 w-full"
              min={-5}
              max={5}
              step={0.1}
              value={simSpotPct}
              onChange={(e) => setSimSpotPct(Number(e.target.value))}
            />
          </label>
        </div>

        {trade && (
          <div className="space-y-1 border-t border-[var(--color-separator)] pt-3 text-xs">
            <div className="font-semibold">
              {trade.symbol} {trade.structure}
            </div>
            {legMarks.length > 0 && (
              <ul className="space-y-0.5 font-mono text-[10px] text-[var(--color-label-secondary)]">
                {legMarks.map((m, i) => (
                  <li key={m.leg_id || i}>
                    {m.side} {m.strike} mid=
                    {m.mid != null ? Number(m.mid).toFixed(2) : "—"} iv=
                    {m.iv != null
                      ? (Number(m.iv) * 100).toFixed(1) + "%"
                      : "—"}{" "}
                    <span className="opacity-50">{m.iv_source}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 gap-1 pt-1 text-center">
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">Mark pkg</div>
                <div className="font-mono text-[11px]">
                  {risk.packageDebit != null
                    ? risk.packageDebit.toFixed(2)
                    : "—"}
                </div>
              </div>
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">RECON</div>
                <div
                  className={
                    "font-mono text-[11px] " +
                    (risk.reconPass === true
                      ? "text-emerald-400"
                      : risk.reconPass === false
                        ? "text-red-400"
                        : "text-white/50")
                  }
                >
                  {risk.reconPass === true
                    ? "pass"
                    : risk.reconPass === false
                      ? "fail"
                      : "—"}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-[var(--color-label-tertiary)]">
              {risk.packId ?? model.packId}
              {risk.engineId ? ` · ${risk.engineId}` : ""}
              {risk.loading ? " · live…" : ""}
            </div>
          </div>
        )}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0e] p-2">
        <div className="mb-2 flex flex-wrap items-center gap-3 px-1 text-xs text-white/50">
          <span className="font-semibold text-white/80">
            {trade ? `${trade.symbol} · OPF risk graph` : "No trade"}
          </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
            {activeModel.label}
          </span>
          <span>
            Max P/L ${risk.maxPnL.toFixed(0)} / ${risk.minPnL.toFixed(0)}
          </span>
          <span className="text-emerald-400/80">Expiration</span>
          <span className="text-fuchsia-400/80">{activeModel.theoLegend}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
          {hasCurves ? (
            <div className="h-full min-h-[420px] w-full">
              <PnLChart
                ref={chartRef}
                expirationData={risk.expirationPoints}
                theoreticalData={risk.theoreticalPoints}
                theoreticalStroke="#e879f9"
                theoreticalLegendLabel={activeModel.theoLegend}
                spotPrice={displaySpot > 0 ? displaySpot : 1}
                spotIndicatorPrice={simSpot > 0 ? simSpot : undefined}
                expirationBreakevens={risk.expirationBreakevens}
                theoreticalBreakevens={risk.theoreticalBreakevens}
                strikes={risk.allStrikes}
                alertLines={alertLines}
                onOpenAlertDialog={onOpenAlertDialog}
                positionLabels={positions
                  .filter((p) => p.visible)
                  .map((p) => ({
                    id: p.id,
                    strikesLabel: p.notation,
                  }))}
                onPositionAlertSelect={(positionId, price) => {
                  const a = createPriceAlert({
                    type: "price_touch",
                    symbol,
                    targetPrice: price,
                    positionId,
                  });
                  setAlerts((prev) => [a, ...prev]);
                }}
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/40">
              {trade && risk.loading ? (
                <span>OPF resolve · dual-side generations…</span>
              ) : trade && risk.error ? (
                <span className="text-amber-400/90">{risk.error}</span>
              ) : (
                <span>
                  Open <strong className="text-white/60">Builder</strong> for
                  live mid package debit, or paste ToS / Heatmap ⌥-click. Right-click
                  the graph for price alerts.
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <PositionBuilder
        open={builderOpen}
        mode={editId ? "edit" : "create"}
        symbol={symbol}
        spotPrice={displaySpot > 0 ? displaySpot : chain.spot || 5000}
        chain={chain}
        initial={editInitial}
        onCancel={() => {
          setBuilderOpen(false);
          setEditId(null);
        }}
        onSave={handleBuilderSave}
      />
    </div>
  );
}

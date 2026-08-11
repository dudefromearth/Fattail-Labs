"use client";

/**
 * Options Lab Analyzer — PB Spec v0.2 + OPF.
 * Card = definition · viewport = OPF viz · package SoR from OPF quote API.
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
  lockLimit,
  lockNatural,
  positionFromInput,
  saveAlerts,
  savePositions,
  unlockCard,
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
import { usePackageQuotes } from "@/lib/options-lab/usePackageQuotes";
import AnalyzerAlertsSection from "@/components/options-lab/AnalyzerAlertsSection";
import AnalyzerPositionsList from "@/components/options-lab/AnalyzerPositionsList";
import PositionBuilder from "@/components/options-lab/PositionBuilder";
import SurfaceViewport from "@/components/options-lab/SurfaceViewport";
import PnLChart, {
  type PnLChartHandle,
  type PriceAlertType,
} from "@/components/options-lab/risk-graph/PnLChart";
import { useSmoothNumber } from "@/lib/useSmoothValue";

/** Analyzer viewport modes — Surface is in-viewport, not a suite app (AZ-VP-S1). */
type AnalyzerViewportMode = "risk" | "surface";

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

/** Clock fallback only when market-plane session facts unavailable (B2). */
function clockPostureFallback(): "Live" | "Held" | "Closed" | "Error" {
  try {
    const d = new Date();
    const et = new Date(
      d.toLocaleString("en-US", { timeZone: "America/New_York" }),
    );
    const day = et.getDay();
    const mins = et.getHours() * 60 + et.getMinutes();
    if (day === 0 || day === 6) return "Closed";
    // Index options often print to 16:15 ET — prefer plane facts when available
    if (mins >= 9 * 60 + 30 && mins < 16 * 60 + 15) return "Live";
    return "Held";
  } catch {
    return "Error";
  }
}

async function fetchPlanePosture(): Promise<"Live" | "Held" | "Closed" | "Error"> {
  try {
    const r = await fetch("/api/me/market/session-status", {
      credentials: "same-origin",
    });
    if (!r.ok) return clockPostureFallback();
    const d = (await r.json()) as {
      open?: boolean;
      market?: string | null;
    };
    if (typeof d.open === "boolean") {
      if (d.open) return "Live";
      const m = String(d.market || "").toLowerCase();
      if (m === "closed" || m === "early-close") return "Closed";
      return "Held";
    }
    return clockPostureFallback();
  } catch {
    return clockPostureFallback();
  }
}

export default function OpfRiskAnalyzer() {
  const { symbol, setSymbol, universe, loading: universeLoading } =
    useOptionsLab();
  const [raw, setRaw] = useState("");
  const [stored, setStored] = useState<StoredAnalyzerTrade | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [spotStr, setSpotStr] = useState("");
  const [vixStr, setVixStr] = useState("");
  const [model, setModel] = useState<OpfModelOption>(DEFAULT_OPF_MODEL);
  const [epochPinned, setEpochPinned] = useState(false);
  const [epochStale, setEpochStale] = useState(false);

  const [timeMachineEnabled, setTimeMachineEnabled] = useState(false);
  const [simTimeOffsetHours, setSimTimeOffsetHours] = useState(0);
  const [simVolatilityOffset, setSimVolatilityOffset] = useState(0);
  const [simSpotPct, setSimSpotPct] = useState(0);

  const [positions, setPositions] = useState<AnalyzerPosition[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AnalyzerThresholdAlert[]>([]);
  const [posture, setPosture] = useState<"Live" | "Held" | "Closed" | "Error">(
    "Held",
  );
  const [viewportMode, setViewportMode] =
    useState<AnalyzerViewportMode>("risk");

  const chartRef = useRef<PnLChartHandle>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

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
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      void fetchPlanePosture().then((p) => {
        if (!cancelled) setPosture(p);
      });
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const sessionHeld = posture === "Held" || posture === "Closed";

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

  const onPackageUpdate = useCallback((id: string, next: AnalyzerPosition) => {
    setPositions((prev) => prev.map((p) => (p.id === id ? next : p)));
  }, []);

  const spotOverride = useMemo(() => {
    const n = Number(spotStr);
    if (Number.isFinite(n) && n > 0) return n;
    return null;
  }, [spotStr]);

  const vix = useMemo(() => {
    const n = Number(vixStr);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [vixStr]);

  /** B4: member spot/VIX / what-if inputs → labeled override; RECON not pass/fail vs live */
  const inputOverrideActive =
    (spotOverride != null && spotOverride > 0) ||
    (vix != null && vix > 0) ||
    timeMachineEnabled ||
    simVolatilityOffset !== 0 ||
    simSpotPct !== 0;

  const risk = useOpfRiskGraph({
    trade,
    spotOverride,
    vix,
    useCase: model.useCase,
    packId: model.packId,
    timeOffsetHours:
      model.useCase === "outlook"
        ? epochPinned
          ? 0
          : timeMachineEnabled
            ? simTimeOffsetHours
            : 0
        : timeMachineEnabled
          ? simTimeOffsetHours
          : 0,
    volOffsetPts: simVolatilityOffset,
    spotPct: simSpotPct,
    enabled: !!trade && !(trade && focused && !focused.visible),
  });

  usePackageQuotes({
    positions,
    sessionHeld,
    enabled: true,
    onUpdate: onPackageUpdate,
    generationEpoch: risk.generationEpoch,
  });

  // Outlook epoch stale when generation moves while pinned
  useEffect(() => {
    if (model.useCase !== "outlook") {
      setEpochStale(false);
      return;
    }
    if (epochPinned && risk.generationEpoch) {
      setEpochStale(true);
    }
  }, [risk.generationEpoch, model.useCase, epochPinned]);

  const activeModel = findOpfModel(risk.packId ?? model.packId);
  const displaySpotRaw =
    spotOverride ?? risk.spot ?? chain.spot ?? trade?.body ?? 0;
  /** Live spot eases between ticks — risk graph line moves continuously */
  const displaySpot =
    useSmoothNumber(displaySpotRaw > 0 ? displaySpotRaw : null, {
      durationMs: 420,
    }) ?? (displaySpotRaw > 0 ? displaySpotRaw : 0);

  // A1: evaluate alerts on raw underlier mark (not smoothed, not what-if override)
  const rawMarkForAlerts = risk.spot ?? chain.spot ?? null;
  useEffect(() => {
    if (rawMarkForAlerts == null || !(rawMarkForAlerts > 0)) return;
    setAlerts((prev) => {
      const next = evaluateAlerts(prev, rawMarkForAlerts, symbol);
      return next === prev ? prev : next;
    });
  }, [rawMarkForAlerts, symbol]);

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
  const incompleteFocus =
    focused?.visible &&
    (focused.liveState === "incomplete" || focused.liveState === "skewed");
  const hasCurves =
    !!trade &&
    !incompleteFocus &&
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
          label:
            (a.type.replace("price_", "") || "alert") +
            (sessionHeld ? " · held" : ""),
          style:
            a.status === "triggered"
              ? ("active" as const)
              : ("dashed" as const),
        })),
    [alerts, symbol, sessionHeld],
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
                  ...positionFromInput(input),
                  id: editId,
                  label,
                  notation,
                  createdAt: p.createdAt,
                  lock: p.lock,
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
      const t = positionToParsedTrade(input);
      if (t.raw) {
        setRaw(t.raw);
        saveAnalyzerTrade(t.raw, "builder");
        setStored(loadAnalyzerTrade());
      }
      setBuilderOpen(false);
      setEditId(null);
      risk.refresh();
    },
    [editId, risk],
  );

  const editInitial = useMemo(() => {
    if (!editId) return null;
    return positions.find((p) => p.id === editId)?.position ?? null;
  }, [editId, positions]);

  const timeRefLabel =
    model.useCase === "day_trade"
      ? sessionHeld
        ? `Held · ${risk.generationEpoch ? "last gen" : "—"}`
        : `Live · gen ${risk.generationEpoch.slice(0, 24) || "…"}`
      : model.useCase === "outlook"
        ? epochStale
          ? "Scenario · epoch stale"
          : "Scenario · epoch"
        : "Replay · no live claim";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
      data-testid="options-lab-opf-risk-analyzer"
    >
      <aside className="flex w-full shrink-0 flex-col gap-3 overflow-y-auto border-b border-[var(--color-separator)] bg-[var(--color-surface)] p-3 lg:w-[21rem] lg:border-b-0 lg:border-r">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            Analyzer
          </h2>
          <p className="text-[11px] text-[var(--color-label-tertiary)]">
            Positions · Alerts · OPF · viewport Risk or Surface
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[10px]">
            <span
              className={
                "rounded px-1.5 py-0.5 font-semibold uppercase " +
                (posture === "Live"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : posture === "Held"
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-white/10 text-white/50")
              }
            >
              {posture}
            </span>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-white/70">
              {activeModel.useCase}
            </span>
          </div>
        </div>

        <AnalyzerPositionsList
          positions={positions}
          focusedId={focusedId}
          sessionHeld={sessionHeld}
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
          onLockNatural={(id) => {
            setPositions((prev) =>
              prev.map((p) => {
                if (p.id !== id) return p;
                try {
                  return lockNatural(p);
                } catch (e) {
                  setParseError(
                    e instanceof Error ? e.message : "lock natural failed",
                  );
                  return p;
                }
              }),
            );
            risk.refresh();
          }}
          onLockLimit={(id) => {
            const pos = positionsRef.current.find((p) => p.id === id);
            if (!pos) return;
            const rawLim = window.prompt(
              "Limit package magnitude (per share)",
              pos.livePackagePerShare != null
                ? String(pos.livePackagePerShare)
                : "1.00",
            );
            if (rawLim == null) return;
            const mag = Math.abs(parseFloat(rawLim));
            if (!Number.isFinite(mag) || mag <= 0) return;
            const isCredit =
              window.confirm("OK = CREDIT limit, Cancel = DEBIT limit") ===
              true;
            setPositions((prev) =>
              prev.map((p) =>
                p.id === id ? lockLimit(p, mag, isCredit) : p,
              ),
            );
            risk.refresh();
          }}
          onUnlock={(id) => {
            setPositions((prev) =>
              prev.map((p) => (p.id === id ? unlockCard(p) : p)),
            );
            risk.refresh();
          }}
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
          <span className={fieldLabel}>OPF model pack / mode</span>
          <select
            className={control}
            value={model.packId}
            onChange={(e) => {
              const m = findOpfModel(e.target.value);
              setModel(m);
              if (m.useCase === "outlook") setEpochPinned(true);
              else setEpochPinned(false);
              setEpochStale(false);
            }}
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
          {model.useCase === "outlook" && (
            <button
              type="button"
              className={btn + " mt-2 w-full"}
              onClick={() => {
                setEpochPinned(false);
                setEpochStale(false);
                risk.refresh();
                setEpochPinned(true);
              }}
            >
              Re-anchor epoch
              {epochStale ? " · stale" : ""}
            </button>
          )}
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
          <span className={fieldLabel}>ToS trade (unlocked-live if no card)</span>
          <textarea
            className={control + " min-h-[4.5rem] font-mono text-[11px]"}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setFocusedId(null);
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
            Viewport: {focused.label}
            {focused.lock.mode === "locked" ? " · locked basis" : ""}
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
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>VIX (opt)</span>
            <input
              className={control}
              value={vixStr}
              onChange={(e) => setVixStr(e.target.value)}
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
            Vol {simVolatilityOffset >= 0 ? "+" : ""}
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
            <div className="grid grid-cols-2 gap-1 text-center">
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">Mark pkg</div>
                <div className="font-mono text-[11px]">
                  {risk.packageDebit != null
                    ? risk.packageDebit.toFixed(2)
                    : focused?.livePackagePerShare != null
                      ? focused.livePackagePerShare.toFixed(2)
                      : "—"}
                </div>
              </div>
              <div className="rounded bg-black/20 p-1">
                <div className="text-[9px] text-white/40">RECON</div>
                <div
                  className={
                    "font-mono text-[11px] " +
                    (inputOverrideActive
                      ? "text-sky-300"
                      : sessionHeld
                        ? "text-white/40"
                        : risk.reconPass === true
                          ? "text-emerald-400"
                          : risk.reconPass === false
                            ? "text-red-400"
                            : "text-white/50")
                  }
                >
                  {inputOverrideActive
                    ? "override"
                    : sessionHeld
                      ? "n/a held"
                      : risk.reconPass === true
                        ? "pass"
                        : risk.reconPass === false
                          ? "fail"
                          : "—"}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-[var(--color-label-tertiary)]">
              {risk.packId ?? model.packId}
              {risk.fromCache && !risk.loading
                ? " · restored"
                : risk.loading
                  ? " · live…"
                  : ""}
            </div>
          </div>
        )}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0e] p-2">
        <div className="mb-2 flex flex-wrap items-center gap-3 px-1 text-xs text-white/50">
          {/* Viewport mode — Surface is in-canvas, not suite nav (AZ-VP-S1) */}
          <div
            className="inline-flex rounded-full border border-white/15 bg-white/5 p-0.5"
            role="tablist"
            aria-label="Analyzer viewport"
            data-testid="analyzer-viewport-mode"
          >
            {(
              [
                { id: "risk" as const, label: "Risk graph" },
                { id: "surface" as const, label: "Surface" },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={viewportMode === m.id}
                className={
                  "rounded-full px-3 py-1 text-[11px] font-semibold transition " +
                  (viewportMode === m.id
                    ? "bg-white/15 text-white"
                    : "text-white/45 hover:text-white/70")
                }
                onClick={() => setViewportMode(m.id)}
                data-testid={`analyzer-viewport-${m.id}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <span className="font-semibold text-white/80">
            {trade
              ? `${trade.symbol} · ${viewportMode === "surface" ? "Surface" : "OPF risk graph"}`
              : "No trade"}
          </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
            {activeModel.label}
          </span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60">
            {timeRefLabel}
          </span>
          {viewportMode === "risk" && (
            <>
              <span>
                Max P/L ${risk.maxPnL.toFixed(0)} / ${risk.minPnL.toFixed(0)}
              </span>
              <span className="text-emerald-400/80">Expiration</span>
              <span className="text-fuchsia-400/80">
                {activeModel.theoLegend}
              </span>
            </>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
          {viewportMode === "surface" ? (
            <SurfaceViewport
              hasTrade={!!trade && !incompleteFocus}
              symbol={trade?.symbol || symbol}
              packLabel={activeModel.label}
              loading={risk.loading}
              error={risk.error}
            />
          ) : incompleteFocus ? (
            <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-amber-400/90">
              Incomplete or skewed package — no fabricated curve (PB-VIEW-6).
              Wait for dual-side generations or fix legs.
            </div>
          ) : hasCurves ? (
            <div className="h-full min-h-[420px] w-full">
              <PnLChart
                ref={chartRef}
                expirationData={risk.expirationPoints}
                theoreticalData={risk.theoreticalPoints}
                theoreticalStroke="#e879f9"
                theoreticalLegendLabel={
                  activeModel.theoLegend + (sessionHeld ? " · held" : "")
                }
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
                <span>OPF resolve · generation apply…</span>
              ) : trade && risk.error ? (
                <span className="text-amber-400/90">{risk.error}</span>
              ) : (
                <span>
                  Open <strong className="text-white/60">Builder</strong> for
                  live OPF package, or paste ToS. Right-click graph for alerts.
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

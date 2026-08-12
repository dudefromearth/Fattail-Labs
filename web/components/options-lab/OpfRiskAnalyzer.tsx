"use client";

/**
 * Options Lab Analyzer — Spec v0.2.1 + PB Spec v0.3 + OPF.
 * Layout OD-AZ1/2: top Controls · viewport · divider · Positions · Alerts.
 * Card = definition · viewport = OPF viz · package SoR from OPF quote API.
 */

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useOptionsLab } from "@/lib/optionsLabContext";
import { loadAnalyzerTrade } from "@/lib/options-lab/analyzerTrade";
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
  setCardDirection,
  setCardExpiration,
  unlockCard,
  type AnalyzerPosition,
  type AnalyzerThresholdAlert,
} from "@/lib/options-lab/analyzerBook";
import {
  clockPostureFallback,
  postureFromSessionStatus,
  type SessionPosture,
} from "@/lib/options-lab/sessionPosture";
import {
  DEFAULT_OPF_MODEL,
  OPF_ANALYZER_MODELS,
  findOpfModel,
  type OpfModelOption,
} from "@/lib/options-lab/opfModels";
import { parseTosScript } from "@/lib/options-lab/tosParser";
import {
  parsedTradeToPositionInput,
  positionToParsedTrade,
} from "@/lib/options-lab/positionToTrade";
import { buildLabel, buildNotation } from "@/lib/options-lab/positionLabels";
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

const BOOK_H_KEY = "ft_analyzer_book_height_px";
const BOOK_H_MIN = 72;
const BOOK_H_DEFAULT = 200;
const VIEWPORT_H_MIN = 140;

const fieldLabel =
  "mb-0.5 block text-[10px] font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]";
const controlSm =
  "rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] " +
  "px-2 py-1 text-xs text-[var(--color-label)]";
const btn =
  "inline-flex min-h-8 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-label)] " +
  "shadow-sm hover:bg-[var(--color-fill)] disabled:opacity-45";

async function fetchPlanePosture(): Promise<SessionPosture> {
  try {
    const r = await fetch("/api/me/market/session-status", {
      credentials: "same-origin",
    });
    if (!r.ok) return clockPostureFallback();
    const d = (await r.json()) as {
      open?: boolean | null;
      market?: string | null;
      ok?: boolean;
    };
    return postureFromSessionStatus(d) ?? clockPostureFallback();
  } catch {
    return clockPostureFallback();
  }
}

export default function OpfRiskAnalyzer() {
  const { symbol, setSymbol, universe, loading: universeLoading } =
    useOptionsLab();
  const [bookNotice, setBookNotice] = useState<string | null>(null);
  const [spotStr, setSpotStr] = useState("");
  const [vixStr, setVixStr] = useState("");
  /** Member edited spot/VIX fields (auto-fill is not an override). */
  const [spotDirty, setSpotDirty] = useState(false);
  const [vixDirty, setVixDirty] = useState(false);
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
  const [posture, setPosture] = useState<SessionPosture>("Held");
  const [viewportMode, setViewportMode] =
    useState<AnalyzerViewportMode>("risk");

  const chartRef = useRef<PnLChartHandle>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  /** Draggable book height (px) — viewport takes the rest. */
  const [bookHeightPx, setBookHeightPx] = useState(BOOK_H_DEFAULT);
  const splitDragRef = useRef<{
    startY: number;
    startH: number;
  } | null>(null);
  const mainSplitRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOK_H_KEY);
      if (!raw) return;
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n >= BOOK_H_MIN) setBookHeightPx(n);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(BOOK_H_KEY, String(bookHeightPx));
    } catch {
      /* ignore */
    }
  }, [bookHeightPx]);

  const onSplitPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      splitDragRef.current = { startY: e.clientY, startH: bookHeightPx };
    },
    [bookHeightPx],
  );

  const onSplitPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = splitDragRef.current;
      if (!drag) return;
      // Drag handle up → more book height; down → less
      const delta = drag.startY - e.clientY;
      let next = drag.startH + delta;
      const main = mainSplitRef.current;
      if (main) {
        const maxBook = Math.max(
          BOOK_H_MIN,
          main.clientHeight - VIEWPORT_H_MIN - 8,
        );
        next = Math.min(maxBook, Math.max(BOOK_H_MIN, next));
      } else {
        next = Math.max(BOOK_H_MIN, next);
      }
      setBookHeightPx(Math.round(next));
    },
    [],
  );

  const onSplitPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (splitDragRef.current) {
        splitDragRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
    },
    [],
  );

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

  /** Heatmap handoff → book card (never a ToS paste viewport path). */
  const ingestHandoffRaw = useCallback((raw: string, source: string) => {
    const parsed = parseTosScript(raw);
    if (!parsed) {
      setBookNotice("Handoff could not be parsed into a position card.");
      return;
    }
    const input = parsedTradeToPositionInput(parsed);
    const pos = positionFromInput(input);
    pos.label = buildLabel(input.underlying, input.legs, input.expiration);
    pos.notation = buildNotation(input.legs);
    setPositions((prev) => [pos, ...prev]);
    setFocusedId(pos.id);
    if (parsed.symbol) {
      const known = universe.some((u) => u.symbol === parsed.symbol);
      if (known) setSymbol(parsed.symbol);
    }
    setBookNotice(
      source === "heatmap"
        ? `Heatmap → book: ${pos.label}`
        : `Added to book: ${pos.label}`,
    );
  }, [universe, setSymbol]);

  useEffect(() => {
    const onEvt = () => {
      const s = loadAnalyzerTrade();
      if (s?.raw) ingestHandoffRaw(s.raw, s.source || "handoff");
    };
    // Consume any pending handoff once on mount
    const pending = loadAnalyzerTrade();
    if (pending?.raw && pending.source === "heatmap") {
      ingestHandoffRaw(pending.raw, "heatmap");
    }
    window.addEventListener("ft-analyzer-trade", onEvt);
    return () => window.removeEventListener("ft-analyzer-trade", onEvt);
  }, [ingestHandoffRaw]);

  // Viewport = selected visible book card only (no ToS paste definition)
  const focused = useMemo(() => {
    if (focusedId) {
      const hit = positions.find((p) => p.id === focusedId);
      if (hit) return hit;
    }
    return positions.find((p) => p.visible) ?? positions[0] ?? null;
  }, [positions, focusedId]);

  // Keep focusedId aligned when list changes
  useEffect(() => {
    if (!positions.length) {
      if (focusedId) setFocusedId(null);
      return;
    }
    if (focusedId && positions.some((p) => p.id === focusedId)) return;
    const first = positions.find((p) => p.visible) ?? positions[0];
    if (first) setFocusedId(first.id);
  }, [positions, focusedId]);

  const trade = useMemo(() => {
    if (focused && focused.visible) {
      return positionToParsedTrade(focused.position);
    }
    return null;
  }, [focused]);

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
    return [...s];
  }, [positions]);

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

  /** B4/A6: override when what-if Enable + knobs, or member-edited spot/VIX */
  const whatIfActive =
    timeMachineEnabled &&
    (simTimeOffsetHours !== 0 ||
      simVolatilityOffset !== 0 ||
      simSpotPct !== 0);
  const memberSpotVixOverride =
    (spotDirty && spotOverride != null && spotOverride > 0) ||
    (vixDirty && vix != null && vix > 0);
  const inputOverrideActive = whatIfActive || memberSpotVixOverride;

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
    // A6: Enable gates all knobs — vol/spot% ignored unless what-if enabled
    volOffsetPts: timeMachineEnabled ? simVolatilityOffset : 0,
    spotPct: timeMachineEnabled ? simSpotPct : 0,
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
    if (spotDirty) return;
    if (risk.spot != null && risk.spot > 0) {
      setSpotStr(String(Math.round(risk.spot * 100) / 100));
    } else if (chain.spot != null && chain.spot > 0) {
      setSpotStr(String(Math.round(chain.spot * 100) / 100));
    }
  }, [risk.spot, chain.spot, spotDirty]);

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
  /** MSC: visible + past expiry → ghost image (dashed grey at-expiry only). */
  const focusExpiredVisible = useMemo(() => {
    if (!focused?.visible) return false;
    const exp =
      focused.position.expiration ||
      focused.position.legs[0]?.expiration ||
      "";
    if (!exp) return false;
    const e = new Date(exp.slice(0, 10) + "T16:00:00Z");
    return e.getTime() <= Date.now();
  }, [focused]);
  const hasCurves =
    !!trade &&
    !incompleteFocus &&
    risk.expirationPoints.length > 0 &&
    (focusExpiredVisible || risk.theoreticalPoints.length > 0);

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
      setBookNotice(null);
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

  const positionsHandlers = {
    positions,
    focusedId,
    sessionHeld,
    sessionSymbol: symbol,
    expirations: chain.expirations,
    onFocus: (id: string) => {
      setFocusedId(id);
      const p = positionsRef.current.find((x) => x.id === id);
      if (p?.position.underlying && p.position.underlying !== symbol) {
        setSymbol(p.position.underlying);
      }
    },
    onToggleVisibility: (id: string) =>
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)),
      ),
    onEdit: (id: string) => {
      setEditId(id);
      setBuilderOpen(true);
    },
    onDelete: (id: string) => {
      setPositions((prev) => prev.filter((p) => p.id !== id));
      if (focusedId === id) setFocusedId(null);
    },
    onCreate: () => {
      setEditId(null);
      setBuilderOpen(true);
    },
    onLockNatural: (id: string) => {
      setPositions((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          try {
            return lockNatural(p);
          } catch (e) {
            setBookNotice(
              e instanceof Error ? e.message : "lock natural failed",
            );
            return p;
          }
        }),
      );
      risk.refresh();
    },
    onLockLimit: (id: string) => {
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
        window.confirm("OK = CREDIT limit, Cancel = DEBIT limit") === true;
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? lockLimit(p, mag, isCredit) : p)),
      );
      risk.refresh();
    },
    onUnlock: (id: string) => {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? unlockCard(p) : p)),
      );
      risk.refresh();
    },
    onSetDirection: (id: string, direction: "buy" | "sell") => {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? setCardDirection(p, direction) : p)),
      );
      risk.refresh();
    },
    onSetExpiration: (id: string, expiration: string) => {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === id
            ? setCardExpiration(p, expiration, chain.expirations)
            : p,
        ),
      );
      risk.refresh();
    },
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-row"
      data-testid="options-lab-opf-risk-analyzer"
    >
      {/* Controls — left column (Coach: not top strip) */}
      <aside
        className="flex w-[15.5rem] shrink-0 flex-col gap-2.5 overflow-y-auto border-r border-[var(--color-separator)] bg-[var(--color-surface)] p-2.5"
        data-testid="analyzer-controls-column"
      >
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-label)]">
            Analyzer
          </h2>
          <p className="text-[10px] text-[var(--color-label-tertiary)]">
            Controls · Models · Time machine
          </p>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
            <span
              className={
                "rounded px-1.5 py-0.5 font-semibold uppercase " +
                (posture === "Live"
                  ? "bg-emerald-500/20 text-emerald-600"
                  : posture === "Held"
                    ? "bg-amber-500/20 text-amber-700"
                    : "bg-[var(--color-fill)] text-[var(--color-label-tertiary)]")
              }
              data-testid="analyzer-posture-badge"
            >
              {posture}
            </span>
            <span className="rounded bg-[var(--color-fill)] px-1.5 py-0.5 text-[var(--color-label-secondary)]">
              {activeModel.useCase}
            </span>
          </div>
        </div>

        {(inputOverrideActive || sessionHeld) && (
          <div
            className={
              "rounded-md px-2 py-1.5 text-[10px] font-medium leading-snug " +
              (inputOverrideActive
                ? "bg-sky-500/15 text-sky-800 dark:text-sky-200"
                : "bg-amber-500/15 text-amber-900 dark:text-amber-100")
            }
            data-testid="analyzer-override-banner"
            role="status"
          >
            {inputOverrideActive
              ? "Override active — RECON is override (not live pass/fail)."
              : posture === "Closed"
                ? "Session closed — Held; no Live claim."
                : "Session Held — last generation; not Live."}
          </div>
        )}

        <label className="block">
          <span className={fieldLabel}>Symbol</span>
          <select
            className={controlSm + " w-full"}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={universeLoading}
            data-testid="analyzer-symbol-select"
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={fieldLabel}>OPF model</span>
          <select
            className={controlSm + " w-full"}
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
          <p className="mt-0.5 text-[9px] leading-snug text-[var(--color-label-tertiary)]">
            {model.description}
          </p>
        </label>

        <div className="grid grid-cols-2 gap-1.5">
          <label className="block">
            <span className={fieldLabel}>Spot</span>
            <input
              className={controlSm + " w-full font-mono"}
              value={spotStr}
              onChange={(e) => {
                setSpotDirty(true);
                setSpotStr(e.target.value);
              }}
              data-testid="analyzer-spot-input"
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>VIX</span>
            <input
              className={controlSm + " w-full font-mono"}
              value={vixStr}
              onChange={(e) => {
                setVixDirty(true);
                setVixStr(e.target.value);
              }}
              data-testid="analyzer-vix-input"
            />
          </label>
        </div>

        <div
          className="flex flex-col gap-1.5 rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-2 py-2"
          data-testid="analyzer-whatif-panel"
        >
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-label)]">
              <input
                type="checkbox"
                checked={timeMachineEnabled}
                onChange={(e) => setTimeMachineEnabled(e.target.checked)}
                data-testid="analyzer-whatif-enable"
              />
              What-if
            </label>
            <button
              type="button"
              className="text-[10px] text-[var(--color-tint)]"
              onClick={resetSim}
            >
              Reset
            </button>
          </div>
          <label className="block text-[10px] text-[var(--color-label-tertiary)]">
            Time {simTimeOffsetHours >= 0 ? "+" : ""}
            {simTimeOffsetHours.toFixed(0)}h
            <input
              type="range"
              className="mt-0.5 w-full"
              min={0}
              max={72}
              step={1}
              value={simTimeOffsetHours}
              disabled={!timeMachineEnabled}
              onChange={(e) => setSimTimeOffsetHours(Number(e.target.value))}
              data-testid="analyzer-whatif-time"
            />
          </label>
          <label className="block text-[10px] text-[var(--color-label-tertiary)]">
            Vol {simVolatilityOffset >= 0 ? "+" : ""}
            {simVolatilityOffset.toFixed(0)} pts
            <input
              type="range"
              className="mt-0.5 w-full"
              min={-30}
              max={30}
              step={1}
              value={simVolatilityOffset}
              disabled={!timeMachineEnabled}
              onChange={(e) => setSimVolatilityOffset(Number(e.target.value))}
              data-testid="analyzer-whatif-vol"
            />
          </label>
          <label className="block text-[10px] text-[var(--color-label-tertiary)]">
            Spot {simSpotPct >= 0 ? "+" : ""}
            {simSpotPct.toFixed(1)}%
            <input
              type="range"
              className="mt-0.5 w-full"
              min={-5}
              max={5}
              step={0.1}
              value={simSpotPct}
              disabled={!timeMachineEnabled}
              onChange={(e) => setSimSpotPct(Number(e.target.value))}
              data-testid="analyzer-whatif-spotpct"
            />
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            className={btn + " w-full"}
            onClick={() => {
              setEditId(null);
              setBuilderOpen(true);
            }}
            data-testid="analyzer-open-builder"
          >
            Builder
          </button>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              className={btn}
              onClick={() => risk.refresh()}
              disabled={!trade || risk.loading}
            >
              {risk.loading ? "…" : "Refresh"}
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => chartRef.current?.autoFit()}
              disabled={!hasCurves}
            >
              Auto-fit
            </button>
          </div>
          {model.useCase === "outlook" && (
            <button
              type="button"
              className={btn + " w-full"}
              onClick={() => {
                setEpochPinned(false);
                setEpochStale(false);
                risk.refresh();
                setEpochPinned(true);
              }}
            >
              Re-anchor{epochStale ? " · stale" : ""}
            </button>
          )}
          <Link
            href="/app/options-lab/heatmap"
            className={btn + " w-full no-underline"}
          >
            Heatmap
          </Link>
        </div>

        {(trade || focused || bookNotice || risk.error) && (
          <div className="space-y-1 border-t border-[var(--color-separator)] pt-2 text-[11px] text-[var(--color-label-secondary)]">
            {focused && (
              <p
                className="text-[var(--color-tint)]"
                data-testid="analyzer-viewport-focus"
              >
                Viewport · {focused.label}
                {focused.lock.mode === "locked" ? " · locked" : ""}
              </p>
            )}
            {trade && (
              <div className="grid grid-cols-2 gap-1 text-center">
                <div className="rounded bg-[var(--color-fill)] p-1">
                  <div className="text-[9px] text-[var(--color-label-tertiary)]">
                    Mark pkg
                  </div>
                  <div className="font-mono text-[11px] text-[var(--color-label)]">
                    {risk.packageDebit != null
                      ? risk.packageDebit.toFixed(2)
                      : focused?.livePackagePerShare != null
                        ? focused.livePackagePerShare.toFixed(2)
                        : "—"}
                  </div>
                </div>
                <div className="rounded bg-[var(--color-fill)] p-1">
                  <div className="text-[9px] text-[var(--color-label-tertiary)]">
                    RECON
                  </div>
                  <div
                    className={
                      "font-mono text-[11px] font-semibold " +
                      (inputOverrideActive
                        ? "text-sky-600"
                        : sessionHeld
                          ? "text-[var(--color-label-tertiary)]"
                          : risk.reconPass === true
                            ? "text-emerald-600"
                            : risk.reconPass === false
                              ? "text-red-500"
                              : "")
                    }
                    data-testid="analyzer-recon-chip"
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
            )}
            {trade && (
              <p className="text-[10px] text-[var(--color-label-tertiary)]">
                {risk.packId ?? model.packId}
                {risk.fromCache && !risk.loading
                  ? " · cache stale"
                  : risk.loading
                    ? " · live…"
                    : ""}
              </p>
            )}
            {bookNotice && (
              <p className="text-emerald-600" role="status">
                {bookNotice}
              </p>
            )}
            {risk.error && (
              <p className="text-amber-600" role="status">
                {risk.error}
              </p>
            )}
          </div>
        )}
      </aside>

      {/* Right column: viewport + book (under) + alerts — list never left of viewport */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={mainSplitRef}
        className="flex min-h-0 min-w-0 flex-1 flex-col"
        data-testid="analyzer-main-split"
      >
        {/* Viewport — fills remaining space above book */}
        <section
          className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0e] p-2"
          data-testid="analyzer-viewport-region"
        >
          <div className="mb-2 flex shrink-0 flex-wrap items-center gap-3 px-1 text-xs text-white/50">
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
              <div className="flex h-full min-h-[120px] items-center justify-center px-6 text-center text-sm text-amber-400/90">
                Incomplete or skewed package — no fabricated curve (PB-VIEW-6).
                Wait for dual-side generations or fix legs.
              </div>
            ) : hasCurves ? (
              <div className="h-full min-h-0 w-full">
                <PnLChart
                  ref={chartRef}
                  /* MSC expired ghost: live series off; at-expiry dashed grey only */
                  expirationData={
                    focusExpiredVisible ? [] : risk.expirationPoints
                  }
                  theoreticalData={
                    focusExpiredVisible ? [] : risk.theoreticalPoints
                  }
                  expiredExpirationData={
                    focusExpiredVisible ? risk.expirationPoints : []
                  }
                  expiredTheoreticalData={[]}
                  theoreticalStroke="#e879f9"
                  theoreticalLegendLabel={
                    focusExpiredVisible
                      ? "Expired ghost (at-expiry)"
                      : activeModel.theoLegend +
                        (sessionHeld ? " · held" : "")
                  }
                  spotPrice={displaySpot > 0 ? displaySpot : 1}
                  spotIndicatorPrice={
                    timeMachineEnabled && simSpot > 0 ? simSpot : undefined
                  }
                  expirationBreakevens={
                    focusExpiredVisible ? [] : risk.expirationBreakevens
                  }
                  theoreticalBreakevens={
                    focusExpiredVisible ? [] : risk.theoreticalBreakevens
                  }
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
              <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-white/40">
                {trade && risk.loading ? (
                  <span>OPF resolve · generation apply…</span>
                ) : trade && risk.error ? (
                  <span className="text-amber-400/90">{risk.error}</span>
                ) : (
                  <span>
                    Select a{" "}
                    <strong className="text-white/60">position</strong> in the
                    book, or open{" "}
                    <strong className="text-white/60">Builder</strong>.
                    Right-click graph for alerts.
                  </span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Draggable divider — drag to resize viewport vs position book */}
        <div
          className="group relative z-10 flex h-3 shrink-0 cursor-row-resize touch-none items-center justify-center border-y border-[var(--color-separator)] bg-[var(--color-fill)] hover:bg-[var(--color-tint)]/20 active:bg-[var(--color-tint)]/30"
          data-testid="analyzer-book-divider"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Drag to resize position book"
          aria-valuenow={bookHeightPx}
          tabIndex={0}
          onPointerDown={onSplitPointerDown}
          onPointerMove={onSplitPointerMove}
          onPointerUp={onSplitPointerUp}
          onPointerCancel={onSplitPointerUp}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setBookHeightPx((h) => h + 16);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              setBookHeightPx((h) => Math.max(BOOK_H_MIN, h - 16));
            }
          }}
        >
          <span
            className="h-0.5 w-10 rounded-full bg-[var(--color-label-tertiary)] group-hover:bg-[var(--color-tint)]"
            aria-hidden
          />
        </div>

        {/* Positions book — fixed height from drag; scrolls when content overflows */}
        <div
          className="flex shrink-0 flex-col overflow-hidden border-b border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1"
          style={{ height: bookHeightPx }}
          data-testid="analyzer-positions-region"
        >
          <AnalyzerPositionsList {...positionsHandlers} />
        </div>
      </div>

      {/* Alerts under book (OD-AZ2) — own scroll, not part of drag split */}
      <div
        className="max-h-[16vh] shrink-0 overflow-y-auto bg-[var(--color-surface)] px-3 py-2"
        data-testid="analyzer-alerts-region"
      >
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
      </div>
      </div>

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

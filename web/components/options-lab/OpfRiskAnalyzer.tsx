"use client";

/**
 * Options Lab Analyzer — Spec v0.2.1 + PB Spec v0.3 + OPF.
 * Layout OD-AZ1/2: top Controls · viewport · divider · Positions · Alerts.
 * Card = definition · viewport = OPF viz · package SoR from OPF quote API.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  clearAnalyzerTrade,
  loadAnalyzerTrade,
} from "@/lib/options-lab/analyzerTrade";
import {
  createPriceAlert,
  evaluateAlerts,
  loadAlerts,
  loadPositions,
  lockLimit,
  lockNatural,
  closePosition,
  positionFromInput,
  saveAlerts,
  savePositions,
  setCardDirection,
  setCardExpiration,
  shiftCardStrikes,
  unlockCard,
  type AnalyzerPosition,
  type AnalyzerThresholdAlert,
} from "@/lib/options-lab/analyzerBook";
import {
  clockPostureFallback,
  planeIsPrinting,
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
  combineParsedTrades,
  parsedTradeToPositionInput,
} from "@/lib/options-lab/positionToTrade";
import { buildLabel, buildNotation } from "@/lib/options-lab/positionLabels";
import type { PositionInput } from "@/lib/options-lab/positionTypes";
import { useBuilderChain } from "@/lib/options-lab/useBuilderChain";
import { useOpfRiskGraph } from "@/lib/options-lab/useOpfRiskGraph";
import { usePackageQuotes } from "@/lib/options-lab/usePackageQuotes";
import { analyzerPositionToOpenTrade } from "@/lib/options-lab/analyzerToTradeLog";
import {
  linkTradeLogId,
  syncBookFromTradeLog,
} from "@/lib/options-lab/analyzerTradeLogSync";
import { createTrade, fetchTrades } from "@/lib/tradeLogApi";
import AnalyzerAlertsSection from "@/components/options-lab/AnalyzerAlertsSection";
import AnalyzerPositionsList from "@/components/options-lab/AnalyzerPositionsList";
import PositionBuilder from "@/components/options-lab/PositionBuilder";
import SurfaceViewport from "@/components/options-lab/SurfaceViewport";
import PnLChart, {
  type PnLChartHandle,
  type PriceAlertType,
} from "@/components/options-lab/risk-graph/PnLChart";
import { useSmoothNumber } from "@/lib/useSmoothValue";
import {
  expiredGhostSeries,
  resolveViewportBookPolicy,
  visibleBookTrade,
} from "@/lib/options-lab/cardDisplayState";

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
      printing?: boolean | null;
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

  // Sync hydrate so the first paint already has the book. An empty first
  // frame used to blank the viewport on every remount (suite nav / tab return).
  const [positions, setPositions] = useState<AnalyzerPosition[]>(
    () => loadPositions(),
  );
  const bookHydrated = true;
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AnalyzerThresholdAlert[]>(
    () => loadAlerts(),
  );
  const [posture, setPosture] = useState<SessionPosture>("Held");
  const [viewportMode, setViewportMode] =
    useState<AnalyzerViewportMode>("risk");

  const chartRef = useRef<PnLChartHandle>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  /** Handoff payloads already applied this session (savedAt) — never re-mint. */
  const consumedHandoffAt = useRef<Set<number>>(new Set());

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
    if (searchParams.get("builder") === "1") {
      setEditId(null);
      setBuilderOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    // Never persist the pre-hydrate empty default — that wiped the book and
    // fought the user after delete+reload races with handoff re-ingest.
    if (!bookHydrated) return;
    savePositions(positions);
  }, [positions, bookHydrated]);
  useEffect(() => {
    if (!bookHydrated) return;
    saveAlerts(alerts);
  }, [alerts, bookHydrated]);

  useEffect(() => {
    if (!bookHydrated) return;
    let alive = true;
    const pull = async () => {
      const linked = positionsRef.current.some(
        (p) => p.tradeLogTradeId != null && p.closedAt == null,
      );
      if (!linked) return;
      const res = await fetchTrades(null, { full: true, limit: 200 });
      if (!alive || !res.ok) return;
      const { next, changed } = syncBookFromTradeLog(
        positionsRef.current,
        res.data.trades || [],
      );
      if (changed) setPositions(next);
    };
    void pull();
    const onFocus = () => void pull();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [bookHydrated, positions]);
  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      void fetchPlanePosture().then((p) => {
        if (!cancelled) setPosture(p);
      });
    };
    tick();
    // Faster while Held/Closed so open → Live is noticed within ~10s of the bell
    // (not stuck on 30s with pre-open marks). Live can poll slower.
    const intervalMs = 10_000;
    const id = window.setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const sessionHeld = posture !== "Live";
  const planePrinting = planeIsPrinting(posture);

  /**
   * Heatmap / suite handoff → one book card.
   * Payload is consumed (cleared) so remount / re-nav does not re-create cards
   * the member already deleted.
   */
  const ingestHandoffRaw = useCallback(
    (raw: string, source: string, savedAt?: number) => {
      if (savedAt != null && consumedHandoffAt.current.has(savedAt)) {
        clearAnalyzerTrade();
        return;
      }
      const parsed = parseTosScript(raw);
      if (!parsed) {
        setBookNotice("Handoff could not be parsed into a position card.");
        clearAnalyzerTrade();
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
      if (savedAt != null) consumedHandoffAt.current.add(savedAt);
      // One-shot: book is SoR after ingest; pending trade must not respawn cards.
      clearAnalyzerTrade();
    },
    [universe, setSymbol],
  );

  useEffect(() => {
    if (!bookHydrated) return;
    // Live handoff events: apply once, then clear storage (see ingestHandoffRaw).
    const onEvt = () => {
      const s = loadAnalyzerTrade();
      if (s?.raw) ingestHandoffRaw(s.raw, s.source || "handoff", s.savedAt);
    };
    // Mount: only auto-apply pending heatmap sends (not stale paste leftovers).
    const pending = loadAnalyzerTrade();
    if (pending?.raw && pending.source === "heatmap") {
      ingestHandoffRaw(pending.raw, "heatmap", pending.savedAt);
    }
    window.addEventListener("ft-analyzer-trade", onEvt);
    return () => window.removeEventListener("ft-analyzer-trade", onEvt);
  }, [bookHydrated, ingestHandoffRaw]);

  // Highlight only — does not drive the viewport (show/hide is independent).
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

  // Viewport = every shown card, additive. Checkbox, not radio.
  const bookTrade = useMemo(
    () =>
      visibleBookTrade(positions, {
        sessionHeld,
        symbol,
      }),
    [positions, sessionHeld, symbol],
  );
  const trades = bookTrade.trades;
  const trade = bookTrade.trade;

  useEffect(() => {
    if (trade?.symbol) {
      const known = universe.some((u) => u.symbol === trade.symbol);
      if (known && trade.symbol !== symbol) setSymbol(trade.symbol);
    }
  }, [trade?.symbol, symbol, universe, setSymbol]);

  // Keep OPF ladders warm even with an empty book (Create dialog must hydrate)
  const warmExps = useMemo(() => {
    const s = new Set<string>();
    for (const p of positions) {
      s.add(p.position.expiration);
      for (const l of p.position.legs) {
        if (l.expiration) s.add(l.expiration);
      }
    }
    // Always warm session calendar when Create may open with no cards
    const today = new Date().toISOString().slice(0, 10);
    s.add(today);
    return [...s].filter(Boolean);
  }, [positions]);

  const chain = useBuilderChain(symbol, warmExps, true, {
    offMarket: !planePrinting,
  });

  // When Builder opens, force OPF refresh so Create is never a dead panel
  useEffect(() => {
    if (!builderOpen) return;
    chain.refresh();
    for (const e of chain.expirations) chain.ensureExpiration(e);
  }, [builderOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPackageUpdate = useCallback((id: string, next: AnalyzerPosition) => {
    setPositions((prev) => {
      // Do not re-insert a deleted id (stale quote completions).
      if (!prev.some((p) => p.id === id)) return prev;
      return prev.map((p) => (p.id === id ? next : p));
    });
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
    trades,
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
    enabled: trades.length > 0,
    pollLive: planePrinting,
  });

  const { refreshForMarketOpen } = usePackageQuotes({
    positions,
    sessionHeld,
    enabled: true,
    onUpdate: onPackageUpdate,
    generationEpoch: risk.generationEpoch,
    // OPF/chain listed calendar — bind step 1 membership
    listedExpirations: chain.expirations,
  });

  // Stable open-handlers (risk.refresh is recreated each render)
  const chainRefreshRef = useRef(chain.refresh);
  chainRefreshRef.current = chain.refresh;
  const riskRefreshRef = useRef(risk.refresh);
  riskRefreshRef.current = risk.refresh;
  const marketOpenRefreshRef = useRef(refreshForMarketOpen);
  marketOpenRefreshRef.current = refreshForMarketOpen;

  // Plane Held/Closed → Live: rebuild OPF chain + risk graph + package marks
  const prevPostureRef = useRef(posture);
  useEffect(() => {
    const prev = prevPostureRef.current;
    prevPostureRef.current = posture;
    if (prev === posture) return;
    if (posture !== "Live") return;
    if (prev !== "Held" && prev !== "Closed") return;
    chainRefreshRef.current();
    riskRefreshRef.current();
    void marketOpenRefreshRef.current();
  }, [posture]);

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
  /**
   * OT-EF viewport policy: named state + no fabricated live curve.
   * Never replace the graph shell with cryptic PB-VIEW-6 copy.
   */
  const viewportFocus = useMemo(
    () => resolveViewportBookPolicy(positions, { sessionHeld }),
    [positions, sessionHeld],
  );
  const curveMode = viewportFocus?.curveMode ?? (trades.length ? "live" : "empty");
  const showExpiredGhost = viewportFocus?.showExpiredGhost === true;
  /** Live package series only when Law B says price is representable. */
  const drawLiveCurves = curveMode === "live";
  const ghostPoints = useMemo(
    () =>
      showExpiredGhost
        ? expiredGhostSeries(positions, {
            sessionHeld,
            symbol,
            spot: displaySpot > 0 ? displaySpot : null,
          })
        : [],
    [showExpiredGhost, positions, sessionHeld, symbol, displaySpot],
  );
  /** ATM for empty shell — chain/risk/spot field, never 0 */
  const axisSpot = useMemo(() => {
    if (displaySpot > 0) return displaySpot;
    if (risk.spot != null && risk.spot > 0) return risk.spot;
    if (chain.spot != null && chain.spot > 0) return chain.spot;
    const n = Number(spotStr);
    if (Number.isFinite(n) && n > 0) return n;
    // Product-ish defaults so grid still paints before first mark
    const s = (symbol || "SPX").toUpperCase();
    if (s === "SPX" || s === "XSP") return 6000;
    if (s === "NDX" || s.startsWith("NQ")) return 21000;
    if (s === "RUT") return 2200;
    return 100;
  }, [displaySpot, risk.spot, chain.spot, spotStr, symbol]);
  const hasLiveSeries =
    drawLiveCurves &&
    risk.expirationPoints.length > 0 &&
    risk.theoreticalPoints.length > 0;
  const hasGhostSeries = showExpiredGhost && ghostPoints.length > 0;
  const hasCurves = hasLiveSeries || hasGhostSeries;

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
                  entryAt: p.entryAt,
                  closedAt: p.closedAt,
                  closedPnl: p.closedPnl,
                  tradeLogTradeId: p.tradeLogTradeId,
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
        prev.map((p) =>
          p.id === id ? { ...p, visible: !p.visible } : p,
        ),
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
    onSetEntryAt: (id: string, entryAt: number) => {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, entryAt, updatedAt: Date.now() } : p,
        ),
      );
    },
    onClosePosition: (id: string) => {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? closePosition(p) : p)),
      );
    },
    onSendToTradeLog: async (id: string) => {
      const pos = positionsRef.current.find((p) => p.id === id);
      if (!pos) return;
      const draft = analyzerPositionToOpenTrade(pos);
      const res = await createTrade(draft);
      if (!res.ok) {
        setBookNotice(
          res.error.kind === "err"
            ? res.error.message
            : "Could not send this position to Trade Log.",
        );
        return;
      }
      const tid = res.data?.id;
      if (tid != null && Number.isFinite(tid)) {
        setPositions((prev) =>
          prev.map((p) => (p.id === id ? linkTradeLogId(p, tid) : p)),
        );
      }
      setBookNotice(
        "Sent to Trade Log as an open trade (simulation). Linked — a Trade Log close will close it here too.",
      );
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
    onLockLimit: (id: string, magnitude: number) => {
      const pos = positionsRef.current.find((p) => p.id === id);
      if (!pos) return;
      const mag = Math.abs(magnitude);
      if (!Number.isFinite(mag) || mag <= 0) return;
      const isCredit = pos.priceSide === "credit";
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
      // Atomic pointer rebind: definition changes once; package quote resolves
      // once to a final state (no continuous re-search / flash).
      setPositions((prev) =>
        prev.map((p) =>
          p.id === id
            ? setCardExpiration(p, expiration, chain.expirations)
            : p,
        ),
      );
      chain.ensureExpiration(expiration);
      // Curves refresh is separate; package marks settle via definition epoch
      risk.refresh();
    },
    onShiftStrikes: (id: string, direction: "up" | "down") => {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === id
            ? shiftCardStrikes(p, direction, (exp) =>
                chain.getStrikes(exp),
              )
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
                  : posture === "Extended"
                    ? "bg-sky-500/20 text-sky-800 dark:text-sky-200"
                    : "bg-amber-500/20 text-amber-800 dark:text-amber-100")
              }
              data-testid="analyzer-posture-badge"
            >
              {posture === "Live"
                ? "Live"
                : posture === "Extended"
                  ? "Pre/post"
                  : "Off market"}
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
              : posture === "Extended"
                ? "Pre/post session — Massive last print / extended quotes. Not RTH NBBO."
                : "Off market — last print. Not polling a live chain."}
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
            {(bookTrade.contributingIds.length > 0 || focused) && (
              <p
                className="text-[var(--color-tint)]"
                data-testid="analyzer-viewport-focus"
              >
                Viewport ·{" "}
                {bookTrade.contributingIds.length > 1
                  ? `${bookTrade.contributingIds.length} positions`
                  : bookTrade.contributingIds.length === 1
                    ? (positions.find(
                        (p) => p.id === bookTrade.contributingIds[0],
                      )?.label ?? focused?.label)
                    : focused?.label}
                {bookTrade.contributingIds.length === 1 &&
                positions.find((p) => p.id === bookTrade.contributingIds[0])
                  ?.lock.mode === "locked"
                  ? " · locked"
                  : ""}
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
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
            {viewportMode === "surface" ? (
              <SurfaceViewport
                hasTrade={trades.length > 0 && drawLiveCurves}
                symbol={trade?.symbol || symbol}
                packLabel={activeModel.label}
                loading={risk.loading}
                error={risk.error}
                notice={viewportFocus?.notice ?? null}
                trade={
                  trades.length > 1
                    ? combineParsedTrades(trades)
                    : trade
                }
                spot={risk.spot}
                legMarks={risk.result?.marks?.leg_marks ?? null}
              />
            ) : (
              <div
                className="relative h-full min-h-[240px] w-full"
                data-testid="analyzer-risk-viewport"
                data-curve-mode={curveMode}
              >
                <PnLChart
                  ref={chartRef}
                  /*
                   * OT-EF / PB-VIEW-6: never fabricate a live package curve.
                   * Minimal state = scales + grid (always). Curves optional.
                   */
                  expirationData={
                    drawLiveCurves ? risk.expirationPoints : []
                  }
                  theoreticalData={
                    drawLiveCurves ? risk.theoreticalPoints : []
                  }
                  expiredExpirationData={ghostPoints}
                  expiredTheoreticalData={[]}
                  theoreticalStroke="#e879f9"
                  theoreticalLegendLabel={
                    showExpiredGhost && !drawLiveCurves
                      ? "Expired · at-expiry residual"
                      : activeModel.theoLegend +
                        (sessionHeld ? " · held" : "")
                  }
                  spotPrice={axisSpot}
                  spotIndicatorPrice={
                    timeMachineEnabled && simSpot > 0 ? simSpot : undefined
                  }
                  expirationBreakevens={
                    drawLiveCurves ? risk.expirationBreakevens : []
                  }
                  theoreticalBreakevens={
                    drawLiveCurves ? risk.theoreticalBreakevens : []
                  }
                  strikes={
                    drawLiveCurves
                      ? risk.allStrikes
                      : showExpiredGhost
                        ? bookTrade.expiredTrades.flatMap((t) =>
                            t.legs.map((l) => l.strike),
                          )
                        : []
                  }
                  alertLines={alertLines}
                  onOpenAlertDialog={onOpenAlertDialog}
                  positionLabels={
                    drawLiveCurves || showExpiredGhost
                      ? positions
                          .filter((p) => p.visible)
                          .map((p) => ({
                            id: p.id,
                            strikesLabel: p.notation,
                          }))
                      : []
                  }
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
                {/* Centered notice over grid — translucent so scales stay readable */}
                {viewportFocus?.notice ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"
                    data-testid="analyzer-viewport-notice"
                    data-notice-kind={viewportFocus.display.kind}
                  >
                    <div className="max-w-sm rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-center shadow-[var(--elevation-2)] backdrop-blur-sm">
                      <div className="text-[13px] font-semibold tracking-wide text-white/90">
                        {viewportFocus.notice.title}
                      </div>
                      <p className="mt-1.5 text-[12px] leading-snug text-white/60">
                        {viewportFocus.notice.detail}
                      </p>
                    </div>
                  </div>
                ) : !hasCurves && trade && risk.loading ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"
                    data-testid="analyzer-viewport-notice"
                    data-notice-kind="updating"
                  >
                    <div className="max-w-sm rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-center backdrop-blur-sm">
                      <div className="text-[13px] font-semibold tracking-wide text-white/90">
                        UPDATING
                      </div>
                      <p className="mt-1.5 text-[12px] leading-snug text-white/60">
                        Building the risk graph for this structure. Scales stay
                        up while marks settle.
                      </p>
                    </div>
                  </div>
                ) : !hasCurves && trade && risk.error ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"
                    data-testid="analyzer-viewport-notice"
                    data-notice-kind="check_legs"
                  >
                    <div className="max-w-sm rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-center backdrop-blur-sm">
                      <div className="text-[13px] font-semibold tracking-wide text-white/90">
                        CHECK LEGS
                      </div>
                      <p className="mt-1.5 text-[12px] leading-snug text-white/60">
                        Could not draw a package curve yet. Confirm every leg is
                        on a listed strike and try again.
                      </p>
                    </div>
                  </div>
                ) : !trade ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"
                    data-testid="analyzer-viewport-notice"
                    data-notice-kind="empty_book"
                  >
                    <div className="max-w-sm rounded-2xl border border-white/12 bg-black/35 px-5 py-3.5 text-center backdrop-blur-sm">
                      <p className="text-[12px] leading-snug text-white/55">
                        Check{" "}
                        <strong className="font-semibold text-white/75">
                          Show
                        </strong>{" "}
                        on one or more positions, or open{" "}
                        <strong className="font-semibold text-white/75">
                          Builder
                        </strong>
                        . Right-click the graph for alerts.
                      </p>
                    </div>
                  </div>
                ) : null}
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
        marketLive={posture === "Live"}
        planePrinting={planePrinting}
        onCancel={() => {
          setBuilderOpen(false);
          setEditId(null);
        }}
        onSave={handleBuilderSave}
      />
    </div>
  );
}

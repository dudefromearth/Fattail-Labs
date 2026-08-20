"use client";

/**
 * Options Lab Analyzer — Spec v0.2.1 + PB Spec v0.3 + OPF.
 * Layout OD-AZ1/2: left Controls inspector · viewport · divider · Positions · Alerts.
 * Card = definition · viewport = OPF viz · package SoR from OPF quote API.
 */

import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useOptionsLab } from "@/lib/optionsLabContext";
import { useWarmTimeOrthoTape } from "@/lib/options-lab/timeOrthoTapeCache";
import {
  clearAnalyzerTrade,
  loadAnalyzerTrade,
} from "@/lib/options-lab/analyzerTrade";
import {
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
  findOpfModel,
  type OpfModelOption,
} from "@/lib/options-lab/opfModels";
import { parseTosScript } from "@/lib/options-lab/tosParser";
import { parsedTradeToPositionInput } from "@/lib/options-lab/positionToTrade";
import { buildLabel, buildNotation } from "@/lib/options-lab/positionLabels";
import type { PositionInput } from "@/lib/options-lab/positionTypes";
import { useBuilderChain } from "@/lib/options-lab/useBuilderChain";
import { useOpfRiskGraph } from "@/lib/options-lab/useOpfRiskGraph";
import {
  formatWhatIfTimeReadout,
  remainingLastTradeHours,
  whatIfTimeStepHours,
} from "@/lib/options-lab/whatIfClocks";
import {
  formatWhatIfVolReadout,
  impliedVolSliderRange,
  loadWhatIfSession,
  majorityRight,
  measuredAtmIvDecimal,
  measuredAtmIvPct,
  saveWhatIfSession,
  volOffsetPtsFromScenario,
} from "@/lib/options-lab/whatIfVol";
import { usePackageQuotes } from "@/lib/options-lab/usePackageQuotes";
import { analyzerPositionToOpenTrade } from "@/lib/options-lab/analyzerToTradeLog";
import {
  linkTradeLogId,
  syncBookFromTradeLog,
} from "@/lib/options-lab/analyzerTradeLogSync";
import { createTrade, fetchTrades } from "@/lib/tradeLogApi";
import AnalyzerAlertsSection from "@/components/options-lab/AnalyzerAlertsSection";
import AnalyzerPositionsList from "@/components/options-lab/AnalyzerPositionsList";
import AnalyzerControlsColumn from "@/components/options-lab/AnalyzerControlsColumn";
import PositionBuilder from "@/components/options-lab/PositionBuilder";
import HostPnLChart from "@/components/options-lab/risk-graph/HostPnLChart";
import type { PnLChartHandle } from "@/lib/risk-graph/pnlChartTypes";
import {
  buildGexProfile,
  gexProfileScale,
  gexTemplate,
} from "@/lib/options-lab/templates/gex";
import type { ValueModeId } from "@/lib/options-lab/templates/types";
import { applyStrikeDragToPosition } from "@/lib/options-lab/listedStrikeDrag";
import { snapToListed } from "@/lib/options-lab/listedStrikes";
import type { StrikeDragInfo } from "@/lib/risk-graph/strikeHandleBind";
import {
  bandFromMassPct,
  RANGE_MASS_1SIGMA,
  RANGE_MASS_2SIGMA,
  tYearsFromRemainingHours,
} from "@/lib/options-lab/probRange";

const GEX_PREF_KEY = "ft_options_lab_analyzer_gex_v1";
const RANGE_PREF_KEY = "ft_options_lab_analyzer_range_v1";
import { useSmoothNumber } from "@/lib/useSmoothValue";
import {
  expiredGhostSeries,
  resolveViewportBookPolicy,
  visibleBookTrade,
} from "@/lib/options-lab/cardDisplayState";

const BOOK_H_KEY = "ft_analyzer_book_height_px";
const BOOK_H_MIN = 72;
/** Header + ~1.25 three-leg cards (default 20-wide fly). */
const BOOK_H_DEFAULT = 288;
const VIEWPORT_H_MIN = 140;

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
  const [, setBookNotice] = useState<string | null>(null);
  const [spotStr, setSpotStr] = useState("");
  const [vixStr, setVixStr] = useState("");
  /** Member edited spot/VIX fields (auto-fill is not an override). */
  const [spotDirty, setSpotDirty] = useState(false);
  const [vixDirty, setVixDirty] = useState(false);
  const [model, setModel] = useState<OpfModelOption>(DEFAULT_OPF_MODEL);
  const [epochPinned, setEpochPinned] = useState(false);
  const [epochStale, setEpochStale] = useState(false);

  const [timeMachineEnabled, setTimeMachineEnabled] = useState(false);
  const [simElapsedHours, setSimElapsedHours] = useState(0);
  const [simIvPct, setSimIvPct] = useState<number | null>(null);
  const [simSpotPct, setSimSpotPct] = useState(0);
  const [wiredVolPts, setWiredVolPts] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const lastMeasuredRef = useRef<number | null>(null);
  const sessionVolOffsetRef = useRef(0);
  const [whatIfHydrated, setWhatIfHydrated] = useState(false);

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
  const [gexEnabled, setGexEnabled] = useState(true);
  const [gexValueMode, setGexValueMode] = useState<ValueModeId>(
    gexTemplate.defaultValueMode,
  );
  const [gexOpacityPct, setGexOpacityPct] = useState(40);
  const [gexPrefReady, setGexPrefReady] = useState(false);
  const [rangeEnabled, setRangeEnabled] = useState(true);
  const [rangeHorizon, setRangeHorizon] = useState("");
  const [rangePct1, setRangePct1] = useState(RANGE_MASS_1SIGMA);
  const [rangePct2, setRangePct2] = useState(RANGE_MASS_2SIGMA);
  const [rangeSecondOn, setRangeSecondOn] = useState(true);
  const [rangePct1Dirty, setRangePct1Dirty] = useState(false);
  const [rangePct2Dirty, setRangePct2Dirty] = useState(false);
  const [rangePrefReady, setRangePrefReady] = useState(false);
  const [strikeDrag, setStrikeDrag] = useState<StrikeDragInfo | null>(null);

  const chartRef = useRef<PnLChartHandle>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const tapeSymbols = useMemo(
    () =>
      [
        ...new Set(
          positions
            .map((p) => (p.position.underlying || "").toUpperCase())
            .filter(Boolean),
        ),
      ],
    [positions],
  );
  useWarmTimeOrthoTape(tapeSymbols, tapeSymbols.length > 0);
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
      if (Number.isFinite(n) && n >= BOOK_H_DEFAULT) setBookHeightPx(n);
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

  useLayoutEffect(() => {
    if (positions.length > 0) return;
    const stored = loadPositions();
    if (stored.length > 0) setPositions(stored);
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GEX_PREF_KEY);
      if (!raw) {
        setGexPrefReady(true);
        return;
      }
      const p = JSON.parse(raw) as {
        enabled?: boolean;
        valueMode?: string;
        opacityPct?: number;
      };
      if (typeof p.enabled === "boolean") setGexEnabled(p.enabled);
      const modes = new Set(gexTemplate.valueModes.map((m) => m.id));
      if (p.valueMode && modes.has(p.valueMode as ValueModeId)) {
        setGexValueMode(p.valueMode as ValueModeId);
      }
      if (typeof p.opacityPct === "number" && Number.isFinite(p.opacityPct)) {
        setGexOpacityPct(Math.max(0, Math.min(100, p.opacityPct)));
      }
    } catch {
      /* ignore */
    }
    setGexPrefReady(true);
  }, []);
  useEffect(() => {
    if (!gexPrefReady) return;
    try {
      sessionStorage.setItem(
        GEX_PREF_KEY,
        JSON.stringify({
          enabled: gexEnabled,
          valueMode: gexValueMode,
          opacityPct: gexOpacityPct,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [gexEnabled, gexValueMode, gexOpacityPct, gexPrefReady]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(RANGE_PREF_KEY);
      if (!raw) {
        setRangePrefReady(true);
        return;
      }
      const p = JSON.parse(raw) as {
        enabled?: boolean;
        horizon?: string;
        pct1?: number;
        pct2?: number;
        secondOn?: boolean;
        pct1Dirty?: boolean;
        pct2Dirty?: boolean;
      };
      if (typeof p.enabled === "boolean") setRangeEnabled(p.enabled);
      if (typeof p.horizon === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.horizon)) {
        setRangeHorizon(p.horizon);
      }
      if (typeof p.pct1 === "number" && Number.isFinite(p.pct1) && p.pct1 >= 50) {
        setRangePct1(Math.max(0.01, Math.min(99.99, Math.round(p.pct1 * 100) / 100)));
      }
      if (typeof p.pct2 === "number" && Number.isFinite(p.pct2) && p.pct2 >= 50) {
        setRangePct2(Math.max(0.01, Math.min(99.99, Math.round(p.pct2 * 100) / 100)));
      }
      if (typeof p.secondOn === "boolean") setRangeSecondOn(p.secondOn);
      if (typeof p.pct1Dirty === "boolean") setRangePct1Dirty(p.pct1Dirty);
      if (typeof p.pct2Dirty === "boolean") setRangePct2Dirty(p.pct2Dirty);
    } catch {
      /* ignore */
    }
    setRangePrefReady(true);
  }, []);
  useEffect(() => {
    if (!rangePrefReady) return;
    try {
      sessionStorage.setItem(
        RANGE_PREF_KEY,
        JSON.stringify({
          enabled: rangeEnabled,
          horizon: rangeHorizon,
          pct1: rangePct1,
          pct2: rangePct2,
          secondOn: rangeSecondOn,
          pct1Dirty: rangePct1Dirty,
          pct2Dirty: rangePct2Dirty,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [
    rangeEnabled,
    rangeHorizon,
    rangePct1,
    rangePct2,
    rangeSecondOn,
    rangePct1Dirty,
    rangePct2Dirty,
    rangePrefReady,
  ]);

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

  const displayPositions = useMemo(() => {
    if (!strikeDrag) return positions;
    return positions.map((p) =>
      p.id === strikeDrag.positionId
        ? applyStrikeDragToPosition(
            p,
            strikeDrag.grabbedStrike,
            strikeDrag.targetStrike,
            strikeDrag.shiftKey,
            (e) => chain.getStrikes(e),
          )
        : p,
    );
  }, [positions, strikeDrag, chain]);

  const graphBook = useMemo(
    () =>
      visibleBookTrade(displayPositions, {
        sessionHeld,
        symbol,
      }),
    [displayPositions, sessionHeld, symbol],
  );

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

  const soonestExp = useMemo(() => {
    const exps: string[] = [];
    for (const t of trades) {
      if (t.expiration) exps.push(t.expiration.slice(0, 10));
      for (const l of t.legs) {
        if (l.expiration) exps.push(l.expiration.slice(0, 10));
      }
    }
    if (!exps.length) return null;
    return exps.sort()[0];
  }, [trades]);

  const remainingHours = useMemo(() => {
    if (!soonestExp) return 0;
    return remainingLastTradeHours(soonestExp, symbol, nowMs);
  }, [soonestExp, symbol, nowMs]);

  const elapsedHours = Math.min(Math.max(0, simElapsedHours), remainingHours);

  const timeOffsetHours =
    model.useCase === "outlook" && epochPinned
      ? 0
      : timeMachineEnabled
        ? elapsedHours
        : 0;

  /** B4/A6: override when what-if Enable + knobs, or member-edited spot/VIX */
  const whatIfActive =
    timeMachineEnabled &&
    (elapsedHours !== 0 || wiredVolPts !== 0 || simSpotPct !== 0);
  const memberSpotVixOverride =
    (spotDirty && spotOverride != null && spotOverride > 0) ||
    (vixDirty && vix != null && vix > 0);
  const inputOverrideActive = whatIfActive || memberSpotVixOverride;

  const risk = useOpfRiskGraph({
    trade: graphBook.trade ?? trade,
    trades: graphBook.trades.length ? graphBook.trades : trades,
    spotOverride,
    vix,
    useCase: model.useCase,
    packId: model.packId,
    timeOffsetHours,
    // A6: Enable gates all knobs — vol/spot% ignored unless what-if enabled
    volOffsetPts: timeMachineEnabled ? wiredVolPts : 0,
    spotPct: timeMachineEnabled ? simSpotPct : 0,
    enabled: (graphBook.trades.length ? graphBook.trades : trades).length > 0,
    pollLive: planePrinting,
    pauseLive: strikeDrag != null,
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
    setSimElapsedHours(0);
    setSimIvPct(lastMeasuredRef.current);
    setWiredVolPts(0);
    sessionVolOffsetRef.current = 0;
    setSimSpotPct(0);
  };

  useEffect(() => {
    const saved = loadWhatIfSession();
    if (saved) {
      sessionVolOffsetRef.current = saved.volOffsetPts;
      setTimeMachineEnabled(saved.enabled);
      setSimElapsedHours(saved.elapsedHours);
      if (saved.enabled) setWiredVolPts(saved.volOffsetPts);
    }
    setWhatIfHydrated(true);
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (simElapsedHours > remainingHours) setSimElapsedHours(remainingHours);
  }, [remainingHours, simElapsedHours]);

  const atmRight = useMemo(
    () => majorityRight(trade?.legs ?? []),
    [trade],
  );
  const measuredPct = useMemo(() => {
    if (!soonestExp || !trades.length) return null;
    const spot =
      (spotOverride != null && spotOverride > 0 ? spotOverride : null) ??
      (risk.spot != null && risk.spot > 0 ? risk.spot : null) ??
      (chain.spot != null && chain.spot > 0 ? chain.spot : null);
    if (spot == null) return null;
    if (!risk.generations.length) return null;
    return measuredAtmIvPct(risk.generations, spot, soonestExp, atmRight);
  }, [
    soonestExp,
    trades.length,
    spotOverride,
    risk.spot,
    risk.generations,
    chain.spot,
    atmRight,
  ]);

  const rangeExpirations = useMemo(
    () =>
      [...chain.expirations]
        .map((e) => e.slice(0, 10))
        .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e))
        .sort(),
    [chain.expirations],
  );

  useEffect(() => {
    if (!rangeExpirations.length) return;
    setRangeHorizon((prev) => {
      if (prev && rangeExpirations.includes(prev)) return prev;
      const fromTrade = (soonestExp || "").slice(0, 10);
      if (fromTrade && rangeExpirations.includes(fromTrade)) return fromTrade;
      return rangeExpirations[0];
    });
  }, [rangeExpirations, soonestExp]);

  const rangeIvDecimal = useMemo(() => {
    if (!rangeHorizon) return null;
    const spot =
      (spotOverride != null && spotOverride > 0 ? spotOverride : null) ??
      (risk.spot != null && risk.spot > 0 ? risk.spot : null) ??
      (chain.spot != null && chain.spot > 0 ? chain.spot : null);
    if (spot == null) return null;
    if (!risk.generations.length) return null;
    const fromGen = measuredAtmIvDecimal(
      risk.generations,
      spot,
      rangeHorizon,
      atmRight,
    );
    if (fromGen != null) return fromGen;
    const strikes = chain.getStrikes(rangeHorizon);
    if (!strikes.length) return null;
    let bestK = strikes[0];
    let bestD = Math.abs(bestK - spot);
    for (const k of strikes) {
      const d = Math.abs(k - spot);
      if (d < bestD) {
        bestK = k;
        bestD = d;
      }
    }
    const c = chain.getContract(rangeHorizon, bestK, atmRight);
    const iv = c?.iv;
    if (iv == null || !(iv > 0) || !Number.isFinite(iv)) return null;
    return iv > 3 ? iv / 100 : iv;
  }, [
    rangeHorizon,
    spotOverride,
    risk.spot,
    risk.generations,
    chain,
    atmRight,
  ]);

  const rangeTYears = useMemo(() => {
    if (!rangeHorizon) return tYearsFromRemainingHours(0);
    return tYearsFromRemainingHours(
      remainingLastTradeHours(rangeHorizon, symbol, nowMs),
    );
  }, [rangeHorizon, symbol, nowMs]);

  const volRange = measuredPct != null ? impliedVolSliderRange(measuredPct) : { min: 1, max: 2 };

  useEffect(() => {
    if (measuredPct == null) return;
    const range = impliedVolSliderRange(measuredPct);
    setSimIvPct((prev) => {
      const offset =
        prev != null && lastMeasuredRef.current != null
          ? prev - lastMeasuredRef.current
          : sessionVolOffsetRef.current;
      lastMeasuredRef.current = measuredPct;
      const next = measuredPct + offset;
      return Math.min(range.max, Math.max(range.min, Math.round(next * 10) / 10));
    });
  }, [measuredPct]);

  useEffect(() => {
    if (!timeMachineEnabled) {
      setWiredVolPts(0);
      return;
    }
    if (measuredPct != null && simIvPct != null) {
      const pts = volOffsetPtsFromScenario(simIvPct, measuredPct);
      sessionVolOffsetRef.current = pts;
      setWiredVolPts(pts);
      return;
    }
    setWiredVolPts(sessionVolOffsetRef.current);
  }, [timeMachineEnabled, measuredPct, simIvPct]);

  useEffect(() => {
    if (!whatIfHydrated) return;
    saveWhatIfSession({
      elapsedHours,
      volOffsetPts: sessionVolOffsetRef.current,
      enabled: timeMachineEnabled,
    });
  }, [elapsedHours, wiredVolPts, timeMachineEnabled, whatIfHydrated]);

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
  const gexProfile = useMemo(() => {
    if (!gexEnabled) return { points: [], scale: 1 };
    const exp = (trade?.expiration || "").slice(0, 10);
    if (!exp) return { points: [], scale: 1 };
    const ctx = chain.getChainContext(exp);
    if (!ctx) return { points: [], scale: 1 };
    const points = buildGexProfile(ctx, gexValueMode);
    return { points, scale: gexProfileScale(points, gexValueMode) };
  }, [gexEnabled, gexValueMode, trade?.expiration, chain]);
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

  const rangeCenterSpot =
    timeMachineEnabled && simSpot > 0
      ? simSpot
      : displaySpot > 0
        ? displaySpot
        : axisSpot;
  const rangeBands = (() => {
    const out: { lo: number; hi: number }[] = [];
    if (!rangeEnabled || rangeIvDecimal == null) return out;
    const args = {
      spot: rangeCenterSpot,
      ivDecimal: rangeIvDecimal,
      tYears: rangeTYears,
    };
    if (rangeSecondOn) {
      const outer = bandFromMassPct({ ...args, massPct: rangePct2 });
      if (outer) out.push(outer);
    }
    const inner = bandFromMassPct({ ...args, massPct: rangePct1 });
    if (inner) out.push(inner);
    return out;
  })();

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

  const strikeHandles = useMemo(() => {
    const out: { strike: number; positionId: string }[] = [];
    const seen = new Set<string>();
    for (const p of displayPositions) {
      if (!p.visible) continue;
      for (const leg of p.position.legs) {
        if (!Number.isFinite(leg.strike)) continue;
        const key = `${p.id}:${leg.strike}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ strike: leg.strike, positionId: p.id });
      }
    }
    return out;
  }, [displayPositions]);

  const onStrikeDrag = useCallback((info: StrikeDragInfo | null) => {
    setStrikeDrag((prev) => {
      if (info == null) return null;
      if (
        prev &&
        prev.positionId === info.positionId &&
        prev.grabbedStrike === info.grabbedStrike &&
        prev.targetStrike === info.targetStrike &&
        prev.shiftKey === info.shiftKey
      ) {
        return prev;
      }
      return info;
    });
  }, []);

  const snapStrike = useCallback(
    (positionId: string, grabbedStrike: number, rawTarget: number) => {
      const pos = positionsRef.current.find((p) => p.id === positionId);
      if (!pos) return grabbedStrike;
      const front = (pos.position.expiration || "").slice(0, 10);
      const leg = pos.position.legs.find(
        (l) => Math.abs(l.strike - grabbedStrike) < 1e-6,
      );
      const exp = (leg?.expiration || front).slice(0, 10);
      const listed = chain.getStrikes(exp);
      return snapToListed(rawTarget, listed) ?? grabbedStrike;
    },
    [chain],
  );

  const onStrikeCommit = useCallback(
    (info: StrikeDragInfo) => {
      setPositions((prev) =>
        prev.map((p) =>
          p.id === info.positionId
            ? applyStrikeDragToPosition(
                p,
                info.grabbedStrike,
                info.targetStrike,
                info.shiftKey,
                (e) => chain.getStrikes(e),
              )
            : p,
        ),
      );
      setStrikeDrag(null);
      risk.refresh();
    },
    [chain, risk],
  );

  return (
    <div
      className="flex min-h-0 flex-1 flex-col md:flex-row"
      data-testid="options-lab-opf-risk-analyzer"
    >
      <AnalyzerControlsColumn
        posture={posture}
        model={model}
        inputOverrideActive={inputOverrideActive}
        sessionHeld={sessionHeld}
        symbol={symbol}
        universe={universe}
        universeLoading={universeLoading}
        onSymbolChange={setSymbol}
        onModelChange={(packId) => {
          const m = findOpfModel(packId);
          setModel(m);
          if (m.useCase === "outlook") setEpochPinned(true);
          else setEpochPinned(false);
          setEpochStale(false);
        }}
        timeMachineEnabled={timeMachineEnabled}
        onTimeMachineEnabled={setTimeMachineEnabled}
        elapsedHours={whatIfHydrated ? elapsedHours : 0}
        onElapsedHours={setSimElapsedHours}
        remainingHours={whatIfHydrated ? remainingHours : 0}
        timeStepHours={
          whatIfHydrated ? whatIfTimeStepHours(remainingHours) : 1
        }
        timeReadout={
          whatIfHydrated && soonestExp
            ? formatWhatIfTimeReadout(nowMs, elapsedHours, remainingHours)
            : "—"
        }
        timeDisabled={
          !timeMachineEnabled || remainingHours <= 0 || trades.length === 0
        }
        simIvPct={simIvPct ?? volRange.min}
        onSimIvPct={setSimIvPct}
        volMin={volRange.min}
        volMax={volRange.max}
        volReadout={
          whatIfHydrated
            ? formatWhatIfVolReadout(
                measuredPct,
                simIvPct ?? measuredPct ?? 0,
                timeMachineEnabled,
                trades.length === 0
                  ? "WAITING"
                  : measuredPct == null
                    ? risk.generations.length
                      ? "IV NO"
                      : "WAITING"
                    : null,
              )
            : "WAITING"
        }
        volDisabled={
          !timeMachineEnabled || measuredPct == null || trades.length === 0
        }
        simSpotPct={simSpotPct}
        onSimSpotPct={setSimSpotPct}
        onResetSim={resetSim}
        onCreate={() => {
          setEditId(null);
          setBuilderOpen(true);
        }}
        onRefresh={() => risk.refresh()}
        refreshDisabled={!trade || risk.loading}
        refreshLoading={risk.loading}
        onAutoFit={() => chartRef.current?.autoFit()}
        autoFitDisabled={!hasCurves}
        showReanchor={model.useCase === "outlook"}
        epochStale={epochStale}
        onReanchor={() => {
          setEpochPinned(false);
          setEpochStale(false);
          risk.refresh();
          setEpochPinned(true);
        }}
        gexEnabled={gexEnabled}
        onGexEnabled={setGexEnabled}
        gexValueMode={gexValueMode}
        onGexValueMode={setGexValueMode}
        gexOpacityPct={gexOpacityPct}
        onGexOpacityPct={setGexOpacityPct}
        rangeEnabled={rangeEnabled}
        onRangeEnabled={setRangeEnabled}
        rangeHorizon={rangeHorizon}
        onRangeHorizon={setRangeHorizon}
        rangeExpirations={rangeExpirations}
        rangePct1={rangePct1}
        onRangePct1={(value) => {
          if (!Number.isFinite(value) || value <= 0) return;
          setRangePct1Dirty(true);
          setRangePct1(Math.max(0.01, Math.min(99.99, Math.round(value * 100) / 100)));
        }}
        rangeSecondOn={rangeSecondOn}
        onRangeSecondOn={setRangeSecondOn}
        rangePct2={rangePct2}
        onRangePct2={(value) => {
          if (!Number.isFinite(value) || value <= 0) return;
          setRangePct2Dirty(true);
          setRangePct2(Math.max(0.01, Math.min(99.99, Math.round(value * 100) / 100)));
        }}
        rangePctDisabled={!rangeHorizon}
      />

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
          <div className="mb-2 flex shrink-0 items-center gap-3 px-1 text-xs text-white/50">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <span className="font-semibold text-white/80">
                {trade ? `${trade.symbol} · OPF risk graph` : "No trade"}
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/80">
                {activeModel.label}
              </span>
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/60">
                {timeRefLabel}
              </span>
              <span>
                Max P/L ${risk.maxPnL.toFixed(0)} / ${risk.minPnL.toFixed(0)}
              </span>
              <span className="text-cyan-400/80">Expiration</span>
              <span className="text-fuchsia-400/80">
                {activeModel.theoLegend}
              </span>
            </div>
            <div className="ml-auto flex shrink-0 items-baseline gap-4">
              <label className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-bold text-yellow-400">Spot</span>
                <input
                  className="w-[8.5rem] border-b border-yellow-400/40 bg-transparent py-0 text-right font-mono text-[24px] font-bold tabular-nums text-yellow-400 outline-none focus:border-yellow-300"
                  value={spotStr}
                  onChange={(e) => {
                    setSpotDirty(true);
                    setSpotStr(e.target.value);
                  }}
                  data-testid="analyzer-spot-input"
                  aria-label="Spot"
                />
              </label>
              <label className="flex items-baseline gap-1.5">
                <span className="text-[16px] font-bold text-red-500">VIX</span>
                <input
                  className="w-[5.75rem] border-b border-red-500/40 bg-transparent py-0 text-right font-mono text-[24px] font-bold tabular-nums text-red-500 outline-none focus:border-red-400"
                  value={vixStr}
                  onChange={(e) => {
                    setVixDirty(true);
                    setVixStr(e.target.value);
                  }}
                  data-testid="analyzer-vix-input"
                  aria-label="VIX"
                />
              </label>
            </div>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
            <div
              className="absolute inset-0"
              data-testid="analyzer-risk-viewport"
              data-curve-mode={curveMode}
            >
                <HostPnLChart
                  ref={chartRef}
                  expirationData={
                    drawLiveCurves ? risk.expirationPoints : []
                  }
                  theoreticalData={
                    drawLiveCurves ? risk.theoreticalPoints : []
                  }
                  expiredExpirationData={ghostPoints}
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
                  gexEnabled={gexEnabled}
                  gexValueMode={gexValueMode}
                  gexPoints={gexProfile.points}
                  gexScale={gexProfile.scale}
                  gexOpacityPct={gexOpacityPct}
                  rangeEnabled={rangeEnabled}
                  rangeBands={rangeBands}
                  strikeHandles={strikeHandles}
                  onStrikeDrag={onStrikeDrag}
                  onStrikeCommit={onStrikeCommit}
                  snapStrike={snapStrike}
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
          className="flex shrink-0 flex-col overflow-hidden border-b border-[var(--color-separator)] bg-[#0a0a0e] px-2 py-1"
          style={{ height: bookHeightPx }}
          data-testid="analyzer-positions-region"
        >
          <AnalyzerPositionsList
            {...positionsHandlers}
            positions={displayPositions}
          />
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

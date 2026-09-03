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
  alertConditionMet,
  toggleAlertRunState,
  applyAlertRunState,
  formatAlertTouchedContext,
  normalizeAlertRunState,
  createPriceAlert,
  createAlgoAlert,
  holderAlertToBuilderSeed,
  evaluateAlerts,
  loadAlerts,
  loadPositions,
  positionStrikeAlertLabel,
  lockLimit,
  lockNatural,
  definedDebitSigned,
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
import { useTmArchiveVix } from "@/lib/options-lab/tmArchiveMarks";
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

import AnalyzerPositionsList from "@/components/options-lab/AnalyzerPositionsList";
import AnalyzerControlsColumn from "@/components/options-lab/AnalyzerControlsColumn";
import PositionBuilder, {
  pickDefaultFrontExpiration,
} from "@/components/options-lab/PositionBuilder";
import { buildListedStructure } from "@/lib/options-lab/listedStructure";
import HostPnLChart from "@/components/options-lab/risk-graph/HostPnLChart";
import AnalyzerTimeMachineStrip from "@/components/options-lab/AnalyzerTimeMachineStrip";
import AnalyzerDayReplayHud from "@/components/options-lab/AnalyzerDayReplayHud";
import type { PnLChartHandle } from "@/lib/risk-graph/pnlChartTypes";
import {
  buildGexProfile,
  gexHorizonExpiration,
  gexProfileScale,
  gexTemplate,
} from "@/lib/options-lab/templates/gex";
import type { ValueModeId } from "@/lib/options-lab/templates/types";
import Button from "@/components/ui/Button";
import AnalyzerSurfacePip from "@/components/options-lab/AnalyzerSurfacePip";
import {
  DEFAULT_PIP,
  loadAnalyzerPip,
  saveAnalyzerPip,
  type PipSize,
} from "@/lib/options-lab/analyzerPip";
import type { OpfLegMarkForSheet } from "@/lib/risk-graph/surfaceModel";
import AlertBuilderDialog, {
  type AlertBuilderSeed,
} from "@/components/options-lab/AlertBuilderDialog";

import type { AlertsManagerDraft } from "@/lib/alerts/analyzerAlertsAdapter";
import { alertUnbound } from "@/lib/alerts/analyzerAlertsAdapter";
import {
  algoEntryDebit,
  isOtmDebitButterfly,
} from "@/lib/options-lab/algoTrailMath";
import {
  algoHudFrozen,
  algoPulseAllowed,
  buildAlgoGuideLines,
  buildAlgoHudModel,
} from "@/lib/options-lab/algoHud";
import {
  remainingHoursForAlgo,
  tickAlgoAlert,
} from "@/lib/options-lab/algoEval";
import { findPnLAtPrice } from "@/lib/risk-graph/hostAlertMenu";
import {
  sessionSpotNow,
  spotPctFromReplay,
} from "@/lib/options-lab/algoDayReplay";
import { useTimeMachineHost } from "@/lib/options-lab/useTimeMachineHost";
import ReplayWatermark from "@/components/options-lab/ReplayWatermark";
import AlgoReasonFeed from "@/components/options-lab/AlgoReasonFeed";
import { algoFeedTape } from "@/lib/options-lab/algoReasonFeed";
import {
  clampSpotPts,
  spotPctFromPts,
  spotPtsRangeFromCanvas,
} from "@/lib/options-lab/whatIfSpotPts";
import { positionNetPremium } from "@/lib/options-lab/positionToTrade";
import { IconChevronUpDown } from "@/components/ui/icons";
import { applyStrikeDragToPosition } from "@/lib/options-lab/listedStrikeDrag";
import { useIsAdmin } from "@/lib/useIsAdmin";
import {
  AUTOFIT_PTS_PER_INCH_DEFAULT,
  AUTOFIT_PTS_PER_INCH_MAX,
  AUTOFIT_PTS_PER_INCH_MIN,
  clampAutofitPtsPerInch,
  loadAutofitPtsPerInch,
  saveAutofitPtsPerInch,
} from "@/lib/options-lab/analyzerAutofitPad";
import { snapToListed } from "@/lib/options-lab/listedStrikes";
import type { StrikeDragInfo } from "@/lib/risk-graph/strikeHandleBind";
import {
  autofitShouldRun2d,
  bookAppearedOnCanvas,
} from "@/lib/risk-graph/pnlChartViewPolicy";
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
import { isTmPositionDark } from "@/lib/options-lab/positionSession";
import { curveFailureNotice } from "@/lib/options-lab/localBookCurves";

const BOOK_H_KEY = "ft_analyzer_book_height_px_v2";
const BOOK_H_MIN = 72;
/** Header + ~1.25 three-leg cards; 20% card height saved goes to the viewport. */
const BOOK_H_DEFAULT = 230;
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

/** Spot and VIX keep hundredths, including .00, so the fields don't jump. */
function formatFixed2(n: number): string {
  if (!Number.isFinite(n)) return "";
  return (Math.round(n * 100) / 100).toFixed(2);
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
  const [reduceMotion, setReduceMotion] = useState(false);
  const [simElapsedHours, setSimElapsedHours] = useState(0);
  const [simIvPct, setSimIvPct] = useState<number | null>(null);
  const [simSpotPts, setSimSpotPts] = useState(0);
  const [canvasX, setCanvasX] = useState<{
    xMin: number;
    xMax: number;
  } | null>(null);
  const [wiredVolPts, setWiredVolPts] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const lastMeasuredRef = useRef<number | null>(null);
  const algoHudFrozenRef = useRef<ReturnType<typeof buildAlgoHudModel>>(null);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
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
  const [alertBuilderOpen, setAlertBuilderOpen] = useState(false);
  const [alertBuilderSeed, setAlertBuilderSeed] =
    useState<AlertBuilderSeed | null>(null);
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
  const [rangeOpacityPct, setRangeOpacityPct] = useState(40);
  const [rangePrefReady, setRangePrefReady] = useState(false);
  const [strikeDrag, setStrikeDrag] = useState<StrikeDragInfo | null>(null);
  const isAdmin = useIsAdmin();
  const [autofitPtsPerInch, setAutofitPtsPerInch] = useState(
    AUTOFIT_PTS_PER_INCH_DEFAULT,
  );
  useEffect(() => {
    setAutofitPtsPerInch(loadAutofitPtsPerInch());
  }, []);
  const [pip, setPip] = useState(DEFAULT_PIP);
  useEffect(() => {
    setPip(loadAnalyzerPip());
  }, []);
  const persistPip = (next: typeof DEFAULT_PIP) => {
    setPip(next);
    saveAnalyzerPip(next);
  };

  const tm = useTimeMachineHost(symbol);
  const tmDay = tm.day;
  const tmSamples = tm.samples;
  const tmHole = tm.hole;
  const tmLoading = tm.loading;
  const tmPlaying = tm.playing;
  const tmSpeed = tm.speed;
  const tmCursor = tm.cursor;
  const tmOpenSpot = tm.openSpot;
  const tmFidelity = tm.fidelity;
  const tmCoverage = tm.coverage;
  const loadTmDay = tm.loadDay;
  const onNeedMonth = tm.onNeedMonth;
  const tmActive = tm.tmActive;
  const tmVix = useTmArchiveVix();
  const wasReplayRef = useRef(false);
  useEffect(() => {
    if (tmActive) {
      wasReplayRef.current = true;
      return;
    }
    if (!wasReplayRef.current) return;
    wasReplayRef.current = false;
    let n = 0;
    setPositions((prev) => {
      const keep = prev.filter((p) => !p.rehearsal);
      n += prev.length - keep.length;
      return keep.length === prev.length ? prev : keep;
    });
    setAlerts((prev) => {
      const keep = prev.filter((a) => !a.rehearsal);
      n += prev.length - keep.length;
      return keep.length === prev.length ? prev : keep;
    });
    setBookNotice(
      "Rehearsal ended. Those cards were practice — not working orders, and they never entered Trade Log.",
    );
  }, [tmActive]);

  useEffect(() => {
    const onPos = () => {
      const pos = positionFromInput({
        underlying: symbol,
        expiration: "2026-08-28",
        contracts: 1,
        direction: "buy",
        legs: [
          {
            strike: 6400,
            type: "call",
            quantity: 1,
            side: "long",
            entry_price: 1,
            expiration: "2026-08-28",
          },
        ],
      });
      pos.rehearsal = true;
      pos.label = "Rehearsal";
      if (tm.tMs != null) pos.entryAt = tm.tMs;
      setPositions((prev) => [pos, ...prev]);
    };
    window.addEventListener("tm-test-rehearsal-pos", onPos);
    return () => window.removeEventListener("tm-test-rehearsal-pos", onPos);
  }, [symbol, tm.tMs]);

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
        opacityPct?: number;
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
      if (
        typeof p.opacityPct === "number" &&
        Number.isFinite(p.opacityPct)
      ) {
        setRangeOpacityPct(Math.max(0, Math.min(100, Math.round(p.opacityPct))));
      }
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
          opacityPct: rangeOpacityPct,
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
    rangeOpacityPct,
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
        playheadMs: tmCursor?.t_ms ?? null,
      }),
    [positions, sessionHeld, symbol, tmCursor?.t_ms],
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
    if (rangeHorizon) s.add(rangeHorizon);
    return [...s].filter(Boolean);
  }, [positions, rangeHorizon]);

  const chain = useBuilderChain(symbol, warmExps, true, {
    offMarket: !planePrinting,
  });
  const simSpotPct = spotPctFromPts(
    simSpotPts,
    chain.spot != null && chain.spot > 0 ? chain.spot : 0,
  );

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

  const closeAlertBuilder = useCallback(() => {
    setAlertBuilderOpen(false);
  }, []);

  const graphBook = useMemo(
    () =>
      visibleBookTrade(displayPositions, {
        sessionHeld,
        symbol,
        playheadMs: tmCursor?.t_ms ?? null,
      }),
    [displayPositions, sessionHeld, symbol, tmCursor?.t_ms],
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
    if (!(Number.isFinite(n) && n > 0)) return null;
    if (tmOpenSpot != null && !spotDirty) return null;
    return n;
  }, [spotStr, tmOpenSpot, spotDirty]);

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
    tmCursor != null
      ? (tmCursor.t_ms - Date.now()) / 3_600_000
      : model.useCase === "outlook" && epochPinned
        ? 0
        : timeMachineEnabled
          ? elapsedHours
          : 0;

  /** B4/A6: override when what-if Enable + knobs, or member-edited spot/VIX */
  const whatIfActive =
    tmCursor != null ||
    (timeMachineEnabled &&
      (elapsedHours !== 0 || wiredVolPts !== 0 || simSpotPts !== 0));
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
    spotPct:
      tmCursor && chain.spot && chain.spot > 0
        ? spotPctFromReplay(tmCursor.spot, chain.spot)
        : timeMachineEnabled
          ? simSpotPct
          : 0,
    enabled: (graphBook.trades.length ? graphBook.trades : trades).length > 0,
    pollLive: planePrinting && !tmActive,
    pauseLive: strikeDrag != null || tmActive,
    tradeIds: graphBook.trades.length ? graphBook.liveIds : undefined,
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
  const opfSpot =
    chain.spot != null && chain.spot > 0
      ? chain.spot
      : risk.spot != null && risk.spot > 0
        ? risk.spot
        : null;
  const opfVix = tmActive
    ? tmVix.mid != null && tmVix.mid > 0
      ? tmVix.mid
      : null
    : chain.vix != null && Number(chain.vix) > 0
      ? Number(chain.vix)
      : null;
  const sessionSpot = sessionSpotNow(tmCursor, tmOpenSpot);

  useEffect(() => {
    const front =
      pickDefaultFrontExpiration(
        chain.expirations,
        posture === "Live",
      ) || chain.expirations[0];
    const listed = front ? chain.getStrikes(front) : [];
    const w = window as Window & { __tmListedReady?: boolean };
    w.__tmListedReady = Boolean(front && listed.length >= 5);
    if (front && listed.length < 5) chain.ensureExpiration(front);
    const onListed = () => {
      const exp =
        pickDefaultFrontExpiration(
          chain.expirations,
          posture === "Live",
        ) || chain.expirations[0];
      if (!exp) return;
      const grid = chain.getStrikes(exp);
      if (grid.length < 5) {
        chain.ensureExpiration(exp);
        return;
      }
      const center =
        (opfSpot != null && opfSpot > 0 && opfSpot) ||
        (sessionSpot != null && sessionSpot > 0 && sessionSpot) ||
        grid[Math.floor(grid.length / 2)];
      const built = buildListedStructure({
        template: "butterfly",
        listed: grid,
        preferCenter: center,
        preferWidth: 20,
        optionSide: "call",
      });
      if (!built) return;
      const input: PositionInput = {
        underlying: symbol,
        expiration: exp,
        contracts: 1,
        direction: "buy",
        legs: built.legs.map((l) => ({ ...l, expiration: exp })),
      };
      const pos = positionFromInput(input);
      pos.label = buildLabel(input.underlying, input.legs, input.expiration);
      pos.notation = buildNotation(input.legs);
      setPositions((prev) => [pos, ...prev]);
    };
    window.addEventListener("tm-test-listed-pos", onListed);
    return () => {
      window.removeEventListener("tm-test-listed-pos", onListed);
      w.__tmListedReady = false;
    };
  }, [chain, posture, opfSpot, sessionSpot, symbol]);

  const displaySpotRaw =
    spotOverride ?? opfSpot ?? trade?.body ?? 0;
  /** Live spot eases between ticks — risk graph line moves continuously */
  const displaySpot =
    useSmoothNumber(displaySpotRaw > 0 ? displaySpotRaw : null, {
      durationMs: 420,
    }) ?? (displaySpotRaw > 0 ? displaySpotRaw : 0);

  // A1: live alerts on raw underlier. Time Machine eligibility uses playhead.
  const rawMarkForAlerts = opfSpot;

  const alertBuilderPositions = useMemo(() => {
    const spot =
      sessionSpot != null && sessionSpot > 0
        ? sessionSpot
        : rawMarkForAlerts != null && rawMarkForAlerts > 0
          ? rawMarkForAlerts
          : displaySpotRaw > 0
            ? displaySpotRaw
            : 0;
    return displayPositions
      .filter((p) => p.visible && !isTmPositionDark(p, tmCursor?.t_ms ?? null))
      .map((p) => {
        const debit = algoEntryDebit({
          definedDebitPerShare: definedDebitSigned(p),
          lockMode: p.lock.mode,
          lockPackageDebit:
            p.lock.mode === "locked" ? p.lock.packageDebitPerShare : null,
          livePackagePerShare: p.livePackagePerShare,
          priceSide: p.priceSide,
          netPremium: positionNetPremium(p.position),
        });
        const listed = chain.getStrikes(p.position.expiration || "");
        return {
          id: p.id,
          strikesLabel: positionStrikeAlertLabel(p),
          algoEligible: isOtmDebitButterfly(
            { legs: p.position.legs, debit },
            spot,
            listed,
          ),
        };
      });
  }, [displayPositions, chain, rawMarkForAlerts, displaySpotRaw, sessionSpot, tmCursor?.t_ms]);

  const liveAlgo = alerts.find(
    (a) =>
      a.alertClass === "algo" &&
      (a.runState === "live" ||
        a.runState === "touched" ||
        a.algoPhase === "recorded"),
  );
  const algoReasonPosts = useMemo(() => {
    if (!liveAlgo?.algo?.reason) return null;
    const phase = liveAlgo.algo.trail_state?.phase ?? liveAlgo.algoPhase;
    return algoFeedTape({
      reasonOn: true,
      phase,
      asOf: liveAlgo.createdAt,
      measurements: {},
      lastTape: [],
      modelFailed: true,
    });
  }, [liveAlgo]);

  const algoHudLive = useMemo(() => {
    if (!liveAlgo?.algo) return null;
    const st = liveAlgo.algo.trail_state;
    if (!st) return null;
    const g = Number.isFinite(st.f)
      ? st.f
      : (liveAlgo.algo.trail_start_pct || 75) / 100;
    return buildAlgoHudModel({
      phase: st.phase,
      H: st.H,
      U: Number.isFinite(st.U) ? st.U : null,
      trailPct: Math.round(g * 100),
      guide_print: st.xS != null && Number.isFinite(st.xS) ? st.xS : null,
    });
  }, [liveAlgo]);
  if (algoHudLive?.frozen) {
    if (!algoHudFrozenRef.current) algoHudFrozenRef.current = algoHudLive;
  } else {
    algoHudFrozenRef.current = null;
  }
  const algoHud = algoHudLive?.frozen ? algoHudFrozenRef.current : algoHudLive;

  const algoPulse =
    alertBuilderPositions.some((p) => p.algoEligible) &&
    !alerts.some((a) => a.alertClass === "algo" && a.runState === "live");
  useEffect(() => {
    setAlerts((prev) => {
      const live = prev.filter((a) => !a.rehearsal);
      const reh = prev.filter((a) => a.rehearsal);
      const nowIso =
        tm.tMs != null ? new Date(tm.tMs).toISOString() : undefined;
      const nextLive =
        rawMarkForAlerts != null && rawMarkForAlerts > 0
          ? evaluateAlerts(live, rawMarkForAlerts, symbol)
          : live;
      const nextReh =
        sessionSpot != null && sessionSpot > 0
          ? evaluateAlerts(reh, sessionSpot, symbol, nowIso)
          : reh;
      const next = [...nextLive, ...nextReh];
      const same =
        next.length === prev.length &&
        next.every((a, i) => a === prev[i] || a.id === prev[i]?.id && a.runState === prev[i]?.runState && a.status === prev[i]?.status);
      return same && nextLive === live && nextReh === reh ? prev : next;
    });
  }, [rawMarkForAlerts, symbol, sessionSpot, tm.tMs]);

  useEffect(() => {
    if (spotDirty) return;
    if (tmOpenSpot != null) {
      setSpotStr(formatFixed2(tmOpenSpot));
      return;
    }
    if (opfSpot != null) {
      setSpotStr(formatFixed2(opfSpot));
    }
  }, [opfSpot, spotDirty, tmOpenSpot]);

  useEffect(() => {
    if (vixDirty) return;
    if (opfVix != null) {
      setVixStr(formatFixed2(opfVix));
    }
  }, [opfVix, vixDirty]);

  const resetSim = () => {
    setTimeMachineEnabled(false);
    setSimElapsedHours(0);
    setSimIvPct(lastMeasuredRef.current);
    setWiredVolPts(0);
    sessionVolOffsetRef.current = 0;
    setSimSpotPts(0);
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

  const simSpot = displaySpot > 0 ? displaySpot + simSpotPts : 0;

  useEffect(() => {
    const anyLive = alerts.some(
      (a) =>
        a.alertClass === "algo" &&
        normalizeAlertRunState(a.runState, a.enabled, a.status) === "live",
    );
    if (!anyLive) return;
    const liveSpot =
      rawMarkForAlerts != null && rawMarkForAlerts > 0 ? rawMarkForAlerts : 0;
    const clockSpot =
      tmCursor && tmCursor.spot > 0
        ? tmCursor.spot
        : timeMachineEnabled && simSpot > 0
          ? simSpot
          : liveSpot;
    if (!(liveSpot > 0) && !(clockSpot > 0)) return;
    const liveNowMs = Date.now();
    const clockNowMs =
      tmCursor != null
        ? tmCursor.t_ms
        : Date.now() + (timeMachineEnabled ? elapsedHours : 0) * 3_600_000;
    const curve = risk.theoreticalPoints.map((p) => ({
      price: p.price,
      pnl: p.pnl / 100,
    }));
    setAlerts((prev) => {
      let changed = false;
      const next = prev.map((a) => {
        if (a.alertClass !== "algo" || !a.algo) return a;
        if (normalizeAlertRunState(a.runState, a.enabled, a.status) !== "live") {
          return a;
        }
        const demo = a.algo.demo === true;
        if (a.rehearsal) {
          if (!(tmCursor && tmCursor.spot > 0)) return a;
        } else if (demo && tmActive) {
          return a;
        }
        const spot = demo || a.rehearsal ? clockSpot : liveSpot;
        if (!(spot > 0)) return a;
        const pos = positions.find((p) => p.id === a.positionId);
        if (!pos) return a;
        const debit = algoEntryDebit({
          definedDebitPerShare: definedDebitSigned(pos),
          lockMode: pos.lock.mode,
          lockPackageDebit:
            pos.lock.mode === "locked" ? pos.lock.packageDebitPerShare : null,
          livePackagePerShare: pos.livePackagePerShare,
          priceSide: pos.priceSide,
          netPremium: positionNetPremium(pos.position),
        });
        const raw = findPnLAtPrice(risk.theoreticalPoints, spot);
        const U = raw == null ? 0 : raw / 100;
        const nowMs = demo || a.rehearsal ? clockNowMs : liveNowMs;
        const ticked = tickAlgoAlert(a, {
          symbol,
          spot,
          U,
          debit,
          legs: pos.position.legs,
          curve,
          remainingHours: remainingHoursForAlgo(a, symbol, nowMs),
          E: null,
        });
        if (ticked !== a) changed = true;
        return ticked;
      });
      return changed ? next : prev;
    });
  }, [
    alerts,
    positions,
    simSpot,
    elapsedHours,
    timeMachineEnabled,
    tmCursor,
    tmActive,
    opfSpot,
    rawMarkForAlerts,
    risk.theoreticalPoints,
    symbol,
  ]);
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
  /** GEX is chain-attached — listed exp, not the shown book. */
  const gexExpiration = useMemo(
    () =>
      gexHorizonExpiration({
        tradeExpiration: trade?.expiration,
        rangeHorizon,
        listedExpirations: chain.expirations,
      }),
    [trade?.expiration, rangeHorizon, chain.expirations],
  );
  useEffect(() => {
    if (!gexEnabled || !gexExpiration) return;
    chain.ensureExpiration(gexExpiration);
  }, [gexEnabled, gexExpiration]); // eslint-disable-line react-hooks/exhaustive-deps
  const gexProfile = useMemo(() => {
    if (!gexEnabled) return { points: [], scale: 1 };
    if (!gexExpiration) return { points: [], scale: 1 };
    const ctx = chain.getChainContext(gexExpiration);
    if (!ctx) return { points: [], scale: 1 };
    const points = buildGexProfile(ctx, gexValueMode);
    return { points, scale: gexProfileScale(points, gexValueMode) };
  }, [gexEnabled, gexValueMode, gexExpiration, chain]);
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
    if (tmOpenSpot != null && tmOpenSpot > 0) return tmOpenSpot;
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
  }, [tmOpenSpot, displaySpot, risk.spot, chain.spot, spotStr, symbol]);

  const spotPtsRange = useMemo(
    () =>
      spotPtsRangeFromCanvas({
        xMin: canvasX?.xMin ?? 0,
        xMax: canvasX?.xMax ?? 0,
        spot: axisSpot,
      }),
    [canvasX, axisSpot],
  );
  useEffect(() => {
    setSimSpotPts((p) => {
      const n = clampSpotPts(p, spotPtsRange);
      return n === p ? p : n;
    });
  }, [spotPtsRange]);

  const onCanvasXRange = useCallback(
    (r: { xMin: number; xMax: number }) => {
      setCanvasX((prev) =>
        prev && prev.xMin === r.xMin && prev.xMax === r.xMax ? prev : r,
      );
    },
    [],
  );

  const rangeCenterSpot =
    tmOpenSpot != null && tmOpenSpot > 0
      ? tmOpenSpot
      : timeMachineEnabled && simSpot > 0
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
    (risk.expirationPoints.length > 0 || risk.theoreticalPoints.length > 0);
  const hasGhostSeries = showExpiredGhost && ghostPoints.length > 0;
  const hasCurves = hasLiveSeries || hasGhostSeries;
  const sheetNotice = curveFailureNotice(risk.error);
  const hadCurvesRef = useRef(false);
  const pendingStrikeFitRef = useRef(false);
  const strikeFitStalePtsRef = useRef<{
    exp: unknown;
    theo: unknown;
  } | null>(null);
  useLayoutEffect(() => {
    const appeared = bookAppearedOnCanvas(hadCurvesRef.current, hasCurves);
    hadCurvesRef.current = hasCurves;
    if (!appeared) return;
    if (
      !autofitShouldRun2d("book-appear", {
        userAdjusted: true,
      })
    ) {
      return;
    }
    chartRef.current?.autoFit();
  }, [hasCurves]);

  useLayoutEffect(() => {
    if (!pendingStrikeFitRef.current) return;
    if (strikeDrag != null) return;
    const stale = strikeFitStalePtsRef.current;
    if (
      stale &&
      risk.expirationPoints === stale.exp &&
      risk.theoreticalPoints === stale.theo
    ) {
      return;
    }
    if (
      !autofitShouldRun2d("strike-drop", {
        userAdjusted: true,
        strikeDragging: false,
      })
    ) {
      return;
    }
    pendingStrikeFitRef.current = false;
    strikeFitStalePtsRef.current = null;
    chartRef.current?.autoFit();
  }, [
    risk.expirationPoints,
    risk.theoreticalPoints,
    strikeDrag,
    hasCurves,
  ]);

  const alertLines = useMemo(
    () =>
      alerts
        .filter((a) => {
          if (a.status === "dismissed") return false;
          const st = normalizeAlertRunState(a.runState, a.enabled, a.status);
          return st === "live" || st === "touched";
        })
        .filter((a) => a.targetIsUnderlier !== false)
        .filter((a) => !a.symbol || a.symbol === symbol)
        .map((a) => ({
          price: a.targetPrice,
          color: a.color,
          label:
            (a.type.replace("price_", "") || "alert") +
            (sessionHeld ? " · held" : ""),
          style:
            normalizeAlertRunState(a.runState, a.enabled, a.status) ===
              "touched" ||
            alertConditionMet(a, displaySpot, symbol)
              ? ("active" as const)
              : ("dashed" as const),
        })),
    [alerts, symbol, sessionHeld, displaySpot],
  );
  const algoGuideLines = useMemo(() => {
    const a = liveAlgo;
    const st = a?.algo?.trail_state;
    if (!a?.algo || !st || st.phase === "waiting") return [];
    return buildAlgoGuideLines({
      xHigh: st.xH,
      xProposed: st.xS,
      xLegacy: st.xS,
      highWaterColor: a.algo.high_water_color || a.color,
      proposedColor: a.algo.trail_color || "#f59e0b",
      legacyColor: a.algo.trail_color || "#f59e0b",
    });
  }, [liveAlgo]);
  const algoBand = (() => {
    const st = liveAlgo?.algo?.trail_state;
    if (!liveAlgo?.algo?.overlay || !st) return null;
    if (st.phase === "waiting") return null;
    if (st.xH == null || st.xS == null) return null;
    if (!Number.isFinite(st.xH) || !Number.isFinite(st.xS)) return null;
    const frozen = algoHudFrozen(st.phase);
    const pulse = algoPulseAllowed({
      reduceMotion,
      frozen,
      pulse: st.pulse === true,
    });
    return {
      lo: Math.min(st.xH, st.xS),
      hi: Math.max(st.xH, st.xS),
      color: liveAlgo.algo.trail_color || "#f59e0b",
      pulse,
      density: pulse ? 1 : 0,
      reduceMotion,
      frozen,
    };
  })();


  useEffect(() => {
    if (tmOpenSpot == null) return;
    requestAnimationFrame(() => chartRef.current?.autoFit());
  }, [tmDay, tmOpenSpot]);

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
        if (tm.tmActive) {
          pos.rehearsal = true;
          if (tm.tMs != null) pos.entryAt = tm.tMs;
        }
        setPositions((prev) => [pos, ...prev]);
        setFocusedId(pos.id);
      }
      setBookNotice(null);
      setBuilderOpen(false);
      setEditId(null);
      risk.refresh();
    },
    [editId, risk, tm.tmActive, tm.tMs],
  );

  const editInitial = useMemo(() => {
    if (!editId) return null;
    return positions.find((p) => p.id === editId)?.position ?? null;
  }, [editId, positions]);

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
      if (pos.rehearsal) {
        setBookNotice(
          "Rehearsal cards stay off Trade Log. They are practice, not a working order.",
        );
        return;
      }
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
      if (isTmPositionDark(p, tmCursor?.t_ms ?? null)) continue;
      for (const leg of p.position.legs) {
        if (!Number.isFinite(leg.strike)) continue;
        const key = `${p.id}:${leg.strike}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ strike: leg.strike, positionId: p.id });
      }
    }
    return out;
  }, [displayPositions, tmCursor?.t_ms]);

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
      pendingStrikeFitRef.current = true;
      strikeFitStalePtsRef.current = {
        exp: risk.expirationPoints,
        theo: risk.theoreticalPoints,
      };
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
      requestAnimationFrame(() => {
        if (
          autofitShouldRun2d("strike-drop", {
            userAdjusted: true,
            strikeDragging: false,
          })
        ) {
          chartRef.current?.autoFit();
        }
      });
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
        inputOverrideActive={inputOverrideActive}
        sessionHeld={sessionHeld}
        notice={bookNotice}
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
        simSpotPts={simSpotPts}
        onSimSpotPts={setSimSpotPts}
        spotPtsMin={spotPtsRange.min}
        spotPtsMax={spotPtsRange.max}
        onResetSim={resetSim}
        onCreate={() => {
          setEditId(null);
          setBuilderOpen(true);
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
        rangeOpacityPct={rangeOpacityPct}
        onRangeOpacityPct={setRangeOpacityPct}
        onCreateAlert={() => {
          const eligible = alertBuilderPositions.filter((p) => p.algoEligible);
          if (eligible.length) {
            const focused = eligible.find((p) => p.id === focusedId);
            setAlertBuilderSeed({
              kind: "position",
              category: "algo",
              positionId: (focused ?? eligible[0]).id,
              demo: tmActive,
              demoClock: tmActive ? "timemachine" : undefined,
              clockMs: tmCursor?.t_ms,
            });
          } else {
            setAlertBuilderSeed({
              kind: "canvas",
              category: "price",
              price:
                sessionSpot != null && sessionSpot > 0
                  ? sessionSpot
                  : displaySpot > 0
                    ? displaySpot
                    : undefined,
              condition: "at",
              demo: tmActive,
              demoClock: tmActive ? "timemachine" : undefined,
              clockMs: tmCursor?.t_ms,
            });
          }
          setAlertBuilderOpen(true);
        }}
        algoPulse={algoPulse}
        onEditAlert={(id) => {
          const a = alerts.find((x) => x.id === id);
          if (!a) return;
          setAlertBuilderSeed({
            ...holderAlertToBuilderSeed(a),
            runState: normalizeAlertRunState(a.runState, a.enabled, a.status),
          });
          setAlertBuilderOpen(true);
        }}
        onToggleAlertState={(id) => {
          setAlerts((prev) =>
            prev.map((a) => {
              if (a.id !== id) return a;
              const next = toggleAlertRunState(
                normalizeAlertRunState(a.runState, a.enabled, a.status),
              );
              return applyAlertRunState(a, next);
            }),
          );
        }}
        onDeleteAlert={(id) => {
          setAlerts((prev) => prev.filter((a) => a.id !== id));
          if (alertBuilderSeed?.id === id) closeAlertBuilder();
        }}
        onExitDemo={() => {
          setAlerts((prev) =>
            prev.map((a) =>
              a.algo?.demo ? { ...a, algo: { ...a.algo, demo: false } } : a,
            ),
          );
          setAlertBuilderSeed((prev) =>
            prev?.demo ? { ...prev, demo: false } : prev,
          );
          resetSim();
        }}
        alerts={alerts
          .filter((a) => a.status !== "dismissed")
          .map((a) => {
            const kind = a.kind ?? (a.positionId ? "position" : "canvas");
            const unbound = alertUnbound(
              kind,
              a.positionId,
              new Set(positions.map((p) => p.id)),
            );
            return {
              id: a.id,
              kind,
              title: a.title,
              unbound,
              runState: normalizeAlertRunState(a.runState, a.enabled, a.status),
              touchedDetail: formatAlertTouchedContext({
                at: a.triggeredAt,
                spot: a.triggeredSpot,
              }),
              algoPhase: a.algoPhase,
              demo: a.algo?.demo === true,
            };
          })}
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
          className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#0a0a0e] [--color-on-inverse:#f5f5f7] p-2"
          data-testid="analyzer-viewport-region"
        >
          <div
            className="mb-2 flex shrink-0 flex-col gap-1 px-1"
            data-testid="analyzer-viewport-toolbar"
          >
          <div className="flex min-h-11 flex-wrap items-center gap-2">
          <div className="flex shrink-0 items-center gap-[50px]">
            <label className="flex shrink-0 items-center gap-1.5">
              <span className="text-[16px] font-bold text-yellow-400">
                Symbol
              </span>
              <span className="relative inline-flex min-h-11 items-center">
                <select
                  className={
                    "min-h-11 min-w-[7.5rem] appearance-none rounded-[var(--radius-md,0.5rem)] " +
                    "border border-white/20 bg-[#1c1c24] py-1 pl-3 pr-11 " +
                    "font-mono text-[24px] font-bold tabular-nums text-yellow-400 " +
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.45)] " +
                    "outline-none " +
                    "hover:border-yellow-400/45 hover:bg-[#22222c] " +
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
                    "focus-visible:outline-yellow-400/80 " +
                    "disabled:opacity-45"
                  }
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  disabled={universeLoading}
                  data-testid="analyzer-symbol-select"
                  aria-label="Symbol"
                >
                  {(universe.some((u) => u.symbol === symbol)
                    ? universe
                    : [{ symbol }, ...universe]
                  ).map((u) => (
                    <option key={u.symbol} value={u.symbol}>
                      {u.symbol}
                    </option>
                  ))}
                </select>
                <span
                  className={
                    "pointer-events-none absolute inset-y-0 right-0 flex w-10 " +
                    "items-center justify-center rounded-r-[var(--radius-md,0.5rem)] " +
                    "border-l border-white/15 bg-white/[0.06] text-yellow-400"
                  }
                  aria-hidden
                >
                  <IconChevronUpDown size={16} />
                </span>
              </span>
            </label>
            <label className="flex shrink-0 items-baseline gap-1.5">
              <span className="text-[16px] font-bold text-yellow-400">Spot</span>
              <input
                className="w-[8.5rem] border-b border-yellow-400/40 bg-transparent py-0 text-right font-mono text-[24px] font-bold tabular-nums text-yellow-400 outline-none focus:border-yellow-300"
                value={spotStr}
                onChange={(e) => {
                  const v = e.target.value;
                  setSpotStr(v);
                  setSpotDirty(v.trim() !== "");
                }}
                onBlur={() => {
                  const n = Number(spotStr);
                  if (Number.isFinite(n) && spotStr.trim() !== "") {
                    setSpotStr(formatFixed2(n));
                  }
                }}
                data-testid="analyzer-spot-input"
                aria-label="Spot"
              />
            </label>
            <label className="flex shrink-0 items-baseline gap-1.5">
              <span className="text-[16px] font-bold text-red-500">VIX</span>
              <input
                className="w-[5.75rem] border-b border-red-500/40 bg-transparent py-0 text-right font-mono text-[24px] font-bold tabular-nums text-red-500 outline-none focus:border-red-400"
                value={vixStr}
                onChange={(e) => {
                  const v = e.target.value;
                  setVixStr(v);
                  setVixDirty(v.trim() !== "");
                }}
                onBlur={() => {
                  const n = Number(vixStr);
                  if (Number.isFinite(n) && vixStr.trim() !== "") {
                    setVixStr(formatFixed2(n));
                  }
                }}
                data-testid="analyzer-vix-input"
                aria-label="VIX"
              />
            </label>
          </div>
            <div className="flex min-w-min flex-wrap items-center gap-2">
              <div className="flex min-h-11 shrink-0 flex-nowrap items-center gap-2">
              {isAdmin ? (
                <label
                  className="flex min-h-11 items-center gap-2 text-[13px] font-medium uppercase tracking-wide text-white/60"
                  title="Autofit scale: underlier points per CSS inch. Higher = smaller tent."
                >
                  Strikes/in
                  <input
                    type="range"
                    min={AUTOFIT_PTS_PER_INCH_MIN}
                    max={AUTOFIT_PTS_PER_INCH_MAX}
                    step={1}
                    value={Math.round(autofitPtsPerInch)}
                    onChange={(e) => {
                      const next = clampAutofitPtsPerInch(Number(e.target.value));
                      setAutofitPtsPerInch(next);
                      saveAutofitPtsPerInch(next);
                      requestAnimationFrame(() => chartRef.current?.autoFit());
                    }}
                    className="h-11 w-28 cursor-pointer accent-[var(--color-tint)]"
                    data-testid="analyzer-autofit-width"
                    aria-label="Autofit strikes per inch"
                  />
                  <span className="w-8 font-mono tabular-nums text-white/80">
                    {Math.round(autofitPtsPerInch)}
                  </span>
                </label>
              ) : null}
              <Button
                variant="bordered"
                onClick={() => chartRef.current?.autoFit()}
                disabled={!hasCurves}
                data-testid="analyzer-autofit"
              >
                Auto-fit
              </Button>
              </div>
              <Button
                variant="bordered"
                className={
                  pip.on ? "border-red-400/80 text-red-200" : ""
                }
                aria-pressed={pip.on}
                data-testid="analyzer-pip-toggle"
                onClick={() => persistPip({ ...pip, on: !pip.on })}
              >
                PiP
              </Button>
              {pip.on
                ? (["sm", "md", "lg"] as PipSize[]).map((s) => (
                    <Button
                      key={s}
                      variant="bordered"
                      className={
                        "min-w-11 px-2 uppercase " +
                        (pip.size === s ? "border-red-400/80 text-red-200" : "")
                      }
                      aria-pressed={pip.size === s}
                      data-testid={`analyzer-pip-size-${s}`}
                      onClick={() => persistPip({ ...pip, size: s })}
                    >
                      {s}
                    </Button>
                  ))
                : null}
            </div>
          </div>
              <AnalyzerTimeMachineStrip
                day={tmDay}
                onDay={loadTmDay}
                onUncovered={loadTmDay}
                coverage={tmCoverage}
                onNeedMonth={onNeedMonth}
                fidelity={tmFidelity}
                hole={tmHole}
                samples={tmSamples}
                playing={tmPlaying}
                speed={tmSpeed}
                onSpeed={tm.onSpeed}
                replayActive={tmActive}
                onPlay={tm.onPlay}
                onPause={tm.onPause}
                onLeave={() => {
                  tm.onLeave();
                  requestAnimationFrame(() => chartRef.current?.autoFit());
                }}
                onStop={tm.onStop}
                loading={tmLoading}
                playheadT={tm.tMs}
              />
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
            {algoReasonPosts ? (
              <AlgoReasonFeed
                phase={liveAlgo?.algo?.trail_state?.phase ?? liveAlgo?.algoPhase}
                posts={algoReasonPosts}
              />
            ) : null}
            {tmActive ? (
              <ReplayWatermark
                testId="analyzer-replay-watermark"
                layer="over-canvas"
              />
            ) : null}
            {timeMachineEnabled ? (
              <div
                aria-hidden
                data-testid="analyzer-viewport-glow"
                data-glow="whatif"
                className="pointer-events-none absolute inset-0 z-[15] rounded-xl shadow-[inset_0_0_28px_12px_rgba(239,68,68,0.5)]"
              />
            ) : null}
            {tmActive ? (
              <AnalyzerDayReplayHud
                day={tmDay}
                samples={tmSamples}
                cursor={tmCursor}
                hole={tmHole}
                loading={tmLoading}
                onSeek={tm.onSeek}
              />
            ) : null}
            <div
              className="absolute inset-0 z-[1]"
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
                  onXRange={onCanvasXRange}
                  autofitCenterPrice={tmOpenSpot}
                  spotIndicatorPrice={
                    tmCursor && tmCursor.spot > 0
                      ? tmCursor.spot
                      : timeMachineEnabled && simSpot > 0
                        ? simSpot
                        : undefined
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
                  autofitPtsPerInch={autofitPtsPerInch}
                  gexEnabled={gexEnabled}
                  gexValueMode={gexValueMode}
                  gexPoints={gexProfile.points}
                  gexScale={gexProfile.scale}
                  gexOpacityPct={gexOpacityPct}
                  rangeEnabled={rangeEnabled}
                  rangeBands={rangeBands}
                  rangeOpacityPct={rangeOpacityPct}
                  strikeHandles={strikeHandles}
                  onStrikeDrag={onStrikeDrag}
                  onStrikeCommit={onStrikeCommit}
                  snapStrike={snapStrike}
                  alertLines={alertLines.map((l) => ({
                    price: l.price,
                    color: l.color,
                    active: l.style === "active",
                  }))}
                  algoGuideLines={algoGuideLines}
                  algoBand={algoBand}
                  algoPhase={liveAlgo?.algoPhase}
                  algoSide={liveAlgo?.algo?.trail_state?.side}
                  algoHud={algoHud}
                  positionExpirationCurves={risk.positionExpirationCurves}
                  positionAlertChoices={displayPositions
                    .filter(
                      (p) =>
                        p.visible &&
                        !isTmPositionDark(p, tmCursor?.t_ms ?? null),
                    )
                    .map((p) => ({
                      id: p.id,
                      strikesLabel: positionStrikeAlertLabel(p),
                    }))}
                  onCanvasAlert={(price, type) => {
                    setAlertBuilderSeed({
                      kind: "canvas",
                      category: "price",
                      price,
                      condition:
                        type === "price_above"
                          ? "above"
                          : type === "price_below"
                            ? "below"
                            : "at",
                    });
                    setAlertBuilderOpen(true);
                  }}
                  onPositionAlert={(positionId, price, type) => {
                    setAlertBuilderSeed({
                      kind: "position",
                      category: "position",
                      positionId,
                      price,
                      condition:
                        type === "price_above"
                          ? "above"
                          : type === "price_below"
                            ? "below"
                            : "at",
                    });
                    setAlertBuilderOpen(true);
                  }}
                />
                {pip.on ? (
                  <AnalyzerSurfacePip
                    trades={
                      graphBook.trades.length ? graphBook.trades : trades
                    }
                    marks={
                      (risk.result?.marks?.leg_marks ??
                        null) as OpfLegMarkForSheet[] | null
                    }
                    spot={
                      opfSpot != null && opfSpot > 0
                        ? opfSpot
                        : risk.spot
                    }
                    volOffsetPts={timeMachineEnabled ? wiredVolPts : 0}
                    timeOffsetHours={timeOffsetHours}
                    size={pip.size}
                    corner={pip.corner}
                    onCorner={(c) => persistPip({ ...pip, corner: c })}
                  />
                ) : null}
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
                ) : !hasCurves && trade && sheetNotice ? (
                  <div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4"
                    data-testid="analyzer-viewport-notice"
                    data-notice-kind={sheetNotice.kind}
                  >
                    <div className="max-w-sm rounded-2xl border border-white/15 bg-black/40 px-5 py-4 text-center backdrop-blur-sm">
                      <div className="text-[13px] font-semibold tracking-wide text-white/90">
                        {sheetNotice.title}
                      </div>
                      <p className="mt-1.5 text-[12px] leading-snug text-white/60">
                        {sheetNotice.detail}
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
        {bookNotice && bookNotice.startsWith("Rehearsal ended") ? (
          <div
            className="shrink-0 border-b border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white/75"
            role="status"
            data-testid="analyzer-rehearsal-ended"
          >
            {bookNotice}
          </div>
        ) : null}
        <div
          className="flex shrink-0 flex-col overflow-hidden border-b border-[var(--color-separator)] bg-[#0a0a0e] [--color-on-inverse:#f5f5f7] px-2 py-1"
          style={{ height: bookHeightPx }}
          data-testid="analyzer-positions-region"
        >
          <AnalyzerPositionsList
            {...positionsHandlers}
            positions={displayPositions}
            playheadMs={tmCursor?.t_ms ?? null}
          />
        </div>
      </div>

      </div>

      <AlertBuilderDialog
        open={alertBuilderOpen}
        seed={alertBuilderSeed}
        symbol={symbol}
        spot={
          sessionSpot != null && sessionSpot > 0 ? sessionSpot : displaySpot
        }
        positions={alertBuilderPositions}
        onClose={closeAlertBuilder}
        onSave={(draft: AlertsManagerDraft) => {
          if (draft.alert_class === "algo" && draft.trigger.algo) {
            const ag = draft.trigger.algo;
            const next = createAlgoAlert({
              id: draft.id,
              symbol: draft.symbol,
              positionId: draft.position_id || "",
              positionLabel: draft.position_label,
              color: ag.high_water_color,
              trailColor: ag.trail_color,
              entryPct: ag.entry_pct,
              trailStartPct: ag.trail_start_pct,
              trailFloorPct: ag.trail_floor_pct,
              decayEnd: ag.decay_end ?? "eod",
              trailStopReason: ag.trail_stop_reason,
              trailEndReason: ag.trail_end_reason,
              demo: ag.demo === true,
              overlay: ag.overlay,
              reason: ag.reason === true || Boolean(ag.trail_stop_reason),
              runState: draft.run_state,
              rehearsal: tm.tmActive,
            });
            if (tm.tmActive && tm.tMs != null) {
              next.createdAt = new Date(tm.tMs).toISOString();
            }
            if (ag.demo && !tmDay) setTimeMachineEnabled(true);
            setAlerts((prev) => {
              const i = prev.findIndex((a) => a.id === next.id);
              if (i >= 0) {
                const copy = prev.slice();
                copy[i] = { ...next, createdAt: prev[i].createdAt };
                return copy;
              }
              return [...prev, next];
            });
            return;
          }
          const type =
            draft.trigger.condition === "above"
              ? "price_above"
              : draft.trigger.condition === "below"
                ? "price_below"
                : "price_touch";
          const next = createPriceAlert({
            id: draft.id,
            type,
            symbol: draft.symbol,
            targetPrice: draft.trigger.target,
            kind: draft.kind,
            positionId: draft.position_id,
            positionLabel: draft.position_label,
            targetIsUnderlier: draft.trigger.family === "price",
            color: draft.color,
            runState: draft.run_state,
            rehearsal: tm.tmActive,
          });
          if (tm.tmActive && tm.tMs != null) {
            next.createdAt = new Date(tm.tMs).toISOString();
          }
          setAlerts((prev) => {
            const i = prev.findIndex((a) => a.id === next.id);
            if (i >= 0) {
              const copy = prev.slice();
              const keepTouch = next.runState === "touched";
              copy[i] = {
                ...next,
                createdAt: prev[i].createdAt,
                triggeredAt: keepTouch ? prev[i].triggeredAt : undefined,
                triggeredSpot: keepTouch ? prev[i].triggeredSpot : undefined,
              };
              return copy;
            }
            return [...prev, next];
          });
        }}
      />
      <PositionBuilder
        open={builderOpen}
        mode={editId ? "edit" : "create"}
        symbol={symbol}
        spotPrice={
          sessionSpot != null && sessionSpot > 0
            ? sessionSpot
            : displaySpot > 0
              ? displaySpot
              : chain.spot || 5000
        }
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

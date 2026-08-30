"use client";

/**
 * Options Lab Surface — 3D of the Analyzer visible book.
 * Every (S, τ) is that book. No probe tent. No second structure.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  ANALYZER_BOOK_EVENT,
  loadPositions,
  savePositions,
} from "@/lib/options-lab/analyzerBook";
import { syncBookFromTradeLog } from "@/lib/options-lab/analyzerTradeLogSync";
import { fetchTrades } from "@/lib/tradeLogApi";
import TimeOrthoLiveChart, {
  type TimeOrthoTapeHandle,
} from "./TimeOrthoLiveChart";
import TimeOrthoEggPanel from "./TimeOrthoEggPanel";
import { shouldExitTimeOrtho } from "@/lib/options-lab/timeOrthoEgg";
import {
  clearTapeCache,
  useWarmTimeOrthoTape,
} from "@/lib/options-lab/timeOrthoTapeCache";
import { positionToParsedTrade } from "@/lib/options-lab/positionToTrade";
import { visibleBookTrade } from "@/lib/options-lab/cardDisplayState";
import { isTmPositionDark } from "@/lib/options-lab/positionSession";
import { useTimeMachineHost } from "@/lib/options-lab/useTimeMachineHost";
import { computeExpiredGhostSheet } from "@/lib/risk-graph/surfaceGhost";
import { useOpfRiskGraph } from "@/lib/options-lab/useOpfRiskGraph";
import TimeMachineChrome from "@/components/options-lab/TimeMachineChrome";
import { useTmReplayActive } from "@/lib/options-lab/useTmReplayActive";
import {
  marksFromChain,
  useChainAtPlayhead,
} from "@/lib/options-lab/tmChainAtT";
import type { ChainContext } from "@/lib/options-lab/templates/types";
import {
  formatWhatIfTimeReadout,
  remainingLastTradeHours,
  tauYearsWhatIf,
  tauYearsWhatIfAfterElapsed,
  whatIfTimeStepHours,
} from "@/lib/options-lab/whatIfClocks";
import {
  formatWhatIfVolReadout,
  impliedVolSliderRange,
  loadWhatIfSession,
  majorityRight,
  measuredAtmIvPct,
  saveWhatIfSession,
  volOffsetPtsFromScenario,
} from "@/lib/options-lab/whatIfVol";
import { useLiveUnderlierMarks } from "@/lib/market/useLiveUnderlierMarks";
import {
  MIN_TAU,
  bindListedSurfaceLegs,
  computeSurfaceSheet,
  expiryFaceTau,
  type OpfLegMarkForSheet,
  type SurfaceSheet,
} from "@/lib/risk-graph/surfaceModel";
import {
  SURFACE_PAD_FRAC,
  applyWidthPad,
  surfaceAutofitWindow,
  surfaceValueWindow,
  unionListedStrikes,
} from "@/lib/risk-graph/surfaceAutofit";
import { RELIEF_DEFAULT } from "@/lib/risk-graph/surfaceRelief";
import {
  mountSurfaceScene,
  SURFACE_VALUE_PLANE_OPACITY_DEFAULT,
  type SurfaceSceneHandle,
} from "@/lib/risk-graph/surfaceScene";
import { fetchMarketOhlc } from "@/lib/marketOhlcApi";
import {
  candleTfForTau,
  candlesToBoxes,
  remainingLifeMs,
} from "@/lib/risk-graph/surfaceCandles";
import { SLOW_ZOOM_GAIN } from "@/lib/risk-graph/surfaceScene/camera";
import {
  listedExpirationsOf,
  surfaceAsOfLabel,
  surfaceBookClock,
  surfaceClockBlocksAnalysis,
  type SurfaceHostClock,
} from "./hostLaw";
import CameraHud from "./CameraHud";
import TimeHud from "./TimeHud";
import PlanesHud from "./PlanesHud";
import ViewsHud from "./ViewsHud";
import HudCollapse from "./HudCollapse";
import {
  cadenceClaim,
  isRealityAltered,
  samplePlayhead,
} from "@/lib/risk-graph/surfaceInspect";
import {
  loadSurfaceInspect,
  saveSurfaceInspect,
  type SavedView,
} from "./persist";
import type { FactoryViewId } from "@/lib/risk-graph/surfaceScene";

type LawB =
  | "EXPIRED"
  | "HELD / RESIDUAL"
  | "NOT TRADED"
  | "IV NO"
  | "CHECK LEGS"
  | "UPDATING"
  | "WAITING"
  | "HIDDEN";

function sheetFingerprint(sheet: SurfaceSheet | null, extra = ""): string {
  if (!sheet) return extra;
  return [
    sheet.spot,
    sheet.sMin,
    sheet.sMax,
    sheet.minPnL,
    sheet.maxPnL,
    sheet.displayAbs,
    sheet.ivSource,
    sheet.quality,
    sheet.spotAxis.length,
    sheet.timeAxis.length,
    sheet.timeAxis[0],
    sheet.timeAxis[sheet.timeAxis.length - 1],
    extra || "",
  ].join("|");
}

export default function SurfaceApp() {
  const { symbol } = useOptionsLab();
  const tm = useTimeMachineHost(symbol);
  const tmPlayhead = tm.cursor?.t_ms ?? null;
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SurfaceSceneHandle | null>(null);
  const sheetRef = useRef<SurfaceSheet | null>(null);
  const [tick, setTick] = useState(0);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [volOffsetPts, setVolOffsetPts] = useState(0);
  const [spotPct, setSpotPct] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [whatIfHydrated, setWhatIfHydrated] = useState(false);
  const pendingElapsedRef = useRef<number | null>(null);
  const [strikeOn, setStrikeOn] = useState(false);
  const [timeOn, setTimeOn] = useState(false);
  const [strikePos, setStrikePos] = useState(100);
  const [timePos, setTimePos] = useState(0);
  const [projection, setProjection] = useState<"perspective" | "orthographic">(
    "perspective",
  );
  const [saved, setSaved] = useState<SavedView[]>([]);
  const [autofitGen, setAutofitGen] = useState(0);
  const [widthPadFrac, setWidthPadFrac] = useState(SURFACE_PAD_FRAC);
  const [heightPadFrac, setHeightPadFrac] = useState(SURFACE_PAD_FRAC);
  const [zoomGain, setZoomGain] = useState(SLOW_ZOOM_GAIN);
  const [valueOpacity, setValueOpacity] = useState(
    SURFACE_VALUE_PLANE_OPACITY_DEFAULT,
  );
  const [relief, setRelief] = useState(RELIEF_DEFAULT);
  const [eggOn, setEggOn] = useState(false);
  const [bookReady, setBookReady] = useState(false);
  const tapeRef = useRef<TimeOrthoTapeHandle | null>(null);
  const hadBookRef = useRef(false);
  const valueOpacityBeforeEggRef = useRef(SURFACE_VALUE_PLANE_OPACITY_DEFAULT);
  const [spots, setSpots] = useState([
    { on: true, brightness: 0.55 },
    { on: true, brightness: 0.55 },
    { on: true, brightness: 0.55 },
    { on: true, brightness: 0.55 },
    { on: false, brightness: 0.55 },
    { on: false, brightness: 0.55 },
    { on: false, brightness: 0.55 },
    { on: false, brightness: 0.55 },
  ]);
  const fitHoldRef = useRef<{
    key: string;
    gen: number;
    contentLo: number;
    contentHi: number;
    sMin: number;
    sMax: number;
  } | null>(null);
  const valueHoldRef = useRef<{
    key: string;
    gen: number;
    contentLo: number;
    contentHi: number;
  } | null>(null);

  useEffect(() => {
    setBookReady(true);
    void loadSurfaceInspect().then((p) => setSaved(p.views || []));
    const on = () => setTick((n) => n + 1);
    window.addEventListener("storage", on);
    window.addEventListener(ANALYZER_BOOK_EVENT, on);
    window.addEventListener("focus", on);
    window.addEventListener("pageshow", on);
    document.addEventListener("visibilitychange", on);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener(ANALYZER_BOOK_EVENT, on);
      window.removeEventListener("focus", on);
      window.removeEventListener("pageshow", on);
      document.removeEventListener("visibilitychange", on);
    };
  }, []);

  useEffect(() => {
    setTick((n) => n + 1);
  }, [pathname]);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      const book = loadPositions();
      if (!book.some((p) => p.tradeLogTradeId != null && p.closedAt == null)) {
        return;
      }
      const res = await fetchTrades(null, { full: true, limit: 200 });
      if (!alive || !res.ok) return;
      const { next, changed } = syncBookFromTradeLog(book, res.data.trades || []);
      if (!changed) return;
      savePositions(next);
      window.dispatchEvent(new Event(ANALYZER_BOOK_EVENT));
    };
    void pull();
    return () => {
      alive = false;
    };
  }, [tick]);

  const allForSymbol = useMemo(() => {
    void tick;
    if (!bookReady) return [];
    const sym = symbol.toUpperCase();
    return loadPositions().filter(
      (p) => (p.position.underlying || "").toUpperCase() === sym,
    );
  }, [tick, symbol, bookReady]);

  const book = useMemo(
    () => allForSymbol.filter((p) => p.visible !== false),
    [allForSymbol],
  );
  const keepTape = bookReady && allForSymbol.length > 0;
  useWarmTimeOrthoTape([symbol], keepTape);

  const bookFitKey = useMemo(
    () =>
      book
        .filter((p) => !isTmPositionDark(p, tmPlayhead))
        .map((p) => {
          const legs = (p.position.legs || [])
            .map(
              (l) =>
                `${l.type}:${Number(l.strike)}:${l.quantity}:${String(l.expiration || p.position.expiration || "").slice(0, 10)}`,
            )
            .sort()
            .join(",");
          return `${p.id}:${p.visible !== false ? 1 : 0}:${legs}`;
        })
        .sort()
        .join("|"),
    [book, tmPlayhead],
  );

  const parsedBook = useMemo(() => {
    const errors: string[] = [];
    let split;
    try {
      split = visibleBookTrade(book, { symbol, playheadMs: tmPlayhead });
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
      split = {
        trade: null,
        trades: [] as ReturnType<typeof positionToParsedTrade>[],
        expiredTrades: [] as ReturnType<typeof positionToParsedTrade>[],
        contributingIds: [] as string[],
      };
    }
    return { ...split, errors };
  }, [book, symbol, tmPlayhead]);
  const trades = parsedBook.trades;
  const expiredTrades = parsedBook.expiredTrades;
  const trade = trades[0] ?? null;
  const risk = useOpfRiskGraph({
    trade,
    trades,
    enabled: trades.length > 0,
    pollLive: false,
  });
  const live = useLiveUnderlierMarks({
    symbols: [symbol],
    enabled: true,
  });
  const liveSpot = live.bySymbol.get(symbol)?.mid ?? null;
  const marksKey = JSON.stringify(risk.result?.marks?.leg_marks ?? null);
  const replayActive = useTmReplayActive();
  const emptyLive: ChainContext = {
    symbol,
    viewSide: "call",
    spot: liveSpot,
    strikeStep: null,
    wings: 25,
    contracts: new Map(),
    asOf: null,
    contentHash: null,
  };
  const chainAtT = useChainAtPlayhead({
    symbol,
    viewSide: "call",
    wings: 25,
    live: emptyLive,
  });
  const replayMarks = replayActive
    ? marksFromChain(
        chainAtT,
        (trades[0]?.expiration || "").slice(0, 10),
      )
    : null;

  const view = useMemo(() => {
    let law: LawB | null = null;
    let detail = "";
    let sheet: SurfaceSheet | null = null;
    let ghostSheet: SurfaceSheet | null = null;
    let label = symbol;
    let cadence = replayActive ? "replay" : "live";
    const liveExps = trades.flatMap((t) =>
      listedExpirationsOf({
        expiration: t.expiration,
        legs: t.legs,
      }),
    );
    const expiredExps = expiredTrades.flatMap((t) =>
      listedExpirationsOf({
        expiration: t.expiration,
        legs: t.legs,
      }),
    );
    const clock: SurfaceHostClock = liveExps.length
      ? surfaceBookClock(liveExps)
      : expiredExps.length
        ? "expired"
        : "live";
    void surfaceClockBlocksAnalysis(clock);
    if (!book.length) {
      fitHoldRef.current = null;
      law = "WAITING";
      detail = "Nothing shown in Analyzer. Surface is that book in 3D.";
      label = `${symbol} · Analyzer`;
    } else if (!trades.length && !expiredTrades.length) {
      law = "CHECK LEGS";
      detail = parsedBook.errors[0] || "Could not read the shown structures.";
    } else if (trades.length > 0 && risk.loading && !risk.result && !expiredTrades.length) {
      law = "UPDATING";
      detail = "Resolving the shown Analyzer book.";
    } else if (trades.length > 0 && risk.error && !risk.result && !expiredTrades.length) {
      law = "CHECK LEGS";
      detail = risk.error;
    } else {
      const replaySpot = chainAtT.spot;
      const spot =
        replayActive && replaySpot && replaySpot > 0
          ? replaySpot
          : liveSpot && liveSpot > 0
            ? liveSpot
            : risk.spot;
      const marks = (
        replayActive && replayMarks && replayMarks.length
          ? replayMarks
          : (risk.result?.marks?.leg_marks ?? null)
      ) as OpfLegMarkForSheet[] | null;
      if (!spot || spot <= 0) {
        law = "WAITING";
        detail = "Waiting for a listed underlier mark.";
      } else {
        const liveLegs = trades.flatMap((t) => t.legs);
        const expiredStrikes = expiredTrades.flatMap((t) =>
          t.legs.map((l) => l.strike),
        );
        const simSpot = spot * (1 + spotPct / 100);
        if (trades.length > 0) {
          const bound = bindListedSurfaceLegs(liveLegs, marks, {
            spot,
            tauFor: (exp) => {
              const rows = (marks || []).filter((m) => {
                if (!exp || !m.expiration) return true;
                return (
                  String(m.expiration).slice(0, 10) === String(exp).slice(0, 10)
                );
              });
              const taus = rows
                .map((m) => Number(m.tau))
                .filter((n) => Number.isFinite(n) && n > 0);
              return taus.length ? Math.max(...taus) : MIN_TAU;
            },
          });
          if (!bound.ok && !expiredTrades.length) {
            law = bound.hole === "IV NO" ? "IV NO" : "CHECK LEGS";
            detail = bound.detail;
          } else if (bound.ok) {
            try {
              const strikes = unionListedStrikes([
                liveLegs.map((l) => l.strike),
                expiredStrikes,
              ]);
              const whatIfLegs = bound.legs.map((leg, i) => {
                const listed = (liveLegs[i]?.expiration || "").slice(0, 10);
                const tau0 = listed
                  ? tauYearsWhatIf(listed, nowMs)
                  : Math.max(leg.tauYears0, MIN_TAU);
                return {
                  ...leg,
                  iv: Math.max(1e-8, leg.iv + volOffsetPts / 100),
                  tauYears0: tau0,
                };
              });
              const hold = fitHoldRef.current;
              const reuse =
                hold != null &&
                hold.key === bookFitKey &&
                hold.gen === autofitGen;
              const fit = reuse
                ? {
                    ...applyWidthPad(
                      hold.contentLo,
                      hold.contentHi,
                      widthPadFrac,
                    ),
                    contentLo: hold.contentLo,
                    contentHi: hold.contentHi,
                  }
                : surfaceAutofitWindow(
                    whatIfLegs,
                    simSpot,
                    strikes,
                    widthPadFrac,
                  );
              fitHoldRef.current = {
                key: bookFitKey,
                gen: autofitGen,
                contentLo: fit.contentLo,
                contentHi: fit.contentHi,
                sMin: fit.sMin,
                sMax: fit.sMax,
              };
              const tauNow = Math.max(
                ...whatIfLegs.map((l) => l.tauYears0),
                MIN_TAU,
              );
              const tauFace = expiryFaceTau(whatIfLegs);
              // Slider / box right end = first listed settlement (OD-PF2).
              // Never stretch to both-dead τ=0 of a longer back month
              // (that put expiration at ~1/4 of the thumb).
              const tauEnd = tauFace < tauNow ? tauFace : 0;
              sheet = computeSurfaceSheet(whatIfLegs, {
                spot: simSpot,
                sMin: fit.sMin,
                sMax: fit.sMax,
                tauHi: tauNow,
                tauLo: tauEnd,
                quality: "per_leg_iv",
                ivSource: bound.ivSources.join("+"),
                listedStrikes: strikes,
              });
            } catch (err) {
              if (!expiredTrades.length) {
                law = "CHECK LEGS";
                detail =
                  err instanceof Error ? err.message : "Sheet failed to compute.";
              }
            }
          }
        }
        if (expiredTrades.length > 0) {
          try {
            const hold = fitHoldRef.current;
            const reuse =
              hold != null &&
              hold.key === bookFitKey &&
              hold.gen === autofitGen &&
              sheet != null;
            let sMin: number;
            let sMax: number;
            if (sheet) {
              sMin = sheet.sMin;
              sMax = sheet.sMax;
            } else if (reuse && hold) {
              const fit = applyWidthPad(
                hold.contentLo,
                hold.contentHi,
                widthPadFrac,
              );
              sMin = fit.sMin;
              sMax = fit.sMax;
            } else {
              const ks = unionListedStrikes([expiredStrikes]);
              const contentLo = Math.min(simSpot, ...ks);
              const contentHi = Math.max(simSpot, ...ks);
              const fit = applyWidthPad(contentLo, contentHi, widthPadFrac);
              fitHoldRef.current = {
                key: bookFitKey,
                gen: autofitGen,
                contentLo,
                contentHi,
                sMin: fit.sMin,
                sMax: fit.sMax,
              };
              sMin = fit.sMin;
              sMax = fit.sMax;
            }
            ghostSheet = computeExpiredGhostSheet(expiredTrades, {
              spot: simSpot,
              sMin,
              sMax,
              timeAxis: sheet?.timeAxis,
            });
          } catch (err) {
            if (!sheet) {
              law = "CHECK LEGS";
              detail =
                err instanceof Error
                  ? err.message
                  : "Expired ghost failed to compute.";
            }
          }
        }
        const names = book.map((p) => p.label || p.notation).filter(Boolean);
        label = `${symbol} · ${names.join(" + ") || `${book.length} shown`}`;
      }
    }
    return { law, detail, sheet, ghostSheet, label, cadence, clock };
  }, [
    book,
    symbol,
    replayActive,
    chainAtT.spot,
    chainAtT.contentHash,
    replayMarks,
    risk.loading,
    risk.result,
    risk.spot,
    risk.error,
    liveSpot,
    trades,
    expiredTrades,
    parsedBook.errors,
    marksKey,
    volOffsetPts,
    spotPct,
    autofitGen,
    bookFitKey,
    widthPadFrac,
    nowMs,
  ]);

  const { law, detail, sheet, ghostSheet, label, cadence, clock } = view;
  const hudSheet = sheet ?? ghostSheet;
  sheetRef.current = hudSheet;
  const sheetKey = sheetFingerprint(
    hudSheet,
    `${volOffsetPts}|${spotPct}|${autofitGen}|${bookFitKey}|${ghostSheet ? "g" : ""}`,
  );

  useLayoutEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.dataset.bound = "1";
    try {
      if (!sceneRef.current) {
        sceneRef.current = mountSurfaceScene(host, { sheet });
      } else {
        sceneRef.current.setSheet(sheet);
      }
      sceneRef.current.setGhostSheet(ghostSheet);
      host.dataset.scene = "ok";
    } catch (err) {
      host.dataset.scene = "fail";
      host.dataset.sceneError = err instanceof Error ? err.message : String(err);
    }
  }, [sheetKey, sheet, ghostSheet]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !symbol) {
      sceneRef.current?.setCandles([]);
      return;
    }
    const ac = new AbortController();
    const tau = sheet.timeAxis[0] ?? sheet.maxTau;
    const tf = candleTfForTau(tau);
    const remDays = Math.max(1, tau * 365.25);
    const lookbackDays =
      tf === "5m" ? 14 : tf === "1h" ? 45 : Math.max(90, Math.ceil(remDays * 2));
    void fetchMarketOhlc(symbol, tf, {
      lookbackDays,
      signal: ac.signal,
    })
      .then((payload) => {
        if (ac.signal.aborted || !sceneRef.current) return;
        const { tNow, tExp } = remainingLifeMs(sheet, Date.now());
        sceneRef.current.setCandles(
          candlesToBoxes(payload.bars || [], sheet, tNow, tExp, tf),
        );
      })
      .catch(() => {
        if (!ac.signal.aborted) sceneRef.current?.setCandles([]);
      });
    return () => ac.abort();
  }, [symbol, sheetKey]);

  useLayoutEffect(() => {
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    setStrikePos((prev) =>
      prev >= sheet.sMin && prev <= sheet.sMax ? prev : sheet.spot,
    );
  }, [sheetKey]);

  useEffect(() => {
    setTimeElapsed(0);
    setPlayhead(null);
  }, [bookFitKey]);

  useEffect(() => {
    const saved = loadWhatIfSession();
    if (saved) {
      setVolOffsetPts(saved.volOffsetPts);
      pendingElapsedRef.current = saved.elapsedHours;
    }
    setWhatIfHydrated(true);
    const id = window.setInterval(() => setNowMs(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const leaveEgg = () => {
    setEggOn(false);
    setValueOpacity(valueOpacityBeforeEggRef.current);
    sceneRef.current?.applyFactoryView("time");
  };

  useLayoutEffect(() => {
    if (!eggOn) return;
    tapeRef.current?.redraw();
  }, [eggOn, sheetKey]);

  useEffect(() => {
    const n = allForSymbol.length;
    if (eggOn && shouldExitTimeOrtho(hadBookRef.current, n)) {
      leaveEgg();
    }
    if (hadBookRef.current && n === 0) clearTapeCache(symbol);
    hadBookRef.current = n > 0;
  }, [allForSymbol.length, eggOn, symbol]);
  const tauHi = hudSheet?.timeAxis[0] ?? 0;
  const tauLo = hudSheet?.timeAxis[(hudSheet?.timeAxis.length || 1) - 1] ?? 0;
  const soonestExp = useMemo(() => {
    const dates = [...trades, ...expiredTrades].flatMap((t) => [
      t.expiration,
      ...t.legs.map((l) => l.expiration),
    ]);
    return (
      dates
        .map((d) => (d || "").slice(0, 10))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort()[0] ?? null
    );
  }, [trades, expiredTrades]);
  const remainingHours = soonestExp
    ? remainingLastTradeHours(soonestExp, symbol, nowMs)
    : 0;
  const elapsedHours = Math.min(
    Math.max(0, timeElapsed) * Math.max(0, remainingHours),
    remainingHours,
  );

  useEffect(() => {
    if (pendingElapsedRef.current == null || remainingHours <= 0) return;
    setTimeElapsed(
      Math.min(1, Math.max(0, pendingElapsedRef.current / remainingHours)),
    );
    pendingElapsedRef.current = null;
  }, [remainingHours]);

  useEffect(() => {
    if (!whatIfHydrated) return;
    saveWhatIfSession({
      elapsedHours,
      volOffsetPts,
      enabled: elapsedHours > 0 || volOffsetPts !== 0,
    });
  }, [elapsedHours, volOffsetPts, whatIfHydrated]);

  const measuredSpot =
    (risk.spot != null && risk.spot > 0 ? risk.spot : null) ??
    (liveSpot != null && liveSpot > 0 ? liveSpot : null);
  const measuredPct =
    soonestExp && measuredSpot != null && risk.generations.length
      ? measuredAtmIvPct(
          risk.generations,
          measuredSpot,
          soonestExp,
          majorityRight(trade?.legs ?? []),
        )
      : null;
  const volRange =
    measuredPct != null ? impliedVolSliderRange(measuredPct) : { min: 1, max: 2 };
  const simIvPct =
    measuredPct != null
      ? Math.min(
          volRange.max,
          Math.max(volRange.min, Math.round((measuredPct + volOffsetPts) * 10) / 10),
        )
      : volRange.min;
  const volReadout = formatWhatIfVolReadout(
    measuredPct,
    simIvPct,
    elapsedHours > 0 || volOffsetPts !== 0,
    trades.length === 0
      ? "WAITING"
      : measuredPct == null
        ? risk.generations.length
          ? "IV NO"
          : "WAITING"
        : null,
  );
  const tauMin = Math.min(tauLo, tauHi);
  const tauMax = Math.max(tauLo, tauHi);
  const tauFromWhatIf = soonestExp
    ? tauYearsWhatIfAfterElapsed(soonestExp, nowMs, elapsedHours)
    : tauHi;
  const tauStarRaw = playhead ?? tauHi;
  const tauStar = hudSheet
    ? Math.min(tauMax, Math.max(tauMin, tauFromWhatIf))
    : tauStarRaw;
  const strikeForPlane = hudSheet
    ? Math.min(hudSheet.sMax, Math.max(hudSheet.sMin, strikePos))
    : strikePos;
  const sample =
    hudSheet && hudSheet.spot > 0
      ? samplePlayhead(hudSheet, hudSheet.spot, tauStar)
      : null;
  const cad = cadenceClaim(cadence === "5-min" ? "5-min" : "live");
  const valueWindow = useMemo(() => {
    if (!hudSheet) {
      valueHoldRef.current = null;
      return null;
    }
    const hold = valueHoldRef.current;
    const reuse =
      hold != null && hold.key === bookFitKey && hold.gen === autofitGen;
    if (!reuse) {
      valueHoldRef.current = {
        key: bookFitKey,
        gen: autofitGen,
        contentLo: Math.min(hudSheet.minPnL, 0),
        contentHi: Math.max(hudSheet.maxPnL, 0),
      };
    }
    const next = valueHoldRef.current;
    if (!next) return null;
    return surfaceValueWindow(next.contentLo, next.contentHi, heightPadFrac);
  }, [hudSheet, bookFitKey, autofitGen, heightPadFrac]);
  const altered = hudSheet
    ? isRealityAltered({
        tau: tauStar,
        tauNow: tauHi,
        tauExpiry: tauLo,
        volOffsetPts,
        spotPct,
      })
    : false;

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setInspect({
      timePlayhead: hudSheet ? tauStar : undefined,
      timeElapsed: hudSheet ? timeElapsed : 0,
      altered,
      valueWindow: valueWindow ?? undefined,
      zoomGain,
      spots,
      relief,
      planes: {
        strike: {
          visible: strikeOn,
          opacity: 0.22,
          position: strikeForPlane,
        },
        time: {
          visible: timeOn,
          opacity: 0.28,
          position: timePos,
        },
        value: { visible: valueOpacity > 0, opacity: valueOpacity, position: 0 },
      },
    });
  }, [sheetKey, tauStar, timeElapsed, strikeOn, timeOn, timePos, strikeForPlane, altered, valueWindow, sheet, hudSheet, zoomGain, valueOpacity, spots, relief]);

  function applySurfaceDefaults() {
    setWidthPadFrac(SURFACE_PAD_FRAC);
    setHeightPadFrac(SURFACE_PAD_FRAC);
    if (eggOn) {
      setValueOpacity(0);
    } else {
      valueOpacityBeforeEggRef.current = SURFACE_VALUE_PLANE_OPACITY_DEFAULT;
      setValueOpacity(SURFACE_VALUE_PLANE_OPACITY_DEFAULT);
    }
    setAutofitGen((n) => n + 1);
    setProjection("perspective");
    sceneRef.current?.fit();
  }

  return (
    <div
      className="relative flex h-full min-h-[50vh] w-full flex-1 flex-col bg-[#0a0a0e]"
      data-testid="surface-host"
      data-law={law || "TENT"}
      data-clock={clock}
      data-cadence={cadence}
      data-has-sheet={hudSheet ? "1" : "0"}
      data-ghost={ghostSheet ? "1" : "0"}
      data-altered={altered ? "1" : "0"}
      data-time-ortho={eggOn ? "1" : "0"}
    >
      <div className="pointer-events-auto relative z-30 shrink-0 px-2 py-1">
        <TimeMachineChrome
          symbol={symbol}
          watermarkTestId="surface-replay-watermark"
        />
      </div>
      {keepTape ? (
        <TimeOrthoLiveChart
          ref={tapeRef}
          symbol={symbol}
          book={allForSymbol.map((p) => ({
            id: p.id,
            label: p.label || p.notation,
            entryAt: p.entryAt ?? p.createdAt,
            closedAt: p.closedAt ?? null,
            closedPnl: p.closedPnl ?? null,
          }))}
          onAxis={
            eggOn
              ? (span) => sceneRef.current?.alignTimeOrtho(span)
              : undefined
          }
          positionScale={
            hudSheet ? { lo: hudSheet.sMin, hi: hudSheet.sMax } : null
          }
          listedStrikes={hudSheet?.listedStrikes ?? []}
          liveSpot={
            liveSpot != null && liveSpot > 0
              ? liveSpot
              : hudSheet?.spot ?? null
          }
          interactive={eggOn}
        />
      ) : null}
      {eggOn ? (
        <TimeOrthoEggPanel
          symbol={symbol}
          positions={allForSymbol}
          lastMid={liveSpot}
          bookPnl={
            Number.isFinite(risk.theoreticalPnLAtSpot)
              ? risk.theoreticalPnLAtSpot
              : risk.packageDebit
          }
          bookState={law}
        />
      ) : null}
      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-sm text-[11px] text-white/55">
        <div className="font-medium text-white/80">{label}</div>
        <div>
          as_of {surfaceAsOfLabel(clock, altered)} · {cadence}
          {hudSheet ? ` · ${hudSheet.ivSource}` : ""}
        </div>
      </div>
      {hudSheet && (clock === "residual" || clock === "expired") ? (
        <div
          className="pointer-events-none absolute left-3 top-12 z-10 max-w-sm text-[11px] text-white/45"
          data-testid="surface-clock-claim"
          data-clock={clock}
        >
          {clock === "residual"
            ? "Held residual — not a live market. Analysis stays on."
            : "Expired — wireframe ghost. Not a live market."}
        </div>
      ) : null}
      {law && !hudSheet ? (
        <div
          className="absolute left-1/2 top-14 z-10 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-white/12 bg-black/65 px-5 py-4"
          data-testid="surface-law-b"
          data-state={law}
        >
          <div className="text-[13px] font-semibold tracking-wide text-white/90">
            {law}
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-white/55">{detail}</p>
          {law === "WAITING" ? (
            <Link
              href="/app/options-lab/analyzer"
              className="mt-2 inline-block text-[12px] text-white/80 underline underline-offset-2"
            >
              Open Analyzer
            </Link>
          ) : null}
        </div>
      ) : null}

      <div
        ref={hostRef}
        id="surface-canvas-host"
        className={
          "relative z-[1] min-h-0 flex-1 overflow-hidden " +
          (eggOn ? "pointer-events-none bg-transparent" : "")
        }
        data-testid="surface-canvas"
      />
      <div
        className="pointer-events-none absolute bottom-3 left-3 top-20 z-20 flex w-[min(20rem,calc(100%-1.5rem))] flex-col gap-2 overflow-y-auto pr-1"
        data-testid="surface-hud-dock"
      >
        <ViewsHud
          timeOrthoOn={eggOn}
          onFactory={(id: FactoryViewId) => {
            if (id === "now" || id === "time" || id === "timeOrtho") {
              setProjection("orthographic");
            } else setProjection("perspective");
            if (id === "timeOrtho") {
              if (!eggOn) {
                valueOpacityBeforeEggRef.current = valueOpacity;
                setValueOpacity(0);
              }
              setEggOn(true);
            } else {
              if (eggOn) {
                setValueOpacity(valueOpacityBeforeEggRef.current);
              }
              setEggOn(false);
            }
            if (id === "fit") sceneRef.current?.fit();
            else sceneRef.current?.applyFactoryView(id);
          }}
          views={saved}
          onSave={() => {
            if (saved.length >= 12) return;
            const next: SavedView = {
              id: crypto.randomUUID(),
              name: `View ${saved.length + 1}`,
              inspect: {
                playhead: timeElapsed,
                volOffsetPts,
                spotPct,
                strikeOn,
                timeOn,
                strikePos,
                timePos,
              },
              updated_at: new Date().toISOString(),
            };
            const views = [...saved, next];
            setSaved(views);
            void saveSurfaceInspect({
              defaults: {},
              default_view_id: null,
              views,
            });
          }}
          onRecall={(id) => {
            const v = saved.find((x) => x.id === id);
            if (!v) return;
            const ins = v.inspect || {};
            if (typeof ins.playhead === "number") {
              if (ins.playhead >= 0 && ins.playhead <= 1) {
                setTimeElapsed(ins.playhead);
              } else if (hudSheet) {
                const span = tauHi - tauLo;
                setTimeElapsed(
                  span > 0 ? Math.min(1, Math.max(0, (tauHi - ins.playhead) / span)) : 0,
                );
              }
            }
            if (typeof ins.volOffsetPts === "number") setVolOffsetPts(ins.volOffsetPts);
            if (typeof ins.spotPct === "number") setSpotPct(ins.spotPct);
            if (typeof ins.strikeOn === "boolean") setStrikeOn(ins.strikeOn);
            if (typeof ins.timeOn === "boolean") setTimeOn(ins.timeOn);
            if (typeof ins.strikePos === "number") setStrikePos(ins.strikePos);
            if (typeof ins.timePos === "number") setTimePos(ins.timePos);
          }}
          onDelete={(id) => {
            const views = saved.filter((x) => x.id !== id);
            setSaved(views);
            void saveSurfaceInspect({
              defaults: {},
              default_view_id: null,
              views,
            });
          }}
        />
        <HudCollapse title="Planes" testId="surface-planes-wrap">
          <PlanesHud
            strikeOn={strikeOn}
            timeOn={timeOn}
            strikePos={hudSheet ? strikeForPlane : strikePos}
            strikeMin={hudSheet?.sMin ?? 80}
            strikeMax={hudSheet?.sMax ?? 120}
            timePos={timePos}
            onStrikeOn={setStrikeOn}
            onTimeOn={setTimeOn}
            onStrikePos={setStrikePos}
            onTimePos={setTimePos}
            widthPadFrac={widthPadFrac}
            heightPadFrac={heightPadFrac}
            onWidthPadFrac={setWidthPadFrac}
            onHeightPadFrac={setHeightPadFrac}
            valueOpacity={valueOpacity}
            onValueOpacity={(v) => {
              setValueOpacity(v);
              if (!eggOn) valueOpacityBeforeEggRef.current = v;
            }}
            onAutofit={applySurfaceDefaults}
          />
        </HudCollapse>
        <HudCollapse title="What-if" testId="surface-time-wrap">
          <TimeHud
            elapsedHours={whatIfHydrated ? elapsedHours : 0}
            remainingHours={whatIfHydrated ? remainingHours : 0}
            timeStepHours={
              whatIfHydrated ? whatIfTimeStepHours(remainingHours) : 1
            }
            timeReadout={
              whatIfHydrated && soonestExp
                ? formatWhatIfTimeReadout(nowMs, elapsedHours, remainingHours)
                : "—"
            }
            timeDisabled={remainingHours <= 0 || trades.length === 0}
            onElapsedHours={(h) => {
              setPlayhead(null);
              setTimeElapsed(
                remainingHours > 0
                  ? Math.min(1, Math.max(0, h / remainingHours))
                  : 0,
              );
            }}
            simIvPct={simIvPct}
            volMin={volRange.min}
            volMax={volRange.max}
            volReadout={volReadout}
            volDisabled={measuredPct == null || trades.length === 0}
            onSimIvPct={(pct) => {
              if (measuredPct == null) return;
              setVolOffsetPts(volOffsetPtsFromScenario(pct, measuredPct));
            }}
            spotPct={spotPct}
            sample={sample}
            cadenceLabel={cad.label}
            lastMinuteGold={cad.lastMinuteGold}
            altered={altered}
            onSpotPct={setSpotPct}
            onReset={() => {
              setPlayhead(null);
              setTimeElapsed(0);
              setVolOffsetPts(0);
              setSpotPct(0);
            }}
          />
        </HudCollapse>
        {eggOn ? null : (
          <HudCollapse title="Camera" testId="surface-camera-wrap">
            <CameraHud
              projection={projection}
              zoomGain={zoomGain}
              onZoomGain={setZoomGain}
              relief={relief}
              onRelief={setRelief}
              spots={spots}
              onSpotOn={(i, on) => {
                setSpots((prev) =>
                  prev.map((s, j) => (j === i ? { ...s, on } : s)),
                );
              }}
              onSpotBrightness={(i, brightness) => {
                setSpots((prev) =>
                  prev.map((s, j) => (j === i ? { ...s, brightness } : s)),
                );
              }}
              onFit={() => {
                setProjection("perspective");
                sceneRef.current?.fit();
              }}
              onAutofit={applySurfaceDefaults}
              onIso={() => {
                setProjection("perspective");
                sceneRef.current?.applyFactoryView("iso");
              }}
              onProjection={() => {
                const next =
                  projection === "orthographic" ? "perspective" : "orthographic";
                setProjection(next);
                sceneRef.current?.setProjection(next);
              }}
            />
          </HudCollapse>
        )}
      </div>
    </div>
  );
}

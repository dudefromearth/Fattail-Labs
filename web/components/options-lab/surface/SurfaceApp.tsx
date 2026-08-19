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
  closePosition,
  loadPositions,
  savePositions,
} from "@/lib/options-lab/analyzerBook";
import { analyzerPositionToOpenTrade } from "@/lib/options-lab/analyzerToTradeLog";
import {
  linkTradeLogId,
  syncBookFromTradeLog,
} from "@/lib/options-lab/analyzerTradeLogSync";
import { createTrade, fetchTrades } from "@/lib/tradeLogApi";
import TimeOrthoLiveChart, {
  type TimeOrthoTapeHandle,
} from "./TimeOrthoLiveChart";
import TimeOrthoEggPanel from "./TimeOrthoEggPanel";
import {
  canvasToPngBlob,
  captureCaption,
  captureFilename,
  compositeCanvases,
  downloadBlob,
  journalDateYmd,
  shouldExitTimeOrtho,
} from "@/lib/options-lab/timeOrthoEgg";
import {
  attachCaptureToTodayJournal,
  JournalCaptureClosedError,
} from "@/lib/options-lab/timeOrthoJournal";
import {
  clearTapeCache,
  useWarmTimeOrthoTape,
} from "@/lib/options-lab/timeOrthoTapeCache";
import { localSessionNote } from "@/lib/options-lab/timeOrthoNote";
import { chartWindow } from "@/lib/options-lab/timeOrthoSession";
import { positionToParsedTrade } from "@/lib/options-lab/positionToTrade";
import { visibleBookTrade } from "@/lib/options-lab/cardDisplayState";
import { computeExpiredGhostSheet } from "@/lib/risk-graph/surfaceGhost";
import { useOpfRiskGraph } from "@/lib/options-lab/useOpfRiskGraph";
import { useLiveUnderlierMarks } from "@/lib/market/useLiveUnderlierMarks";
import {
  MIN_TAU,
  bindListedSurfaceLegs,
  computeSurfaceSheet,
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
import { mountSurfaceScene, type SurfaceSceneHandle } from "@/lib/risk-graph/surfaceScene";
import { fetchMarketOhlc } from "@/lib/marketOhlcApi";
import {
  candleTfForTau,
  candlesToBoxes,
  remainingLifeMs,
} from "@/lib/risk-graph/surfaceCandles";
import { SLOW_ZOOM_GAIN } from "@/lib/risk-graph/surfaceScene/camera";
import {
  beGhostEps,
  parkMovedBreakEvens,
  t0BreakEvens,
} from "@/lib/options-lab/t0BreakEvenGhost";
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
  isTimeAltered,
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
  const pathname = usePathname();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<SurfaceSceneHandle | null>(null);
  const sheetRef = useRef<SurfaceSheet | null>(null);
  const [tick, setTick] = useState(0);
  const [playhead, setPlayhead] = useState<number | null>(null);
  const [volOffsetPts, setVolOffsetPts] = useState(0);
  const [spotPct, setSpotPct] = useState(0);
  const [strikeOn, setStrikeOn] = useState(false);
  const [timeOn, setTimeOn] = useState(true);
  const [strikePos, setStrikePos] = useState(100);
  const [projection, setProjection] = useState<"perspective" | "orthographic">(
    "perspective",
  );
  const [saved, setSaved] = useState<SavedView[]>([]);
  const [autofitGen, setAutofitGen] = useState(0);
  const [widthPadFrac, setWidthPadFrac] = useState(SURFACE_PAD_FRAC);
  const [heightPadFrac, setHeightPadFrac] = useState(SURFACE_PAD_FRAC);
  const [zoomGain, setZoomGain] = useState(SLOW_ZOOM_GAIN);
  const [valueOpacity, setValueOpacity] = useState(0.12);
  const [relief, setRelief] = useState(RELIEF_DEFAULT);
  const [candlesOn, setCandlesOn] = useState(false);
  const [eggOn, setEggOn] = useState(false);
  const [sendNote, setSendNote] = useState<string | null>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [bookReady, setBookReady] = useState(false);
  const tapeRef = useRef<TimeOrthoTapeHandle | null>(null);
  const hadBookRef = useRef(false);
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
    [book],
  );

  const parsedBook = useMemo(() => {
    const errors: string[] = [];
    let split;
    try {
      split = visibleBookTrade(book, { symbol });
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
  }, [book, symbol]);
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

  const view = useMemo(() => {
    let law: LawB | null = null;
    let detail = "";
    let sheet: SurfaceSheet | null = null;
    let ghostSheet: SurfaceSheet | null = null;
    let label = symbol;
    let cadence = "live";
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
      const spot = liveSpot && liveSpot > 0 ? liveSpot : risk.spot;
      const marks = (risk.result?.marks?.leg_marks ?? null) as
        | OpfLegMarkForSheet[]
        | null;
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
              const whatIfLegs = bound.legs.map((leg) => ({
                ...leg,
                iv: Math.max(1e-8, leg.iv + volOffsetPts / 100),
              }));
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
              sheet = computeSurfaceSheet(whatIfLegs, {
                spot: simSpot,
                sMin: fit.sMin,
                sMax: fit.sMax,
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

  const beGhostsRef = useRef<number[]>([]);
  const prevLiveBeRef = useRef<number[]>([]);
  const [beLevels, setBeLevels] = useState<number[]>([]);
  useEffect(() => {
    beGhostsRef.current = [];
    prevLiveBeRef.current = [];
    setBeLevels([]);
  }, [bookFitKey]);

  const leaveEgg = () => {
    setEggOn(false);
    beGhostsRef.current = [];
    prevLiveBeRef.current = [];
    setBeLevels([]);
    sceneRef.current?.setBeGhosts([]);
    sceneRef.current?.applyFactoryView("time");
  };

  useEffect(() => {
    const n = allForSymbol.length;
    if (eggOn && shouldExitTimeOrtho(hadBookRef.current, n)) {
      leaveEgg();
    }
    if (hadBookRef.current && n === 0) clearTapeCache(symbol);
    hadBookRef.current = n > 0;
  }, [allForSymbol.length, eggOn, symbol]);
  useEffect(() => {
    const live = t0BreakEvens(hudSheet);
    const eps = beGhostEps(hudSheet?.sMin ?? 0, hudSheet?.sMax ?? 1);
    beGhostsRef.current = parkMovedBreakEvens(
      prevLiveBeRef.current,
      live,
      beGhostsRef.current,
      eps,
    );
    prevLiveBeRef.current = live;
    const all = [...beGhostsRef.current, ...live];
    setBeLevels(all);
    sceneRef.current?.setBeGhosts(eggOn ? all : []);
  }, [sheetKey, hudSheet, eggOn, bookFitKey]);

  const tauHi = hudSheet?.timeAxis[0] ?? 0;
  const tauLo = hudSheet?.timeAxis[(hudSheet?.timeAxis.length || 1) - 1] ?? 0;
  const tauMin = Math.min(tauLo, tauHi);
  const tauMax = Math.max(tauLo, tauHi);
  const tauStarRaw = playhead ?? tauHi;
  const tauStar =
    hudSheet && Number.isFinite(tauStarRaw)
      ? Math.min(tauMax, Math.max(tauMin, tauStarRaw))
      : tauStarRaw;
  const strikeForPlane = hudSheet
    ? Math.min(hudSheet.sMax, Math.max(hudSheet.sMin, strikePos))
    : strikePos;
  const sample =
    hudSheet && hudSheet.spot > 0
      ? samplePlayhead(hudSheet, hudSheet.spot, tauStar)
      : null;
  const cad = cadenceClaim(cadence === "5-min" ? "5-min" : "live");
  const valueWindow = hudSheet
    ? surfaceValueWindow(
        Math.min(
          sheet?.minPnL ?? ghostSheet?.minPnL ?? 0,
          ghostSheet?.minPnL ?? sheet?.minPnL ?? 0,
        ),
        Math.max(
          sheet?.maxPnL ?? ghostSheet?.maxPnL ?? 0,
          ghostSheet?.maxPnL ?? sheet?.maxPnL ?? 0,
        ),
        heightPadFrac,
      )
    : null;
  const timeWalked = hudSheet ? isTimeAltered(tauStar, tauHi, tauLo) : false;
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
      altered,
      valueWindow: valueWindow ?? undefined,
      zoomGain,
      candlesOn,
      spots,
      relief,
      planes: {
        strike: {
          visible: strikeOn,
          opacity: 0.22,
          position: strikeForPlane,
        },
        time: {
          visible: !!(sheet && timeOn && timeWalked),
          opacity: 0.28,
          position: tauStar,
        },
        value: { visible: valueOpacity > 0, opacity: valueOpacity, position: 0 },
      },
    });
  }, [sheetKey, tauStar, strikeOn, timeOn, timeWalked, strikeForPlane, altered, valueWindow, sheet, hudSheet, zoomGain, valueOpacity, spots, candlesOn, relief]);

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
          beLevels={beLevels}
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
          onToggleVisibility={(id) => {
            const next = loadPositions().map((p) =>
              p.id === id ? { ...p, visible: !p.visible } : p,
            );
            savePositions(next);
            window.dispatchEvent(new Event(ANALYZER_BOOK_EVENT));
          }}
          onClosePosition={(id) => {
            const next = loadPositions().map((p) =>
              p.id === id ? closePosition(p) : p,
            );
            savePositions(next);
            window.dispatchEvent(new Event(ANALYZER_BOOK_EVENT));
          }}
          onRemovePosition={(id) => {
            const next = loadPositions().filter((p) => p.id !== id);
            savePositions(next);
            window.dispatchEvent(new Event(ANALYZER_BOOK_EVENT));
          }}
          captureBusy={captureBusy}
          onCapture={async () => {
            if (captureBusy) return;
            setCaptureBusy(true);
            try {
              const tape = tapeRef.current?.getCanvas() ?? null;
              if (!tape) {
                setSendNote("Nothing to capture yet.");
                return;
              }
              const surface = sceneRef.current?.captureCanvas() ?? null;
              const composed = compositeCanvases(tape, surface);
              const blob = await canvasToPngBlob(composed);
              const dateYmd = journalDateYmd();
              const filename = captureFilename(symbol, dateYmd);
              const file = new File([blob], filename, { type: "image/png" });
              const win = chartWindow(Date.now());
              const visible = allForSymbol.filter((p) => p.visible !== false);
              const caption = captureCaption({
                symbol,
                dateYmd,
                positions: visible.map((p) => ({
                  label: p.label,
                  notation: p.notation,
                })),
                note: localSessionNote({
                  symbol,
                  phase: win.prefillsPriorDay ? "pre" : "rth",
                  positions: visible.map((p) => ({
                    label: p.label,
                    notation: p.notation,
                  })),
                  lastMid: liveSpot,
                  bookPnl: Number.isFinite(risk.theoreticalPnLAtSpot)
                    ? risk.theoreticalPnLAtSpot
                    : risk.packageDebit,
                  bookState: law,
                }),
              });
              try {
                await attachCaptureToTodayJournal(file, caption);
                setSendNote("Saved to today’s journal.");
              } catch (err) {
                downloadBlob(file, filename);
                setSendNote(
                  err instanceof JournalCaptureClosedError
                    ? "Journal is closed for today — saved a picture here instead."
                    : "Saved a picture here. Journal did not take it.",
                );
              }
            } catch {
              setSendNote("Could not capture this view.");
            } finally {
              setCaptureBusy(false);
            }
          }}
          onSendToTradeLog={async (id) => {
            const pos = loadPositions().find((p) => p.id === id);
            if (!pos) return;
            const res = await createTrade(analyzerPositionToOpenTrade(pos));
            if (res.ok && res.data?.id != null) {
              const next = loadPositions().map((p) =>
                p.id === id ? linkTradeLogId(p, res.data.id) : p,
              );
              savePositions(next);
            }
            setSendNote(
              res.ok
                ? "Sent to Trade Log as an open trade (simulation). Linked — a Trade Log close will close it here too."
                : res.error.kind === "err"
                  ? res.error.message
                  : "Could not send this position to Trade Log.",
            );
          }}
        />
      ) : null}
      {sendNote ? (
        <div
          className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white/80"
          data-testid="surface-time-ortho-toast"
        >
          {sendNote}
        </div>
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
          onFactory={(id: FactoryViewId) => {
            if (id === "now" || id === "time" || id === "timeOrtho") {
              setProjection("orthographic");
            } else setProjection("perspective");
            if (id === "timeOrtho") {
              setCandlesOn(false);
              setEggOn(true);
            } else {
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
                playhead: tauStar,
                volOffsetPts,
                spotPct,
                strikeOn,
                timeOn,
                strikePos,
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
            if (typeof ins.playhead === "number") setPlayhead(ins.playhead);
            if (typeof ins.volOffsetPts === "number") setVolOffsetPts(ins.volOffsetPts);
            if (typeof ins.spotPct === "number") setSpotPct(ins.spotPct);
            if (typeof ins.strikeOn === "boolean") setStrikeOn(ins.strikeOn);
            if (typeof ins.timeOn === "boolean") setTimeOn(ins.timeOn);
            if (typeof ins.strikePos === "number") setStrikePos(ins.strikePos);
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
            onStrikeOn={setStrikeOn}
            onTimeOn={setTimeOn}
            onStrikePos={setStrikePos}
            widthPadFrac={widthPadFrac}
            heightPadFrac={heightPadFrac}
            onWidthPadFrac={setWidthPadFrac}
            onHeightPadFrac={setHeightPadFrac}
            valueOpacity={valueOpacity}
            onValueOpacity={setValueOpacity}
            candlesOn={candlesOn}
            onCandlesOn={setCandlesOn}
            relief={relief}
            onRelief={setRelief}
          />
        </HudCollapse>
        <HudCollapse title="Time" testId="surface-time-wrap">
          <TimeHud
            tauLo={hudSheet ? tauLo : 0}
            tauHi={hudSheet ? tauHi : 1}
            playhead={hudSheet ? tauStar : 0}
            volOffsetPts={volOffsetPts}
            spotPct={spotPct}
            sample={sample}
            cadenceLabel={cad.label}
            lastMinuteGold={cad.lastMinuteGold}
            onPlayhead={setPlayhead}
            onVol={setVolOffsetPts}
            onSpotPct={setSpotPct}
            onReset={() => {
              setPlayhead(null);
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
              onAutofit={() => {
                setAutofitGen((n) => n + 1);
                setProjection("perspective");
                sceneRef.current?.fit();
              }}
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

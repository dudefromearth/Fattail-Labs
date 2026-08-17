"use client";

/**
 * Options Lab Surface — 3D of the Analyzer visible book.
 * Every (S, τ) is that book. No probe tent. No second structure.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  ANALYZER_BOOK_EVENT,
  loadPositions,
} from "@/lib/options-lab/analyzerBook";
import { positionToParsedTrade } from "@/lib/options-lab/positionToTrade";
import { useOpfRiskGraph } from "@/lib/options-lab/useOpfRiskGraph";
import { useLiveUnderlierMarks } from "@/lib/market/useLiveUnderlierMarks";
import {
  MIN_TAU,
  bindListedSurfaceLegs,
  computeSurfaceSheet,
  type OpfLegMarkForSheet,
  type SurfaceSheet,
} from "@/lib/risk-graph/surfaceModel";
import { surfaceAutofitWindow } from "@/lib/risk-graph/surfaceAutofit";
import { mountSurfaceScene, type SurfaceSceneHandle } from "@/lib/risk-graph/surfaceScene";
import { surfaceHostClock } from "./hostLaw";
import CameraHud from "./CameraHud";
import TimeHud from "./TimeHud";
import PlanesHud from "./PlanesHud";
import ViewsHud from "./ViewsHud";
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

  useEffect(() => {
    void loadSurfaceInspect().then((p) => setSaved(p.views || []));
    const on = () => setTick((n) => n + 1);
    window.addEventListener("storage", on);
    window.addEventListener(ANALYZER_BOOK_EVENT, on);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener(ANALYZER_BOOK_EVENT, on);
    };
  }, []);

  const book = useMemo(() => {
    void tick;
    const sym = symbol.toUpperCase();
    return loadPositions().filter(
      (p) =>
        p.visible !== false &&
        (p.position.underlying || "").toUpperCase() === sym,
    );
  }, [tick, symbol]);

  const parsedBook = useMemo(() => {
    const trades: ReturnType<typeof positionToParsedTrade>[] = [];
    const errors: string[] = [];
    for (const p of book) {
      try {
        trades.push(positionToParsedTrade(p.position));
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
    return { trades, errors };
  }, [book]);
  const trades = parsedBook.trades;
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
    let label = symbol;
    let cadence = "live";
    if (!book.length) {
      law = "WAITING";
      detail = "Nothing shown in Analyzer. Surface is that book in 3D.";
      label = `${symbol} · Analyzer`;
    } else if (!trades.length) {
      law = "CHECK LEGS";
      detail = parsedBook.errors[0] || "Could not read the shown structures.";
    } else {
      const clocks = book.map((p) =>
        surfaceHostClock(
          (p.position.expiration || p.position.legs[0]?.expiration || "").slice(
            0,
            10,
          ),
        ),
      );
      const clock = clocks.includes("live")
        ? "live"
        : clocks.includes("residual")
          ? "residual"
          : "expired";
      if (clock === "expired") {
        law = "EXPIRED";
        detail = "Card EXPIRED is midnight ET. Viewport ghost uses the defined debit.";
      } else if (clock === "residual") {
        law = "HELD / RESIDUAL";
        detail = "After OPF settlement instant. Held / residual, never live.";
      } else if (risk.loading && !risk.result) {
        law = "UPDATING";
        detail = "Resolving the shown Analyzer book.";
      } else if (risk.error && !risk.result) {
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
          const allLegs = trades.flatMap((t) => t.legs);
          const bound = bindListedSurfaceLegs(allLegs, marks, {
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
          if (!bound.ok) {
            law = bound.hole === "IV NO" ? "IV NO" : "CHECK LEGS";
            detail = bound.detail;
          } else {
            try {
              const strikes = allLegs.map((l) => l.strike);
              const simSpot = spot * (1 + spotPct / 100);
              const whatIfLegs = bound.legs.map((leg) => ({
                ...leg,
                iv: Math.max(1e-8, leg.iv + volOffsetPts / 100),
              }));
              const fit = surfaceAutofitWindow(whatIfLegs, simSpot, strikes);
              sheet = computeSurfaceSheet(whatIfLegs, {
                spot: simSpot,
                sMin: fit.sMin,
                sMax: fit.sMax,
                quality: "per_leg_iv",
                ivSource: bound.ivSources.join("+"),
                listedStrikes: strikes,
              });
              const names = book
                .map((p) => p.label || p.notation)
                .filter(Boolean);
              label = `${symbol} · ${names.join(" + ") || `${book.length} shown`}`;
            } catch (err) {
              law = "CHECK LEGS";
              detail =
                err instanceof Error ? err.message : "Sheet failed to compute.";
            }
          }
        }
      }
    }
    return { law, detail, sheet, label, cadence };
  }, [
    book,
    symbol,
    risk.loading,
    risk.result,
    risk.spot,
    risk.error,
    liveSpot,
    trades,
    parsedBook.errors,
    marksKey,
    volOffsetPts,
    spotPct,
    autofitGen,
  ]);

  sheetRef.current = view.sheet;
  const sheetKey = sheetFingerprint(
    view.sheet,
    `${volOffsetPts}|${spotPct}|${autofitGen}`,
  );

  useLayoutEffect(() => {
    const host = hostRef.current;
    const sheet = sheetRef.current;
    if (!host) return;
    host.dataset.bound = "1";
    try {
      if (!sceneRef.current) {
        sceneRef.current = mountSurfaceScene(host, { sheet });
      } else {
        sceneRef.current.setSheet(sheet);
      }
      host.dataset.scene = "ok";
    } catch (err) {
      host.dataset.scene = "fail";
      host.dataset.sceneError = err instanceof Error ? err.message : String(err);
    }
  }, [sheetKey]);

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

  const { law, detail, sheet, label, cadence } = view;
  const tauHi = sheet?.timeAxis[0] ?? 0;
  const tauLo = sheet?.timeAxis[(sheet?.timeAxis.length || 1) - 1] ?? 0;
  const tauMin = Math.min(tauLo, tauHi);
  const tauMax = Math.max(tauLo, tauHi);
  const tauStarRaw = playhead ?? tauHi;
  const tauStar =
    sheet && Number.isFinite(tauStarRaw)
      ? Math.min(tauMax, Math.max(tauMin, tauStarRaw))
      : tauStarRaw;
  const strikeForPlane = sheet
    ? Math.min(sheet.sMax, Math.max(sheet.sMin, strikePos))
    : strikePos;
  const sample =
    sheet && sheet.spot > 0 ? samplePlayhead(sheet, sheet.spot, tauStar) : null;
  const cad = cadenceClaim(cadence === "5-min" ? "5-min" : "live");
  const altered = sheet
    ? isRealityAltered({
        tau: tauStar,
        tauNow: tauHi,
        tauExpiry: tauLo,
        volOffsetPts,
        spotPct,
      })
    : false;

  useEffect(() => {
    if (!sceneRef.current || !sheet) return;
    sceneRef.current.setInspect({
      timePlayhead: tauStar,
      altered,
      planes: {
        strike: { visible: strikeOn, opacity: 0.22, position: strikeForPlane },
        time: { visible: timeOn, opacity: 0.28, position: tauStar },
        value: { visible: true, opacity: 0.12, position: 0 },
      },
    });
  }, [sheetKey, tauStar, strikeOn, timeOn, strikeForPlane, altered]);

  return (
    <div
      className="relative flex h-full min-h-[50vh] w-full flex-1 flex-col bg-[#0a0a0e]"
      data-testid="surface-host"
      data-law={law || "TENT"}
      data-cadence={cadence}
      data-has-sheet={sheet ? "1" : "0"}
      data-altered={altered ? "1" : "0"}
    >
      <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-sm text-[11px] text-white/55">
        <div className="font-medium text-white/80">{label}</div>
        <div>
          as_of {altered ? "time machine" : "live"} · {cadence}
          {sheet ? ` · ${sheet.ivSource}` : ""}
        </div>
      </div>
      {law ? (
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
        className="relative min-h-0 flex-1 overflow-hidden"
        data-testid="surface-canvas"
      />
      <TimeHud
        tauLo={sheet ? tauLo : 0}
        tauHi={sheet ? tauHi : 1}
        playhead={sheet ? tauStar : 0}
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
      <PlanesHud
        strikeOn={strikeOn}
        timeOn={timeOn}
        strikePos={sheet ? strikeForPlane : strikePos}
        strikeMin={sheet?.sMin ?? 80}
        strikeMax={sheet?.sMax ?? 120}
        onStrikeOn={setStrikeOn}
        onTimeOn={setTimeOn}
        onStrikePos={setStrikePos}
      />
      <ViewsHud
        onFactory={(id: FactoryViewId) => {
          if (id === "now" || id === "time") setProjection("orthographic");
          else setProjection("perspective");
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
      <CameraHud
        projection={projection}
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
      />
    </div>
  );
}

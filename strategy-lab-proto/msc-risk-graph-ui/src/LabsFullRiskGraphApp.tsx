/**
 * Full MSC Risk Graph host for Strategy Lab.
 *
 * Data path (reliable): poll /live-chart.json written by Streamlit.
 * Optional: also accept postMessage labs-rg-data.
 * Drag path: POST /api/drag (Vite middleware) + postMessage for CCv2 bridge.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import RiskGraphPanel, {
  type RiskGraphPanelHandle,
  type RiskGraphStrategy,
  type PriceAlertLine,
} from "./ms-transplant/components/RiskGraphPanel";
import type { PositionLeg } from "./ms-transplant/types/riskGraph";
import { repriceShortCredit } from "./lib/repriceCredit";
import { applyLabsStrikeDrag } from "./lib/labsDragGeometry";
import "./msc-risk-graph.css";

type LabsChartPayload = {
  expiration: { price: number; pnl: number }[];
  theoretical: { price: number; pnl: number }[];
  spot: number;
  strikes: number[];
  expirationBreakevens: number[];
  theoreticalBreakevens: number[];
  oneSigmaBandWidth?: number;
  title?: string;
  strategy?: RiskGraphStrategy;
  vix?: number;
  symbol?: string;
};

function postParent(msg: unknown) {
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, "*");
    }
  } catch {
    /* ignore */
  }
}

function todayPlus(dte: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(0, dte));
  return d.toISOString().slice(0, 10);
}

/** Strip per-leg IVs so client BS uses flat strat/VIX vol (Theo surface). */
function flatTheoStrategy(s: RiskGraphStrategy): RiskGraphStrategy {
  if (!s.legs?.length) return s;
  return {
    ...s,
    legs: s.legs.map((leg) => {
      const { implied_volatility: _iv, ...rest } = leg as PositionLeg & {
        implied_volatility?: number;
      };
      return rest as PositionLeg;
    }),
  };
}

function strategyFromPayload(p: LabsChartPayload): RiskGraphStrategy {
  if (p.strategy) {
    return flatTheoStrategy({
      ...p.strategy,
      addedAt: p.strategy.addedAt || Date.now(),
      visible: p.strategy.visible !== false,
      id: p.strategy.id || "labs-shape",
    });
  }
  const strikes = [...(p.strikes || [])].sort((a, b) => a - b);
  const spot = p.spot || 100;
  const body = strikes.length
    ? strikes.reduce((a, b) => a + b, 0) / strikes.length
    : spot;
  const width =
    strikes.length >= 2
      ? Math.max(1, Math.round((strikes[strikes.length - 1] - strikes[0]) / 2))
      : 5;
  const legs: PositionLeg[] = [];
  if (strikes.length >= 3) {
    const lo = strikes[0];
    const mid =
      strikes.find((s) => Math.abs(s - body) < 1e-6) ??
      strikes[Math.floor(strikes.length / 2)];
    const hi = strikes[strikes.length - 1];
    legs.push(
      { strike: lo, expiration: todayPlus(0), right: "put", quantity: 1 },
      { strike: mid, expiration: todayPlus(0), right: "put", quantity: -1 },
      { strike: mid, expiration: todayPlus(0), right: "call", quantity: -1 },
      { strike: hi, expiration: todayPlus(0), right: "call", quantity: 1 },
    );
  } else if (strikes.length >= 2) {
    legs.push(
      { strike: strikes[0], expiration: todayPlus(0), right: "put", quantity: 1 },
      { strike: strikes[1], expiration: todayPlus(0), right: "put", quantity: -1 },
    );
  }
  return flatTheoStrategy({
    id: "labs-shape",
    addedAt: Date.now(),
    visible: true,
    strategy: "butterfly",
    side: "call",
    strike: Math.round(body),
    width,
    dte: 0,
    expiration: todayPlus(0),
    debit: null,
    symbol: p.symbol || "SPY",
    legs: legs.length ? legs : undefined,
    positionType:
      legs.length === 3
        ? "butterfly"
        : legs.length === 4
          ? "iron_condor"
          : "vertical",
    direction: "short",
    costBasisType: "credit",
    quantity: 1,
  });
}

function applyPayload(
  p: LabsChartPayload,
  setPayload: (p: LabsChartPayload) => void,
  setStrategies: (s: RiskGraphStrategy[]) => void,
) {
  setPayload(p);
  setStrategies([strategyFromPayload(p)]);
}

function strikesSig(strikes: number[] | undefined): string {
  return [...(strikes || [])]
    .map((x) => Math.round(Number(x) * 100) / 100)
    .sort((a, b) => a - b)
    .join(",");
}

export function LabsFullRiskGraphApp() {
  const [payload, setPayload] = useState<LabsChartPayload | null>(null);
  const [strategies, setStrategies] = useState<RiskGraphStrategy[]>([]);
  const [priceAlertLines, setPriceAlertLines] = useState<PriceAlertLine[]>([]);
  const [status, setStatus] = useState("Connecting…");
  /** Bumps to force a hard remount of RiskGraphPanel (debug). */
  const [panelEpoch, setPanelEpoch] = useState(0);
  const [debugNote, setDebugNote] = useState("");
  const panelRef = useRef<RiskGraphPanelHandle>(null);
  const lastChartSig = useRef<string>("");
  /** After a handle drop, ignore poll files that still show pre-drag strikes. */
  const pendingLocalStrikes = useRef<string | null>(null);
  const pendingLocalUntil = useRef<number>(0);

  // Poll live-chart.json — reliable across Streamlit iframe isolation
  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams(window.location.search);
    const autofitParam = params.get("autofit");
    let lastAutofitParam = autofitParam;

    const tick = async () => {
      try {
        const res = await fetch(`/live-chart.json?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (alive) setStatus(`No chart file yet (${res.status}) — waiting for Strategy Lab…`);
          return;
        }
        const p = (await res.json()) as LabsChartPayload;
        const fileStrikes = strikesSig(p.strikes);
        const sig = JSON.stringify({
          s: p.spot,
          k: p.strikes,
          t: p.title,
          n: p.expiration?.length,
        });

        // Local handle-move is source of truth until Streamlit writes matching strikes.
        // Never re-apply a stale file — that was reverting the shape after every drag.
        if (pendingLocalStrikes.current) {
          if (fileStrikes === pendingLocalStrikes.current) {
            // Server caught up — take its payload (credit/curves) and clear guard
            pendingLocalStrikes.current = null;
            pendingLocalUntil.current = 0;
            lastChartSig.current = sig;
            applyPayload(p, setPayload, setStrategies);
            if (alive) setStatus("Live");
            return;
          }
          if (Date.now() < pendingLocalUntil.current) {
            if (alive) setStatus("Live · shape moved (waiting for Spec sync)…");
            return;
          }
          // Timed out: prefer server package if it has a valid multi-leg shape.
          // Keeping a broken single-leg-drag local forever left the graph unrenderable.
          const serverLegs = p.strategy?.legs?.length ?? 0;
          pendingLocalStrikes.current = null;
          pendingLocalUntil.current = 0;
          lastChartSig.current = sig;
          if (serverLegs >= 2) {
            applyPayload(p, setPayload, setStrategies);
            if (alive) setStatus("Live · resynced from Spec");
          } else if (alive) {
            setStatus("Live · local shape");
          }
          return;
        }

        if (sig !== lastChartSig.current) {
          const firstLoad = lastChartSig.current === "";
          lastChartSig.current = sig;
          applyPayload(p, setPayload, setStrategies);
          // First load: autofit after layout + after client curves compute.
          // Without the later fit, strike handles sit off-screen until Force re-render.
          if (firstLoad) {
            window.setTimeout(() => panelRef.current?.autoFit(), 80);
            window.setTimeout(() => panelRef.current?.autoFit(), 250);
            window.setTimeout(() => panelRef.current?.autoFit(), 600);
          }
        }
        // Explicit Autofit from Streamlit (URL ?autofit=N) without remounting
        const af = new URLSearchParams(window.location.search).get("autofit");
        if (af && af !== lastAutofitParam) {
          lastAutofitParam = af;
          window.setTimeout(() => panelRef.current?.autoFit(), 50);
        }
        if (alive) setStatus("Live");
      } catch {
        if (alive) setStatus("Waiting for Strategy Lab (chart feed)…");
      }
    };
    tick();
    const id = window.setInterval(tick, 400);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // Also accept postMessage (optional path) — same clobber rules as poll
  useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      const d = ev.data;
      if (!d || typeof d !== "object") return;
      if (d.type === "labs-rg-data" && d.payload) {
        const p = d.payload as LabsChartPayload;
        const fileStrikes = strikesSig(p.strikes);
        if (
          pendingLocalStrikes.current &&
          fileStrikes !== pendingLocalStrikes.current
        ) {
          return; // don't revert a local handle move
        }
        applyPayload(p, setPayload, setStrategies);
        setStatus("Live (postMessage)");
      }
      if (d.type === "labs-rg-autofit") {
        panelRef.current?.autoFit();
      }
    };
    window.addEventListener("message", onMsg);
    postParent({ type: "labs-rg-ready" });
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const spot = payload?.spot ?? 560;
  const vix = payload?.vix ?? 16;
  const strikeSummary =
    strategies[0]?.legs
      ?.map((l) => l.strike)
      .sort((a, b) => a - b)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(" · ") || "—";

  // Labs host path: apply handle geometry (body=whole structure, wing=resize),
  // reprice credit vs spot, then notify Streamlit. Never move body shorts alone
  // without wings — that destroys the iron fly and breaks the graph.
  const commitDrag = useCallback(
    (
      strategyId: string,
      grabbedStrike: number,
      strikeOffset: number,
      shiftAll: boolean,
    ) => {
      if (!strikeOffset) return;
      const S = spot;

      setStrategies((prev) => {
        const next = prev.map((s) => {
          if (s.id !== strategyId || !s.legs?.length) return s;
          const geo = applyLabsStrikeDrag({
            legs: s.legs,
            bodyStrike: Number(s.strike) || S,
            width: Number(s.width) > 0 ? Number(s.width) : 5,
            grabbedStrike,
            offset: strikeOffset,
            shiftAll,
            positionType: s.positionType,
          });
          const credit = repriceShortCredit({
            legs: geo.legs,
            spot: S,
            wing: geo.width,
            dte: s.dte,
            iv: vix / 100,
          });
          pendingLocalStrikes.current = strikesSig(geo.legs.map((l) => l.strike));
          pendingLocalUntil.current = Date.now() + 15000;
          return {
            ...s,
            legs: geo.legs,
            strike: geo.strike,
            width: geo.width,
            debit: credit,
            costBasis: credit,
            costBasisType: "credit" as const,
            addedAt: Date.now(),
          };
        });
        return next;
      });

      setPayload((prev) => {
        if (!prev?.strategy?.legs) return prev;
        const s = prev.strategy;
        if (s.id !== strategyId) return prev;
        const geo = applyLabsStrikeDrag({
          legs: s.legs!,
          bodyStrike: Number(s.strike) || S,
          width: Number(s.width) > 0 ? Number(s.width) : 5,
          grabbedStrike,
          offset: strikeOffset,
          shiftAll,
          positionType: s.positionType,
        });
        const credit = repriceShortCredit({
          legs: geo.legs,
          spot: S,
          wing: geo.width,
          dte: s.dte,
          iv: (prev.vix ?? vix) / 100,
        });
        return {
          ...prev,
          strikes: [...new Set(geo.legs.map((l) => l.strike))].sort(
            (a, b) => a - b,
          ),
          strategy: {
            ...s,
            legs: geo.legs,
            strike: geo.strike,
            width: geo.width,
            debit: credit,
            costBasis: credit,
            costBasisType: "credit",
            addedAt: Date.now(),
          },
        };
      });

      setStatus(
        `Moved ${shiftAll ? "all legs" : `strike ${grabbedStrike}`} by ${strikeOffset >= 0 ? "+" : ""}${strikeOffset} (credit repriced)`,
      );

      // Streamlit apply_handle_drag: shift_key or body short → body_offset slide.
      // Client already applied Labs geometry; shift_key=true keeps server in lockstep
      // for body slides even when the user didn't hold Shift.
      const strat = strategies.find((s) => s.id === strategyId);
      let streamlitShift = shiftAll;
      if (!streamlitShift && strat?.legs?.length) {
        const at = strat.legs.filter(
          (l) => Math.abs(Number(l.strike) - grabbedStrike) < 1e-6,
        );
        const bodyOnly =
          at.length > 0 &&
          at.every((l) => l.quantity < 0) &&
          !at.some((l) => l.quantity > 0);
        streamlitShift = bodyOnly;
      }
      const body = {
        type: "strike_drag",
        grabbed_strike: grabbedStrike,
        new_strike: grabbedStrike + strikeOffset,
        offset: strikeOffset,
        role: streamlitShift ? "body" : "auto",
        side: "auto",
        shift_key: streamlitShift,
        strategy_id: strategyId,
        ts: Date.now(),
      };
      fetch("/api/drag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => undefined);
      postParent({
        type: "labs-rg-strike-drag",
        payload: {
          strategyId,
          grabbedStrike,
          offset: strikeOffset,
          shiftKey: streamlitShift,
        },
      });
    },
    [spot, vix, strategies],
  );

  const noopAlert = useCallback(() => {}, []);

  /** Debug: remount panel + redraw. Does NOT change strikes → R2R/shape stay same. */
  const forceRerender = useCallback(() => {
    const t = new Date().toLocaleTimeString();
    setStrategies((prev) =>
      prev.map((s) => ({
        ...s,
        legs: s.legs?.map((l) => ({ ...l })),
        addedAt: Date.now(),
      })),
    );
    setPayload((prev) => (prev ? { ...prev } : prev));
    setPanelEpoch((n) => n + 1);
    setStatus(`Force re-render @ ${t}`);
    setDebugNote(
      `Remount #${panelEpoch + 1} @ ${t} — no strike change (use Strikes ±5 to reprice credit/R2R).`,
    );
    window.setTimeout(() => panelRef.current?.autoFit(), 80);
  }, [panelEpoch]);

  /**
   * Debug: shift all legs by ±delta and reprice credit (ATM vs OTM).
   */
  const nudgeStrikes = useCallback(
    (delta: number) => {
      const t = new Date().toLocaleTimeString();
      let before = "—";
      let after = "—";
      let creditNote = "";
      setStrategies((prev) => {
        const next = prev.map((s) => {
          if (!s.legs?.length) return s;
          before = [...new Set(s.legs.map((l) => l.strike))]
            .sort((a, b) => a - b)
            .join(",");
          const legs = s.legs.map((l) => ({
            ...l,
            strike: Number(l.strike) + delta,
          }));
          after = [...new Set(legs.map((l) => l.strike))]
            .sort((a, b) => a - b)
            .join(",");
          const credit = repriceShortCredit({
            legs,
            spot,
            wing: Number(s.width) > 0 ? Number(s.width) : 5,
            dte: s.dte,
            iv: vix / 100,
          });
          creditNote = `credit ${Number(s.debit ?? 0).toFixed(2)} → ${credit.toFixed(2)}`;
          pendingLocalStrikes.current = strikesSig(legs.map((l) => l.strike));
          pendingLocalUntil.current = Date.now() + 15000;
          return {
            ...s,
            legs,
            strike: Number(s.strike) + delta,
            debit: credit,
            costBasis: credit,
            costBasisType: "credit" as const,
            addedAt: Date.now(),
          };
        });
        return next;
      });
      setPayload((prev) => {
        if (!prev?.strategy?.legs) return prev;
        const legs = prev.strategy.legs.map((l) => ({
          ...l,
          strike: Number(l.strike) + delta,
        }));
        const credit = repriceShortCredit({
          legs,
          spot,
          wing: Number(prev.strategy.width) > 0 ? Number(prev.strategy.width) : 5,
          dte: prev.strategy.dte,
          iv: (prev.vix ?? vix) / 100,
        });
        return {
          ...prev,
          strikes: [...new Set(legs.map((l) => l.strike))].sort((a, b) => a - b),
          strategy: {
            ...prev.strategy,
            legs,
            strike: Number(prev.strategy.strike ?? 0) + delta,
            debit: credit,
            costBasis: credit,
            costBasisType: "credit",
            addedAt: Date.now(),
          },
        };
      });
      setStatus(`Nudge ${delta >= 0 ? "+" : ""}${delta} @ ${t}`);
      setDebugNote(
        `Strikes ${before} → ${after}. ${creditNote}. Credit/R2R reprice with moneyness.`,
      );
    },
    [spot, vix],
  );

  return (
    <div className="labs-rg-shell">
      <div className="labs-rg-shell-bar">
        <strong style={{ fontSize: 13 }}>
          {(payload && payload.title) || "Risk Graph"} · MSC full panel
        </strong>
        <span style={{ color: "#8b919a", fontSize: 12 }}>{status}</span>
        <span
          style={{ color: "#c4b5fd", fontSize: 12, fontFamily: "monospace" }}
          title="Current strategy strikes"
        >
          strikes: {strikeSummary}
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="btn-auto-fit-header"
          title="Remount panel (no strike change — R2R will not change)"
          onClick={forceRerender}
        >
          Force re-render
        </button>
        <button
          type="button"
          className="btn-auto-fit-header"
          title="Shift all strikes −5 — tent must slide left"
          onClick={() => nudgeStrikes(-5)}
        >
          Strikes −5
        </button>
        <button
          type="button"
          className="btn-auto-fit-header"
          title="Shift all strikes +5 — tent must slide right"
          onClick={() => nudgeStrikes(5)}
        >
          Strikes +5
        </button>
        <button
          type="button"
          className="btn-auto-fit-header"
          onClick={() => panelRef.current?.autoFit()}
        >
          Autofit
        </button>
      </div>
      {debugNote ? (
        <div
          style={{
            padding: "6px 12px",
            fontSize: 12,
            background: "#1e1b4b",
            color: "#e9d5ff",
            borderBottom: "1px solid #312e81",
          }}
        >
          {debugNote}
        </div>
      ) : null}
      <div className="labs-rg-shell-body">
        {!payload ? (
          <div style={{ padding: 32, color: "#8b919a", fontSize: 14 }}>
            <p style={{ margin: "0 0 8px" }}>{status}</p>
            <p style={{ margin: 0, fontSize: 12 }}>
              Strategy Lab writes <code>live-chart.json</code> into this UI. Keep
              Streamlit open on the Risk Graph studio section.
            </p>
          </div>
        ) : (
          <RiskGraphPanel
            key={`rg-panel-${panelEpoch}`}
            ref={panelRef}
            strategies={strategies}
            onRemoveStrategy={(id) =>
              setStrategies((prev) => prev.filter((s) => s.id !== id))
            }
            onToggleStrategyVisibility={(id) =>
              setStrategies((prev) =>
                prev.map((s) =>
                  s.id === id ? { ...s, visible: !s.visible } : s,
                ),
              )
            }
            onUpdateStrategyDebit={(id, debit) =>
              setStrategies((prev) =>
                prev.map((s) => (s.id === id ? { ...s, debit } : s)),
              )
            }
            priceAlertLines={priceAlertLines}
            onDeletePriceAlertLine={(id) =>
              setPriceAlertLines((prev) => prev.filter((a) => a.id !== id))
            }
            onOpenAlertDialog={noopAlert}
            onStartNewAlert={noopAlert}
            onStartEditingAlert={noopAlert}
            spotPrice={spot}
            vix={vix}
            timeMachineEnabled={false}
            onTimeMachineToggle={() => {}}
            simTimeOffsetHours={0}
            onSimTimeChange={() => {}}
            simVolatilityOffset={0}
            onSimVolatilityChange={() => {}}
            simSpotPct={0}
            onSimSpotPctChange={() => {}}
            onResetSimulation={() => {}}
            onRepositionStrategy={commitDrag}
            hideSidebar={true}
          />
        )}
      </div>
    </div>
  );
}

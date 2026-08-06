"use client";

/**
 * Curate run environment — sim broker, fake money, decision log.
 * Deploy (Tradier) is separate and Coach-gated.
 */

import { useCallback, useEffect, useState } from "react";
import type { StrategyLabStrategy } from "@/lib/strategyLabApi";
import CurateSymbolPicker from "@/components/strategy-lab/CurateSymbolPicker";
import {
  armCurateInstance,
  createCurateInstance,
  fetchCurateMeta,
  getCurateInstance,
  listCurateInstances,
  pauseCurateInstance,
  tickCurateInstance,
  type CurateDecision,
  type CurateInstance,
  type CuratePosition,
} from "@/lib/strategyLabCurateApi";

type Props = {
  strategy: StrategyLabStrategy;
  pushNotice: (
    level: "info" | "success" | "warning" | "error",
    message: string,
  ) => void;
};

function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export default function CurateRuntimePanel({ strategy, pushNotice }: Props) {
  const [metaLabel, setMetaLabel] = useState("");
  const [instances, setInstances] = useState<CurateInstance[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [instance, setInstance] = useState<CurateInstance | null>(null);
  const [positions, setPositions] = useState<CuratePosition[]>([]);
  const [decisions, setDecisions] = useState<CurateDecision[]>([]);
  const [busy, setBusy] = useState(false);
  const [alloc, setAlloc] = useState("10000");
  const [riskPer, setRiskPer] = useState("500");
  const [scanSymbol, setScanSymbol] = useState("SPY");

  const reloadList = useCallback(async () => {
    const res = await listCurateInstances(strategy.id);
    if (!res) return;
    setInstances(res.instances);
    if (!activeId && res.instances[0]) {
      setActiveId(res.instances[0].id);
    }
  }, [strategy.id, activeId]);

  const reloadActive = useCallback(async () => {
    if (!activeId) {
      setInstance(null);
      setPositions([]);
      setDecisions([]);
      return;
    }
    const res = await getCurateInstance(activeId);
    if (!res) return;
    setInstance(res.instance);
    setPositions(res.positions);
    setDecisions(res.decisions);
  }, [activeId]);

  useEffect(() => {
    void fetchCurateMeta().then((m) => {
      if (m) setMetaLabel(m.fill_model_label);
    });
  }, []);

  useEffect(() => {
    void reloadList();
  }, [reloadList]);

  useEffect(() => {
    void reloadActive();
  }, [reloadActive]);

  async function onCreate() {
    setBusy(true);
    try {
      const allocation_usd = Number(alloc);
      const scan_risk_per_open_usd = Number(riskPer);
      if (!(allocation_usd > 0) || !(scan_risk_per_open_usd > 0)) {
        pushNotice("error", "Allocation and risk per open must be > 0");
        return;
      }
      const res = await createCurateInstance({
        strategy_id: strategy.id,
        envelope: {
          allocation_usd,
          scan_risk_per_open_usd,
          max_positions_concurrent: 3,
          max_positions_per_day: 5,
          scan_symbol: scanSymbol,
        },
      });
      if (res.error || !res.instance) {
        pushNotice("error", res.error || "Create failed");
        return;
      }
      pushNotice(
        "success",
        `Curate run started on ${scanSymbol} (sim capital)`,
      );
      setActiveId(res.instance.id);
      await reloadList();
    } finally {
      setBusy(false);
    }
  }

  async function onArm() {
    if (!activeId) return;
    setBusy(true);
    try {
      const res = await armCurateInstance(activeId);
      if (res.error) pushNotice("error", res.error);
      else {
        pushNotice("success", "Armed — bot is ready in Curate (sim)");
        await reloadActive();
        await reloadList();
      }
    } finally {
      setBusy(false);
    }
  }

  async function onPause() {
    if (!activeId) return;
    setBusy(true);
    try {
      const res = await pauseCurateInstance(activeId);
      if (res.error) pushNotice("error", res.error);
      else {
        pushNotice("info", "Paused");
        await reloadActive();
        await reloadList();
      }
    } finally {
      setBusy(false);
    }
  }

  async function onTick() {
    if (!activeId) return;
    setBusy(true);
    try {
      const res = await tickCurateInstance(activeId);
      if (res.error) pushNotice("error", res.error);
      else {
        const n = res.events?.length ?? 0;
        pushNotice(
          "success",
          n ? `Tick: ${n} event(s)` : "Tick complete (no new events)",
        );
        if (res.instance) setInstance(res.instance);
        if (res.positions) setPositions(res.positions);
        await reloadActive();
      }
    } finally {
      setBusy(false);
    }
  }

  const openPositions = positions.filter((p) => p.status === "open");

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            Run this bot in Curate
          </h3>
          <p className="mt-0.5 max-w-xl text-xs text-[var(--color-label-secondary)]">
            Select the symbol for this Curate run (may match Design underlying).
            Shared live marks, simulated broker, sim capital. Positions are
            instances of the bot. Deploy only after Curate — no separate Deploy
            symbol step.
          </p>
          {metaLabel ? (
            <p className="mt-1 text-[10px] leading-snug text-[var(--color-label-secondary)]">
              Fill model: {metaLabel}
            </p>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:max-w-md">
          <CurateSymbolPicker
            value={scanSymbol}
            onChange={setScanSymbol}
            tradeableOnly
          />
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-[10px] font-semibold text-[var(--color-label-secondary)]">
              Allocation $
              <input
                className="mt-0.5 block w-24 rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-1 text-xs"
                value={alloc}
                onChange={(e) => setAlloc(e.target.value)}
              />
            </label>
            <label className="text-[10px] font-semibold text-[var(--color-label-secondary)]">
              Risk / open $
              <input
                className="mt-0.5 block w-24 rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-1 text-xs"
                value={riskPer}
                onChange={(e) => setRiskPer(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCreate()}
              className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Run in Curate
            </button>
          </div>
        </div>
      </div>

      {instances.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {instances.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setActiveId(i.id)}
              className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                activeId === i.id
                  ? "border-blue-500 bg-blue-50 text-blue-800"
                  : "border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)]"
              }`}
            >
              {i.id} · {i.status} · v{i.bound_version}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-label-secondary)]">
          No Curate instances yet. Create one to run scan/manage on sim capital.
        </p>
      )}

      {instance ? (
        <div className="space-y-3 rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-label)]">
              {instance.status}
            </span>
            <span className="text-xs text-[var(--color-label-secondary)]">
              Cash {money(instance.cash_usd)} · Realized{" "}
              {money(instance.realized_pnl_usd)} · Alloc{" "}
              {money(instance.allocation_usd)}
            </span>
            <span
              className="text-xs font-mono tabular-nums text-[var(--color-label-secondary)]"
              title="Runtime since last start/restart"
            >
              Run {instance.runtime_label || "—"}
            </span>
            <span className="text-[10px] text-[var(--color-label-secondary)]">
              broker={instance.broker} · {instance.fill_model}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {(instance.status === "draft" ||
              instance.status === "paused" ||
              instance.status === "halted") && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onArm()}
                className="rounded-lg border border-emerald-600 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
              >
                Arm
              </button>
            )}
            {(instance.status === "armed" || instance.status === "running") && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onTick()}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Advance (one tick)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onPause()}
                  className="rounded-lg border border-[var(--color-separator)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--color-fill)] disabled:opacity-50"
                >
                  Pause
                </button>
              </>
            )}
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
              Open positions ({openPositions.length})
            </h4>
            {openPositions.length === 0 ? (
              <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
                None — tick while armed/running to scan-open under envelope.
              </p>
            ) : (
              <ul className="mt-1 space-y-1">
                {openPositions.map((p) => (
                  <li
                    key={p.id}
                    className="rounded border border-[var(--color-separator)] px-2 py-1 text-xs"
                  >
                    <span className="font-semibold">{p.symbol}</span> · risk{" "}
                    {money(p.max_loss_usd)} · uPnL{" "}
                    {money(p.unrealized_pnl_usd)} · mark{" "}
                    {p.mark_price != null ? p.mark_price.toFixed(2) : "—"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
              Decision log
            </h4>
            <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-[11px]">
              {decisions.slice(0, 40).map((d) => (
                <li
                  key={d.id}
                  className="border-b border-[var(--color-separator)]/60 py-0.5 text-[var(--color-label-secondary)]"
                >
                  <span className="font-mono text-[10px] opacity-70">
                    {d.created_at.slice(11, 19)}
                  </span>{" "}
                  <span className="font-semibold text-[var(--color-label)]">
                    {d.event_type}
                  </span>
                  {d.reason_code ? (
                    <span className="text-amber-700"> ({d.reason_code})</span>
                  ) : null}
                  {d.message ? ` — ${d.message}` : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

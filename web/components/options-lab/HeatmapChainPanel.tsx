"use client";

/**
 * Heatmap app v1 — options chain ladder (templates later).
 * Layout: left control rail ~1/5 · right chain ~4/5 · full remaining viewport height.
 * Apple HIG: surface cards, segmented controls, token chrome (HIS v1.0).
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_STRIKE_WINGS,
  STRIKE_WING_CHOICES,
  fetchLadderExpirations,
  type LadderExpirationContract,
  type LadderRow,
  type StrikeWings,
} from "@/lib/chainLadderApi";
import { useOptionChainBus } from "@/lib/market/useOptionChainBus";
import { useOptionsLab } from "@/lib/optionsLabContext";
import {
  HEATMAP_TEMPLATES,
  getTemplate,
  buildGrid,
} from "@/lib/options-lab/templates/registry";
import { SYM_FLY_WIDTHS_DEFAULT } from "@/lib/options-lab/templates/symFly";
import { DEFAULT_GRADIENT_THRESHOLD } from "@/lib/options-lab/templates/color";
import type {
  ChainContext,
  TemplateParams,
  ValueModeId,
} from "@/lib/options-lab/templates/types";

const EXPIRY_PICK_COUNT = 3;

const fieldLabel =
  "mb-1 block text-xs font-medium text-[var(--color-label-secondary)]";

const selectControl =
  "block min-h-11 w-full min-w-[8rem] rounded-[var(--radius-md,0.5rem)] border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-label)] " +
  "shadow-[var(--elevation-1)] transition-colors " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
  "disabled:opacity-45";

const secondaryBtn =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-label)] " +
  "shadow-[var(--elevation-1)] transition-colors " +
  "hover:bg-[var(--color-fill)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] " +
  "disabled:pointer-events-none disabled:opacity-45";

function fmt(n: number | null | undefined, digits = 2): string {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

function fmtStrike(n: number | null | undefined): string {
  if (n == null) return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  const cents = Math.round(v * 100);
  const neg = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const wholeStr = String(whole);
  const body =
    frac === 0 ? wholeStr : `${wholeStr}.${String(frac).padStart(2, "0")}`;
  return neg ? `-${body}` : body;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  testId?: string;
}) {
  return (
    <div>
      <span className={fieldLabel}>{label}</span>
      <nav
        className="inline-flex flex-wrap items-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
        aria-label={label}
        data-testid={testId}
      >
        {options.map((item) => {
          const active = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-pressed={active}
              className={[
                "inline-flex min-h-9 items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                active
                  ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
              ].join(" ")}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const StrikeRow = memo(function StrikeRow({
  row,
  flash,
}: {
  row: LadderRow;
  flash: boolean;
}) {
  const rowBg = row.is_spot
    ? "bg-[var(--color-tint)]/15"
    : flash
      ? "bg-[var(--color-fill)] motion-safe:transition-colors motion-safe:duration-500"
      : "bg-[var(--color-surface)]";

  return (
    <tr
      className={[
        rowBg,
        row.is_spot ? "font-semibold" : "",
        "text-[var(--color-label)]",
      ].join(" ")}
      data-strike={row.strike}
      data-spot={row.is_spot ? "1" : "0"}
    >
      <td
        className={[
          "sticky left-0 z-[1] border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums",
          rowBg,
        ].join(" ")}
        title={String(row.strike)}
      >
        <span className="inline-flex items-center justify-end gap-1.5">
          {fmtStrike(row.strike)}
          {row.is_spot ? (
            <span
              className="inline-flex items-center rounded-full bg-[var(--color-tint)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              aria-label="Spot strike"
            >
              Spot
            </span>
          ) : null}
        </span>
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums">
        {fmt(row.mid)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
        {fmt(row.bid)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
        {fmt(row.ask)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
        {fmt(row.volume, 0)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums text-[var(--color-label-secondary)]">
        {fmt(row.open_interest, 0)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums">
        {fmt(row.delta, 3)}
      </td>
      <td className="border-b border-[var(--color-separator)] px-3 py-2.5 text-right tabular-nums">
        {row.iv != null ? `${(Number(row.iv) * 100).toFixed(1)}%` : "—"}
      </td>
    </tr>
  );
});

export default function HeatmapChainPanel() {
  const { symbol, setSymbol, universe, loading: universeLoading } =
    useOptionsLab();
  const [expiryContracts, setExpiryContracts] = useState<
    LadderExpirationContract[]
  >([]);
  const [expiration, setExpiration] = useState("");
  const [side, setSide] = useState<"call" | "put">("call");
  const [wings, setWings] = useState<StrikeWings>(DEFAULT_STRIKE_WINGS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ladderDte, setLadderDte] = useState<number | null>(null);
  const [templateId, setTemplateId] = useState("ladder");
  const [valueMode, setValueMode] = useState<ValueModeId>("quote");
  const [stickyScale, setStickyScale] = useState<number | undefined>(undefined);
  const mounted = useRef(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const presentKeyRef = useRef<string>("");
  const centerOnPresentRef = useRef(true);

  const bus = useOptionChainBus({
    symbol,
    expiration,
    side,
    wings,
    enabled: Boolean(expiration && symbol),
  });

  const tpl = getTemplate(templateId);

  useEffect(() => {
    // Reset value mode when template changes
    setValueMode(tpl.defaultValueMode);
    setStickyScale(undefined);
  }, [templateId, tpl.defaultValueMode]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!symbol) return;
    setExpiration("");
    setExpiryContracts([]);
    setLadderDte(null);
    void (async () => {
      try {
        const pack = await fetchLadderExpirations(symbol, EXPIRY_PICK_COUNT);
        if (!mounted.current) return;
        setExpiryContracts(pack.contracts);
        const def =
          pack.default_expiration || pack.contracts[0]?.expiration || "";
        setExpiration(def);
        const dte0 = pack.contracts.find((c) => c.expiration === def)?.dte;
        setLadderDte(dte0 != null ? dte0 : null);
        setLoadError(null);
      } catch (e) {
        if (mounted.current)
          setLoadError(
            e instanceof Error ? e.message : "Could not load expirations",
          );
      }
    })();
  }, [symbol]);

  useEffect(() => {
    const key = `${symbol}|${expiration}|${side}|${wings}`;
    if (presentKeyRef.current !== key) {
      presentKeyRef.current = key;
      centerOnPresentRef.current = true;
    }
  }, [expiration, symbol, side, wings]);

  useEffect(() => {
    if (bus.dte != null) setLadderDte(bus.dte);
  }, [bus.dte]);

  const ordered = useMemo(() => {
    return [...bus.rows.values()].sort((a, b) => b.strike - a.strike);
  }, [bus.rows]);

  const chainCtx: ChainContext = useMemo(
    () => ({
      symbol,
      viewSide: side,
      spot: bus.spot,
      strikeStep: bus.strikeStep,
      wings,
      contracts: bus.contracts,
      asOf: bus.asOf,
      contentHash: bus.hash,
    }),
    [
      symbol,
      side,
      bus.spot,
      bus.strikeStep,
      wings,
      bus.contracts,
      bus.asOf,
      bus.hash,
    ],
  );

  const templateParams: TemplateParams = useMemo(
    () => ({
      valueMode,
      // MSC SPX widths 20…50 (MASSIVE_WIDTHS_SPX)
      widthMode: "fixed_points",
      fixedPoints: [...SYM_FLY_WIDTHS_DEFAULT],
      stickyScale,
      gradientThreshold: DEFAULT_GRADIENT_THRESHOLD,
    }),
    [valueMode, stickyScale],
  );

  const matrix = useMemo(() => {
    if (tpl.layout !== "matrix") return null;
    const g = buildGrid(tpl, chainCtx, templateParams);
    return g;
  }, [tpl, chainCtx, templateParams]);

  useEffect(() => {
    if (matrix?.stickyScale == null) return;
    setStickyScale((prev) =>
      prev != null && Math.abs(prev - matrix.stickyScale) < 1e-12
        ? prev
        : matrix.stickyScale,
    );
  }, [matrix?.stickyScale]);

  const centerSpot = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return false;
    const spotEl = root.querySelector(
      'tr[data-spot="1"]',
    ) as HTMLElement | null;
    if (!spotEl) return false;
    const rootRect = root.getBoundingClientRect();
    const elRect = spotEl.getBoundingClientRect();
    root.scrollTop +=
      elRect.top + elRect.height / 2 - (rootRect.top + rootRect.height / 2);
    return true;
  }, []);

  useEffect(() => {
    if (!centerOnPresentRef.current || !ordered.length) return;
    if (!ordered.some((r) => r.is_spot)) return;
    const id = window.requestAnimationFrame(() => {
      if (centerSpot()) centerOnPresentRef.current = false;
    });
    return () => window.cancelAnimationFrame(id);
  }, [ordered, centerSpot]);

  const selectedMeta = universe.find((u) => u.symbol === symbol);
  const selectedExpiry = expiryContracts.find(
    (c) => c.expiration === expiration,
  );
  const displayDte =
    ladderDte != null
      ? ladderDte
      : selectedExpiry != null
        ? selectedExpiry.dte
        : null;

  const error = loadError || bus.error;
  const streaming = bus.transport === "stream";
  const held = bus.transport === "held";

  return (
    <div
      className="flex min-h-0 flex-1 flex-col md:flex-row"
      data-testid="options-lab-heatmap-panel"
    >
      {/* Left rail ~1/5 — controls, full height */}
      <aside
        className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-b border-[var(--color-separator)] bg-[var(--color-surface)] p-3 sm:p-4 md:w-[20%] md:min-w-[12.5rem] md:max-w-[20rem] md:border-b-0 md:border-r"
        aria-label="Chain controls"
      >
        <div>
          <h2
            className="font-semibold tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline, 1.0625rem)" }}
          >
            Heatmap
          </h2>
          <p className="mt-0.5 text-xs leading-snug text-[var(--color-label-tertiary)]">
            Dual-side chain · live templates
          </p>
        </div>

        {/* Live status */}
        <div className="flex flex-col gap-1 text-xs text-[var(--color-label-tertiary)]">
          <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-label)]">
            <span
              className={[
                "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
                streaming
                  ? "bg-[var(--color-tint)]"
                  : held
                    ? "bg-amber-500"
                    : "bg-[var(--color-label-tertiary)]",
              ].join(" ")}
              aria-hidden
            />
            {streaming
              ? "Live stream"
              : held
                ? "Held · market closed"
                : bus.transport === "error"
                  ? "Stream error"
                  : "Connecting…"}
          </span>
          {displayDte != null ? <span>{displayDte} DTE</span> : null}
          {selectedMeta?.feed_symbol ? (
            <span className="break-all">Feed {selectedMeta.feed_symbol}</span>
          ) : null}
          <span className="tabular-nums break-all">{bus.lastPatch}</span>
        </div>

        <label className="block">
          <span className={fieldLabel}>Symbol</span>
          <select
            className={selectControl}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={universeLoading || !universe.length}
            data-testid="options-lab-symbol"
          >
            {universe.map((u) => (
              <option key={u.symbol} value={u.symbol}>
                {u.symbol}
                {u.kind ? ` · ${u.kind}` : ""}
              </option>
            ))}
            {!universe.length && !universeLoading && (
              <option value={symbol}>{symbol}</option>
            )}
          </select>
        </label>

        <label className="block">
          <span className={fieldLabel}>Template</span>
          <select
            className={selectControl}
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            data-testid="heatmap-template"
          >
            {HEATMAP_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        {tpl.valueModes.length > 1 ? (
          <label className="block">
            <span className={fieldLabel}>Value</span>
            <select
              className={selectControl}
              value={valueMode}
              onChange={(e) => setValueMode(e.target.value as ValueModeId)}
              data-testid="heatmap-value-mode"
            >
              {tpl.valueModes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <p className="text-[11px] leading-snug text-[var(--color-label-tertiary)]">
          {tpl.description}
        </p>

        <label className="block">
          <span className={fieldLabel}>
            Contract (next {EXPIRY_PICK_COUNT})
          </span>
          <select
            className={selectControl}
            value={expiration}
            onChange={(e) => {
              const v = e.target.value;
              setExpiration(v);
              const c = expiryContracts.find((x) => x.expiration === v);
              setLadderDte(c != null ? c.dte : null);
            }}
            data-testid="chain-ladder-expiration"
          >
            {!expiration && <option value="">Select…</option>}
            {expiryContracts.map((c) => (
              <option key={c.expiration} value={c.expiration}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <Segmented
          label="Side"
          value={side}
          options={[
            { id: "call", label: "Calls" },
            { id: "put", label: "Puts" },
          ]}
          onChange={setSide}
          testId="chain-ladder-side"
        />

        <label className="block">
          <span className={fieldLabel}>Wings</span>
          <select
            className={selectControl}
            value={wings}
            onChange={(e) => setWings(Number(e.target.value) as StrikeWings)}
            data-testid="chain-ladder-wings"
          >
            {STRIKE_WING_CHOICES.map((n) => (
              <option key={n} value={n}>
                ±{n} strikes
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={secondaryBtn + " w-full"}
          onClick={() => centerSpot()}
          disabled={!ordered.some((r) => r.is_spot)}
          data-testid="chain-ladder-center-spot"
        >
          Center spot
        </button>

        <div className="mt-auto border-t border-[var(--color-separator)] pt-4">
          <span className={fieldLabel}>Spot</span>
          <div
            className="font-semibold tabular-nums tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-title-2, 1.375rem)" }}
          >
            {bus.spot != null ? fmt(bus.spot, 2) : "—"}
          </div>
          <div className="mt-1 text-[11px] tabular-nums text-[var(--color-label-tertiary)]">
            {bus.hash ? `gen ${bus.hash.slice(0, 8)}` : "—"}
          </div>
        </div>

        {error && (
          <div
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}
      </aside>

      {/* Right ~4/5 — active template view */}
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-canvas)]"
        aria-label="Heatmap view"
      >
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-auto bg-[var(--color-surface)]"
        >
          {tpl.layout === "matrix" && matrix ? (
            /* MSC-look matrix: gold figures, green width headers, ATM gold */
            <table className="w-full min-w-[28rem] border-collapse text-[11px] leading-none">
              <thead className="sticky top-0 z-[2] bg-[#0a0a0e]">
                <tr className="border-b border-white/10">
                  <th
                    scope="col"
                    className="sticky left-0 z-[3] w-[3.75rem] min-w-[3.75rem] bg-[#0a0a0e] px-2 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-white/45"
                  >
                    Strike
                  </th>
                  {matrix.cols.map((c) => (
                    <th
                      key={c.id}
                      scope="col"
                      className="min-w-[3rem] px-1 py-1.5 text-center text-[11px] font-semibold tabular-nums text-emerald-400"
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((row, ri) => (
                  <tr
                    key={row.strike}
                    data-spot={row.isSpot ? "1" : "0"}
                    className={[
                      "h-6 border-b border-white/[0.03]",
                      row.isSpot ? "border-t border-amber-400/80" : "",
                    ].join(" ")}
                  >
                    <td
                      className={[
                        "sticky left-0 z-[1] w-[3.75rem] min-w-[3.75rem] border-r border-white/[0.03] px-1 text-center tabular-nums",
                        row.isSpot
                          ? "bg-black/40 font-bold text-amber-400"
                          : "bg-black/20 text-white/45",
                      ].join(" ")}
                    >
                      {row.label}
                    </td>
                    {matrix.cols.map((col, ci) => {
                      const cell = matrix.cells[ri]?.[ci];
                      return (
                        <td
                          key={col.id}
                          title={cell?.tooltip}
                          className="min-w-[3rem] px-0.5 text-center tabular-nums text-amber-400 [text-shadow:0_0_2px_rgba(0,0,0,0.8)]"
                          style={{
                            backgroundColor: cell?.bgCss || "#1a1a1a",
                            height: "24px",
                          }}
                        >
                          {cell?.display ?? "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {!matrix.rows.length && (
                  <tr>
                    <td
                      colSpan={matrix.cols.length + 1}
                      className="px-4 py-24 text-center text-[var(--color-label-secondary)]"
                    >
                      {expiration
                        ? "Waiting for chain…"
                        : "Choose a contract"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead
                className="sticky top-0 z-[2] border-b border-[var(--color-separator)] bg-[var(--color-surface-secondary,var(--color-fill))] text-[var(--color-label-secondary)]"
                style={{ fontSize: "var(--text-caption, 0.75rem)" }}
              >
                <tr>
                  <th
                    scope="col"
                    className="sticky left-0 z-[3] bg-[var(--color-surface-secondary,var(--color-fill))] px-3 py-2.5 text-right font-semibold tracking-wide"
                  >
                    Strike
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-right font-semibold tracking-wide"
                  >
                    Mid
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-right font-semibold tracking-wide"
                  >
                    Bid
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-right font-semibold tracking-wide"
                  >
                    Ask
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-right font-semibold tracking-wide"
                  >
                    Vol
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-right font-semibold tracking-wide"
                  >
                    OI
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-right font-semibold tracking-wide"
                  >
                    Δ
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-2.5 text-right font-semibold tracking-wide"
                  >
                    IV
                  </th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((row) => (
                  <StrikeRow
                    key={`${row.side}-${row.strike}`}
                    row={row}
                    flash={bus.flashStrikes.has(row.strike)}
                  />
                ))}
                {!ordered.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-24 text-center text-[var(--color-label-secondary)]"
                      style={{
                        fontSize: "var(--text-subheadline, 0.9375rem)",
                      }}
                    >
                      {expiration
                        ? "Waiting for chain quotes…"
                        : "Choose a contract to load the ladder"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

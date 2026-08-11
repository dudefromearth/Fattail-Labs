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
  useSmoothNumber,
  useSmoothNumberMap,
} from "@/lib/useSmoothValue";
import {
  DEFAULT_HEATMAP_TEMPLATE_ID,
  HEATMAP_TEMPLATES,
  getTemplate,
  buildGrid,
} from "@/lib/options-lab/templates/registry";
import { SYM_FLY_WIDTHS_DEFAULT } from "@/lib/options-lab/templates/symFly";
import { DEFAULT_GRADIENT_THRESHOLD } from "@/lib/options-lab/templates/color";
import {
  buildGexProfile,
  fmtGexProfile,
  gexProfileScale,
} from "@/lib/options-lab/templates/gex";
import type {
  ChainContext,
  TemplateParams,
  ValueModeId,
} from "@/lib/options-lab/templates/types";
import { isUsEquityRthOpenByClock } from "@/lib/market/usEquitySession";
import {
  generateTosScript,
  symFlyTosLegs,
} from "@/lib/options-lab/tosGenerator";
import { symFlyDebit } from "@/lib/options-lab/templates/pricing";
import { saveAnalyzerTrade } from "@/lib/options-lab/analyzerTrade";
import Link from "next/link";

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

/** Darken rgb()/hex for selected matrix tile. */
function darkenCssColor(css: string | undefined, factor = 0.55): string {
  const base = css || "#1a1a1a";
  const m = base.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/i,
  );
  if (m) {
    const r = Math.round(Number(m[1]) * factor);
    const g = Math.round(Number(m[2]) * factor);
    const b = Math.round(Number(m[3]) * factor);
    return `rgb(${r},${g},${b})`;
  }
  if (base.startsWith("#") && (base.length === 7 || base.length === 4)) {
    const hex =
      base.length === 4
        ? `#${base[1]}${base[1]}${base[2]}${base[2]}${base[3]}${base[3]}`
        : base;
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${r},${g},${b})`;
  }
  return base;
}

type MatrixTileKey = { strike: number; colId: string };

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
  const [templateId, setTemplateId] = useState(DEFAULT_HEATMAP_TEMPLATE_ID);
  const [valueMode, setValueMode] = useState<ValueModeId>(
    () => getTemplate(DEFAULT_HEATMAP_TEMPLATE_ID).defaultValueMode,
  );
  const [stickyScale, setStickyScale] = useState<number | undefined>(undefined);
  const [selectedTile, setSelectedTile] = useState<MatrixTileKey | null>(null);
  const [tosScript, setTosScript] = useState<string>("");
  const [tosCopied, setTosCopied] = useState(false);
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
    setSelectedTile(null);
  }, [templateId, tpl.defaultValueMode]);

  useEffect(() => {
    setSelectedTile(null);
  }, [symbol, expiration, side, wings, valueMode]);

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
        // Prefer server default (skips 0DTE after RTH close). Client clock
        // is a safety net if an older API still returns expired 0DTE first.
        let def =
          pack.default_expiration || pack.contracts[0]?.expiration || "";
        const sessionOpen = isUsEquityRthOpenByClock();
        if (!sessionOpen && pack.contracts.length) {
          const first = pack.contracts.find((c) => c.expiration === def);
          if (first && first.dte === 0) {
            const next = pack.contracts.find((c) => c.dte > 0);
            if (next) def = next.expiration;
          }
        }
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

  const copyTosForFly = useCallback(
    async (body: number, widthPts: number) => {
      if (!expiration) return;
      const shortFly = valueMode === "credit";
      // Always price from mid debit (structure cost), not RoC / R:R display modes
      const d = symFlyDebit(chainCtx, body, widthPts);
      const cost = d != null && Number.isFinite(d) ? Math.abs(d) : null;
      const legs = symFlyTosLegs({
        body,
        widthPts,
        expiration,
        side,
        short: shortFly,
      });
      const script = generateTosScript({
        symbol,
        legs,
        costBasis: cost,
      });
      setTosScript(script);
      setSelectedTile({ strike: body, colId: `w${widthPts}` });
      // Hand off to Analyzer (session) — same line as clipboard
      saveAnalyzerTrade(script, "heatmap");
      try {
        await navigator.clipboard.writeText(script);
        setTosCopied(true);
        window.setTimeout(() => setTosCopied(false), 1600);
      } catch {
        setTosCopied(false);
      }
    },
    [chainCtx, expiration, side, symbol, valueMode],
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

  const gexProfile = useMemo(() => {
    if (tpl.layout !== "profile" || tpl.id !== "gex") return null;
    const points = buildGexProfile(chainCtx, valueMode);
    const scale = gexProfileScale(points, valueMode);
    return { points, scale };
  }, [tpl.layout, tpl.id, chainCtx, valueMode]);

  /** Live spot — ease between bus updates instead of hard jump */
  const smoothSpot = useSmoothNumber(bus.spot, { durationMs: 420 });

  /** GEX magnitudes → animate bar widths / labels */
  const gexAnimKey = useMemo(() => {
    if (!gexProfile) return "";
    return (
      gexProfile.points
        .map(
          (p) =>
            `${p.strike}:${p.call ?? ""}:${p.put ?? ""}:${p.value ?? ""}`,
        )
        .join("|") + `|s${gexProfile.scale}`
    );
  }, [gexProfile]);

  const gexTargets = useMemo(() => {
    const m: Record<string, number> = {};
    if (!gexProfile) return m;
    for (const pt of gexProfile.points) {
      if (pt.call != null) m[`${pt.strike}:c`] = Math.abs(pt.call);
      if (pt.put != null) m[`${pt.strike}:p`] = Math.abs(pt.put);
      if (pt.value != null) m[`${pt.strike}:v`] = pt.value;
    }
    m.__scale = gexProfile.scale || 1;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gexAnimKey fingerprints profile
  }, [gexAnimKey]);

  const smoothGex = useSmoothNumberMap(gexTargets, {
    durationMs: 420,
    startAtZero: true,
  });
  const smoothGexScale = Math.max(1e-12, smoothGex.__scale ?? gexProfile?.scale ?? 1);

  const hasSpotRow = useMemo(() => {
    if (gexProfile?.points.some((p) => p.isSpot)) return true;
    return ordered.some((r) => r.is_spot);
  }, [gexProfile, ordered]);

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
      '[data-spot="1"]',
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
          disabled={!hasSpotRow}
          data-testid="chain-ladder-center-spot"
        >
          Center spot
        </button>

        {/* ToS script — Option-click a matrix tile to fill + copy */}
        <div className="flex flex-col gap-1.5" data-testid="heatmap-tos-panel">
          <div className="flex items-center justify-between gap-2">
            <span className={fieldLabel + " mb-0"}>ToS script</span>
            <span className="text-[10px] text-[var(--color-label-tertiary)]">
              {tosCopied
                ? "Copied"
                : "⌥-click tile"}
            </span>
          </div>
          <pre
            className="max-h-40 min-h-[4.5rem] overflow-auto whitespace-pre-wrap break-all rounded-lg border border-emerald-500/25 bg-[#0a0f0a] px-2.5 py-2 font-mono text-[11px] leading-snug text-emerald-400 shadow-inner"
            data-testid="heatmap-tos-script"
            title={tosScript || "Option-click a Symmetric flies tile"}
          >
            {tosScript ||
              "Option-click a fly tile to generate BUY/SELL BUTTERFLY … @debit LMT"}
          </pre>
          {tosScript ? (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                className={secondaryBtn + " w-full min-h-9 py-1.5 text-xs"}
                onClick={() => {
                  void navigator.clipboard.writeText(tosScript).then(() => {
                    setTosCopied(true);
                    window.setTimeout(() => setTosCopied(false), 1600);
                  });
                }}
                data-testid="heatmap-tos-copy"
              >
                {tosCopied ? "Copied" : "Copy again"}
              </button>
              <Link
                href="/app/options-lab/analyzer"
                className={
                  secondaryBtn +
                  " w-full min-h-9 py-1.5 text-xs no-underline inline-flex"
                }
                data-testid="heatmap-open-analyzer"
                onClick={() => saveAnalyzerTrade(tosScript, "heatmap")}
              >
                Open in Analyzer
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mt-auto border-t border-[var(--color-separator)] pt-4">
          <span className={fieldLabel}>Spot</span>
          <div
            className="font-semibold tabular-nums tracking-tight text-[var(--color-label)]"
            style={{ fontSize: "var(--text-title-2, 1.375rem)" }}
          >
            {smoothSpot != null ? fmt(smoothSpot, 2) : "—"}
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

      {/* Right ~4/5 — contained panel with header */}
      <section
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--color-canvas)] p-2 sm:p-3"
        aria-label="Heatmap view"
      >
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2,0_4px_16px_rgba(0,0,0,0.18))]"
          data-testid="heatmap-view-panel"
        >
          {/* Panel header */}
          <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--color-separator)] bg-[var(--color-surface-secondary,var(--color-fill))] px-3 py-2 sm:px-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <h3
                  className="truncate font-semibold tracking-tight text-[var(--color-label)]"
                  style={{ fontSize: "var(--text-headline, 1.0625rem)" }}
                >
                  {tpl.label}
                </h3>
                {tpl.valueModes.length > 1 ? (
                  <span className="text-xs font-medium text-[var(--color-label-secondary)]">
                    ·{" "}
                    {tpl.valueModes.find((m) => m.id === valueMode)?.label ??
                      valueMode}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-[var(--color-label-tertiary)]">
                {[
                  symbol || null,
                  side === "call" ? "Calls" : "Puts",
                  expiration || null,
                  displayDte != null ? `${displayDte} DTE` : null,
                  tpl.layout === "matrix"
                    ? "Width 20–50"
                    : tpl.layout === "profile"
                      ? "Vertical profile"
                      : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--color-label-secondary)]">
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
                  ? "Live"
                  : held
                    ? "Held"
                    : bus.transport === "error"
                      ? "Error"
                      : "…"}
              </span>
              <span className="tabular-nums">
                Spot{" "}
                <span className="font-semibold text-[var(--color-label)]">
                  {smoothSpot != null ? fmt(smoothSpot, 2) : "—"}
                </span>
              </span>
              {bus.hash ? (
                <span
                  className="hidden tabular-nums text-[var(--color-label-tertiary)] sm:inline"
                  title={bus.hash}
                >
                  gen {bus.hash.slice(0, 8)}
                </span>
              ) : null}
              <button
                type="button"
                className={
                  secondaryBtn +
                  " min-h-9 px-3 py-1 text-xs " +
                  (!hasSpotRow ? "pointer-events-none opacity-45" : "")
                }
                onClick={() => centerSpot()}
                disabled={!hasSpotRow}
                data-testid="chain-ladder-center-spot-panel"
              >
                Center spot
              </button>
            </div>
          </header>

          {/* Panel body — scrollable grid / profile */}
          <div
            ref={scrollRef}
            className={[
              "min-h-0 flex-1 overflow-auto",
              tpl.layout === "matrix" || tpl.layout === "profile"
                ? "bg-[#0a0a0e]"
                : "bg-[var(--color-surface)]",
            ].join(" ")}
          >
            {tpl.layout === "profile" && gexProfile ? (
              /* Vertical GEX: combined Call/Put dual bars, or Net / Abs single series */
              <div
                className="flex min-h-full flex-col text-[13px]"
                data-testid="heatmap-gex-profile"
              >
                <div className="sticky top-0 z-[2] flex h-9 items-center border-b border-white/10 bg-[#0a0a0e]/95 px-2 text-[11px] font-medium uppercase tracking-wide text-white/45 backdrop-blur-sm">
                  <span className="w-20 shrink-0 text-right tabular-nums">
                    Strike
                  </span>
                  <span className="mx-2 flex-1 text-center normal-case tracking-normal">
                    {valueMode === "gex_abs" ? (
                      <span className="text-sky-400/90">Absolute GEX →</span>
                    ) : valueMode === "gex_net" ? (
                      <span className="text-emerald-400/90">
                        ← Neg · Net · Pos →
                      </span>
                    ) : (
                      <span>
                        <span className="text-red-400/90">← Puts</span>
                        <span className="text-white/35"> · </span>
                        <span className="text-sky-400/90">Calls →</span>
                      </span>
                    )}
                  </span>
                  <span className="w-[4.5rem] shrink-0 text-right tabular-nums">
                    {valueMode === "gex_all" ||
                    valueMode === "gex_call" ||
                    valueMode === "gex_put"
                      ? "C / P"
                      : "Value"}
                  </span>
                </div>
                {gexProfile.points.map((pt) => {
                  const scale = smoothGexScale;
                  const combined =
                    valueMode === "gex_all" ||
                    valueMode === "gex_call" ||
                    valueMode === "gex_put";

                  // Animated magnitudes (lerp toward live GEX)
                  const callMag =
                    pt.call != null
                      ? (smoothGex[`${pt.strike}:c`] ?? Math.abs(pt.call))
                      : null;
                  const putMag =
                    pt.put != null
                      ? (smoothGex[`${pt.strike}:p`] ?? Math.abs(pt.put))
                      : null;
                  const callPct =
                    callMag != null
                      ? `${(Math.min(1, callMag / scale) * 50).toFixed(2)}%`
                      : "0%";
                  const putPct =
                    putMag != null
                      ? `${(Math.min(1, putMag / scale) * 50).toFixed(2)}%`
                      : "0%";

                  // Net / Abs single bar (value signed; abs mode uses magnitude)
                  const seriesRaw =
                    pt.valid && pt.value != null
                      ? (smoothGex[`${pt.strike}:v`] ?? pt.value)
                      : 0;
                  const seriesSigned =
                    valueMode === "gex_abs" ? Math.abs(seriesRaw) : seriesRaw;
                  const seriesFrac = Math.min(
                    1,
                    Math.abs(seriesSigned) / scale,
                  );
                  const seriesPct = `${(seriesFrac * 50).toFixed(2)}%`;
                  const seriesNeg = seriesSigned < 0;
                  const seriesPos = seriesSigned > 0;

                  const tip = combined
                    ? [
                        `Strike ${pt.label}`,
                        pt.call != null
                          ? `Call ${fmtGexProfile(pt.call)}`
                          : "Call —",
                        pt.put != null
                          ? `Put ${fmtGexProfile(pt.put)}`
                          : "Put —",
                        pt.value != null
                          ? `Net ${fmtGexProfile(pt.value)}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : pt.valid && pt.value != null
                      ? `${pt.label}: ${fmtGexProfile(pt.value)} (÷1e9)`
                      : `${pt.label}: missing γ/OI`;

                  return (
                    <div
                      key={pt.strike}
                      data-spot={pt.isSpot ? "1" : "0"}
                      className={[
                        "flex h-8 items-center border-b border-white/[0.04] px-2",
                        pt.isSpot
                          ? "border-t border-amber-400/70 bg-amber-400/5"
                          : "",
                      ].join(" ")}
                      title={tip}
                    >
                      <span
                        className={[
                          "w-20 shrink-0 text-right tabular-nums font-medium",
                          pt.isSpot
                            ? "font-bold text-amber-400"
                            : "text-white/50",
                        ].join(" ")}
                      >
                        {pt.label}
                      </span>
                      <div className="relative mx-2 h-5 flex-1 overflow-hidden rounded-sm bg-white/[0.04]">
                        <div
                          className="absolute inset-y-0 left-1/2 w-px bg-white/25"
                          aria-hidden
                        />
                        {combined ? (
                          <>
                            {/* Put → left (red) */}
                            {putMag != null && putMag > 0 ? (
                              <div
                                className="absolute top-0.5 bottom-0.5 rounded-sm bg-red-500/85 motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
                                style={{ right: "50%", width: putPct }}
                              />
                            ) : null}
                            {/* Call → right (blue) */}
                            {callMag != null && callMag > 0 ? (
                              <div
                                className="absolute top-0.5 bottom-0.5 rounded-sm bg-sky-500/85 motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
                                style={{ left: "50%", width: callPct }}
                              />
                            ) : null}
                          </>
                        ) : pt.valid && (seriesPos || seriesNeg) ? (
                          <div
                            className={[
                              "absolute top-0.5 bottom-0.5 rounded-sm motion-safe:transition-[width,left,right] motion-safe:duration-300 motion-safe:ease-out",
                              valueMode === "gex_abs"
                                ? "bg-sky-500/90"
                                : seriesNeg
                                  ? "bg-red-500/85"
                                  : "bg-sky-500/85",
                            ].join(" ")}
                            style={
                              seriesNeg
                                ? { right: "50%", width: seriesPct }
                                : { left: "50%", width: seriesPct }
                            }
                          />
                        ) : null}
                      </div>
                      <span className="w-[4.5rem] shrink-0 text-right tabular-nums text-[11px] leading-tight">
                        {combined ? (
                          <>
                            <span className="text-sky-400">
                              {callMag != null ? fmtGexProfile(callMag) : "—"}
                            </span>
                            <span className="text-white/30">/</span>
                            <span className="text-red-400">
                              {putMag != null ? fmtGexProfile(putMag) : "—"}
                            </span>
                          </>
                        ) : (
                          <span
                            className={
                              !pt.valid
                                ? "text-white/25"
                                : seriesNeg
                                  ? "text-red-400"
                                  : "text-sky-400"
                            }
                          >
                            {pt.valid && pt.value != null
                              ? fmtGexProfile(seriesRaw)
                              : "—"}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {!gexProfile.points.length && (
                  <div className="px-4 py-24 text-center text-white/40">
                    {expiration
                      ? "Waiting for dual-side chain (γ / OI)…"
                      : "Choose a contract"}
                  </div>
                )}
              </div>
            ) : tpl.layout === "matrix" && matrix ? (
              /* Symmetric flies matrix: 2× type vs MSC 12/10px baseline */
              <table className="w-full min-w-[40rem] border-collapse text-[24px] leading-none">
                <thead className="sticky top-0 z-[2] bg-[#0a0a0e]/90 backdrop-blur-sm">
                  <tr className="h-14 border-b border-white/10">
                    <th
                      scope="col"
                      className="sticky left-0 z-[3] h-14 w-[7rem] min-w-[7rem] bg-[#0a0a0e] px-2 text-center align-middle text-[20px] font-medium uppercase tracking-wide text-white/45"
                    >
                      Strike
                    </th>
                    {matrix.cols.map((c) => (
                      <th
                        key={c.id}
                        scope="col"
                        className="h-14 min-w-[5.5rem] px-1 text-center align-middle text-[24px] font-semibold tabular-nums text-emerald-400"
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
                        "h-14 border-b border-white/[0.03]",
                        row.isSpot ? "border-t-2 border-amber-400/80" : "",
                      ].join(" ")}
                    >
                      <td
                        className={[
                          "sticky left-0 z-[1] h-14 w-[7rem] min-w-[7rem] border-r border-white/[0.03] px-1 text-center align-middle text-[24px] tabular-nums",
                          row.isSpot
                            ? "bg-black/40 font-bold text-amber-400"
                            : "bg-black/20 text-white/45",
                        ].join(" ")}
                      >
                        {row.label}
                      </td>
                      {matrix.cols.map((col, ci) => {
                        const cell = matrix.cells[ri]?.[ci];
                        const selected =
                          selectedTile?.strike === row.strike &&
                          selectedTile?.colId === col.id;
                        const bg = selected
                          ? darkenCssColor(cell?.bgCss || "#1a1a1a", 0.5)
                          : cell?.bgCss || "#1a1a1a";
                        return (
                          <td
                            key={col.id}
                            role="button"
                            tabIndex={0}
                            title={
                              (cell?.tooltip || "") +
                              "\nOption-click: copy ToS butterfly script"
                            }
                            aria-pressed={selected}
                            data-selected={selected ? "1" : "0"}
                            onClick={(e) => {
                              // Option (Mac) / Alt (Win): ToS script + clipboard
                              if (e.altKey) {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!cell?.valid) return;
                                void copyTosForFly(row.strike, col.widthPts);
                                return;
                              }
                              setSelectedTile((prev) =>
                                prev?.strike === row.strike &&
                                prev?.colId === col.id
                                  ? null
                                  : { strike: row.strike, colId: col.id },
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedTile((prev) =>
                                  prev?.strike === row.strike &&
                                  prev?.colId === col.id
                                    ? null
                                    : { strike: row.strike, colId: col.id },
                                );
                              }
                            }}
                            className={[
                              "h-14 min-w-[5.5rem] cursor-pointer px-1 text-center align-middle tabular-nums text-[24px] text-amber-400",
                              "[text-shadow:0_0_2px_rgba(0,0,0,0.8)]",
                              "motion-safe:transition-[background-color,filter,transform,box-shadow] motion-safe:duration-300 motion-safe:ease-out",
                              "hover:z-[1] hover:scale-[1.04] hover:brightness-125 hover:ring-1 hover:ring-white/35 hover:shadow-[0_0_10px_rgba(255,255,255,0.25)]",
                              "active:scale-[0.98] active:brightness-75",
                              selected
                                ? "z-[1] ring-2 ring-amber-400/70 brightness-90"
                                : "",
                              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-300",
                            ].join(" ")}
                            style={{ backgroundColor: bg }}
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
                        className="px-4 py-24 text-center text-[24px] text-white/40"
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
        </div>
      </section>
    </div>
  );
}

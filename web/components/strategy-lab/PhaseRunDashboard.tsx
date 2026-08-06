"use client";

/**
 * Curate / Deploy run board — memory-bounded architecture.
 *
 * Stability contract:
 * - Paginate (never mount hundreds of SVG charts at once)
 * - Runtime clock lives inside each RuntimeCell (no 1 Hz parent re-render)
 * - Cards / rows / charts are memoized
 * - Sort never depends on a live ticking clock
 * - Filter chrome shows shown/total as N/M
 */

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import MiniEquityChart, {
  type EquityPoint,
} from "@/components/strategy-lab/MiniEquityChart";
import { formatRuntimeSince } from "@/lib/formatRuntime";
import { formatUsd } from "@/lib/formatMoney";

/** Hard cap of mounted cards/rows (and SVGs) at once. */
export const PHASE_RUN_PAGE_SIZE = 12;

export type PhaseRunRow = {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  symbol?: string;
  equity: number;
  vsBaseline: number;
  baseline: number;
  openPositions: number;
  openRisk: number;
  openUpnl: number;
  closedPositions: number;
  metaRight?: string;
  runStartedAt?: string | null;
  runtimeLabel?: string | null;
  equitySeries: EquityPoint[];
  corrVsSpy?: number | null;
  corrInterpretation?: string | null;
  href?: string;
};

export type PhaseRunDashboardProps = {
  phaseLabel: string;
  phaseKey: "curate" | "deploy";
  accountModeLabel: string;
  summary?: {
    runs: number;
    active: number;
    bots?: number;
    strategies?: number;
  };
  rows: PhaseRunRow[];
  loading?: boolean;
  emptyHint?: string;
  toolbarExtra?: ReactNode;
  onRefresh?: () => void;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
};

type SortKey =
  | "status"
  | "name"
  | "symbol"
  | "equity"
  | "vsBaseline"
  | "open"
  | "risk"
  | "upnl"
  | "closed"
  | "runtime"
  | "corr";

type SortDir = "asc" | "desc";
type OutcomeFilter = "all" | "winner" | "loser" | "flat";
type OpenFilter = "all" | "has_open" | "no_open";

const STATUS_RANK: Record<string, number> = {
  running: 0,
  armed: 1,
  paused: 2,
  halted: 3,
  draft: 4,
  archived: 5,
};

const DESC_DEFAULT: ReadonlySet<SortKey> = new Set([
  "equity",
  "vsBaseline",
  "open",
  "risk",
  "upnl",
  "closed",
  "runtime",
  "corr",
]);

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "name", label: "Name" },
  { key: "symbol", label: "Symbol" },
  { key: "equity", label: "Equity" },
  { key: "vsBaseline", label: "vs alloc" },
  { key: "open", label: "Open" },
  { key: "risk", label: "Risk" },
  { key: "upnl", label: "uPnL" },
  { key: "closed", label: "Closed" },
  { key: "runtime", label: "Runtime" },
  { key: "corr", label: "ρ vs SPY" },
];

function statusTone(status: string) {
  if (status === "running") return "bg-emerald-100 text-emerald-800";
  if (status === "armed") return "bg-blue-100 text-blue-800";
  if (status === "paused" || status === "halted")
    return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-600";
}

function corrLabel(r: number | null | undefined): string {
  if (r == null || Number.isNaN(r)) return "ρ —";
  const sign = r >= 0 ? "+" : "";
  return `ρ ${sign}${r.toFixed(2)}`;
}

function corrTone(r: number | null | undefined): string {
  if (r == null || Number.isNaN(r)) return "text-[var(--color-label-secondary)]";
  const a = Math.abs(r);
  if (a >= 0.7) return r >= 0 ? "text-violet-800" : "text-orange-800";
  if (a >= 0.4) return "text-sky-800";
  return "text-[var(--color-label-secondary)]";
}

/** Local 1s clock — only this cell re-renders, never the whole board. */
const RuntimeCell = memo(function RuntimeCell({
  runStartedAt,
  runtimeLabel,
}: {
  runStartedAt?: string | null;
  runtimeLabel?: string | null;
}) {
  const [label, setLabel] = useState(() =>
    runStartedAt
      ? formatRuntimeSince(runStartedAt)
      : runtimeLabel || "—",
  );

  useEffect(() => {
    if (!runStartedAt) {
      setLabel(runtimeLabel || "—");
      return;
    }
    const tick = () => setLabel(formatRuntimeSince(runStartedAt));
    tick();
    // Pause when tab hidden — saves timers across many cells
    let id: number | null = null;
    const start = () => {
      if (id != null) return;
      id = window.setInterval(tick, 1000);
    };
    const stop = () => {
      if (id != null) {
        window.clearInterval(id);
        id = null;
      }
    };
    const onVis = () => {
      if (document.visibilityState === "visible") {
        tick();
        start();
      } else stop();
    };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [runStartedAt, runtimeLabel]);

  return (
    <span
      className="font-mono tabular-nums"
      title={
        runStartedAt
          ? `Runtime since last start/restart (${runStartedAt})`
          : "Runtime since last start/restart"
      }
    >
      {label}
    </span>
  );
});

function sortValue(r: PhaseRunRow, key: SortKey): string | number {
  switch (key) {
    case "status":
      return STATUS_RANK[r.status] ?? 99;
    case "name":
      return (r.title || "").toLowerCase();
    case "symbol":
      return (r.symbol || "").toLowerCase();
    case "equity":
      return r.equity ?? 0;
    case "vsBaseline":
      return r.vsBaseline ?? 0;
    case "open":
      return r.openPositions ?? 0;
    case "risk":
      return r.openRisk ?? 0;
    case "upnl":
      return r.openUpnl ?? 0;
    case "closed":
      return r.closedPositions ?? 0;
    case "runtime": {
      // Stable sort key: start epoch (not live seconds — avoids re-sort every tick)
      if (!r.runStartedAt) return Number.POSITIVE_INFINITY;
      const t = Date.parse(r.runStartedAt);
      return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
    }
    case "corr":
      return r.corrVsSpy == null || Number.isNaN(r.corrVsSpy)
        ? Number.NEGATIVE_INFINITY
        : r.corrVsSpy;
    default:
      return 0;
  }
}

function compareRows(
  a: PhaseRunRow,
  b: PhaseRunRow,
  key: SortKey,
  dir: SortDir,
): number {
  const av = sortValue(a, key);
  const bv = sortValue(b, key);
  let cmp = 0;
  if (typeof av === "string" && typeof bv === "string") {
    cmp = av.localeCompare(bv);
  } else {
    cmp = Number(av) - Number(bv);
  }
  if (cmp === 0 && key !== "name") {
    cmp = (a.title || "").localeCompare(b.title || "");
  }
  return dir === "asc" ? cmp : -cmp;
}

function SortHeader({
  label,
  colKey,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  colKey: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = sortKey === colKey;
  return (
    <th className="py-2 pr-2 font-semibold">
      <button
        type="button"
        onClick={() => onSort(colKey)}
        className={`inline-flex items-center gap-0.5 uppercase tracking-wide hover:text-[var(--color-label)] ${
          active
            ? "text-[var(--color-label)]"
            : "text-[var(--color-label-secondary)]"
        }`}
      >
        {label}
        <span className="font-mono text-[9px] opacity-80" aria-hidden>
          {active ? (sortDir === "asc" ? " ▲" : " ▼") : " ↕"}
        </span>
      </button>
    </th>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
        active
          ? "bg-blue-600 text-white"
          : "border border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
      }`}
    >
      {children}
    </button>
  );
}

const PhaseRunCard = memo(function PhaseRunCard({ r }: { r: PhaseRunRow }) {
  return (
    <article className="flex flex-col rounded-xl border border-[var(--color-separator)] bg-[var(--color-fill)]/30 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[var(--color-label)]">
            {r.title}
          </h3>
          <p className="truncate text-[10px] text-[var(--color-label-secondary)]">
            {r.symbol ? `${r.symbol} · ` : ""}
            {r.subtitle}
          </p>
        </div>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusTone(r.status)}`}
        >
          {r.status}
        </span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase text-[var(--color-label-secondary)]">
            Equity≈
          </div>
          <div className="font-mono text-lg font-bold tabular-nums text-[var(--color-label)]">
            {formatUsd(r.equity)}
          </div>
          <div
            className={`text-[11px] font-semibold tabular-nums ${
              r.vsBaseline >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {r.vsBaseline >= 0 ? "+" : ""}
            {formatUsd(r.vsBaseline)}
          </div>
        </div>
        <MiniEquityChart
          series={r.equitySeries}
          baseline={r.baseline}
          width={140}
          height={52}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-[var(--color-label-secondary)]">
        <span
          className={`font-bold tabular-nums ${corrTone(r.corrVsSpy)}`}
          title={r.corrInterpretation || "Correlation on-demand via calculator"}
        >
          {corrLabel(r.corrVsSpy)}
          <span className="ml-0.5 font-normal opacity-70">vs SPY</span>
        </span>
        <span>
          Run{" "}
          <strong className="text-[var(--color-label)]">
            <RuntimeCell
              runStartedAt={r.runStartedAt}
              runtimeLabel={r.runtimeLabel}
            />
          </strong>
        </span>
        <span>
          Open{" "}
          <strong className="text-[var(--color-label)]">{r.openPositions}</strong>
        </span>
        <span>
          Risk{" "}
          <strong className="text-[var(--color-label)]">
            {formatUsd(r.openRisk)}
          </strong>
        </span>
        <span>
          uPnL{" "}
          <strong className="text-[var(--color-label)]">
            {formatUsd(r.openUpnl)}
          </strong>
        </span>
        <span>
          Closed{" "}
          <strong className="text-[var(--color-label)]">
            {r.closedPositions}
          </strong>
        </span>
      </div>
      {r.metaRight ? (
        <div className="mt-1 text-[10px] text-[var(--color-label-secondary)]">
          {r.metaRight}
        </div>
      ) : null}
    </article>
  );
});

const PhaseRunTableRow = memo(function PhaseRunTableRow({
  r,
}: {
  r: PhaseRunRow;
}) {
  return (
    <tr className="border-b border-[var(--color-separator)]/70">
      <td className="py-2 pr-2">
        <div className="font-semibold text-[var(--color-label)]">{r.title}</div>
        <div className="font-mono text-[10px] text-[var(--color-label-secondary)]">
          {r.subtitle}
        </div>
      </td>
      <td className="py-2 pr-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusTone(r.status)}`}
        >
          {r.status}
        </span>
      </td>
      <td className="py-2 pr-2 font-mono font-semibold">{r.symbol || "—"}</td>
      <td className="py-2 pr-2 text-[var(--color-label)]">
        <RuntimeCell
          runStartedAt={r.runStartedAt}
          runtimeLabel={r.runtimeLabel}
        />
      </td>
      <td
        className={`py-2 pr-2 font-mono font-bold tabular-nums ${corrTone(r.corrVsSpy)}`}
        title={r.corrInterpretation || undefined}
      >
        {corrLabel(r.corrVsSpy)}
      </td>
      <td className="py-2 pr-2">
        <MiniEquityChart
          series={r.equitySeries}
          baseline={r.baseline}
          width={120}
          height={40}
        />
      </td>
      <td className="py-2 pr-2 font-mono font-semibold tabular-nums">
        {formatUsd(r.equity)}
      </td>
      <td
        className={`py-2 pr-2 font-mono tabular-nums ${
          r.vsBaseline >= 0 ? "text-emerald-700" : "text-rose-700"
        }`}
      >
        {r.vsBaseline >= 0 ? "+" : ""}
        {formatUsd(r.vsBaseline)}
      </td>
      <td className="py-2 pr-2 tabular-nums">{r.openPositions}</td>
      <td className="py-2 pr-2 tabular-nums">{formatUsd(r.openRisk)}</td>
      <td className="py-2 text-[10px] text-[var(--color-label-secondary)]">
        {r.metaRight || "—"}
      </td>
    </tr>
  );
});

export default function PhaseRunDashboard({
  phaseLabel,
  phaseKey,
  accountModeLabel,
  summary,
  rows,
  loading,
  emptyHint,
  toolbarExtra,
  onRefresh,
  headerSlot,
  footerSlot,
}: PhaseRunDashboardProps) {
  const [view, setView] = useState<"grid" | "table">(() =>
    rows.length > PHASE_RUN_PAGE_SIZE ? "table" : "grid",
  );
  const [page, setPage] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [symbolFilter, setSymbolFilter] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>("all");
  const [openFilter, setOpenFilter] = useState<OpenFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("status");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const statusOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.status) s.add(r.status);
    return Array.from(s).sort(
      (a, b) => (STATUS_RANK[a] ?? 99) - (STATUS_RANK[b] ?? 99),
    );
  }, [rows]);

  const symbolOptions = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.symbol) s.add(r.symbol);
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter.size > 0 && !statusFilter.has(r.status)) return false;
      if (symbolFilter && (r.symbol || "") !== symbolFilter) return false;
      if (outcomeFilter === "winner" && !(r.vsBaseline > 0)) return false;
      if (outcomeFilter === "loser" && !(r.vsBaseline < 0)) return false;
      if (outcomeFilter === "flat" && Math.abs(r.vsBaseline) >= 1) return false;
      if (openFilter === "has_open" && r.openPositions <= 0) return false;
      if (openFilter === "no_open" && r.openPositions > 0) return false;
      if (q) {
        const hay =
          `${r.title} ${r.subtitle || ""} ${r.symbol || ""} ${r.status} ${r.id}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, query, statusFilter, symbolFilter, outcomeFilter, openFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PHASE_RUN_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => {
    const start = safePage * PHASE_RUN_PAGE_SIZE;
    return sorted.slice(start, start + PHASE_RUN_PAGE_SIZE);
  }, [sorted, safePage]);

  // Reset page when filters shrink the set
  useEffect(() => {
    setPage(0);
  }, [query, statusFilter, symbolFilter, outcomeFilter, openFilter, sortKey, sortDir]);

  const filtersActive =
    query.trim() !== "" ||
    statusFilter.size > 0 ||
    symbolFilter !== "" ||
    outcomeFilter !== "all" ||
    openFilter !== "all";

  const toggleStatus = useCallback((st: string) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(st)) next.delete(st);
      else next.add(st);
      return next;
    });
  }, []);

  const onSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir(DESC_DEFAULT.has(key) ? "desc" : "asc");
      return key;
    });
  }, []);

  function clearFilters() {
    setQuery("");
    setStatusFilter(new Set());
    setSymbolFilter("");
    setOutcomeFilter("all");
    setOpenFilter("all");
  }

  const countBadge = (
    <span
      className={
        filtersActive
          ? "inline-flex items-center gap-1.5 rounded-full border-2 border-amber-500 bg-amber-100 px-2.5 py-0.5 text-sm font-bold tabular-nums text-amber-950 shadow-sm"
          : "inline-flex items-center gap-1 rounded-full border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--color-label-secondary)]"
      }
      title={
        filtersActive
          ? `Filter on — ${sorted.length}/${rows.length} runs`
          : `${rows.length} runs`
      }
      data-testid="phase-run-count"
      data-filtered={filtersActive ? "true" : "false"}
    >
      {filtersActive ? (
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
          Filtered
        </span>
      ) : null}
      <span className="font-mono text-base leading-none">
        {sorted.length}/{rows.length}
      </span>
    </span>
  );

  return (
    <section
      className="rounded-2xl border-2 border-blue-600/40 bg-[var(--color-surface)] shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      data-phase-run={phaseKey}
      data-testid={`phase-run-dashboard-${phaseKey}`}
    >
      <div className="border-b border-[var(--color-separator)] bg-gradient-to-r from-blue-600/[0.08] to-transparent px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[var(--color-label)]">
                {phaseLabel}
              </h2>
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {accountModeLabel}
              </span>
              {rows.length > 0 ? countBadge : null}
            </div>
            <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
              {phaseKey === "curate"
                ? "Curate — multi-bot compare on shared live marks with sim capital. Paginated for stability."
                : "Deploy — curated bots on your broker (paper/live). Paginated for stability."}
            </p>
            {summary ? (
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--color-label-secondary)]">
                <span>
                  Runs{" "}
                  <strong className="text-[var(--color-label)]">
                    {summary.runs}
                  </strong>
                </span>
                <span>
                  Active{" "}
                  <strong className="text-[var(--color-label)]">
                    {summary.active}
                  </strong>
                </span>
                {(summary.bots ?? summary.strategies) != null ? (
                  <span>
                    Bots{" "}
                    <strong className="text-[var(--color-label)]">
                      {summary.bots ?? summary.strategies}
                    </strong>
                  </span>
                ) : null}
                {sorted.length > PHASE_RUN_PAGE_SIZE ? (
                  <span>
                    Page{" "}
                    <strong className="text-[var(--color-label)]">
                      {safePage + 1}/{pageCount}
                    </strong>{" "}
                    · {PHASE_RUN_PAGE_SIZE}/page
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-[var(--color-separator)] p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  view === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  view === "table"
                    ? "bg-blue-600 text-white"
                    : "text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                }`}
              >
                Table
              </button>
            </div>
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-lg border border-[var(--color-separator)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--color-fill)]"
              >
                Refresh
              </button>
            ) : null}
            {toolbarExtra}
          </div>
        </div>
        {headerSlot ? <div className="mt-3">{headerSlot}</div> : null}

        {rows.length > 0 ? (
          <div
            className={
              filtersActive
                ? "mt-3 space-y-2 rounded-xl border-2 border-amber-500 bg-amber-50/90 p-2.5"
                : "mt-3 space-y-2 rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)]/80 p-2.5"
            }
            data-testid="phase-run-filters"
            data-filtered={filtersActive ? "true" : "false"}
          >
            {filtersActive ? (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-200/70 px-2.5 py-1.5">
                <p className="text-xs font-bold text-amber-950">
                  <span className="mr-1.5 inline-block rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                    Filter on
                  </span>
                  Showing{" "}
                  <span className="font-mono text-sm tabular-nums">
                    {sorted.length}/{rows.length}
                  </span>
                  {rows.length - sorted.length > 0 ? (
                    <span className="ml-1 font-semibold text-amber-900/80">
                      · {rows.length - sorted.length} hidden
                    </span>
                  ) : null}
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-md bg-amber-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-950"
                >
                  Clear filters
                </button>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold tabular-nums text-[var(--color-label)]">
                {sorted.length}/{rows.length}
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter name, symbol, status…"
                className="min-w-[10rem] flex-1 rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs"
              />
              <label className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-label-secondary)]">
                Symbol
                <select
                  value={symbolFilter}
                  onChange={(e) => setSymbolFilter(e.target.value)}
                  className="rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-1 text-xs font-semibold"
                >
                  <option value="">All</option>
                  {symbolOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-label-secondary)]">
                Sort
                <select
                  value={sortKey}
                  onChange={(e) => {
                    const k = e.target.value as SortKey;
                    setSortKey(k);
                    setSortDir(DESC_DEFAULT.has(k) ? "desc" : "asc");
                  }}
                  className="rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-1 text-xs font-semibold"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="rounded-md border border-[var(--color-separator)] px-2 py-1 text-xs font-semibold hover:bg-[var(--color-fill)]"
              >
                {sortDir === "asc" ? "Asc ▲" : "Desc ▼"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                Status
              </span>
              <Chip
                active={statusFilter.size === 0}
                onClick={() => setStatusFilter(new Set())}
              >
                All
              </Chip>
              {statusOptions.map((st) => (
                <Chip
                  key={st}
                  active={statusFilter.has(st)}
                  onClick={() => toggleStatus(st)}
                >
                  {st}
                </Chip>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                Outcome
              </span>
              {(
                [
                  ["all", "All"],
                  ["winner", "Winners"],
                  ["loser", "Losers"],
                  ["flat", "Flat"],
                ] as const
              ).map(([k, lab]) => (
                <Chip
                  key={k}
                  active={outcomeFilter === k}
                  onClick={() => setOutcomeFilter(k)}
                >
                  {lab}
                </Chip>
              ))}
              <span className="mx-1 text-[var(--color-separator)]">|</span>
              <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                Opens
              </span>
              {(
                [
                  ["all", "All"],
                  ["has_open", "Has open"],
                  ["no_open", "No open"],
                ] as const
              ).map(([k, lab]) => (
                <Chip
                  key={k}
                  active={openFilter === k}
                  onClick={() => setOpenFilter(k)}
                >
                  {lab}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4 sm:p-5">
        {loading && !rows.length ? (
          <p className="text-sm text-[var(--color-label-secondary)]">
            Loading runs…
          </p>
        ) : !rows.length ? (
          <div className="rounded-xl border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-4 py-10 text-center">
            <p className="text-sm font-medium text-[var(--color-label)]">
              No {phaseLabel.toLowerCase()} runs yet
            </p>
            <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
              {emptyHint ||
                "Create and arm instances to populate this dashboard."}
            </p>
          </div>
        ) : !sorted.length ? (
          <div className="rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 px-4 py-8 text-center">
            <p className="text-sm font-bold text-amber-950">
              Filter on —{" "}
              <span className="font-mono tabular-nums">0/{rows.length}</span>{" "}
              shown
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 text-xs font-bold text-amber-950 underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {view === "grid" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {pageRows.map((r) => (
                  <PhaseRunCard key={r.id} r={r} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[58rem] border-collapse text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--color-separator)] text-[10px] tracking-wide">
                      <SortHeader
                        label="Bot"
                        colKey="name"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortHeader
                        label="Status"
                        colKey="status"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortHeader
                        label="Symbol"
                        colKey="symbol"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortHeader
                        label="Runtime"
                        colKey="runtime"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortHeader
                        label="ρ vs SPY"
                        colKey="corr"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <th className="py-2 pr-2 font-semibold text-[var(--color-label-secondary)]">
                        Equity path
                      </th>
                      <SortHeader
                        label="Equity≈"
                        colKey="equity"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortHeader
                        label="vs alloc"
                        colKey="vsBaseline"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortHeader
                        label="Open"
                        colKey="open"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortHeader
                        label="Risk"
                        colKey="risk"
                        sortKey={sortKey}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <th className="py-2 font-semibold text-[var(--color-label-secondary)]">
                        Last tick
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r) => (
                      <PhaseRunTableRow key={r.id} r={r} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination — hard memory bound */}
            {pageCount > 1 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-separator)] pt-3">
                <p className="text-xs text-[var(--color-label-secondary)]">
                  Showing{" "}
                  <span className="font-mono font-bold text-[var(--color-label)]">
                    {safePage * PHASE_RUN_PAGE_SIZE + 1}–
                    {Math.min(
                      (safePage + 1) * PHASE_RUN_PAGE_SIZE,
                      sorted.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-mono font-bold text-[var(--color-label)]">
                    {sorted.length}
                  </span>
                  {filtersActive ? (
                    <span className="text-amber-800">
                      {" "}
                      (filtered from {rows.length})
                    </span>
                  ) : null}
                  <span className="ml-1 opacity-70">
                    · max {PHASE_RUN_PAGE_SIZE} mounted for browser stability
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safePage <= 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="rounded-md border border-[var(--color-separator)] px-2.5 py-1 text-xs font-semibold disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <span className="px-2 font-mono text-xs font-bold tabular-nums">
                    {safePage + 1}/{pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= pageCount - 1}
                    onClick={() =>
                      setPage((p) => Math.min(pageCount - 1, p + 1))
                    }
                    className="rounded-md border border-[var(--color-separator)] px-2.5 py-1 text-xs font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}

        {footerSlot ? <div className="mt-4">{footerSlot}</div> : null}
      </div>
    </section>
  );
}

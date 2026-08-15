"use client";

/**
 * Book-wide Find and Badge — one place, not per campaign.
 * AutoFilter off until selected. Clear stamp before assign. Five undos.
 * Found set is named (date range + position count). Table pages 50.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui";
import {
  fetchFoundSet,
  fetchTradeDistincts,
  fetchTrades,
  patchTradeCampaign,
  type FoundSetItem,
  type TradeDistincts,
} from "@/lib/tradeLogApi";
import type { Trade } from "@/lib/tradeLog";
import { fetchCampaigns, type PracticeCampaign } from "@/lib/practiceSpineApi";
import CampaignBadge from "@/components/practice/CampaignBadge";
import DateWhenFilter from "@/components/trade-log/DateWhenFilter";
import FilterMenuPortal from "@/components/trade-log/FilterMenuPortal";
import { compactWhen } from "@/lib/tradeLogWhenTree";

const UNDO_LIMIT = 5;
const PAGE_SIZE = 50;

type ColKey = "when" | "symbol" | "strategy" | "side" | "effect" | "campaign";

type Filters = Partial<Record<ColKey, string[]>>;

type StampChange = {
  id: number;
  from: number | null;
  to: number | null;
};

type UndoBatch = {
  label: string;
  changes: StampChange[];
};

function dayYmd(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = String(iso);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "";
}

function fmtDay(ymd: string | null | undefined): string {
  const d = dayYmd(ymd);
  if (!d) return "—";
  try {
    return new Date(d + "T12:00:00").toLocaleDateString(undefined, {
      dateStyle: "medium",
    });
  } catch {
    return d;
  }
}

function symbolOf(t: Trade): string {
  const legs = t.legs || [];
  const u = legs.find((l) => l.underlier)?.underlier;
  const s = legs.find((l) => l.symbol)?.symbol;
  return String(u || s || "—");
}

function effectOf(t: Trade): string {
  const fx = (t.legs || []).map((l) => l.pos_effect).filter(Boolean);
  const opens = fx.filter((e) => e === "TO_OPEN").length;
  const closes = fx.filter((e) => e === "TO_CLOSE").length;
  if (closes > opens) return "TO_CLOSE";
  if (opens > 0) return "TO_OPEN";
  return "—";
}

function sideOf(t: Trade): string {
  const s = (t.net_side || "").toUpperCase();
  if (s === "CREDIT" || s === "DEBIT") return s;
  return "—";
}

function positionTypeLabel(code: string | null | undefined): string {
  const s = (code || "").toUpperCase();
  if (!s || s === "CUSTOM" || s === "UNKNOWN" || s === "—") return "Single";
  if (s === "SINGLE") return "Single";
  if (s === "VERTICAL") return "Vertical";
  if (s === "BUTTERFLY") return "Butterfly";
  if (s === "IRON_FLY") return "Iron fly";
  if (s === "IRON_CONDOR") return "Iron condor";
  if (s === "BROKEN_WING_FLY") return "Broken-wing fly";
  if (s === "STRADDLE") return "Straddle";
  if (s === "STRANGLE") return "Strangle";
  if (s === "CALENDAR") return "Calendar";
  if (s === "DIAGONAL") return "Diagonal";
  if (s === "CONDOR") return "Condor";
  return code || "Single";
}

function campaignLabel(t: Trade, titles: Map<number, string>): string {
  if (t.practice_campaign_id == null) return "None";
  return titles.get(t.practice_campaign_id) || `#${t.practice_campaign_id}`;
}

function csv(xs: string[] | undefined): string | null {
  if (!xs || xs.length === 0) return null;
  return xs.join(",");
}

function campaignStillMatches(
  filterOn: boolean,
  filters: Filters,
  campaignId: number | null,
): boolean {
  if (!filterOn) return true;
  const want = filters.campaign;
  if (!want || want.length === 0) return true;
  const key = campaignId == null ? "none" : String(campaignId);
  return want.includes(key);
}

/** L4 — fill day must sit in the campaign window or the badge is refused. */
function campaignCoversTrade(
  camp: PracticeCampaign,
  execAt: string | null | undefined,
): boolean {
  const day = dayYmd(execAt);
  if (!day) return false;
  const start = camp.starts_at ? dayYmd(camp.starts_at) : "";
  const end = camp.ends_at ? dayYmd(camp.ends_at) : "";
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

function filterQuery(
  filterOn: boolean,
  filters: Filters,
  allDays: string[],
) {
  if (!filterOn) return {};
  return {
    ...compactWhen(filters.when, allDays),
    symbols: csv(filters.symbol),
    strategies: csv(filters.strategy),
    sides: csv(filters.side),
    effects: csv(filters.effect),
    campaigns: csv(filters.campaign),
  };
}

const COLS: { key: ColKey; label: string }[] = [
  { key: "when", label: "When" },
  { key: "symbol", label: "Symbol" },
  { key: "strategy", label: "Strategy" },
  { key: "side", label: "Debit/Credit" },
  { key: "effect", label: "Effect" },
  { key: "campaign", label: "Campaign" },
];

function AutoFilter({
  col,
  values,
  labels,
  applied,
  open,
  onOpen,
  onApply,
  onClear,
}: {
  col: ColKey;
  values: string[];
  labels?: Map<string, string>;
  applied: string[] | undefined;
  open: boolean;
  onOpen: (k: ColKey | null) => void;
  onApply: (k: ColKey, picked: string[] | null) => void;
  onClear: (k: ColKey) => void;
}) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const box = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const active = applied != null && applied.length > 0;

  useEffect(() => {
    if (!open) return;
    setQ("");
    setPicked(new Set(applied && applied.length ? applied : values));
  }, [open, applied, values]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (box.current?.contains(t) || menu.current?.contains(t)) return;
      onOpen(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpen]);

  const shown = values.filter((v) =>
    (labels?.get(v) || v).toLowerCase().includes(q.trim().toLowerCase()),
  );
  const allOn = shown.length > 0 && shown.every((v) => picked.has(v));

  return (
    <div className="relative inline-flex" ref={box}>
      <button
        type="button"
        className={[
          "inline-flex h-4 w-4 items-center justify-center rounded-[2px] border text-[9px] leading-none",
          active
            ? "border-[var(--color-tint)] bg-[var(--color-tint-soft)] text-[var(--color-tint-emphasis)]"
            : "border-[var(--color-separator)] bg-[var(--color-fill)] text-[var(--color-label-tertiary)]",
        ].join(" ")}
        aria-label={`Filter ${COLS.find((c) => c.key === col)?.label || col}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid={`autofilter-${col}`}
        data-filtered={active ? "1" : "0"}
        onClick={() => onOpen(open ? null : col)}
      >
        ▾
      </button>
      <FilterMenuPortal
        open={open}
        anchorRef={box}
        menuRef={menu}
        width={224}
      >
        <div
          className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-2 shadow-[var(--elevation-2)]"
          role="listbox"
          data-testid={`autofilter-menu-${col}`}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="w-full rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1 text-xs"
          />
          <label className="mt-2 flex items-center gap-2 border-b border-[var(--color-separator)] pb-1.5 text-xs text-[var(--color-label)]">
            <input
              type="checkbox"
              checked={allOn}
              onChange={() => {
                setPicked((prev) => {
                  const next = new Set(prev);
                  if (allOn) shown.forEach((v) => next.delete(v));
                  else shown.forEach((v) => next.add(v));
                  return next;
                });
              }}
            />
            (Select All)
          </label>
          <ul className="mt-1 max-h-44 overflow-auto">
            {shown.map((v) => (
              <li key={v}>
                <label className="flex items-center gap-2 py-0.5 text-xs text-[var(--color-label)]">
                  <input
                    type="checkbox"
                    checked={picked.has(v)}
                    onChange={() => {
                      setPicked((prev) => {
                        const next = new Set(prev);
                        if (next.has(v)) next.delete(v);
                        else next.add(v);
                        return next;
                      });
                    }}
                  />
                  <span className="truncate">{labels?.get(v) || v}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-end gap-1.5">
            <button
              type="button"
              className="rounded px-2 py-1 text-[11px] text-[var(--color-label-secondary)]"
              onClick={() => {
                onClear(col);
                onOpen(null);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="rounded bg-[var(--color-tint)] px-2 py-1 text-[11px] font-medium text-[var(--color-on-tint)]"
              onClick={() => {
                const all = values.length > 0 && values.every((v) => picked.has(v));
                onApply(col, all ? null : [...picked]);
                onOpen(null);
              }}
            >
              OK
            </button>
          </div>
        </div>
      </FilterMenuPortal>
    </div>
  );
}

function uniquesFromDistincts(
  d: TradeDistincts | null,
): Record<ColKey, string[]> {
  if (!d) {
    return {
      when: [],
      symbol: [],
      strategy: [],
      side: [],
      effect: [],
      campaign: [],
    };
  }
  return {
    when: d.days || [],
    symbol: d.symbols || [],
    strategy: d.strategies || [],
    side: d.sides || [],
    effect: d.effects || [],
    campaign: (d.campaigns || []).map((c) =>
      c.id == null ? "none" : String(c.id),
    ),
  };
}

export default function TradeFindTag() {
  const [sheet, setSheet] = useState<Trade[]>([]);
  const [items, setItems] = useState<FoundSetItem[]>([]);
  const [charters, setCharters] = useState<PracticeCampaign[]>([]);
  const [assignTo, setAssignTo] = useState<number | "">("");
  const [titles, setTitles] = useState<Map<number, string>>(new Map());
  const [colors, setColors] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [pageBusy, setPageBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [filterOn, setFilterOn] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [openCol, setOpenCol] = useState<ColKey | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<UndoBatch[]>([]);
  const [firstDay, setFirstDay] = useState<string | null>(null);
  const [lastDay, setLastDay] = useState<string | null>(null);
  const [positionCount, setPositionCount] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [distincts, setDistincts] = useState<TradeDistincts | null>(null);
  const cursors = useRef<(string | null)[]>([null]);

  const qopts = useMemo(
    () => filterQuery(filterOn, filters, distincts?.days || []),
    [filterOn, filters, distincts?.days],
  );
  const qoptsKey = JSON.stringify(qopts);
  const qoptsRef = useRef(qopts);
  qoptsRef.current = qopts;
  const fetchGen = useRef(0);

  const loadMenus = useCallback(async () => {
    const [camps, dist] = await Promise.all([
      fetchCampaigns().catch(() => ({ campaigns: [] as PracticeCampaign[] })),
      fetchTradeDistincts().catch(() => null),
    ]);
    const list = (camps.campaigns || []).filter((c) => !c.is_ledger);
    setCharters(list);
    const m = new Map<number, string>();
    const cols = new Map<number, string>();
    for (const c of camps.campaigns || []) {
      m.set(c.id, c.title);
      if (c.badge_color) cols.set(c.id, c.badge_color);
    }
    setTitles(m);
    setColors(cols);
    if (dist && dist.ok) setDistincts(dist.data);
  }, []);

  const applyFoundPayload = useCallback(
    (
      found: Awaited<ReturnType<typeof fetchFoundSet>>,
      tr: Awaited<ReturnType<typeof fetchTrades>>,
      cursorPage: number,
    ) => {
      if (found.ok) {
        setFirstDay(found.data.first_day);
        setLastDay(found.data.last_day);
        setPositionCount(found.data.position_count);
        setItems(found.data.items || []);
      } else {
        setFirstDay(null);
        setLastDay(null);
        setPositionCount(null);
        setItems([]);
      }
      if (!tr.ok) {
        setSheet([]);
        setHasMore(false);
        setErr("Could not load trades.");
        return;
      }
      setSheet(tr.data.trades || []);
      setHasMore(Boolean(tr.data.has_more));
      cursors.current[cursorPage + 1] = tr.data.next_cursor ?? null;
    },
    [],
  );

  const opened = useRef(false);
  const hydrate = useCallback(
    async (
      opts: ReturnType<typeof filterQuery>,
      cursor: string | null,
      cursorPage: number,
    ) => {
      const gen = ++fetchGen.current;
      const [found, tr] = await Promise.all([
        fetchFoundSet(opts),
        fetchTrades(null, {
          limit: PAGE_SIZE,
          cursor,
          positions_only: true,
          ...opts,
        }),
      ]);
      if (gen !== fetchGen.current) return;
      applyFoundPayload(found, tr, cursorPage);
      opened.current = true;
    },
    [applyFoundPayload],
  );

  const load = useCallback(async () => {
    setErr(null);
    if (!opened.current) setLoading(true);
    else setPageBusy(true);
    try {
      await hydrate(qoptsRef.current, cursors.current[page] ?? null, page);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not load trades.");
      setSheet([]);
    } finally {
      setLoading(false);
      setPageBusy(false);
    }
  }, [page, qoptsKey, hydrate]);

  const refreshFound = useCallback(
    async (opts?: ReturnType<typeof filterQuery>) => {
      setPageBusy(true);
      setErr(null);
      cursors.current = [null];
      setPage(0);
      setSelected(new Set());
      try {
        await hydrate(opts ?? qoptsRef.current, null, 0);
        await loadMenus();
      } catch (e) {
        setErr(
          e instanceof Error ? e.message : "Could not refresh the found set.",
        );
      } finally {
        setLoading(false);
        setPageBusy(false);
      }
    },
    [hydrate, loadMenus],
  );

  useEffect(() => {
    void loadMenus();
  }, [loadMenus]);

  useEffect(() => {
    void load();
  }, [load]);

  function resetPaging() {
    setPage(0);
    cursors.current = [null];
    setSelected(new Set());
  }

  const uniques = useMemo(() => uniquesFromDistincts(distincts), [distincts]);

  const campaignLabels = useMemo(() => {
    const m = new Map<string, string>();
    m.set("none", "None");
    for (const c of distincts?.campaigns || []) {
      if (c.id != null) m.set(String(c.id), c.title);
    }
    for (const [id, title] of titles) m.set(String(id), title);
    return m;
  }, [distincts, titles]);

  const strategyLabels = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of uniques.strategy) m.set(s, positionTypeLabel(s));
    return m;
  }, [uniques.strategy]);

  const colLabels = (col: ColKey) => {
    if (col === "campaign") return campaignLabels;
    if (col === "strategy") return strategyLabels;
    return undefined;
  };

  const workingSet: FoundSetItem[] =
    items.length > 0
      ? items
      : sheet.map((t) => ({
          id: t.id,
          practice_campaign_id: t.practice_campaign_id ?? null,
          exec_at: t.exec_at,
        }));

  const selectedMeta = workingSet.filter((t) => selected.has(t.id));
  const anyStamped = selectedMeta.some((t) => t.practice_campaign_id != null);
  const anyClearable = selectedMeta.some((t) => t.practice_campaign_id != null);
  const canAssign = selectedMeta.length > 0 && !anyStamped;
  const canClear = selectedMeta.length > 0 && anyClearable;

  const allChecked =
    workingSet.length > 0 && workingSet.every((t) => selected.has(t.id));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(workingSet.map((t) => t.id)));
  }

  function pushUndo(batch: UndoBatch) {
    setUndo((prev) => [batch, ...prev].slice(0, UNDO_LIMIT));
  }

  async function apply(nextId: number | null, label: string) {
    if (selectedMeta.length === 0) return;
    if (nextId != null && anyStamped) {
      setErr("Clear the campaign on the found set before assigning.");
      return;
    }
    if (nextId != null && !nextId) {
      setErr("Choose a campaign to assign.");
      return;
    }
    setBusy(true);
    setErr(null);
    setNote(null);
    let targets =
      nextId == null
        ? selectedMeta.filter((t) => t.practice_campaign_id != null)
        : selectedMeta.filter((t) => t.practice_campaign_id == null);
    const rejected: FoundSetItem[] = [];
    if (nextId != null) {
      const camp = charters.find((c) => c.id === nextId);
      if (camp) {
        const kept: FoundSetItem[] = [];
        for (const t of targets) {
          const exec =
            t.exec_at ?? sheet.find((s) => s.id === t.id)?.exec_at ?? null;
          if (campaignCoversTrade(camp, exec)) kept.push(t);
          else rejected.push(t);
        }
        targets = kept;
      }
    }
    const changes: StampChange[] = [];
    const fails: string[] = [];
    for (const t of targets) {
      const res = await patchTradeCampaign(t.id, nextId);
      if (res.ok) {
        changes.push({
          id: t.id,
          from: t.practice_campaign_id ?? null,
          to: nextId,
        });
      } else {
        const msg =
          res.error.kind === "err" ? res.error.message : res.error.kind;
        fails.push(`#${t.id}: ${msg}`);
      }
    }
    if (changes.length > 0) {
      pushUndo({ label, changes });
      setNote(
        `${label} · ${changes.length} trade${changes.length === 1 ? "" : "s"}.`,
      );
      const nextById = new Map(changes.map((c) => [c.id, c.to]));
      const stamp = (id: number, prev: number | null) =>
        nextById.has(id) ? (nextById.get(id) ?? null) : prev;
      setItems((prev) => {
        const next = prev
          .map((t) => ({
            ...t,
            practice_campaign_id: stamp(t.id, t.practice_campaign_id),
          }))
          .filter((t) =>
            campaignStillMatches(filterOn, filters, t.practice_campaign_id),
          );
        return next;
      });
      setSheet((prev) =>
        prev
          .map((t) => ({
            ...t,
            practice_campaign_id: stamp(t.id, t.practice_campaign_id ?? null),
          }))
          .filter((t) =>
            campaignStillMatches(
              filterOn,
              filters,
              t.practice_campaign_id ?? null,
            ),
          ),
      );
    }
    const rejectNote =
      rejected.length > 0
        ? `${rejected.length} position${rejected.length === 1 ? "" : "s"} rejected — outside this campaign's dates. Not tagged.`
        : "";
    if (fails.length > 0) {
      setErr(
        [fails.slice(0, 3).join(" · "), rejectNote].filter(Boolean).join(" "),
      );
    } else if (rejectNote) {
      setErr(rejectNote);
    }
    await refreshFound(qopts);
    setBusy(false);
  }

  async function undoLast() {
    const batch = undo[0];
    if (!batch || busy) return;
    setBusy(true);
    setErr(null);
    setNote(null);
    const fails: string[] = [];
    for (const c of [...batch.changes].reverse()) {
      const res = await patchTradeCampaign(c.id, c.from);
      if (!res.ok) {
        const msg =
          res.error.kind === "err" ? res.error.message : res.error.kind;
        fails.push(`#${c.id}: ${msg}`);
      }
    }
    setUndo((prev) => prev.slice(1));
    setNote(`Undid: ${batch.label}`);
    if (fails.length > 0) setErr(fails.slice(0, 3).join(" · "));
    await refreshFound(qopts);
    setBusy(false);
  }

  const n = positionCount ?? 0;
  const from = n === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = page * PAGE_SIZE + sheet.length;
  const showing =
    n === 0
      ? "Showing 0"
      : `Showing ${from}–${to} of ${n.toLocaleString()}`;

  return (
    <section
      className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 sm:p-5"
      data-testid="trade-find-tag"
    >
      <div
        className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)] px-4 py-3"
        data-testid="find-tag-found-set"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
          Found set
        </p>
        {loading && positionCount == null ? (
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            Opening accounts…
          </p>
        ) : n === 0 ? (
          <p
            className="mt-1 text-lg font-semibold text-[var(--color-label)]"
            data-testid="find-tag-found-count"
          >
            0 positions
          </p>
        ) : (
          <>
            <p
              className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-[var(--color-label)]"
              data-testid="find-tag-found-range"
            >
              {fmtDay(firstDay)} → {fmtDay(lastDay)}
            </p>
            <p
              className="mt-0.5 text-sm tabular-nums text-[var(--color-label)]"
              data-testid="find-tag-found-count"
            >
              {n.toLocaleString()} {n === 1 ? "position" : "positions"}
              <span className="text-[var(--color-label-secondary)]">
                {" "}
                · {showing}
              </span>
            </p>
          </>
        )}
      </div>
      <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
        AutoFilter hides until you turn it on. Filter every account (each
        account is one book), select positions, then clear or assign a campaign
        badge. A campaign is not a book. A position outside the campaign dates
        is rejected and stays unbadged. The table pages {PAGE_SIZE} at a time.
        Clear a badge before assigning another. Five undos.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={filterOn ? "primary" : "secondary"}
          onClick={() => {
            const next = !filterOn;
            setFilterOn(next);
            setOpenCol(null);
            resetPaging();
            if (!next) setFilters({});
          }}
          data-testid="campaign-autofilter-toggle"
          aria-pressed={filterOn}
        >
          AutoFilter
        </Button>
        {filterOn ? (
          <button
            type="button"
            className="text-xs text-[var(--color-tint)] underline"
            onClick={() => {
              setFilters({});
              setOpenCol(null);
              resetPaging();
            }}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !canClear}
          onClick={() => void apply(null, "Cleared campaign")}
          data-testid="campaign-alloc-clear"
        >
          Clear campaign
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={busy || !canAssign}
          onClick={() => {
            if (assignTo === "") {
              setErr("Choose a campaign to assign.");
              return;
            }
            void apply(assignTo, "Assigned campaign");
          }}
          data-testid="campaign-alloc-add"
          title={
            anyStamped
              ? "Clear the campaign on these trades first"
              : undefined
          }
        >
          Assign campaign
        </Button>
        <label className="text-xs text-[var(--color-label-secondary)]">
          To
          <select
            value={assignTo === "" ? "" : String(assignTo)}
            onChange={(e) =>
              setAssignTo(e.target.value ? Number(e.target.value) : "")
            }
            className="ml-1 rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-label)]"
            data-testid="find-tag-assign-to"
          >
            <option value="">Choose campaign</option>
            {charters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <Button
          type="button"
          variant="plain"
          disabled={busy || undo.length === 0}
          onClick={() => void undoLast()}
          data-testid="campaign-alloc-undo"
        >
          Undo{undo.length ? ` (${undo.length}/${UNDO_LIMIT})` : ""}
        </Button>
        <span
          className="text-xs text-[var(--color-label-tertiary)]"
          data-testid="find-tag-showing"
        >
          {showing}
          {selected.size ? ` · ${selected.size} selected` : ""}
        </span>
      </div>
      {anyStamped && selected.size > 0 ? (
        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
          Some selected trades already have a campaign. Clear first, then
          assign.
        </p>
      ) : null}

      {note ? (
        <p className="mt-2 text-sm text-[var(--color-label-secondary)]">{note}</p>
      ) : null}
      {err ? (
        <p className="mt-2 text-sm text-[var(--color-destructive)]" role="alert">
          {err}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={pageBusy || page === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          data-testid="find-tag-page-prev"
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={pageBusy || !hasMore}
          onClick={() => setPage((p) => p + 1)}
          data-testid="find-tag-page-next"
        >
          Next
        </Button>
        <span className="text-xs tabular-nums text-[var(--color-label-tertiary)]">
          Page {page + 1}
          {pageBusy ? " · loading…" : ""}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        {loading ? (
          <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
        ) : sheet.length === 0 ? (
          <p className="text-sm text-[var(--color-label-tertiary)]">
            No trades in this found set.
          </p>
        ) : (
          <table
            className="w-full min-w-[40rem] text-left text-sm"
            data-testid="find-tag-table"
          >
            <thead>
              <tr className="border-b border-[var(--color-separator)] text-[11px] uppercase tracking-wide">
                <th className="w-8 py-1.5">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    aria-label="Select found set"
                    data-testid="find-tag-select-all"
                  />
                </th>
                {COLS.map((c) => (
                  <th key={c.key} className="py-1.5 pr-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                        {c.label}
                      </span>
                      {filterOn && c.key === "when" ? (
                        <DateWhenFilter
                          days={distincts?.days || []}
                          applied={filters.when}
                          open={openCol === "when"}
                          onOpen={setOpenCol}
                          onApply={(picked) => {
                            setFilters((prev) => {
                              const next = { ...prev };
                              if (!picked || picked.length === 0) delete next.when;
                              else next.when = picked;
                              return next;
                            });
                            resetPaging();
                          }}
                          onClear={() => {
                            setFilters((prev) => {
                              const next = { ...prev };
                              delete next.when;
                              return next;
                            });
                            resetPaging();
                          }}
                        />
                      ) : null}
                      {filterOn && c.key !== "when" ? (
                        <AutoFilter
                          col={c.key}
                          values={uniques[c.key]}
                          labels={colLabels(c.key)}
                          applied={filters[c.key]}
                          open={openCol === c.key}
                          onOpen={setOpenCol}
                          onApply={(k, picked) => {
                            setFilters((prev) => {
                              const next = { ...prev };
                              if (!picked || picked.length === 0) delete next[k];
                              else next[k] = picked;
                              return next;
                            });
                            resetPaging();
                          }}
                          onClear={(k) => {
                            setFilters((prev) => {
                              const next = { ...prev };
                              delete next[k];
                              return next;
                            });
                            resetPaging();
                          }}
                        />
                      ) : null}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheet.map((t) => (
                <tr
                  key={t.id}
                  className="border-t border-[var(--color-separator)]"
                  data-testid="find-tag-row"
                >
                  <td className="py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(t.id)}
                      onChange={() => toggle(t.id)}
                      aria-label={`Select trade ${t.id}`}
                    />
                  </td>
                  <td className="py-2 tabular-nums text-[var(--color-label-secondary)]">
                    {dayYmd(t.exec_at) || "—"}
                  </td>
                  <td className="py-2 text-[var(--color-label)]">
                    {symbolOf(t)}
                  </td>
                  <td className="py-2 text-[var(--color-label-secondary)]">
                    {positionTypeLabel(t.strategy)}
                  </td>
                  <td className="py-2 text-[var(--color-label-secondary)]">
                    {sideOf(t)}
                  </td>
                  <td className="py-2 text-[var(--color-label-secondary)]">
                    {effectOf(t) === "TO_OPEN"
                      ? "To Open"
                      : effectOf(t) === "TO_CLOSE"
                        ? "To Close"
                        : "—"}
                  </td>
                  <td
                    className="py-2 text-[var(--color-label-tertiary)]"
                    data-testid={`find-tag-campaign-${t.id}`}
                    data-campaign={
                      t.practice_campaign_id == null
                        ? "none"
                        : String(t.practice_campaign_id)
                    }
                  >
                    {t.practice_campaign_id == null ? (
                      "None"
                    ) : (
                      <CampaignBadge
                        title={campaignLabel(t, titles)}
                        color={
                          t.practice_campaign_id != null
                            ? colors.get(t.practice_campaign_id)
                            : null
                        }
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

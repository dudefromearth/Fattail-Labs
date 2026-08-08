"use client";

// Trade Log v1.1 — table-first blotter, right sheet, manual management UX.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TradeLogTable from "@/components/trade-log/TradeLogTable";
import TradeLogToolbar from "@/components/trade-log/TradeLogToolbar";
import TradeSheet from "@/components/trade-log/TradeSheet";
import ImportSheet from "@/components/trade-log/ImportSheet";
import PracticeSuiteChrome from "@/components/practice/PracticeSuiteChrome";
import type { Account, Catalog, Trade } from "@/lib/tradeLog";
import {
  buildCloseDraftFromOpen,
  listUnmatchedOpens,
  shortStructureLabel,
} from "@/lib/tradeLog";
import {
  exportUrl,
  fetchCatalog,
  fetchTrades,
  fetchUnmatchedOpens,
} from "@/lib/tradeLogApi";
import {
  fetchCampaigns,
  fetchPlaybookEntries,
} from "@/lib/practiceSpineApi";
import { usePracticeContext } from "@/lib/practiceContext";
import { saveTradeLogLastUsed } from "@/lib/tradeLogPrefs";

type LoadState = "loading" | "ok" | "anon" | "forbidden" | "err";
type SheetMode = "create" | "edit" | "close";

const PAGE_LIMIT = 80;

function TradeLogBody() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const deepLinkId = Number(searchParams.get("id") || "");
  /** Campaign page → blotter deep-link (`?campaign=N`). */
  const deepLinkCampaign = Number(searchParams.get("campaign") || "");
  /** Journey Adhere pillar → meter complement (F2). Not standing chrome. */
  const deepLinkAdherenceMode = searchParams.get("adherence_mode") || "";
  const deepLinkFromDay = searchParams.get("from_day") || "";
  const deepLinkToDay = searchParams.get("to_day") || "";
  const {
    accountId,
    accountIdParam,
    setAccountId,
    accountLabel,
    accounts: ctxAccounts,
    refreshAccounts,
    prefsReady,
    dateFilterActive,
    periodLabel,
    setGranularity,
  } = usePracticeContext();

  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  /** Blotter pages (newest first, append on load-more). */
  const [trades, setTrades] = useState<Trade[]>([]);
  /** Server-matched unmatched opens (full book on server; small payload). */
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<SheetMode>("create");
  const [selected, setSelected] = useState<Trade | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deepLinked, setDeepLinked] = useState(false);
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);
  const [campaignFilter, setCampaignFilter] = useState<number | "">("");
  const [playbookFilter, setPlaybookFilter] = useState<
    number | "" | "unaffiliated"
  >("");
  /** F2: drift = not followed and not partial (broke + unknown). */
  const [adherenceMode, setAdherenceMode] = useState<"drift" | "">("");
  const [filterFromDay, setFilterFromDay] = useState<string>("");
  const [filterToDay, setFilterToDay] = useState<string>("");
  const [campaignOptions, setCampaignOptions] = useState<
    {
      id: number;
      title: string;
      is_default?: boolean;
      is_ledger?: boolean;
      account_id?: number | null;
    }[]
  >([]);
  const [playbookOptions, setPlaybookOptions] = useState<
    { id: number; title: string }[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetchCampaigns().catch(() => null),
      fetchPlaybookEntries(true).catch(() => null),
    ]).then(([camps, pbs]) => {
      if (camps?.campaigns) {
        setCampaignOptions(
          camps.campaigns.map((c) => ({
            id: c.id,
            title: c.title,
            is_default: !!c.is_default,
            is_ledger: !!c.is_ledger,
            account_id: c.account_id ?? null,
          })),
        );
      }
      if (pbs?.entries) {
        setPlaybookOptions(
          pbs.entries.map((e) => ({ id: e.id, title: e.title })),
        );
      }
    });
  }, []);

  // Apply ?campaign= from Practice Campaign → Trade Log deep-link
  useEffect(() => {
    if (deepLinkCampaign > 0) {
      setCampaignFilter(deepLinkCampaign);
    }
  }, [deepLinkCampaign]);

  // When account changes, reset campaign filter to that account's ledger/default
  // (or clear if none). Never leave a campaign id from another account selected.
  useEffect(() => {
    if (deepLinkCampaign > 0) return;
    if (accountId === "all") {
      setCampaignFilter("");
      return;
    }
    if (!campaignOptions.length) {
      setCampaignFilter("");
      return;
    }
    const forAccount = campaignOptions.filter(
      (c) => c.account_id == null || c.account_id === accountId,
    );
    const pool = forAccount.length ? forAccount : campaignOptions;
    const preferred =
      pool.find((c) => c.is_ledger) ||
      pool.find((c) => c.is_default) ||
      pool[0];
    if (preferred) setCampaignFilter(preferred.id);
    else setCampaignFilter("");
  }, [accountId, campaignOptions, deepLinkCampaign]);

  // Journey Adhere deep-link only (F2) — no standing process filter on the blotter
  useEffect(() => {
    if (deepLinkAdherenceMode === "drift") {
      setAdherenceMode("drift");
      if (deepLinkFromDay) setFilterFromDay(deepLinkFromDay.slice(0, 10));
      if (deepLinkToDay) setFilterToDay(deepLinkToDay.slice(0, 10));
    } else {
      setAdherenceMode("");
      setFilterFromDay("");
      setFilterToDay("");
    }
  }, [deepLinkAdherenceMode, deepLinkFromDay, deepLinkToDay]);

  function clearJourneyAdherenceFilter() {
    setAdherenceMode("");
    setFilterFromDay("");
    setFilterToDay("");
    const next = new URLSearchParams(searchParams.toString());
    next.delete("adherence_mode");
    next.delete("from_day");
    next.delete("to_day");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const load = useCallback(() => {
    if (!prefsReady) {
      setState("loading");
      return;
    }
    setError(null);
    setNextCursor(null);
    setHasMore(false);
    Promise.all([
      fetchTrades(accountIdParam, {
        limit: PAGE_LIMIT,
        practice_campaign_id:
          campaignFilter === "" ? null : campaignFilter,
        playbook_entry_id:
          typeof playbookFilter === "number" ? playbookFilter : null,
        playbook_mode:
          playbookFilter === "unaffiliated" ? "unaffiliated" : null,
        adherence_mode: adherenceMode === "drift" ? "drift" : null,
        from_day: filterFromDay || null,
        to_day: filterToDay || null,
      }),
      fetchUnmatchedOpens(accountIdParam),
      fetchCatalog(),
    ])
      .then(async ([tr, opens, vn]) => {
        if (!tr.ok) {
          const msg =
            tr.error.kind === "err" ? tr.error.message : tr.error.kind;
          if (
            accountIdParam != null &&
            tr.error.kind === "err" &&
            /account not found/i.test(tr.error.message || "")
          ) {
            // Fall back to Primary (default account), not "All accounts"
            const active = (ctxAccounts || []).filter(
              (a) => a.status === "active",
            );
            const home =
              active.find((a) => a.label === "Default") ||
              active.find((a) => a.label === "Primary") ||
              active[0];
            if (home) setAccountId(home.id);
            else setAccountId("all");
            setError(null);
            setState("loading");
            return;
          }
          setState(tr.error.kind === "err" ? "err" : tr.error.kind);
          if (tr.error.kind === "err") setError(msg);
          return;
        }
        if (!vn.ok) {
          if (vn.error.kind === "anon" || vn.error.kind === "forbidden") {
            setState(vn.error.kind);
            return;
          }
        }
        setTrades(tr.data.trades || []);
        setHasMore(!!tr.data.has_more);
        setNextCursor(tr.data.next_cursor ?? null);
        if (opens.ok) {
          setOpenTrades(opens.data.trades || []);
          if (opens.data.accounts?.length) {
            setAccounts(opens.data.accounts);
          }
        } else {
          setOpenTrades([]);
        }
        if (tr.data.accounts?.length) {
          setAccounts(tr.data.accounts);
        }
        refreshAccounts();
        if (vn.ok) {
          setCatalog({
            venues: vn.data.venues || [],
            strategies: vn.data.strategies || [],
          });
        }
        setState("ok");
      })
      .catch((e) => {
        setState("err");
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [
    accountIdParam,
    prefsReady,
    refreshAccounts,
    setAccountId,
    campaignFilter,
    playbookFilter,
    adherenceMode,
    filterFromDay,
    filterToDay,
    ctxAccounts,
  ]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const tr = await fetchTrades(accountIdParam, {
        limit: PAGE_LIMIT,
        cursor: nextCursor,
        practice_campaign_id:
          campaignFilter === "" ? null : campaignFilter,
        playbook_entry_id:
          typeof playbookFilter === "number" ? playbookFilter : null,
        playbook_mode:
          playbookFilter === "unaffiliated" ? "unaffiliated" : null,
        adherence_mode: adherenceMode === "drift" ? "drift" : null,
        from_day: filterFromDay || null,
        to_day: filterToDay || null,
      });
      if (!tr.ok) {
        setLoadingMore(false);
        return;
      }
      const incoming = tr.data.trades || [];
      setTrades((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        const add = incoming.filter((t) => !seen.has(t.id));
        return [...prev, ...add];
      });
      setHasMore(!!tr.data.has_more);
      setNextCursor(tr.data.next_cursor ?? null);
    } finally {
      setLoadingMore(false);
    }
  }, [
    accountIdParam,
    hasMore,
    nextCursor,
    loadingMore,
    campaignFilter,
    playbookFilter,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (state !== "ok" || !deepLinkId || deepLinked) return;
    const t =
      trades.find((x) => x.id === deepLinkId) ||
      openTrades.find((x) => x.id === deepLinkId);
    if (!t) {
      // May be older than first page — fetch single trade
      void fetch(`/api/me/trade-log/trades/${deepLinkId}`, {
        credentials: "same-origin",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((row: Trade | null) => {
          if (!row?.id) return;
          setSelected(row);
          setSheetMode("edit");
          setSheetOpen(true);
          setDeepLinked(true);
        });
      return;
    }
    setSelected(t);
    setSheetMode("edit");
    setSheetOpen(true);
    setDeepLinked(true);
    requestAnimationFrame(() => {
      const el = document.getElementById(`trade-row-${t.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [state, trades, openTrades, deepLinkId, deepLinked]);

  useEffect(() => {
    setDeepLinked(false);
  }, [deepLinkId]);

  const mergedAccounts = accounts.length ? accounts : ctxAccounts;
  const activeAccounts = mergedAccounts.filter((a) => a.status === "active");
  const standingHome =
    activeAccounts.find((a) => a.label === "Default") ||
    activeAccounts.find((a) => a.label === "Primary") ||
    activeAccounts[0];
  const defaultAcct =
    accountId !== "all" ? accountId : standingHome?.id ?? null;
  const exportAccount =
    accountId !== "all"
      ? mergedAccounts.find((a) => a.id === accountId)
      : standingHome;
  const nativeVenueLabel =
    exportAccount?.broker && exportAccount.broker !== "unset"
      ? exportAccount.broker
      : "FatTail if unset";

  const campaignOptionsForAccount = useMemo(() => {
    if (accountId === "all") return campaignOptions;
    const scoped = campaignOptions.filter(
      (c) => c.account_id == null || c.account_id === accountId,
    );
    return scoped.length ? scoped : campaignOptions;
  }, [accountId, campaignOptions]);

  const campaignFilterLabel = useMemo(() => {
    if (campaignFilter === "" || campaignFilter == null) return "All campaigns";
    const c = campaignOptions.find((x) => x.id === campaignFilter);
    if (!c) return "Campaign";
    const tag = c.is_ledger || c.is_default ? " · default" : "";
    return `${c.title}${tag}`;
  }, [campaignFilter, campaignOptions]);

  const contextScopeLabel = useMemo(() => {
    return `${accountLabel} · ${campaignFilterLabel}`;
  }, [accountLabel, campaignFilterLabel]);

  /** Prefer server opens for accuracy; fall back to client match on loaded pages. */
  const unmatched = useMemo(() => {
    if (openTrades.length > 0 || state === "ok") {
      // openTrades is authoritative when loaded (may be empty book)
      if (openTrades.length > 0) return openTrades;
      // Still loading opens failed — derive from page
      return listUnmatchedOpens(trades);
    }
    return listUnmatchedOpens(trades);
  }, [openTrades, trades, state]);

  /** Sheet matching: loaded pages + known opens (avoid missing open outside page). */
  const sheetTrades = useMemo(() => {
    const byId = new Map<number, Trade>();
    for (const t of trades) byId.set(t.id, t);
    for (const t of openTrades) byId.set(t.id, t);
    if (selected) byId.set(selected.id, selected);
    return [...byId.values()];
  }, [trades, openTrades, selected]);

  const tableTrades = filterOpenOnly ? unmatched : trades;

  async function trashIds(ids: number[]) {
    setBulkBusy(true);
    for (const id of ids) {
      await fetch(`/api/me/trade-log/trades/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
    }
    setBulkBusy(false);
    setSelectedIds(new Set());
    setSelected(null);
    setSheetOpen(false);
    load();
  }

  return (
    <>
      <TradeLogToolbar
        accountLabel={contextScopeLabel}
        onImport={() => setImportOpen(true)}
        onNewTrade={() => {
          setSheetMode("create");
          setSelected(null);
          setSheetOpen(true);
        }}
        nativeVenueLabel={nativeVenueLabel}
        onExport={(fmt) => {
          let aid: number | null = accountIdParam;
          if (fmt === "native" && accountId === "all" && standingHome?.id) {
            aid = standingHome.id;
          }
          window.location.href = exportUrl({ accountId: aid, format: fmt });
        }}
      />

      {selectedIds.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm dark:border-red-900 dark:bg-red-950">
          <span className="font-medium text-red-900 dark:text-red-100">
            {selectedIds.size} open selected
          </span>
          <button
            type="button"
            disabled={bulkBusy}
            className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            onClick={() => {
              if (
                !window.confirm(
                  `Trash ${selectedIds.size} open position(s)? Cannot be undone.`,
                )
              )
                return;
              void trashIds([...selectedIds]);
            }}
          >
            {bulkBusy ? "Trashing…" : "Bulk trash"}
          </button>
          <button
            type="button"
            className="text-xs underline text-red-800 dark:text-red-200"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear selection
          </button>
        </div>
      )}

      {state === "loading" && (
        <p className="mt-8 text-sm text-[var(--color-label-tertiary)]">
          Loading…
        </p>
      )}
      {state === "anon" && (
        <p className="mt-8 text-sm">
          <Link href="/login" className="font-medium text-[var(--color-tint)]">
            Sign in
          </Link>{" "}
          to use Trade Log.
        </p>
      )}
      {state === "forbidden" && (
        <div className="surface-card mt-8 border border-[var(--color-separator)] p-5 text-sm">
          <p className="font-medium text-[var(--color-label)]">
            Membership required
          </p>
          <p className="mt-2 text-[var(--color-label-secondary)]">
            Trade Log is included with Observer and Navigator memberships.
          </p>
          <Link
            href="/membership"
            className="mt-3 inline-block font-medium text-[var(--color-tint)]"
          >
            View membership →
          </Link>
        </div>
      )}
      {state === "err" && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Could not load Trade Log</p>
          {error && <p className="mt-1 font-mono text-xs opacity-80">{error}</p>}
          <button type="button" onClick={() => load()} className="mt-3 underline">
            Try again
          </button>
        </div>
      )}

      {state === "ok" &&
        accountId !== "all" &&
        tableTrades.length === 0 &&
        dateFilterActive &&
        (mergedAccounts.find((a) => a.id === accountId)?.trade_count ?? 0) >
          0 && (
          <div
            className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-fill)]/50 px-3 py-2 text-xs text-[var(--color-label-secondary)]"
            role="status"
            data-testid="trade-log-empty-period"
          >
            No trades in{" "}
            <span className="font-medium text-[var(--color-label)]">
              {periodLabel}
            </span>{" "}
            for this account ({accountLabel} has fills outside this window).{" "}
            <button
              type="button"
              className="font-medium text-[var(--color-tint)] hover:underline"
              onClick={() => setGranularity("all")}
            >
              Show all time
            </button>
          </div>
        )}

      {state === "ok" &&
        accountId !== "all" &&
        tableTrades.length === 0 &&
        !dateFilterActive &&
        mergedAccounts.some(
          (a) =>
            a.status === "active" &&
            a.id !== accountId &&
            (a.trade_count ?? 0) > 0,
        ) && (
          <div
            className="mt-4 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-fill)]/50 px-3 py-2 text-xs text-[var(--color-label-secondary)]"
            role="status"
            data-testid="trade-log-empty-other-books"
          >
            No trades on{" "}
            <span className="font-medium text-[var(--color-label)]">
              {accountLabel}
            </span>
            . Other active accounts have fills — switch account in Practice
            chrome above.
          </div>
        )}

      {state === "ok" && adherenceMode === "drift" && (
        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2 text-xs text-[var(--color-label-secondary)]"
          data-testid="journey-adhere-locate-banner"
          role="status"
        >
          <p>
            From Journey · showing trades that are not{" "}
            <span className="font-medium text-[var(--color-label)]">
              followed
            </span>{" "}
            or{" "}
            <span className="font-medium text-[var(--color-label)]">
              partial
            </span>
            {filterFromDay || filterToDay
              ? ` · ${[filterFromDay, filterToDay].filter(Boolean).join(" → ")}`
              : ""}
            . This is a locate view, not a standing Trade Log filter.
          </p>
          <button
            type="button"
            onClick={clearJourneyAdherenceFilter}
            className="shrink-0 font-medium text-[var(--color-tint)] hover:underline"
            data-testid="journey-adhere-locate-clear"
          >
            Clear
          </button>
        </div>
      )}

      {state === "ok" && (
        <TradeLogTable
          trades={tableTrades}
          allTradesForIssues={sheetTrades}
          openCount={unmatched.length}
          selectedId={selected?.id}
          filterOpenOnly={filterOpenOnly}
          onFilterOpenOnly={setFilterOpenOnly}
          campaignFilter={campaignFilter}
          onCampaignFilter={setCampaignFilter}
          campaignOptions={campaignOptionsForAccount}
          playbookFilter={playbookFilter}
          onPlaybookFilter={setPlaybookFilter}
          playbookOptions={playbookOptions}
          hasMore={!filterOpenOnly && hasMore}
          loadingMore={loadingMore}
          onLoadMore={() => void loadMore()}
          selectedIds={selectedIds}
          onToggleSelect={(id) => {
            setSelectedIds((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onSelectAllOpens={() => {
            setSelectedIds(new Set(unmatched.map((t) => t.id)));
            setFilterOpenOnly(true);
          }}
          onNewTrade={() => {
            setSheetMode("create");
            setSelected(null);
            setSheetOpen(true);
          }}
          onSelect={(t) => {
            setSelected(t);
            setSheetMode("edit");
            setSheetOpen(true);
          }}
          onCloseOpen={(t) => {
            setSelected(t);
            setSheetMode("close");
            setSheetOpen(true);
          }}
        />
      )}

      <TradeSheet
        open={sheetOpen && state === "ok"}
        mode={sheetMode}
        trade={
          sheetMode === "edit" || sheetMode === "close" ? selected : null
        }
        trades={sheetTrades}
        accounts={mergedAccounts}
        catalog={catalog}
        defaultAccountId={defaultAcct}
        onClose={() => {
          setSheetOpen(false);
        }}
        onSaved={() => load()}
        onOpenTrade={(t) => {
          setSelected(t);
          setSheetMode("edit");
          setSheetOpen(true);
        }}
        onRequestCloseFromOpen={(openTrade) => {
          setSelected(openTrade);
          setSheetMode("close");
          setSheetOpen(true);
        }}
        onRequestImport={() => {
          setSheetOpen(false);
          setImportOpen(true);
        }}
        onSelectOpenForClose={(openTrade) => {
          setSelected(openTrade);
          setSheetMode("close");
          setSheetOpen(true);
        }}
        onTrashed={() => {
          setSelected(null);
          setSheetOpen(false);
          load();
        }}
        onDuplicateOpen={(openTrade) => {
          const draft = buildCloseDraftFromOpen(openTrade);
          // Re-open as create with structure from open (as TO_OPEN)
          saveTradeLogLastUsed({
            account_id: openTrade.account_id,
            strategy: openTrade.strategy,
            underlier:
              openTrade.legs[0]?.underlier ||
              openTrade.legs[0]?.symbol ||
              "SPX",
          });
          setSelected(null);
          setSheetMode("create");
          setSheetOpen(true);
          // Store template in sessionStorage for sheet to pick up
          try {
            sessionStorage.setItem(
              "ft.tradeLog.duplicateTemplate",
              JSON.stringify({
                strategy: openTrade.strategy,
                account_id: openTrade.account_id,
                legs: openTrade.legs.map((l) => ({
                  ...l,
                  pos_effect: "TO_OPEN",
                  fill_price: 0,
                })),
                asset_class: openTrade.asset_class,
                net_side: openTrade.net_side,
                label: shortStructureLabel(openTrade),
                // invert draft sides back - use open legs as TO_OPEN
                from: draft.source_open_id,
              }),
            );
          } catch {
            /* ignore */
          }
        }}
      />
      <ImportSheet
        open={importOpen && state === "ok"}
        accounts={mergedAccounts}
        defaultAccountId={defaultAcct}
        onClose={() => setImportOpen(false)}
        onImported={() => load()}
      />
    </>
  );
}

function TradeLogClient() {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 pb-24 sm:px-6">
      <PracticeSuiteChrome active="trade-log" hideTitle>
        <TradeLogBody />
      </PracticeSuiteChrome>
    </main>
  );
}

export default function TradeLogPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6">
          <p className="text-sm text-[var(--color-label-tertiary)]">
            Loading Trade Log…
          </p>
        </main>
      }
    >
      <TradeLogClient />
    </Suspense>
  );
}

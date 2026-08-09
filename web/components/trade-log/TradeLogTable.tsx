"use client";

/**
 * Trade blotter — open/close blocks, open filter, row actions, validation chips.
 */

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { Trade } from "@/lib/tradeLog";
import {
  entrySourceLabel,
  formatQtyEffect,
  issueLabel,
  listUnmatchedOpens,
  normalizeEntrySource,
  positionBadge,
  tradeIsCloseFill,
  tradeRowIssues,
} from "@/lib/tradeLog";

const COLUMNS = [
  { key: "sel", label: "", align: "left" as const },
  { key: "exec", label: "Exec time", align: "left" as const },
  { key: "strategy", label: "Strategy", align: "left" as const },
  { key: "status", label: "Status", align: "left" as const },
  { key: "side", label: "Side", align: "left" as const },
  { key: "qty", label: "Qty · effect", align: "left" as const },
  { key: "symbol", label: "Symbol", align: "left" as const },
  { key: "exp", label: "Exp", align: "left" as const },
  { key: "strike", label: "Strike", align: "right" as const },
  { key: "type", label: "Type", align: "left" as const },
  { key: "price", label: "Price", align: "right" as const },
  { key: "net", label: "Net", align: "right" as const },
] as const;

type BlockKind = "open" | "close" | "neutral";

function blockKind(trade: Trade): BlockKind {
  const effects = trade.legs.map((l) => l.pos_effect).filter(Boolean);
  const closes = effects.filter((e) => e === "TO_CLOSE").length;
  const opens = effects.filter((e) => e === "TO_OPEN").length;
  if (closes > opens) return "close";
  if (opens > 0) return "open";
  return "neutral";
}

function rowBg(kind: BlockKind, selected: boolean): string {
  if (selected) return "var(--blotter-select-bg)";
  if (kind === "close") return "var(--blotter-close-bg)";
  if (kind === "open") return "var(--blotter-open-bg)";
  return "var(--color-surface)";
}

function rowRule(
  kind: BlockKind,
  selected: boolean,
  isLastLeg: boolean,
  hasNextPosition: boolean,
): CSSProperties {
  if (isLastLeg && hasNextPosition) {
    return {
      borderBottomWidth: 1,
      borderBottomStyle: "solid",
      borderBottomColor: "var(--blotter-position-rule)",
    };
  }
  if (selected && !isLastLeg) {
    const color =
      kind === "close"
        ? "var(--blotter-border-close)"
        : kind === "open"
          ? "var(--blotter-border-open)"
          : "rgba(255,255,255,0.28)";
    return {
      borderBottomWidth: 1,
      borderBottomStyle: "solid",
      borderBottomColor: color,
    };
  }
  return {
    borderBottomWidth: 0,
    borderBottomStyle: "none",
    borderBottomColor: "transparent",
  };
}

function sideClass(
  side: string | undefined,
  selected: boolean,
  kind: BlockKind,
): string {
  if (selected || kind === "open" || kind === "close") {
    return "font-semibold text-white/95";
  }
  if (side === "BUY") return "font-semibold text-[var(--color-success)]";
  if (side === "SELL") return "font-semibold text-[var(--color-destructive)]";
  return "text-[var(--color-label)]";
}

function badgeMeta(badge: ReturnType<typeof positionBadge>): {
  label: string;
  cls: string;
} {
  switch (badge) {
    case "open":
      return {
        label: "Open",
        cls: "bg-emerald-500/90 text-white",
      };
    case "complete":
      return {
        label: "Complete",
        cls: "bg-white/20 text-white",
      };
    case "orphan_close":
      return {
        label: "Orphan close",
        cls: "bg-amber-400 text-black",
      };
    default:
      return { label: "", cls: "" };
  }
}

export default function TradeLogTable({
  trades,
  allTradesForIssues,
  openCount,
  onSelect,
  selectedId,
  onNewTrade,
  onCloseOpen,
  selectedIds,
  onToggleSelect,
  onSelectAllOpens,
  filterOpenOnly,
  onFilterOpenOnly,
  campaignFilter,
  onCampaignFilter,
  campaignOptions,
  playbookFilter,
  onPlaybookFilter,
  playbookOptions,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  /** Rows to render (already filtered when Open-only). */
  trades: Trade[];
  /** Broader set for match/issue chips (loaded pages + server opens). */
  allTradesForIssues?: Trade[];
  /** Authoritative unmatched open count (server). */
  openCount?: number;
  onSelect: (t: Trade) => void;
  selectedId?: number | null;
  onNewTrade?: () => void;
  onCloseOpen?: (t: Trade) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onSelectAllOpens?: () => void;
  filterOpenOnly?: boolean;
  onFilterOpenOnly?: (v: boolean) => void;
  campaignFilter?: number | "";
  onCampaignFilter?: (v: number | "") => void;
  campaignOptions?: {
    id: number;
    title: string;
    is_default?: boolean;
    is_ledger?: boolean;
    account_id?: number | null;
  }[];
  /** "" = All campaigns; "unaffiliated" = no playbook; number = linked playbook */
  playbookFilter?: number | "" | "unaffiliated";
  onPlaybookFilter?: (v: number | "" | "unaffiliated") => void;
  playbookOptions?: { id: number; title: string }[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}) {
  const issueBook = allTradesForIssues ?? trades;
  const unmatched = useMemo(() => listUnmatchedOpens(issueBook), [issueBook]);
  const openN = openCount ?? unmatched.length;
  const unmatchedIds = useMemo(() => {
    if (filterOpenOnly) {
      // Parent already passed only opens as trades
      return new Set(trades.map((t) => t.id));
    }
    return new Set(unmatched.map((t) => t.id));
  }, [filterOpenOnly, trades, unmatched]);
  const visible = trades;
  const campaignTitleById = useMemo(() => {
    const m = new Map<number, { title: string; is_ledger?: boolean }>();
    for (const c of campaignOptions || []) {
      m.set(c.id, { title: c.title, is_ledger: c.is_ledger || c.is_default });
    }
    return m;
  }, [campaignOptions]);

  const empty = !filterOpenOnly && trades.length === 0;
  const emptyFilter = filterOpenOnly && trades.length === 0;

  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]"
      data-testid="trade-log-table"
      data-empty={empty ? "true" : "false"}
      style={
        {
          ["--blotter-open-bg" as string]: "#0B4A1F",
          ["--blotter-close-bg" as string]: "#8B1A1A",
          ["--blotter-border-open" as string]: "#062E12",
          ["--blotter-border-close" as string]: "#4A0C0C",
          ["--blotter-position-rule" as string]: "rgba(0,0,0,0.55)",
          ["--blotter-select-bg" as string]: "#2A7AB8",
        } as CSSProperties
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 text-[13px]">
          <span className="font-semibold text-[var(--color-label)]">
            Trade history
          </span>
          <span className="tabular-nums text-[var(--color-label-secondary)]">
            {empty
              ? "0 trades · multi-leg groups"
              : filterOpenOnly
                ? `${trades.length} open`
                : `${trades.length} loaded${hasMore ? "+" : ""}`}
          </span>
          {(openN > 0 || filterOpenOnly) && (
            <button
              type="button"
              onClick={() => onFilterOpenOnly?.(!filterOpenOnly)}
              className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
                filterOpenOnly
                  ? "bg-emerald-700 text-white"
                  : "border border-[var(--color-separator)] text-[var(--color-label)] hover:bg-[var(--color-fill)]"
              }`}
            >
              Open: {openN}
            </button>
          )}
          {openN > 0 && onSelectAllOpens && (
            <button
              type="button"
              onClick={onSelectAllOpens}
              className="text-xs text-[var(--color-tint)] underline"
            >
              Select opens
            </button>
          )}
          {onCampaignFilter && (campaignOptions?.length ?? 0) > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-label-secondary)]">
              <span className="sr-only">Filter by campaign</span>
              <select
                value={campaignFilter === "" || campaignFilter == null ? "" : String(campaignFilter)}
                onChange={(e) => {
                  const v = e.target.value;
                  onCampaignFilter(v ? Number(v) : "");
                }}
                className="max-w-[14rem] rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-label)]"
                data-testid="blotter-campaign-filter"
                title="Named campaign = stamps for that campaign. All campaigns = every trade on this account filter."
              >
                {campaignOptions!.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                    {c.is_ledger || c.is_default ? " · default" : ""}
                  </option>
                ))}
                <option value="">All campaigns</option>
              </select>
            </label>
          )}
          {onPlaybookFilter && (
            <label className="flex items-center gap-1.5 text-xs text-[var(--color-label-secondary)]">
              <span className="sr-only">Filter by playbook</span>
              <select
                value={
                  playbookFilter === "" || playbookFilter == null
                    ? ""
                    : String(playbookFilter)
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) onPlaybookFilter("");
                  else if (v === "unaffiliated") onPlaybookFilter("unaffiliated");
                  else onPlaybookFilter(Number(v));
                }}
                className="max-w-[14rem] rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-label)]"
                data-testid="blotter-playbook-filter"
                title="Named playbook = exact link. Unaffiliated = no playbook. All playbooks = no playbook filter."
              >
                {(playbookOptions || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
                <option value="unaffiliated">Unaffiliated</option>
                <option value="">All playbooks</option>
              </select>
            </label>
          )}
        </div>
        <span className="text-[12px] text-[var(--color-label-secondary)]">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm align-middle"
            style={{ background: "var(--blotter-open-bg)" }}
          />{" "}
          Open{" "}
          <span
            className="ml-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
            style={{ background: "var(--blotter-close-bg)" }}
          />{" "}
          Close{" "}
          <span
            className="ml-2 inline-block h-2.5 w-2.5 rounded-sm align-middle"
            style={{ background: "var(--blotter-select-bg)" }}
          />{" "}
          Selected
        </span>
      </div>

      <div className="relative max-h-[min(70vh,720px)] overflow-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left text-[13px] leading-snug text-[var(--color-label)]">
          <thead className="sticky top-0 z-[1] bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-separator)]">
            <tr className="border-b border-[var(--color-separator)]">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={`px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)] whitespace-nowrap ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emptyFilter && (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  className="px-4 py-8 text-center text-sm text-[var(--color-label-secondary)]"
                >
                  No open positions in this view.{" "}
                  <button
                    type="button"
                    className="text-[var(--color-tint)] underline"
                    onClick={() => onFilterOpenOnly?.(false)}
                  >
                    Show all
                  </button>
                </td>
              </tr>
            )}
            {!empty &&
              visible.map((trade, ti) => {
                const legs =
                  trade.legs.length > 0
                    ? trade.legs
                    : [
                        {
                          side: "BUY" as const,
                          quantity: 0,
                          fill_price: 0,
                          pos_effect: null,
                        },
                      ];
                const kind = blockKind(trade);
                const selected = selectedId === trade.id;
                const bg = rowBg(kind, selected);
                const hasNext = ti < visible.length - 1;
                const onColor =
                  selected || kind === "open" || kind === "close";
                const textMain = onColor
                  ? "text-white"
                  : "text-[var(--color-label)]";
                const isUnmatched = unmatchedIds.has(trade.id);
                const badge = positionBadge(trade, issueBook);
                const bmeta = badgeMeta(badge);
                const issues = tradeRowIssues(trade, issueBook).filter(
                  (i) => i !== "unmatched_open",
                );
                const checked = selectedIds?.has(trade.id) ?? false;

                return legs.map((leg, i) => {
                  const isLastLeg = i === legs.length - 1;
                  const rule = rowRule(kind, selected, isLastLeg, hasNext);
                  return (
                    <tr
                      key={`${trade.id}-${i}`}
                      id={i === 0 ? `trade-row-${trade.id}` : undefined}
                      data-trade-id={trade.id}
                      onClick={() => onSelect(trade)}
                      data-selected={selected ? "true" : "false"}
                      data-block={kind}
                      className="cursor-pointer tabular-nums transition-[filter] hover:brightness-110"
                      style={{ backgroundColor: bg }}
                    >
                      <td
                        className="px-2 py-2"
                        style={{ backgroundColor: bg, ...rule }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {i === 0 && isUnmatched && onToggleSelect ? (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleSelect(trade.id)}
                            aria-label={`Select open #${trade.id}`}
                          />
                        ) : null}
                      </td>
                      <td
                        className={`px-2 py-2 font-medium ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {i === 0
                          ? (trade.exec_at || "")
                              .replace("T", " ")
                              .slice(0, 16)
                          : ""}
                      </td>
                      <td
                        className={`px-2 py-2 font-semibold ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {i === 0 ? (
                          <span className="inline-flex flex-wrap items-center gap-1">
                            {trade.strategy}
                            {(() => {
                              const src = normalizeEntrySource(
                                trade.entry_source,
                              );
                              if (src === "manual") return null;
                              return (
                                <span
                                  className={`rounded px-1 text-[10px] font-bold uppercase tracking-wide ${
                                    src === "import"
                                      ? "bg-sky-500/90 text-white"
                                      : "bg-violet-600/90 text-white"
                                  }`}
                                  title={
                                    src === "import"
                                      ? "Imported (file or paste)"
                                      : "Automated (Strategy Lab or other automation)"
                                  }
                                >
                                  {entrySourceLabel(src)}
                                </span>
                              );
                            })()}
                            {(() => {
                              // Spec §9 — one campaign badge chip; no variance color
                              const cid = trade.practice_campaign_id;
                              if (cid == null || cid <= 0) return null;
                              const meta = campaignTitleById.get(cid);
                              const label = meta?.title
                                ? meta.title.length > 18
                                  ? `${meta.title.slice(0, 16)}…`
                                  : meta.title
                                : `#${cid}`;
                              const by = trade.stamped_by;
                              const tier =
                                by === "member"
                                  ? "Directed"
                                  : by === "memory"
                                    ? "Memory"
                                    : meta?.is_ledger
                                      ? "Ledger"
                                      : "Campaign";
                              return (
                                <button
                                  type="button"
                                  data-testid="blotter-campaign-badge"
                                  className="max-w-[9rem] truncate rounded-full border border-white/25 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-white/95 hover:bg-white/20"
                                  title={`${tier}: ${meta?.title || `Campaign ${cid}`} — tap to filter`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCampaignFilter?.(cid);
                                  }}
                                >
                                  {label}
                                </button>
                              );
                            })()}
                          </span>
                        ) : (
                          ""
                        )}
                      </td>
                      <td
                        className="px-2 py-2"
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {i === 0 && bmeta.label ? (
                          <span
                            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${bmeta.cls}`}
                          >
                            {bmeta.label}
                          </span>
                        ) : null}
                        {i === 0 && issues.length > 0 && (
                          <span className="ml-1 inline-flex flex-wrap gap-0.5">
                            {issues.map((iss) => (
                              <span
                                key={iss}
                                className="rounded bg-amber-400/95 px-1 text-[9px] font-semibold text-black"
                              >
                                {issueLabel(iss)}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-2 py-2 ${sideClass(leg.side, selected, kind)}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {leg.side || "—"}
                      </td>
                      <td
                        className={`px-2 py-2 ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {leg.quantity
                          ? formatQtyEffect(leg as Trade["legs"][0])
                          : "—"}
                      </td>
                      <td
                        className={`px-2 py-2 font-medium ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {leg.underlier || leg.symbol || "—"}
                      </td>
                      <td
                        className={`px-2 py-2 whitespace-nowrap ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {leg.expiry || "—"}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-medium ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {leg.strike != null ? String(leg.strike) : "—"}
                      </td>
                      <td
                        className={`px-2 py-2 ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {leg.right || "—"}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-medium ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {leg.quantity ? Number(leg.fill_price).toFixed(2) : "—"}
                      </td>
                      <td
                        className={`px-2 py-2 text-right font-semibold ${textMain}`}
                        style={{ backgroundColor: bg, ...rule }}
                      >
                        {i === 0 && trade.net_price != null
                          ? `${trade.net_side === "CREDIT" ? "+" : ""}${Number(trade.net_price).toFixed(2)}${trade.net_side ? ` ${trade.net_side}` : ""}`
                          : i === 0
                            ? "—"
                            : ""}
                        {i === 0 &&
                          tradeIsCloseFill(trade) &&
                          badge === "complete" && (
                            <span className="ml-1 text-[10px] font-normal opacity-80">
                              · closed
                            </span>
                          )}
                      </td>
                    </tr>
                  );
                });
              })}
          </tbody>
        </table>

        {empty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-surface)]/75 px-4 backdrop-blur-[1px]">
            <div className="pointer-events-auto max-w-md rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] px-6 py-5 text-center shadow-[var(--elevation-2)]">
              <p className="text-[15px] font-semibold text-[var(--color-label)]">
                Your blotter is ready
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-label-secondary)]">
                Multi-leg fills group by strategy. Green = open, red = close.
                Import a file or log a trade to fill the book. History loads in
                pages to keep the browser light.
              </p>
              {onNewTrade && (
                <button
                  type="button"
                  onClick={onNewTrade}
                  className="mt-4 min-h-[44px] rounded-full bg-[var(--color-tint)] px-5 py-2 text-[15px] font-medium text-[var(--color-on-tint)]"
                >
                  + New trade
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {hasMore && onLoadMore && !filterOpenOnly && (
        <div className="border-t border-[var(--color-separator)] px-4 py-3 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={onLoadMore}
            className="rounded-full border border-[var(--color-separator)] px-5 py-2 text-sm font-medium text-[var(--color-label)] hover:bg-[var(--color-fill)] disabled:opacity-50"
          >
            {loadingMore ? "Loading older trades…" : "Load older trades"}
          </button>
          <p className="mt-1 text-[11px] text-[var(--color-label-tertiary)]">
            Lazy-loaded · keeps page memory down
          </p>
        </div>
      )}
    </div>
  );
}

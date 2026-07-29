"use client";

/**
 * Trade blotter table — ToS-style solid position blocks:
 * - Unselected: solid green/red fill, no cell grid. Only a dark line between positions.
 * - Selected: solid blue fill; horizontal row lines between legs only (no vertical cell outlines).
 */

import type { CSSProperties } from "react";
import type { Trade } from "@/lib/tradeLog";
import { formatQtyEffect } from "@/lib/tradeLog";

const COLUMNS = [
  { key: "exec", label: "Exec time", align: "left" as const },
  { key: "strategy", label: "Strategy", align: "left" as const },
  { key: "side", label: "Side", align: "left" as const },
  { key: "qty", label: "Qty · effect", align: "left" as const },
  { key: "symbol", label: "Symbol", align: "left" as const },
  { key: "exp", label: "Exp", align: "left" as const },
  { key: "strike", label: "Strike", align: "right" as const },
  { key: "type", label: "Type", align: "left" as const },
  { key: "price", label: "Price", align: "right" as const },
  { key: "net", label: "Net", align: "right" as const },
] as const;

/** Ghost multi-leg blocks for empty blotter (full structure, soft type only). */
const SKELETON_BLOCKS: {
  tint: "open" | "close";
  strategy: string;
  exec: string;
  net: string;
  legs: {
    side: string;
    qty: string;
    symbol: string;
    exp: string;
    strike: string;
    type: string;
    price: string;
  }[];
}[] = [
  {
    tint: "open",
    strategy: "BUTTERFLY",
    exec: "—",
    net: "— DEBIT",
    legs: [
      {
        side: "BUY",
        qty: "+1 TO OPEN",
        symbol: "SPX",
        exp: "—",
        strike: "—",
        type: "PUT",
        price: "—",
      },
      {
        side: "SELL",
        qty: "−2 TO OPEN",
        symbol: "SPX",
        exp: "—",
        strike: "—",
        type: "PUT",
        price: "—",
      },
      {
        side: "BUY",
        qty: "+1 TO OPEN",
        symbol: "SPX",
        exp: "—",
        strike: "—",
        type: "PUT",
        price: "—",
      },
    ],
  },
  {
    tint: "close",
    strategy: "BUTTERFLY",
    exec: "—",
    net: "— CREDIT",
    legs: [
      {
        side: "SELL",
        qty: "−1 TO CLOSE",
        symbol: "SPX",
        exp: "—",
        strike: "—",
        type: "PUT",
        price: "—",
      },
      {
        side: "BUY",
        qty: "+2 TO CLOSE",
        symbol: "SPX",
        exp: "—",
        strike: "—",
        type: "PUT",
        price: "—",
      },
      {
        side: "SELL",
        qty: "−1 TO CLOSE",
        symbol: "SPX",
        exp: "—",
        strike: "—",
        type: "PUT",
        price: "—",
      },
    ],
  },
  {
    tint: "open",
    strategy: "VERTICAL",
    exec: "—",
    net: "— DEBIT",
    legs: [
      {
        side: "BUY",
        qty: "+1 TO OPEN",
        symbol: "SPX",
        exp: "—",
        strike: "—",
        type: "CALL",
        price: "—",
      },
      {
        side: "SELL",
        qty: "−1 TO OPEN",
        symbol: "SPX",
        exp: "—",
        strike: "—",
        type: "CALL",
        price: "—",
      },
    ],
  },
];

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

/**
 * Horizontal rules only — never a cell grid.
 * - Between positions (last leg of a block): dark separator.
 * - Inside a selected multi-leg block: row lines between legs (open/close tint).
 * - Unselected internals: none.
 */
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

function TableHead() {
  return (
    <thead className="sticky top-0 z-[1] bg-[var(--color-surface)] shadow-[0_1px_0_var(--color-separator)]">
      <tr className="border-b border-[var(--color-separator)]">
        {COLUMNS.map((c) => (
          <th
            key={c.key}
            className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)] whitespace-nowrap ${
              c.align === "right" ? "text-right" : "text-left"
            }`}
          >
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export default function TradeLogTable({
  trades,
  onSelect,
  selectedId,
  onNewTrade,
}: {
  trades: Trade[];
  onSelect: (t: Trade) => void;
  selectedId?: number | null;
  onNewTrade?: () => void;
}) {
  const empty = trades.length === 0;

  return (
    <div
      className="mt-4 overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.08)]"
      data-testid="trade-log-table"
      data-empty={empty ? "true" : "false"}
      style={
        {
          // Matched to ToS trade history (Coach screenshots)
          ["--blotter-open-bg" as string]: "#0B4A1F",
          ["--blotter-close-bg" as string]: "#8B1A1A",
          ["--blotter-border-open" as string]: "#062E12",
          ["--blotter-border-close" as string]: "#4A0C0C",
          // Dark rule between positions only (not cell chrome)
          ["--blotter-position-rule" as string]: "rgba(0,0,0,0.55)",
          // Selection blue: medium ToS blue
          ["--blotter-select-bg" as string]: "#2A7AB8",
        } as CSSProperties
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-separator)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex items-center gap-3 text-[13px]">
          <span className="font-semibold text-[var(--color-label)]">
            Trade history
          </span>
          <span className="tabular-nums text-[var(--color-label-secondary)]">
            {empty
              ? "0 trades · multi-leg groups"
              : `${trades.length} trade${trades.length === 1 ? "" : "s"}`}
          </span>
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
        <table className="w-full min-w-[960px] border-collapse text-left text-[13px] leading-snug text-[var(--color-label)]">
          <TableHead />
          <tbody>
            {empty
              ? SKELETON_BLOCKS.map((block, bi) => {
                  const kind = block.tint as BlockKind;
                  const bg = rowBg(kind, false);
                  const hasNext = bi < SKELETON_BLOCKS.length - 1;
                  return block.legs.map((leg, i) => {
                    const isLastLeg = i === block.legs.length - 1;
                    const rule = rowRule(kind, false, isLastLeg, hasNext);
                    return (
                      <tr
                        key={`sk-${bi}-${i}`}
                        aria-hidden
                        className="pointer-events-none tabular-nums"
                        style={{ backgroundColor: bg }}
                      >
                        {(
                          [
                            i === 0 ? block.exec : "",
                            i === 0 ? block.strategy : "",
                            leg.side,
                            leg.qty,
                            leg.symbol,
                            leg.exp,
                            leg.strike,
                            leg.type,
                            leg.price,
                            i === 0 ? block.net : "",
                          ] as string[]
                        ).map((content, ci) => (
                          <td
                            key={ci}
                            className={`px-3 py-2 text-white/55 ${ci === 6 || ci === 8 || ci === 9 ? "text-right" : ""} ${ci === 1 || ci === 2 ? "font-semibold" : ""}`}
                            style={{
                              backgroundColor: bg,
                              borderWidth: 0,
                              ...rule,
                            }}
                          >
                            {content}
                          </td>
                        ))}
                      </tr>
                    );
                  });
                })
              : trades.map((trade, ti) => {
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
                  const hasNext = ti < trades.length - 1;
                  const onColor =
                    selected || kind === "open" || kind === "close";
                  const textMain = onColor
                    ? "text-white"
                    : "text-[var(--color-label)]";
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
                        {(
                          [
                            {
                              key: "exec",
                              content:
                                i === 0
                                  ? (trade.exec_at || "")
                                      .replace("T", " ")
                                      .slice(0, 16)
                                  : "",
                              className: `font-medium ${textMain}`,
                            },
                            {
                              key: "strategy",
                              content: i === 0 ? trade.strategy : "",
                              className: `font-semibold ${textMain}`,
                            },
                            {
                              key: "side",
                              content: leg.side || "—",
                              className: sideClass(leg.side, selected, kind),
                            },
                            {
                              key: "qty",
                              content: leg.quantity
                                ? formatQtyEffect(leg as Trade["legs"][0])
                                : "—",
                              className: textMain,
                            },
                            {
                              key: "symbol",
                              content: leg.underlier || leg.symbol || "—",
                              className: `font-medium ${textMain}`,
                            },
                            {
                              key: "exp",
                              content: leg.expiry || "—",
                              className: `whitespace-nowrap ${textMain}`,
                            },
                            {
                              key: "strike",
                              content:
                                leg.strike != null ? String(leg.strike) : "—",
                              className: `text-right font-medium ${textMain}`,
                            },
                            {
                              key: "type",
                              content: leg.right || "—",
                              className: textMain,
                            },
                            {
                              key: "price",
                              content: leg.quantity
                                ? Number(leg.fill_price).toFixed(2)
                                : "—",
                              className: `text-right font-medium ${textMain}`,
                            },
                            {
                              key: "net",
                              content:
                                i === 0 && trade.net_price != null
                                  ? `${trade.net_side === "CREDIT" ? "+" : ""}${Number(trade.net_price).toFixed(2)}${trade.net_side ? ` ${trade.net_side}` : ""}`
                                  : i === 0
                                    ? "—"
                                    : "",
                              className: `text-right font-semibold ${textMain}`,
                            },
                          ] as const
                        ).map((cell) => (
                          <td
                            key={cell.key}
                            className={`px-3 py-2 ${cell.className}`}
                            style={{
                              backgroundColor: bg,
                              borderWidth: 0,
                              ...rule,
                            }}
                          >
                            {cell.content}
                          </td>
                        ))}
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
                Multi-leg fills group by strategy — butterflies show three rows.
                Green = open, red = close. Import a file or log a trade to fill
                the book.
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
    </div>
  );
}

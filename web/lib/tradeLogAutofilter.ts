/** Trade Log Autofilter column readers — host-side, not inside the shared component. */

import { NONE_TOKEN, type ColumnDef, type FilterMap } from "@/lib/autofilter";
import { positionBadge, type Trade } from "@/lib/tradeLog";

export const TL_STATUS = {
  open: "Open",
  complete: "Complete",
  orphan: "Orphan close",
} as const;

export function tradeExecDay(t: Trade): string | null {
  const s = t.exec_at ? String(t.exec_at) : "";
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

export function tradeSymbols(t: Trade): string[] {
  const out: string[] = [];
  for (const l of t.legs || []) {
    const u = (l.underlier || "").trim();
    const s = (l.symbol || "").trim();
    if (u) out.push(u);
    else if (s) out.push(s);
  }
  return out.length ? [...new Set(out)] : [];
}

export function tradeStatus(t: Trade, all: Trade[]): string {
  const b = positionBadge(t, all);
  if (b === "open") return TL_STATUS.open;
  if (b === "complete") return TL_STATUS.complete;
  if (b === "orphan_close") return TL_STATUS.orphan;
  return NONE_TOKEN;
}

/** O2 token = stored code. Empty → (none). */
export function tradeStrategy(t: Trade): string | null {
  const s = (t.strategy || "").trim();
  return s ? s : null;
}

/** O2 — catalog label when present; ValueFilter falls back to the code. */
export function strategyLabelsFromCatalog(
  strategies: { code?: string | null; label?: string | null }[],
): Map<string, string> {
  const m = new Map<string, string>();
  m.set(NONE_TOKEN, "(none)");
  for (const s of strategies) {
    const code = (s.code || "").trim();
    if (!code) continue;
    const label = (s.label || "").trim();
    if (label) m.set(code, label);
  }
  return m;
}

export function tradeLogColumns(all: Trade[]): ColumnDef<Trade>[] {
  return [
    {
      key: "when",
      label: "Exec time",
      type: "date",
      read: (t) => tradeExecDay(t),
    },
    {
      key: "campaign",
      label: "Campaign",
      type: "value",
      read: (t) =>
        t.practice_campaign_id == null ? null : String(t.practice_campaign_id),
    },
    {
      key: "strategy",
      label: "Strategy",
      type: "value",
      read: (t) => tradeStrategy(t),
    },
    {
      key: "symbol",
      label: "Symbol",
      type: "value",
      read: (t) => {
        const xs = tradeSymbols(t);
        return xs.length ? xs : null;
      },
    },
    {
      key: "status",
      label: "Status",
      type: "value",
      read: (t) => {
        const s = tradeStatus(t, all);
        return s === NONE_TOKEN ? null : s;
      },
    },
  ];
}

/** A5 — badge tap and `?campaign=` share this identity. Not a private filter. */
export function campaignColumnFilter(
  prev: FilterMap,
  campaignId: number,
): FilterMap {
  return { ...prev, campaign: [String(campaignId)] };
}

/**
 * REQ-003 picker helpers. Display chrome only — membership/order come from the API.
 * No contract-month table. No production copy of the tagged picker file.
 */

import type {
  ClassChipId,
  GrayReason,
  SymbologyRow,
  UniverseGroup,
} from "./types";
import { CONTINUITY_CAPTION } from "./types";

export type RootChrome = {
  title: string;
  exchange: string;
  badge: string;
  badgeBg: string;
};

/** Layout labels for known roots. Not a symbol list — unknown roots still render. */
const ROOT_CHROME: Record<string, RootChrome> = {
  ES: {
    title: "E-mini S&P 500 Futures",
    exchange: "CME",
    badge: "500",
    badgeBg: "#e53935",
  },
  MES: {
    title: "Micro E-mini S&P 500 Futures",
    exchange: "CME",
    badge: "500",
    badgeBg: "#e53935",
  },
  SPX: {
    title: "S&P 500 Index",
    exchange: "CBOE",
    badge: "500",
    badgeBg: "#1a237e",
  },
  XSP: {
    title: "Mini-SPX Index",
    exchange: "CBOE",
    badge: "50",
    badgeBg: "#1a237e",
  },
};

/** Pair ends shown only when both groups are in this app's universe payload. */
const PAIR_DECLARATIONS: readonly [string, string][] = [
  ["ES", "SPX"],
  ["MES", "XSP"],
];

export function chromeForRoot(root: string): RootChrome {
  const hit = ROOT_CHROME[root];
  if (hit) return hit;
  const badge = root.slice(0, 3) || "?";
  return {
    title: root,
    exchange: "",
    badge,
    badgeBg: "#546e7a",
  };
}

export function rowClass(row: SymbologyRow): ClassChipId | null {
  if (row.type === "root" || row.type === "contract" || row.type === "continuity-alias") {
    return "futures";
  }
  if (row.type === "stock") return "stocks";
  if (row.type === "index" || row.type === "cash") return "indices";
  return null;
}

export function groupMatchesChip(
  group: UniverseGroup,
  chip: ClassChipId,
): boolean {
  if (chip === "all") return true;
  return group.rows.some((row) => rowClass(row) === chip);
}

export function isBangAlias(symbol: string): boolean {
  return /^.+[12]!$/.test(symbol);
}

export function isFrontDialect(symbol: string): boolean {
  if (symbol.endsWith("1!")) return true;
  return symbol.startsWith("/") || symbol.startsWith("@");
}

export function continuityCaptionFor(row: SymbologyRow): string {
  if (row.type !== "continuity-alias") return "";
  if (isFrontDialect(row.symbol)) return CONTINUITY_CAPTION;
  return "";
}

/** TV family children at rest: 1! / 2! then dated long form. Dialects stay in search. */
export function isRestChild(row: SymbologyRow): boolean {
  if (row.type === "contract") return true;
  if (row.type === "continuity-alias" && isBangAlias(row.symbol)) return true;
  return false;
}

export function sortFamilyChildren(rows: SymbologyRow[]): SymbologyRow[] {
  const rank = (row: SymbologyRow): number => {
    if (row.type === "continuity-alias" && row.symbol.endsWith("1!")) return 0;
    if (row.type === "continuity-alias" && row.symbol.endsWith("2!")) return 1;
    if (row.type === "continuity-alias") return 2;
    if (row.type === "contract") return 3;
    return 9;
  };
  return [...rows].sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return rows.indexOf(a) - rows.indexOf(b);
  });
}

export function familyChildren(group: UniverseGroup): SymbologyRow[] {
  return sortFamilyChildren(group.rows.filter(isRestChild));
}

export function groupParent(group: UniverseGroup): SymbologyRow | null {
  return group.rows.find((r) => r.type === "root") || group.rows[0] || null;
}

export function groupIsExpandable(group: UniverseGroup): boolean {
  return familyChildren(group).length > 0;
}

export function rowIsGray(row: SymbologyRow): boolean {
  if (row.gray && row.gray.copy) return true;
  if (row.state && row.state !== "ACTIVE") return true;
  return false;
}

export function rowGrayCopy(row: SymbologyRow): string {
  return row.gray?.copy || "";
}

export function rowBindable(row: SymbologyRow): boolean {
  if (row.type === "root") return false;
  if (row.type === "continuity-alias") return true;
  if (row.type === "contract" || row.type === "index" || row.type === "stock" || row.type === "cash") {
    return true;
  }
  return false;
}

export type PairBadge = {
  declared: string;
  other: string;
  label: string;
  state: string;
  active: boolean;
};

function worstState(rows: SymbologyRow[]): string {
  const rank: Record<string, number> = {
    ACTIVE: 0,
    COMING: 1,
    STALE: 2,
    INELIGIBLE: 3,
  };
  let worst = "COMING";
  let n = -1;
  for (const row of rows) {
    const s = row.state || (row.may_be_active ? "COMING" : "");
    if (!s) continue;
    const r = rank[s] ?? 1;
    if (r > n) {
      n = r;
      worst = s;
    }
  }
  return worst;
}

/** SYM-8: badge only when both declared ends are in this universe payload. */
export function pairBadgesFromUniverse(groups: UniverseGroup[]): PairBadge[] {
  const byRoot = new Map(groups.map((g) => [g.root, g]));
  const out: PairBadge[] = [];
  for (const [a, b] of PAIR_DECLARATIONS) {
    const ga = byRoot.get(a);
    const gb = byRoot.get(b);
    if (!ga || !gb) continue;
    const state = worstState([...ga.rows, ...gb.rows]);
    const active = state === "ACTIVE";
    out.push({
      declared: a,
      other: b,
      label: `${a} → ${b}`,
      state,
      active,
    });
  }
  return out;
}

export function pairBadgeForRoot(
  root: string,
  badges: PairBadge[],
): PairBadge | null {
  return badges.find((p) => p.declared === root || p.other === root) || null;
}

export function groupsFromRows(
  rows: SymbologyRow[],
  order: string[],
): UniverseGroup[] {
  const map = new Map<string, SymbologyRow[]>();
  for (const row of rows) {
    const list = map.get(row.root) || [];
    list.push(row);
    map.set(row.root, list);
  }
  const seen = new Set<string>();
  const groups: UniverseGroup[] = [];
  for (const root of order) {
    const list = map.get(root);
    if (!list) continue;
    groups.push({ root, rows: list });
    seen.add(root);
  }
  for (const [root, list] of map) {
    if (seen.has(root)) continue;
    groups.push({ root, rows: list });
  }
  return groups;
}

export function missRow(q: string, miss: GrayReason): SymbologyRow {
  return {
    type: "index",
    symbol: q,
    root: q,
    roles: [],
    state: null,
    member_visible: true,
    has_chains: false,
    may_be_active: false,
    metadata_ref: null,
    gray: miss,
  };
}

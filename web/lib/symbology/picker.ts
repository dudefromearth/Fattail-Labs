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
  exchange: string;
  badge: string;
  badgeBg: string;
};

/** Layout chrome only (SPEC-13). Titles come from registry display_name. */
const ROOT_CHROME: Record<string, RootChrome> = {
  ES: {
    exchange: "CME",
    badge: "500",
    badgeBg: "#e53935",
  },
  MES: {
    exchange: "CME",
    badge: "500",
    badgeBg: "#e53935",
  },
  SPX: {
    exchange: "CBOE",
    badge: "500",
    badgeBg: "#1a237e",
  },
  XSP: {
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

export function continuityCaptionFor(
  row: SymbologyRow,
  group?: UniverseGroup,
): string {
  if (row.type === "continuity-alias") {
    if (isFrontDialect(row.symbol)) return CONTINUITY_CAPTION;
    return "";
  }
  if (group && row.type === "contract" && group.front && row.symbol === group.front) {
    return CONTINUITY_CAPTION;
  }
  return "";
}

/** TV family children at rest: dated strip only. 1! / 2! are chrome against front/forward. */
export function isRestChild(row: SymbologyRow): boolean {
  return row.type === "contract";
}

export function sortFamilyChildren(
  rows: SymbologyRow[],
  group?: Pick<UniverseGroup, "front" | "forward">,
): SymbologyRow[] {
  const contracts = rows.filter((r) => r.type === "contract");
  if (!group) return contracts;
  const used = new Set<string>();
  const out: SymbologyRow[] = [];
  const take = (sym: string | null | undefined) => {
    if (!sym) return;
    const hit = contracts.find((r) => r.symbol === sym);
    if (hit && !used.has(hit.symbol)) {
      out.push(hit);
      used.add(hit.symbol);
    }
  };
  take(group.front);
  take(group.forward);
  for (const row of contracts) {
    if (used.has(row.symbol)) continue;
    out.push(row);
  }
  return out;
}

export function familyChildren(group: UniverseGroup): SymbologyRow[] {
  return sortFamilyChildren(group.rows.filter(isRestChild), group);
}

export function stripRoleFor(
  row: SymbologyRow,
  group: UniverseGroup,
): "front" | "forward" | null {
  if (row.type !== "contract") return null;
  if (group.front && row.symbol === group.front) return "front";
  if (group.forward && row.symbol === group.forward) return "forward";
  return null;
}

export function aliasAgainst(row: SymbologyRow, group: UniverseGroup): string | null {
  const role = stripRoleFor(row, group);
  if (role === "front") return `${group.root}1!`;
  if (role === "forward") return `${group.root}2!`;
  return null;
}

export function searchChildren(group: UniverseGroup, query: string): SymbologyRow[] {
  const q = query.trim();
  const kids = familyChildren(group);
  const dialects = group.rows.filter((r) => {
    if (r.type !== "continuity-alias" || isBangAlias(r.symbol)) return false;
    return q === r.symbol || q.toUpperCase() === r.symbol.toUpperCase();
  });
  return [...kids, ...dialects];
}

export function groupSearchRank(group: UniverseGroup, query: string): number {
  const q = query.trim().toUpperCase();
  if (!q) return 1;
  const prefix = group.rows.some((r) => r.symbol.toUpperCase().startsWith(q));
  return prefix ? 0 : 1;
}

export function rankSearchGroups(
  groups: UniverseGroup[],
  query: string,
): UniverseGroup[] {
  return [...groups].sort((a, b) => {
    const d = groupSearchRank(a, query) - groupSearchRank(b, query);
    if (d !== 0) return d;
    return groups.indexOf(a) - groups.indexOf(b);
  });
}

export function attachStripPointers(
  groups: UniverseGroup[],
  universe: { groups: UniverseGroup[] } | null,
): UniverseGroup[] {
  if (!universe) return groups;
  const byRoot = new Map(universe.groups.map((g) => [g.root, g]));
  return groups.map((g) => {
    const src = byRoot.get(g.root);
    if (!src) return g;
    const have = new Set(g.rows.map((r) => r.symbol));
    const parent = src.rows.find((r) => r.type === "root");
    const rows = parent && !have.has(parent.symbol) ? [parent, ...g.rows] : [...g.rows];
    return {
      ...g,
      front: g.front ?? src.front,
      forward: g.forward ?? src.forward,
      rows: rows.map((r) => {
        if (r.display_name) return r;
        const hit = src.rows.find((s) => s.symbol === r.symbol);
        return hit?.display_name ? { ...r, display_name: hit.display_name } : r;
      }),
    };
  });
}

export type HighlightPart = { text: string; hit: boolean };

export function splitHighlight(text: string, query: string): HighlightPart[] {
  const q = query.trim();
  if (!q || !text) return [{ text, hit: false }];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: HighlightPart[] = [];
  let i = 0;
  while (i < text.length) {
    const j = lower.indexOf(needle, i);
    if (j < 0) {
      parts.push({ text: text.slice(i), hit: false });
      break;
    }
    if (j > i) parts.push({ text: text.slice(i, j), hit: false });
    parts.push({ text: text.slice(j, j + needle.length), hit: true });
    i = j + needle.length;
    if (!needle.length) break;
  }
  return parts;
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

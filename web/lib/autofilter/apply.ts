import {
  NONE_TOKEN,
  type ColumnDef,
  type DateWindow,
  type FilterMap,
  type FilterResult,
  type Incompatibility,
  type SelectionGate,
} from "./types";

export function cellValues<R>(row: R, col: ColumnDef<R>): string[] {
  const v = col.read(row);
  if (v == null || v === "") return [NONE_TOKEN];
  const xs = Array.isArray(v) ? v : [v];
  const out = xs.map((x) => (x == null || x === "" ? NONE_TOKEN : String(x)));
  return out.length ? out : [NONE_TOKEN];
}

export function cellValue<R>(row: R, col: ColumnDef<R>): string {
  return cellValues(row, col)[0] ?? NONE_TOKEN;
}

export function filtersActive(filters: FilterMap): boolean {
  return Object.values(filters).some((xs) => !!xs && xs.length > 0);
}

export function applyAutofilter<R>(
  rows: R[],
  cols: ColumnDef<R>[],
  filters: FilterMap,
): FilterResult<R> {
  const total = rows.length;
  const filterOn = filtersActive(filters);
  if (!filterOn) {
    return { rows, shown: total, total, filterOn: false };
  }
  const next = rows.filter((row) =>
    cols.every((col) => {
      const want = filters[col.key];
      if (!want || want.length === 0) return true;
      const have = cellValues(row, col);
      return want.some((w) => have.includes(w));
    }),
  );
  return { rows: next, shown: next.length, total, filterOn: true };
}

export function filterOnLabel(shown: number, total: number): string {
  return `Filter on — ${shown}/${total}`;
}

export const NOTHING_MATCHED =
  "Nothing matched. Clear filters to see the full set.";

/** Empty-but-valid (A8): combination could have matched; it just didn't. */
export function emptyValidCopy(shown: number, filterOn: boolean): string | null {
  if (!filterOn || shown > 0) return null;
  return NOTHING_MATCHED;
}

/**
 * O3 select-time: grey out a value only when the resulting combination is
 * *structurally* impossible (incompatibility). Zero rows without that
 * predicate is empty-but-valid, not a conflict.
 */
export function selectionGate(
  filters: FilterMap,
  colKey: string,
  value: string,
  incompatibility?: Incompatibility,
): SelectionGate {
  const prev = filters[colKey];
  const nextPicks = prev && prev.length ? [...prev] : [];
  if (!nextPicks.includes(value)) nextPicks.push(value);
  const next: FilterMap = { ...filters, [colKey]: nextPicks };
  const reason = incompatibility?.(next) ?? null;
  if (reason) return { disabled: true, reason };
  return { disabled: false, reason: null };
}

function ymd(s: string | null | undefined): string {
  if (!s) return "";
  const t = String(s);
  return /^\d{4}-\d{2}-\d{2}/.test(t) ? t.slice(0, 10) : "";
}

function dayInWindow(day: string, w: DateWindow): boolean {
  const d = ymd(day);
  if (!d) return false;
  const start = ymd(w.start);
  const end = ymd(w.end);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}

/**
 * Structural conflict: selected calendar days sit entirely outside every
 * selected dated window (e.g. campaign charter). `none` has no window and
 * does not participate. Used as an Incompatibility.
 */
export function dateVsWindowsConflict(
  dateKey: string,
  windowKey: string,
  windows: DateWindow[],
): Incompatibility {
  const byId = new Map(windows.map((w) => [w.id, w]));
  return (filters: FilterMap) => {
    const days = (filters[dateKey] || []).map(ymd).filter(Boolean);
    const ids = (filters[windowKey] || []).filter((id) => id && id !== NONE_TOKEN);
    if (days.length === 0 || ids.length === 0) return null;
    const wins = ids
      .map((id) => byId.get(id))
      .filter((w): w is DateWindow => !!w);
    if (wins.length === 0) return null;
    const anyOverlap = days.some((d) => wins.some((w) => dayInWindow(d, w)));
    if (anyOverlap) return null;
    return "Those dates sit outside the selected campaign window.";
  };
}

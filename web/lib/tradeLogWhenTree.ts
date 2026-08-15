/**
 * Find and tag When AutoFilter — calendar hierarchy.
 * Years, then months, then days. Days stay collapsed until a month opens.
 */

export type WhenMonth = { ym: string; label: string; days: string[] };
export type WhenYear = { year: string; months: WhenMonth[] };

const MONTH_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ymdOf(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = String(iso);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : "";
}

export function monthLong(ym: string): string {
  const n = Number(ym.slice(5, 7));
  return MONTH_LONG[n - 1] || ym;
}

export function buildWhenTree(days: string[]): WhenYear[] {
  const byYear = new Map<string, Map<string, string[]>>();
  const unique = [...new Set(days.map(ymdOf).filter(Boolean))].sort((a, b) =>
    b.localeCompare(a),
  );
  for (const d of unique) {
    const y = d.slice(0, 4);
    const ym = d.slice(0, 7);
    let months = byYear.get(y);
    if (!months) {
      months = new Map();
      byYear.set(y, months);
    }
    let bucket = months.get(ym);
    if (!bucket) {
      bucket = [];
      months.set(ym, bucket);
    }
    bucket.push(d);
  }
  return [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([ym, ds]) => ({
          ym,
          label: monthLong(ym),
          days: [...ds].sort((a, b) => b.localeCompare(a)),
        })),
    }));
}

/** One year → months open, days shut. Several years → years shut. */
export function defaultExpandedYears(tree: WhenYear[]): Set<string> {
  if (tree.length === 1) return new Set([tree[0].year]);
  return new Set();
}

export function allDaysOf(tree: WhenYear[]): string[] {
  return tree.flatMap((y) => y.months.flatMap((m) => m.days));
}

export function triState(
  picked: Set<string>,
  days: string[],
): "all" | "some" | "none" {
  if (days.length === 0) return "none";
  let n = 0;
  for (const d of days) if (picked.has(d)) n += 1;
  if (n === 0) return "none";
  if (n === days.length) return "all";
  return "some";
}

export function compactWhen(
  selected: string[] | undefined,
  allDays: string[],
): { years?: string; months?: string; days?: string } {
  if (!selected || selected.length === 0) return {};
  const picked = new Set(selected.map(ymdOf).filter(Boolean));
  const tree = buildWhenTree(allDays);
  const universe = allDaysOf(tree);
  if (universe.length > 0 && universe.every((d) => picked.has(d))) return {};
  const years: string[] = [];
  const months: string[] = [];
  const days: string[] = [];
  for (const y of tree) {
    const yDays = y.months.flatMap((m) => m.days);
    if (yDays.length > 0 && yDays.every((d) => picked.has(d))) {
      years.push(y.year);
      continue;
    }
    for (const m of y.months) {
      if (m.days.length > 0 && m.days.every((d) => picked.has(d))) {
        months.push(m.ym);
      } else {
        for (const d of m.days) if (picked.has(d)) days.push(d);
      }
    }
  }
  const out: { years?: string; months?: string; days?: string } = {};
  if (years.length) out.years = years.join(",");
  if (months.length) out.months = months.join(",");
  if (days.length) out.days = days.join(",");
  return out;
}

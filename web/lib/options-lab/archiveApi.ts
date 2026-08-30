/**
 * Labs archive proxy client. Browser never calls StudioOne.
 * Coverage · index · levelled fetch. Not algo-replay. Not the retired 1-minute walk.
 */

export type ArchiveCoverageDay = {
  date: string;
  status: string;
  books?: Array<{ count?: number; status?: string }>;
};

export type ArchiveCoverageDoc = {
  days?: ArchiveCoverageDay[];
  unreachable?: boolean;
  error?: string;
  store_missing?: boolean;
};

export type ArchiveSnap = {
  captured_at?: string;
  expiration?: string;
  symbol?: string;
  generation?: {
    spot?: number | null;
    as_of?: string;
    content_hash?: string;
  };
  _file?: string;
  _index?: number;
  hole?: string | null;
};

export type ArchiveFetchDoc = {
  day?: string;
  symbol?: string;
  expiration?: string | null;
  level?: number;
  hash?: string;
  count_on_disk?: number;
  returned?: number;
  snaps?: ArchiveSnap[];
  hole?: string | null;
  error?: string;
  S?: number;
  k?: number;
  next_index?: number | null;
};

export type ArchiveGet = (
  url: string,
  signal?: AbortSignal,
) => Promise<{ status: number; body: unknown }>;

export async function defaultArchiveGet(
  url: string,
  signal?: AbortSignal,
): Promise<{ status: number; body: unknown }> {
  const r = await fetch(url, { credentials: "same-origin", signal });
  let body: unknown = null;
  try {
    body = await r.json();
  } catch {
    body = null;
  }
  return { status: r.status, body };
}

function qs(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.join("&");
}

export function coverageUrl(
  symbol: string,
  from?: string,
  to?: string,
): string {
  return `/api/me/options-lab/archive/coverage?${qs({
    symbols: symbol,
    from,
    to,
  })}`;
}

export function indexUrl(day: string, symbol: string): string {
  return `/api/me/options-lab/archive/index?${qs({ day, symbol })}`;
}

export function marksUrl(opts: {
  day: string;
  t: string;
  symbols?: string;
}): string {
  return `/api/me/options-lab/archive/marks?${qs({
    day: opts.day,
    t: opts.t,
    symbols: opts.symbols ?? "VIX",
  })}`;
}

export function fetchUrl(opts: {
  day: string;
  symbol: string;
  level: number;
  dayHash?: string;
  fromIndex?: number;
  from?: string;
  to?: string;
}): string {
  return `/api/me/options-lab/archive/fetch?${qs({
    day: opts.day,
    symbol: opts.symbol,
    level: opts.level,
    day_hash: opts.dayHash,
    from_index: opts.fromIndex,
    from: opts.from,
    to: opts.to,
  })}`;
}

export function dayIsCovered(row: ArchiveCoverageDay | undefined): boolean {
  if (!row) return false;
  if (row.status === "none" || row.status === "not_today") return false;
  const books = row.books ?? [];
  return books.some((b) => (b.count ?? 0) > 0);
}

export function coverageFlagsFromDoc(
  doc: ArchiveCoverageDoc | null,
): Map<string, boolean> {
  const out = new Map<string, boolean>();
  if (!doc || doc.unreachable || doc.store_missing) return out;
  for (const row of doc.days ?? []) {
    if (!row.date) continue;
    out.set(row.date, dayIsCovered(row));
  }
  return out;
}

export function coveredDatesFromDoc(doc: ArchiveCoverageDoc | null): Set<string> {
  const out = new Set<string>();
  for (const [day, on] of coverageFlagsFromDoc(doc)) {
    if (on) out.add(day);
  }
  return out;
}

/** A14.6–9 generation-keyed client cache. Honesty outranks speed. Survives refresh. */

export type GenPayload = {
  profile_generation_id?: string | null;
  parameter_set_hash?: string | null;
  named_state?: string | null;
  bars?: unknown;
  bins?: unknown;
  [k: string]: unknown;
};

export type CacheEntry = {
  url: string;
  etag: string | null;
  generation: string | null;
  body: GenPayload;
  at: number;
};

export type FetchGenResult = {
  body: GenPayload | null;
  fromCache: boolean;
  stale: boolean;
  status: number;
  ms: number;
  etag: string | null;
};

const mem = new Map<string, CacheEntry>();
const LS_KEY = "ft_sa_delivery_v1";
const LS_MAX = 48;
let hydrated = false;

/** Every hop sends If-None-Match. Unchanged generation → 304. Pin lives in DEV-API.md. */

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    const rows = [...mem.values()].sort((a, b) => b.at - a.at).slice(0, LS_MAX);
    window.localStorage.setItem(LS_KEY, JSON.stringify(rows));
  } catch {
    /* quota */
  }
}

export function hydrateCache(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    const rows = JSON.parse(raw) as CacheEntry[];
    for (const e of rows) {
      if (e?.url && e.body) mem.set(e.url, e);
    }
  } catch {
    /* ignore */
  }
}

export function generationOf(body: GenPayload | null | undefined): string | null {
  if (!body) return null;
  const g = body.profile_generation_id || body.parameter_set_hash;
  return g ? String(g) : null;
}

export function peek(url: string): CacheEntry | null {
  hydrateCache();
  return mem.get(url) || null;
}

export function put(url: string, body: GenPayload, etag: string | null): CacheEntry {
  const entry: CacheEntry = {
    url,
    etag,
    generation: generationOf(body),
    body,
    at: Date.now(),
  };
  mem.set(url, entry);
  persist();
  return entry;
}

export function bustSource(source: string): void {
  const needle = source.toUpperCase();
  for (const [k] of mem) {
    if (k.toUpperCase().includes(`/${needle}?`) || k.toUpperCase().includes(`source=${needle}`)) {
      mem.delete(k);
    }
  }
  persist();
}

async function network(
  url: string,
  hit: CacheEntry | undefined,
  signal?: AbortSignal,
): Promise<FetchGenResult> {
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const headers: Record<string, string> = {};
  if (hit?.etag) headers["If-None-Match"] = hit.etag;
  let r: Response;
  try {
    r = await fetch(url, {
      credentials: "same-origin",
      cache: "no-cache",
      headers,
      signal,
    });
  } catch (e) {
    if (signal?.aborted) {
      // Superseded by a newer request for a different window — not a
      // failure, just no longer wanted. Caller sees an empty result and
      // silently skips it (see SaPriceChart run()'s bins.length check).
      return { body: null, fromCache: false, stale: false, status: 0, ms: 0, etag: null };
    }
    throw e;
  }
  const ms =
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  if (r.status === 304 && hit) {
    return {
      body: hit.body,
      fromCache: true,
      stale: false,
      status: 304,
      ms,
      etag: hit.etag,
    };
  }
  if (!r.ok) {
    // Never fail silently (VP-L18 elegant-failure doctrine) — a 4xx/5xx here
    // used to vanish into a normally-resolved result with body:null, which
    // is why an interval switch could look like "nothing happened."
    console.error(`[saDelivery] ${r.status} ${url}`);
    if (hit) {
      return {
        body: hit.body,
        fromCache: true,
        stale: true,
        status: r.status,
        ms,
        etag: hit.etag,
      };
    }
    return { body: null, fromCache: false, stale: false, status: r.status, ms, etag: null };
  }
  const body = (await r.json()) as GenPayload;
  const etag = r.headers.get("etag");
  put(url, body, etag);
  return {
    body,
    fromCache: false,
    stale: false,
    status: r.status,
    ms,
    etag,
  };
}

/** Await the network hop. Use for OHLC when stale cache would hide history (REQ-001). */
const inflightByUrl = new Map<string, Promise<FetchGenResult>>();
const controllerByUrl = new Map<string, AbortController>();

/**
 * Cancel an in-flight fetchGenWait for this exact URL, if any. Use when a
 * newer request has superseded it — e.g. the chart's window settled on a
 * different range. Without this, a stale request keeps burning real CPU
 * on the server for a result nobody wants anymore, which was stacking up
 * under concurrent load and starving the request that actually mattered.
 */
export function abortFetchGenWait(url: string): void {
  controllerByUrl.get(url)?.abort();
}

export async function fetchGenWait(url: string): Promise<FetchGenResult> {
  hydrateCache();
  // Multiple call sites (interval switch, pan, settings change, live-regen)
  // can each independently decide "fetch this window" for the identical
  // URL within the same tick — up to ~20 duplicate requests observed for
  // one window. Coalesce by URL: callers racing for the same in-flight
  // request share its result instead of each opening a new connection.
  const existing = inflightByUrl.get(url);
  if (existing) return existing;
  const controller = new AbortController();
  controllerByUrl.set(url, controller);
  // Do not send If-None-Match — a 304 would re-apply a short cached series (REQ-001).
  const p = network(url, undefined, controller.signal).finally(() => {
    inflightByUrl.delete(url);
    controllerByUrl.delete(url);
  });
  inflightByUrl.set(url, p);
  return p;
}

function bandKeyOf(url: string): string {
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://x");
    return `${u.pathname}?source=${u.searchParams.get("source") || ""}`;
  } catch {
    return url;
  }
}

const currentUrlByBand = new Map<string, string>();

/**
 * Exclusive per-(source,target) VP window fetch: when a caller asks for a
 * different URL than whatever was last requested for this band, the older
 * one is aborted first. Each effect remount gets its own fresh in-effect
 * flight tracker (flightRef), so one remount has no way to know a *prior*
 * remount's request for a since-abandoned window is still running — they
 * were piling up as independent StudioOne requests, several genuinely
 * different (not just duplicate) wide/expensive windows deep, starving the
 * one request that actually mattered under concurrent load. This tracker
 * lives above any single effect instance so it catches that case too.
 */
export function fetchWindowExclusive(url: string): Promise<FetchGenResult> {
  const key = bandKeyOf(url);
  const prev = currentUrlByBand.get(key);
  if (prev && prev !== url) abortFetchGenWait(prev);
  currentUrlByBand.set(key, url);
  return fetchGenWait(url);
}

export function ohlcSpanDays(bars: { t?: number }[] | undefined): number {
  if (!bars || bars.length < 2) return 0;
  const a = Number(bars[0].t);
  const b = Number(bars[bars.length - 1].t);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  const ms = b > 1e12 ? b - a : (b - a) * 1000;
  return ms / 86400000;
}

export async function fetchGen(url: string): Promise<FetchGenResult> {
  hydrateCache();
  const hit = mem.get(url);
  if (hit) {
    void network(url, hit).catch(() => undefined);
    return {
      body: hit.body,
      fromCache: true,
      stale: false,
      status: 200,
      ms: 0,
      etag: hit.etag,
    };
  }
  try {
    return await network(url, undefined);
  } catch {
    return { body: null, fromCache: false, stale: false, status: 0, ms: 0, etag: null };
  }
}

export function prefetch(url: string): void {
  hydrateCache();
  if (mem.has(url)) return;
  void fetchGen(url);
}

export function cacheSize(): number {
  return mem.size;
}

export function _resetCacheForTests(): void {
  mem.clear();
  hydrated = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }
}

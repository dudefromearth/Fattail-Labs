/**
 * LIM ghost trail — Spec v0.4.3 LIM19–22 · LIM33 · E13.
 *
 * Fixed-interval emission of (xUnclamped, y). Injected now(). No calendar.
 * Session trigger (G1): leading YYYY-MM-DD of ctx.asOf as written.
 */

export const LIM_TRAIL_GHOST_SIZE = 1;

export type LimTrailNow = () => number;

export type LimTrailIdentity = {
  symbol: string;
  expiration: string;
  asOf: string | null;
};

export type LimTrailSample = {
  xUnclamped: number;
  y: number;
};

export type LimTrailGhost = {
  xUnclamped: number;
  y: number;
  t: number;
  size: number;
  opacity: number;
};

export type LimTrailOptions = {
  intervalS: number;
  windowMin: number;
  now: LimTrailNow;
};

export type LimTransitionHint = {
  boundary: "x0" | "y50" | null;
  etaMin: number | null;
};

const ISO_DAY = /^(\d{4}-\d{2}-\d{2})/;

/** G1: date the stamp already wrote. Prefix only. */
export function tradingDateFromAsOf(asOf: string | null | undefined): string | null {
  if (asOf == null) return null;
  const s = String(asOf).trim();
  const m = ISO_DAY.exec(s);
  return m ? m[1] : null;
}

function identityChanged(
  prev: LimTrailIdentity | null,
  next: LimTrailIdentity,
): boolean {
  if (prev == null) return false;
  if (prev.symbol !== next.symbol) return true;
  if (prev.expiration !== next.expiration) return true;
  return tradingDateFromAsOf(prev.asOf) !== tradingDateFromAsOf(next.asOf);
}

function clamp01(n: number): number {
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

export class LimTrail {
  private readonly intervalMs: number;
  private readonly windowMs: number;
  private readonly now: LimTrailNow;
  private buf: Array<{ xUnclamped: number; y: number; t: number }> = [];
  private identity: LimTrailIdentity | null = null;
  private lastEmitAt: number | null = null;

  constructor(opts: LimTrailOptions) {
    if (typeof opts.now !== "function") {
      throw new Error("limTrail requires a now() supplier");
    }
    if (!(opts.intervalS > 0) || !(opts.windowMin > 0)) {
      throw new Error("limTrail intervalS and windowMin must be > 0");
    }
    this.intervalMs = opts.intervalS * 1000;
    this.windowMs = opts.windowMin * 60 * 1000;
    this.now = opts.now;
  }

  clear(): void {
    this.buf = [];
    this.lastEmitAt = null;
  }

  observe(sample: LimTrailSample, identity: LimTrailIdentity): LimTrailGhost[] {
    if (identityChanged(this.identity, identity)) {
      this.clear();
      this.identity = identity;
      this.lastEmitAt = this.now();
      return [];
    }
    this.identity = identity;
    const n = this.now();
    if (this.lastEmitAt == null) {
      this.lastEmitAt = n;
    } else if (n - this.lastEmitAt >= this.intervalMs) {
      this.buf.push({
        xUnclamped: sample.xUnclamped,
        y: sample.y,
        t: n,
      });
      this.lastEmitAt = n;
    }
    this.prune(n);
    return this.ghostsAt(n);
  }

  ghosts(): LimTrailGhost[] {
    return this.ghostsAt(this.now());
  }

  private prune(n: number): void {
    const cutoff = n - this.windowMs;
    if (this.buf.length === 0) return;
    let i = 0;
    while (i < this.buf.length && this.buf[i].t < cutoff) i++;
    if (i > 0) this.buf = this.buf.slice(i);
  }

  private ghostsAt(n: number): LimTrailGhost[] {
    const w = this.windowMs;
    const out: LimTrailGhost[] = [];
    for (const p of this.buf) {
      const age = n - p.t;
      if (age > w) continue;
      out.push({
        xUnclamped: p.xUnclamped,
        y: p.y,
        t: p.t,
        size: LIM_TRAIL_GHOST_SIZE,
        opacity: clamp01(1 - age / w),
      });
    }
    return out;
  }
}

export function createLimTrail(opts: LimTrailOptions): LimTrail {
  return new LimTrail(opts);
}

/** LIM22 — diagnostic only. Returns null when the flag is off. No chrome. */
export function computeLimTransition(opts: {
  show: boolean;
  ghosts: readonly LimTrailGhost[];
  driftMinRate: number;
}): LimTransitionHint | null {
  if (!opts.show) return null;
  const g = opts.ghosts;
  if (g.length < 2) return { boundary: null, etaMin: null };
  const a = g[g.length - 2];
  const b = g[g.length - 1];
  const dtMin = (b.t - a.t) / 60_000;
  if (!(dtMin > 0)) return { boundary: null, etaMin: null };
  const dx = b.xUnclamped - a.xUnclamped;
  const dy = b.y - a.y;
  const speed = Math.hypot(dx, dy) / dtMin;
  if (!(speed >= opts.driftMinRate)) return { boundary: null, etaMin: null };
  if (b.xUnclamped !== 0 && dx * b.xUnclamped < 0) {
    return { boundary: "x0", etaMin: Math.abs(b.xUnclamped) / Math.abs(dx / dtMin) };
  }
  if (b.y !== 50 && dy * (b.y - 50) < 0) {
    return { boundary: "y50", etaMin: Math.abs(b.y - 50) / Math.abs(dy / dtMin) };
  }
  return { boundary: null, etaMin: null };
}

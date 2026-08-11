/**
 * Smooth real-time display — lerp targets instead of hard jumps.
 * Used for spot labels, GEX bar magnitudes, risk-graph spot line.
 */

"use client";

import { useEffect, useRef, useState } from "react";

export type SmoothOpts = {
  /** Animation duration (ms). Default 380. */
  durationMs?: number;
  /** Disable and snap immediately. */
  enabled?: boolean;
  /** Absolute epsilon to treat as equal. */
  epsilon?: number;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animate a single number toward `target` with ease-out.
 * Returns null while target is null/undefined/non-finite.
 */
export function useSmoothNumber(
  target: number | null | undefined,
  opts: SmoothOpts = {},
): number | null {
  const durationMs = opts.durationMs ?? 380;
  const enabled = opts.enabled !== false;
  const epsilon = opts.epsilon ?? 1e-9;

  const [display, setDisplay] = useState<number | null>(() =>
    target != null && Number.isFinite(target) ? target : null,
  );
  const displayRef = useRef(display);
  const rafRef = useRef(0);
  const animRef = useRef<{
    from: number;
    to: number;
    start: number;
  } | null>(null);

  useEffect(() => {
    if (target == null || !Number.isFinite(target)) {
      displayRef.current = null;
      setDisplay(null);
      animRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    if (!enabled) {
      displayRef.current = target;
      setDisplay(target);
      animRef.current = null;
      return;
    }

    const from =
      displayRef.current != null && Number.isFinite(displayRef.current)
        ? displayRef.current
        : target;

    if (Math.abs(from - target) <= epsilon) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    // Retarget mid-flight from current displayed value
    animRef.current = {
      from,
      to: target,
      start: performance.now(),
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const a = animRef.current;
      if (!a) return;
      // If target changed, outer effect restarts; this frame still uses current a
      const t = Math.min(1, (now - a.start) / durationMs);
      const v = a.from + (a.to - a.from) * easeOutCubic(t);
      displayRef.current = v;
      setDisplay(v);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        displayRef.current = a.to;
        setDisplay(a.to);
        animRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, enabled, epsilon]);

  return display;
}

/**
 * Smooth a map of numeric values (e.g. GEX per strike:key).
 * Missing keys fall out; new keys start at target (or 0 if preferred).
 */
export function useSmoothNumberMap(
  targets: Record<string, number>,
  opts: SmoothOpts & { startAtZero?: boolean } = {},
): Record<string, number> {
  const durationMs = opts.durationMs ?? 380;
  const enabled = opts.enabled !== false;
  const epsilon = opts.epsilon ?? 1e-12;
  const startAtZero = opts.startAtZero === true;

  const [display, setDisplay] = useState<Record<string, number>>(() => ({
    ...targets,
  }));
  const displayRef = useRef(display);
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const fromRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) {
      displayRef.current = { ...targets };
      setDisplay({ ...targets });
      return;
    }

    const from: Record<string, number> = {};
    const keys = new Set([
      ...Object.keys(displayRef.current),
      ...Object.keys(targets),
    ]);
    for (const k of keys) {
      const cur = displayRef.current[k];
      const tgt = targets[k];
      if (tgt == null) continue; // drop missing
      if (cur == null || !Number.isFinite(cur)) {
        from[k] = startAtZero ? 0 : tgt;
      } else {
        from[k] = cur;
      }
    }
    fromRef.current = from;
    startRef.current = performance.now();

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / durationMs);
      const e = easeOutCubic(t);
      const next: Record<string, number> = {};
      const tg = targetsRef.current;
      let moving = false;
      for (const k of Object.keys(tg)) {
        const f = fromRef.current[k] ?? (startAtZero ? 0 : tg[k]);
        const to = tg[k];
        if (!Number.isFinite(to)) continue;
        const v = f + (to - f) * e;
        next[k] = v;
        if (Math.abs(to - v) > epsilon) moving = true;
      }
      // Snap at end
      if (t >= 1) {
        for (const k of Object.keys(tg)) {
          if (Number.isFinite(tg[k])) next[k] = tg[k];
        }
      }
      displayRef.current = next;
      setDisplay(next);
      if (t < 1 && moving) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targets, durationMs, enabled, epsilon, startAtZero]);

  return display;
}

/** Stable fingerprint so map targets only re-animate when values change. */
export function fingerprintNumberMap(m: Record<string, number>): string {
  return Object.keys(m)
    .sort()
    .map((k) => `${k}:${m[k].toFixed(6)}`)
    .join("|");
}

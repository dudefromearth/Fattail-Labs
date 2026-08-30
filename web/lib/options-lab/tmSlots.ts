/**
 * Time Machine occupancy — TMI-79 v0.7.4.
 * Two browser slots, one playhead. Occupancy is today + archive, not one date.
 *
 * Today: always capturing. Dies on OPF trading-date change only (TMI-73).
 * Archive: at most one past day. W5 fills it from StudioOne.
 */

import { nyYmd } from "./algoDayReplay";

export const TM_HOLE_NO_DATE = "NO DATE" as const;

export type TmTodayGen = {
  t_ms: number;
  asOf: string;
  contentHash: string;
  spot: number | null;
  symbol: string;
  expiration: string;
  /** Snap filename — TAP RESTART twins share t_ms. */
  file?: string;
};

export function todayGensAsSamples(
  gens: readonly TmTodayGen[],
): { t_ms: number; spot: number }[] {
  return gens
    .filter((g) => g.spot != null && g.spot > 0)
    .map((g) => ({ t_ms: g.t_ms, spot: g.spot as number }));
}

export type TmTodaySlot = {
  tradingDate: string;
  symbol: string;
  gens: TmTodayGen[];
};

export type TmArchiveSlot = {
  day: string;
  gens: TmTodayGen[];
};

export type TmProjector = "live" | "today" | "archive";

export type TmPlayhead = {
  t_ms: number | null;
  projector: TmProjector;
};

type TmState = {
  today: TmTodaySlot | null;
  archive: TmArchiveSlot | null;
  playhead: TmPlayhead;
  hole: typeof TM_HOLE_NO_DATE | null;
};

const boot: TmState = {
  today: null,
  archive: null,
  playhead: { t_ms: null, projector: "live" },
  hole: null,
};

const state: TmState =
  typeof window !== "undefined" &&
  (window as Window & { __tmSlots?: TmState }).__tmSlots
    ? (window as Window & { __tmSlots: TmState }).__tmSlots
    : boot;

if (typeof window !== "undefined") {
  (window as Window & { __tmSlots?: TmState }).__tmSlots = state;
}

const listeners: Set<() => void> =
  typeof window !== "undefined" &&
  (window as Window & { __tmSlotListeners?: Set<() => void> }).__tmSlotListeners
    ? (window as Window & { __tmSlotListeners: Set<() => void> })
        .__tmSlotListeners
    : new Set();
if (typeof window !== "undefined") {
  (window as Window & { __tmSlotListeners?: Set<() => void> }).__tmSlotListeners =
    listeners;
}

function emit(): void {
  if (typeof window !== "undefined") {
    const w = window as Window & { __tmLog?: TmOccupancyDigest[] };
    if (Array.isArray(w.__tmLog)) w.__tmLog.push(occupancyDigest());
  }
  for (const fn of listeners) fn();
}

export function subscribeTmSlots(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getTmSlots(): Readonly<TmState> {
  return state;
}

/** NY calendar date of an OPF as_of. Not the browser clock. */
export function tradingDateFromAsOf(asOf: string | null | undefined): string | null {
  if (!asOf || !String(asOf).trim()) return null;
  const ms = Date.parse(asOf);
  if (!Number.isFinite(ms)) return null;
  return nyYmd(ms);
}

export function captureToday(gen: TmTodayGen): typeof TM_HOLE_NO_DATE | null {
  const tradingDate = tradingDateFromAsOf(gen.asOf);
  if (!tradingDate) {
    state.hole = TM_HOLE_NO_DATE;
    emit();
    return TM_HOLE_NO_DATE;
  }
  state.hole = null;
  const cur = state.today;
  if (cur && (cur.tradingDate !== tradingDate || cur.symbol !== gen.symbol)) {
    // TMI-73 / ATM-C2: discard today before accepting a different session.
    state.today = { tradingDate, symbol: gen.symbol, gens: [gen] };
    emit();
    return null;
  }
  if (!cur) {
    state.today = { tradingDate, symbol: gen.symbol, gens: [gen] };
    emit();
    return null;
  }
  const hit = cur.gens.findIndex((g) => g.contentHash === gen.contentHash);
  if (hit >= 0) {
    cur.gens[hit] = gen;
  } else {
    cur.gens.push(gen);
  }
  cur.gens.sort((a, b) => a.t_ms - b.t_ms);
  emit();
  return null;
}

export type TmOccupancyDigest = {
  todayCount: number;
  todayHashes: string[];
  todayLastT: number | null;
  archiveDay: string | null;
  archiveCount: number;
  projector: TmProjector;
};

export function genAtPlayhead(): TmTodayGen | null {
  const { playhead, today, archive } = state;
  if (playhead.projector === "live" || playhead.t_ms == null) return null;
  const gens =
    playhead.projector === "archive" ? archive?.gens ?? [] : today?.gens ?? [];
  if (!gens.length) return null;
  let best = gens[0];
  for (const g of gens) {
    if (g.t_ms <= playhead.t_ms) best = g;
    else break;
  }
  return best;
}

/** First print of the held archive day (TMI-89). Never “from the open.” */
export function formatHoldHorizon(nowMs: number = Date.now()): {
  line: string;
  fromMs: number | null;
} {
  void nowMs;
  const gens = state.archive?.gens ?? [];
  if (!gens.length) {
    return {
      line: "Raise a day to hold what the archive has.",
      fromMs: null,
    };
  }
  const fromMs = gens[0].t_ms;
  const clock = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(fromMs));
  return {
    line: `The archive holds from ${clock} ET.`,
    fromMs,
  };
}

/** @deprecated name — the hold is the archive slot. */
export function formatTodayHorizon(nowMs: number = Date.now()): {
  line: string;
  fromOpen: boolean;
  fromMs: number | null;
} {
  const h = formatHoldHorizon(nowMs);
  return { line: h.line, fromOpen: false, fromMs: h.fromMs };
}

export function occupancyDigest(): TmOccupancyDigest {
  const gens = state.today?.gens ?? [];
  return {
    todayCount: gens.length,
    todayHashes: gens.map((g) => g.contentHash),
    todayLastT: gens.length ? gens[gens.length - 1].t_ms : null,
    archiveDay: state.archive?.day ?? null,
    archiveCount: state.archive?.gens.length ?? 0,
    projector: state.playhead.projector,
  };
}

/** Occupancy for a past day. Does not pause or discard today. */
export function setArchive(slot: TmArchiveSlot | null): void {
  const prevDay = state.archive?.day ?? null;
  const prevCount = state.archive?.gens.length ?? 0;
  if (slot && prevDay && prevDay !== slot.day) {
    // TMI-79: discard the previous archive day before accepting the next.
    // Emit the empty slot so occupancy proofs can see the discard.
    state.archive = null;
    emit();
  }
  state.archive = slot;
  if (slot) {
    const entered = prevDay !== slot.day || prevCount === 0;
    if (entered) {
      state.playhead = {
        t_ms: slot.gens[0]?.t_ms ?? state.playhead.t_ms,
        projector: "archive",
      };
    }
  }
  emit();
}

/** Reset: drop archive, leave today, exit replay (watermark gone). */
export function exitReplay(): void {
  state.archive = null;
  state.playhead = { t_ms: null, projector: "live" };
  emit();
}

/** Date back to today while remaining in replay: park newest gen. */
export function enterTodayReplay(): void {
  state.archive = null;
  const gens = state.today?.gens ?? [];
  const newest = gens.length ? gens[gens.length - 1] : null;
  state.playhead = {
    t_ms: newest?.t_ms ?? null,
    projector: newest ? "today" : "live",
  };
  emit();
}

/** @deprecated use exitReplay (Reset) or enterTodayReplay (date=today). */
export function discardArchiveReturnLive(): void {
  exitReplay();
}

export function setPlayhead(t_ms: number | null, projector: TmProjector): void {
  state.playhead = { t_ms, projector };
  emit();
}

export function resetTmSlotsForTests(): void {
  state.today = null;
  state.archive = null;
  state.playhead = { t_ms: null, projector: "live" };
  state.hole = null;
}

let loadDayHandler: ((day: string) => void) | null = null;

export function setTmLoadDayHandler(fn: ((day: string) => void) | null): void {
  loadDayHandler = fn;
}

if (typeof window !== "undefined") {
  window.addEventListener("tm-test-engage", () => {
    setPlayhead(Date.now(), "today");
  });
  window.addEventListener("tm-test-capture", (ev) => {
    const d = (ev as CustomEvent).detail;
    if (!d || typeof d !== "object") return;
    const bag = window as Window & { __tmCaptures?: string[] };
    bag.__tmCaptures = bag.__tmCaptures ?? [];
    bag.__tmCaptures.push(String((d as TmTodayGen).contentHash ?? ""));
    captureToday(d as TmTodayGen);
  });
  window.addEventListener("tm-test-load-day", (ev) => {
    const d = (ev as CustomEvent).detail;
    if (typeof d === "string") loadDayHandler?.(d);
  });
  (
    window as Window & { __tmOccupancy?: () => TmOccupancyDigest }
  ).__tmOccupancy = occupancyDigest;
}

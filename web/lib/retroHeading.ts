/**
 * Retrospective Heading Card model — Reporting Standards Spec v0.1 §7a.
 * Compass reading only. Never invents conduct scores, return-on-debit
 * win bands, win-rate as a verdict, or a silent $50k capital base.
 *
 * Drawdown capital base (Coach 2026-08-15):
 *   no campaign → total trading capital entered on Accounts & Capital
 *   campaign in place (non-ledger) → that campaign's allocated capital
 * Then running-peak of that path. Named unset if capital is not set.
 */

import type { ProcessMeterItem, ProcessPayload } from "@/components/ProcessMeter";
import type { OverlayBin, ReportsBook, SeriesPoint } from "@/lib/reportsBook";
import { buildOverlayDistribution } from "@/lib/reportsBook";
import type { CapitalAccountBalance } from "@/lib/capitalApi";
import type { PracticeCampaign } from "@/lib/practiceSpineApi";

export const TARGET_SHAPE = [
  { id: "loss", label: "Losses", targetShare: 0.5 },
  { id: "small", label: "25–250%", targetShare: 0.37 },
  { id: "medium", label: "250–450%", targetShare: 0.1 },
  { id: "large", label: ">450%", targetShare: 0.02 },
] as const;

export type ShapeBucket = {
  id: string;
  label: string;
  targetShare: number;
  memberShare: number | null;
  memberCount: number | null;
};

export type RetroHeadingVerdict = {
  state: string;
  blurb: string;
  score: number | null;
  establishing: boolean;
};

export type RetroTrajectory = {
  resolving: number | null;
  repeating: number | null;
  ready: boolean;
  note: string;
};

export type RetroShapeReading = {
  buckets: ShapeBucket[];
  /** Full-book curve with this period counted on the same edges. */
  curve: OverlayBin[];
  fullOutcomes: number;
  periodOutcomes: number;
  caption: string;
  headline: string;
  decided: number;
  winners: number;
  losers: number;
  tradeCount: number;
  youLossPct: number | null;
  youWinPct: number | null;
};

export type RadarAxis = {
  id: string;
  label: string;
  overall: number;
  /** Period contribution on this axis; null = this window did not score it. */
  period: number | null;
};

const AXIS_SHORT: Record<string, string> = {
  persistence: "Persist",
  routine: "Routine",
  learning: "Learn",
  live: "Live",
  adherence: "Adhere",
  retrospective: "Retro",
  mental_toughness: "Tough",
  journaling: "Journal",
  presence: "Present",
  cadence: "Cadence",
};

export type CapitalBase = {
  amount: number | null;
  kind: "trading" | "allocated" | "unset";
  label: string;
  campaignId: number | null;
};

export type RetroDrawdownReading = {
  points: number[];
  /** Drawdown at period end — the current reading for this retro window. */
  currentPct: number | null;
  averagePct: number | null;
  deepestPct: number | null;
  recoveryNote: string;
  conductNote: string;
  sideways: boolean;
  band: "normal" | "plunge" | "deep" | "none";
  bandLabel: string;
  capital: CapitalBase;
  headline: string;
};

export type RetroPillar = {
  id: string;
  label: string;
  percent: number | null;
  detail: string;
  drifting: boolean;
};

export type RetroWindowFacts = {
  days: number | null;
  trades: number | null;
};

export type RetroHeadingModel = {
  verdict: RetroHeadingVerdict;
  trajectory: RetroTrajectory;
  shape: RetroShapeReading;
  drawdown: RetroDrawdownReading;
  pillars: RetroPillar[];
  radar: RadarAxis[];
  pillarCaption: string;
  window: RetroWindowFacts;
};

const PROCESS_SKIP = new Set(["book_net_per_trade"]);

function asDict(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function asList(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function meterById(
  meters: ProcessMeterItem[] | undefined,
  id: string,
): ProcessMeterItem | undefined {
  return (meters || []).find((m) => m.id === id);
}

function meterPercent(m: ProcessMeterItem | undefined): number | null {
  if (!m || m.empty || m.soon) return null;
  const n = Number(m.percent);
  return Number.isFinite(n) ? n : null;
}

export function formatCapital(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

/**
 * What the member entered on Accounts & Capital — starting balances
 * marked set. That is total trading capital (Coach). Not a selected
 * Practice-context book, not a $50k placeholder.
 */
export function totalEnteredTradingCapital(
  accounts: CapitalAccountBalance[],
): number | null {
  const sum = accounts.reduce((s, a) => {
    if (!a.starting_balance_set) return s;
    const bal = Number(a.starting_balance);
    return Number.isFinite(bal) && bal > 0 ? s + bal : s;
  }, 0);
  return sum > 0 ? sum : null;
}

/**
 * Capital base for the heading-card drawdown ribbon.
 * Campaign in place (non-ledger) → allocated capital.
 * Otherwise → total trading capital from Accounts & Capital.
 * Never invents $50k.
 */
export function resolveHeadingCapital(opts: {
  capitalAccounts: CapitalAccountBalance[];
  campaign?: PracticeCampaign | null;
}): CapitalBase {
  const camp = opts.campaign;
  const realCamp = Boolean(camp && !camp.is_ledger);
  if (realCamp && camp) {
    const cap = num(camp.starting_capital);
    if (cap != null && cap > 0) {
      return {
        amount: cap,
        kind: "allocated",
        label: `Allocated · ${camp.title || "campaign"}`,
        campaignId: camp.id,
      };
    }
    return {
      amount: null,
      kind: "unset",
      label: `${camp.title || "Campaign"} has no allocated capital`,
      campaignId: camp.id,
    };
  }
  const trading = totalEnteredTradingCapital(opts.capitalAccounts);
  if (trading != null) {
    return {
      amount: trading,
      kind: "trading",
      label: `Trading capital · ${formatCapital(trading)}`,
      campaignId: null,
    };
  }
  return {
    amount: null,
    kind: "unset",
    label: "Trading capital is not set on Accounts & Capital",
    campaignId: null,
  };
}

export function buildVerdict(
  process: ProcessPayload | null,
  loading = false,
): RetroHeadingVerdict {
  if (loading && !process) {
    return {
      state: "Reading the compass",
      blurb: "Gathering the Journey score and the period path.",
      score: null,
      establishing: true,
    };
  }
  if (!process) {
    return {
      state: "Finding heading",
      blurb: "The Journey score will fill as practice lands on the pillars.",
      score: null,
      establishing: true,
    };
  }
  const grade = process.grade;
  const establishing = Boolean(
    grade?.establishing || grade?.id === "establishing",
  );
  const state = establishing
    ? "Finding heading"
    : grade?.label || process.overall_label || "On course";
  const score = Number.isFinite(process.overall_percent)
    ? Math.round(process.overall_percent)
    : null;
  return {
    state,
    blurb:
      grade?.blurb ||
      "Compass reading — pillar balance. The retro is where the score is shown.",
    score,
    establishing,
  };
}

export function buildTrajectory(
  comparison: Record<string, unknown> | null | undefined,
  isMaiden: boolean,
): RetroTrajectory {
  if (isMaiden || !comparison || comparison.has_prior === false) {
    return {
      resolving: null,
      repeating: null,
      ready: false,
      note: "First review — repeating and resolving wait for a prior.",
    };
  }
  const rows = asList(comparison.metrics);
  let resolving = 0;
  let repeating = 0;
  let compared = 0;
  for (const row of rows) {
    const metric = String(row.metric || "");
    if (PROCESS_SKIP.has(metric)) continue;
    if (!row.comparable) continue;
    const cur = num(asDict(row.current)?.value);
    const prev = num(asDict(row.previous)?.value);
    if (cur == null || prev == null) continue;
    compared += 1;
    if (cur > prev + 1e-9) resolving += 1;
    else if (cur < prev - 1e-9) repeating += 1;
  }
  if (compared === 0) {
    return {
      resolving: null,
      repeating: null,
      ready: false,
      note: "Not enough yet to name repeating vs resolving.",
    };
  }
  return {
    resolving,
    repeating,
    ready: true,
    note: "Process readings vs last review — conduct findings walk in conversation.",
  };
}

export function buildShape(
  winners: number,
  losers: number,
  tradeCount = 0,
  fullPnls: number[] = [],
  periodPnls: number[] = [],
): RetroShapeReading {
  const decided = Math.max(0, winners + losers);
  const lossShare = decided > 0 ? losers / decided : null;
  const winShare = decided > 0 ? winners / decided : null;
  const buckets: ShapeBucket[] = TARGET_SHAPE.map((b) => ({
    id: b.id,
    label: b.label,
    targetShare: b.targetShare,
    memberShare: b.id === "loss" ? lossShare : null,
    memberCount: b.id === "loss" && decided > 0 ? losers : null,
  }));
  const curve = buildOverlayDistribution(fullPnls, periodPnls);
  const base = {
    buckets,
    curve,
    fullOutcomes: fullPnls.length,
    periodOutcomes: periodPnls.length,
    decided,
    winners,
    losers,
    tradeCount,
  };
  if (decided === 0) {
    return {
      ...base,
      caption:
        fullPnls.length > 0
          ? `Full curve: ${fullPnls.length} outcomes. This period has no closed prints on it yet.`
          : tradeCount > 0
            ? `${tradeCount} trade${tradeCount === 1 ? "" : "s"} in the window — none closed with a recorded outcome yet.`
            : "No closed outcomes in this window.",
      headline: "No closed outcomes this period",
      youLossPct: null,
      youWinPct: null,
    };
  }
  const lossPct = Math.round((lossShare || 0) * 100);
  const winPct = Math.round((winShare || 0) * 100);
  let left = "Left tail near target";
  if (lossShare != null && lossShare < 0.35) left = "Left tail thin";
  else if (lossShare != null && lossShare > 0.65) left = "Left tail heavy";
  return {
    ...base,
    caption: `${left}. Tint marks this period on the full curve. Win-rate is not a compass reading.`,
    headline: `${losers} loss${losers === 1 ? "" : "es"} · ${winners} win${winners === 1 ? "" : "s"} this period`,
    youLossPct: lossPct,
    youWinPct: winPct,
  };
}

function weekRateToPct(perWeek: number | null): number | null {
  if (perWeek == null) return null;
  return Math.max(0, Math.min(100, Math.round((perWeek / 5) * 100)));
}

function periodValueForMeter(
  id: string,
  periodProcess: Record<string, unknown> | null | undefined,
  brief: Record<string, unknown> | null | undefined,
): number | null {
  const proc = periodProcess || {};
  const tiles = asDict(brief?.tiles);
  const routine = asDict(proc.routine);
  const live = asDict(proc.live);
  const learning = asDict(proc.learning);
  const adh = asDict(proc.adherence);
  const windowDays =
    num(tiles?.window_days) ?? num(proc.window_days) ?? num(brief?.window_days);
  const weeks = windowDays != null && windowDays > 0 ? windowDays / 7 : null;

  if (id === "routine" || id === "persistence" || id === "journaling") {
    const perWeek =
      num(routine?.activity_days_per_week) ??
      (weeks && num(tiles?.journal_days) != null
        ? num(tiles?.journal_days)! / weeks
        : null);
    if (id === "journaling") {
      const days = num(tiles?.journal_days);
      if (days != null && windowDays && windowDays > 0) {
        return Math.max(0, Math.min(100, Math.round((days / windowDays) * 100)));
      }
    }
    return weekRateToPct(perWeek);
  }
  if (id === "live" || id === "presence") {
    const perWeek =
      num(live?.checkins_per_week) ??
      (weeks && num(tiles?.live_checkins) != null
        ? num(tiles?.live_checkins)! / weeks
        : null);
    return weekRateToPct(perWeek);
  }
  if (id === "learning") {
    const perWeek =
      num(learning?.lesson_days_per_week) ??
      (weeks && num(tiles?.lessons_completed) != null
        ? num(tiles?.lessons_completed)! / weeks
        : null);
    return weekRateToPct(perWeek);
  }
  if (id === "adherence") {
    const rate = num(adh?.followed_or_partial_rate);
    if (rate != null) return Math.max(0, Math.min(100, Math.round(rate * 100)));
    const followed = num(tiles?.followed_or_partial);
    const total = num(tiles?.adherence_total);
    if (followed != null && total != null && total > 0) {
      return Math.round((followed / total) * 100);
    }
    return null;
  }
  if (id === "retrospective" || id === "cadence") {
    return null;
  }
  return null;
}

export function buildRadar(
  process: ProcessPayload | null,
  opts?: {
    periodProcess?: Record<string, unknown> | null;
    periodBrief?: Record<string, unknown> | null;
  },
): { axes: RadarAxis[]; caption: string } {
  const meters = (process?.meters || []).filter(
    (m) => !m.soon || m.id === "retrospective",
  );
  const axes: RadarAxis[] = meters.map((m) => ({
    id: m.id,
    label: AXIS_SHORT[m.id] || m.label.split(/\s+/)[0] || m.id,
    overall: m.empty || m.soon ? 0 : Math.max(0, Math.min(100, Number(m.percent) || 0)),
    period: periodValueForMeter(m.id, opts?.periodProcess, opts?.periodBrief),
  }));
  const periodHits = axes.filter((a) => a.period != null).length;
  const caption =
    periodHits === 0
      ? "Full practice map. Period contribution fills in with this window's process."
      : "Muted shape is the full compass. Tint is what this period contributed.";
  return { axes, caption };
}

function drawdownBand(
  currentPct: number | null,
): Pick<RetroDrawdownReading, "band" | "bandLabel"> {
  if (currentPct == null) {
    return { band: "none", bandLabel: "No path" };
  }
  const depth = Math.abs(currentPct);
  if (depth <= 2.5) {
    return { band: "normal", bandLabel: "Normal band (≤2.5%)" };
  }
  if (depth <= 4) {
    return { band: "plunge", bandLabel: "Plunge band (3–4%)" };
  }
  return { band: "deep", bandLabel: "Deep band (5%+)" };
}

export function buildDrawdown(
  series: SeriesPoint[] | undefined,
  totalReturnPct: number | null,
  hasPnlData: boolean,
  capital: CapitalBase,
): RetroDrawdownReading {
  const conductNote = "Conduct in drawdown is not scored yet.";
  const unset: RetroDrawdownReading = {
    points: [],
    currentPct: null,
    averagePct: null,
    deepestPct: null,
    recoveryNote: "No path yet.",
    conductNote,
    sideways: false,
    band: "none",
    bandLabel: "No path",
    capital,
    headline:
      capital.kind === "unset"
        ? capital.label
        : "No closed path in this window",
  };
  if (capital.kind === "unset" || capital.amount == null) {
    return {
      ...unset,
      headline: capital.label,
      recoveryNote: "Current drawdown % waits on the capital base.",
    };
  }
  if (!hasPnlData || !series || series.length < 2) {
    return {
      ...unset,
      currentPct: 0,
      headline: `0.00% of ${formatCapital(capital.amount)}`,
      recoveryNote: "No closed path in this window.",
      bandLabel: "Held the capital",
    };
  }

  const points = series.map((p) => p.drawdownPct * 100);
  const currentPct = points[points.length - 1] ?? 0;
  const underwater = points.filter((v) => v < -0.05);
  const deepestPct = Math.min(...points);
  const averagePct =
    underwater.length > 0
      ? underwater.reduce((s, v) => s + v, 0) / underwater.length
      : 0;

  let recoveryNote = "At the peak of this period.";
  if (currentPct < -0.05) {
    recoveryNote =
      Math.abs(currentPct - deepestPct) < 0.05
        ? "Current print is the deepest of the period."
        : `Deepest this period was ${Math.abs(deepestPct).toFixed(2)}%.`;
  } else if (deepestPct < -0.05) {
    recoveryNote = `Back to the peak · deepest this period ${Math.abs(deepestPct).toFixed(2)}%.`;
  }

  const sideways =
    Math.abs(currentPct) <= 2.5 &&
    totalReturnPct != null &&
    Math.abs(totalReturnPct) < 2.5;
  const { band, bandLabel } = drawdownBand(currentPct);
  const ofWhat =
    capital.kind === "allocated"
      ? `of ${formatCapital(capital.amount)} allocated`
      : `of ${formatCapital(capital.amount)} trading capital`;

  return {
    points,
    currentPct,
    averagePct,
    deepestPct,
    recoveryNote,
    conductNote,
    sideways,
    band,
    bandLabel,
    capital,
    headline: `${Math.abs(currentPct).toFixed(2)}% ${ofWhat}`,
  };
}

function integrityJournalPercent(
  integrity: Record<string, unknown> | null | undefined,
): number | null {
  const drivers = asList(integrity?.drivers);
  const journal = drivers.find(
    (d) => String(d.id || "").toLowerCase() === "journal",
  );
  return journal ? num(journal.percent) : null;
}

function journalDensityPercent(
  brief: Record<string, unknown> | null | undefined,
): number | null {
  const tiles = asDict(brief?.tiles);
  const days = num(tiles?.journal_days);
  const window = num(tiles?.window_days) ?? num(brief?.window_days);
  if (days == null || window == null || window <= 0) return null;
  return Math.max(0, Math.min(100, Math.round((days / window) * 100)));
}

function journalDetail(
  brief: Record<string, unknown> | null | undefined,
  fallback: string,
): string {
  const tiles = asDict(brief?.tiles);
  const days = num(tiles?.journal_days);
  const notes = num(tiles?.journal_notes);
  if (days != null) {
    return `${days} journal day${days === 1 ? "" : "s"} in the window`;
  }
  if (notes != null) {
    return `${notes} journal note${notes === 1 ? "" : "s"}`;
  }
  return fallback;
}

export function buildPillars(
  process: ProcessPayload | null,
  opts?: {
    periodBrief?: Record<string, unknown> | null;
    integrity?: Record<string, unknown> | null;
  },
): { pillars: RetroPillar[]; caption: string } {
  const meters = process?.meters;
  const journaling =
    integrityJournalPercent(opts?.integrity) ??
    journalDensityPercent(opts?.periodBrief);

  const routine = meterById(meters, "routine");
  const persist = meterById(meters, "persistence");
  const live = meterById(meters, "live");
  const retro = meterById(meters, "retrospective");

  const raw: RetroPillar[] = [
    {
      id: "routine",
      label: "Routine",
      percent: meterPercent(routine),
      detail: routine?.detail || routine?.hint || "Daily routine",
      drifting: false,
    },
    {
      id: "journaling",
      label: "Journaling",
      percent: journaling,
      detail: journalDetail(
        opts?.periodBrief,
        "Journal days in this window",
      ),
      drifting: false,
    },
    {
      id: "persistence",
      label: "Persistence",
      percent: meterPercent(persist),
      detail: persist?.detail || persist?.hint || "Practice weeks held",
      drifting: false,
    },
    {
      id: "presence",
      label: "Presence",
      percent: meterPercent(live),
      detail: live?.detail || live?.hint || "Live check-ins",
      drifting: false,
    },
    {
      id: "cadence",
      label: "Cadence",
      percent: meterPercent(retro),
      detail: retro?.detail || retro?.hint || "Review cadence",
      drifting: false,
    },
  ];

  const scored = raw.map((p) => p.percent).filter((n): n is number => n != null);
  const median =
    scored.length === 0
      ? 50
      : [...scored].sort((a, b) => a - b)[Math.floor(scored.length / 2)];

  const pillars = raw.map((p) => ({
    ...p,
    drifting: p.percent != null && (p.percent < 50 || p.percent < median - 15),
  }));

  const drifted = pillars.filter((p) => p.drifting);
  const caption =
    drifted.length === 0
      ? "Pillars holding — no named drift."
      : `Drift: ${drifted.map((p) => p.label.toLowerCase()).join(", ")}.`;

  return { pillars, caption };
}

export function buildWindowFacts(opts: {
  periodBrief?: Record<string, unknown> | null;
  book?: ReportsBook | null;
  hint?: { days?: number | null; trades?: number | null };
}): RetroWindowFacts {
  const tiles = asDict(opts.periodBrief?.tiles);
  const days =
    num(tiles?.window_days) ??
    num(opts.periodBrief?.window_days) ??
    opts.hint?.days ??
    null;
  const trades =
    num(tiles?.trade_count) ??
    (opts.book && opts.book.tradeCount > 0 ? opts.book.tradeCount : null) ??
    opts.hint?.trades ??
    null;
  return { days, trades };
}

export function buildRetroHeading(input: {
  process: ProcessPayload | null;
  book: ReportsBook | null;
  fullBook?: ReportsBook | null;
  comparison?: Record<string, unknown> | null;
  periodBrief?: Record<string, unknown> | null;
  periodProcess?: Record<string, unknown> | null;
  integrity?: Record<string, unknown> | null;
  isMaiden?: boolean;
  loading?: boolean;
  capital?: CapitalBase;
  windowHint?: { days?: number | null; trades?: number | null };
}): RetroHeadingModel {
  const book = input.book;
  const fullBook = input.fullBook ?? null;
  const capital =
    input.capital ??
    ({
      amount: null,
      kind: "unset",
      label: "Trading capital is not set",
      campaignId: null,
    } satisfies CapitalBase);
  const { pillars, caption } = buildPillars(input.process, {
    periodBrief: input.periodBrief,
    integrity: input.integrity,
  });
  const radar = buildRadar(input.process, {
    periodProcess: input.periodProcess,
    periodBrief: input.periodBrief,
  });
  return {
    verdict: buildVerdict(input.process, Boolean(input.loading)),
    trajectory: buildTrajectory(input.comparison, Boolean(input.isMaiden)),
    shape: buildShape(
      book?.winners ?? 0,
      book?.losers ?? 0,
      book?.tradeCount ?? 0,
      fullBook?.outcomePnls ?? book?.outcomePnls ?? [],
      book?.outcomePnls ?? [],
    ),
    drawdown: buildDrawdown(
      book?.series,
      book && book.hasPnlData ? book.totalReturnPct : null,
      Boolean(book?.hasPnlData) && capital.amount != null,
      capital,
    ),
    pillars,
    radar: radar.axes,
    pillarCaption: radar.caption,
    window: buildWindowFacts({
      periodBrief: input.periodBrief,
      book,
      hint: input.windowHint,
    }),
  };
}

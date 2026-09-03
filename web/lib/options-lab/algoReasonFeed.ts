/**
 * AZ-ALGO P4 — Trader Feed host `algo-reason`.
 * Measurements only, as-of stamped. No hold/fold, target, or probability.
 * House base is process words. Apex: "short-gamma region — profit-at-risk elevated".
 */

export const ALGO_REASON_HOST = "algo-reason";

export const ALGO_FEED_ALLOWLIST = [
  "delta",
  "gamma",
  "U",
  "H",
  "D",
  "risk_taken",
  "exit_side",
  "working_side",
  "g",
  "k",
  "gamma_factor",
  "proximity_factor",
  "PaR",
  "move_unit",
  "trail_level_proposed",
  "trail_level_legacy",
  "threatened_line",
  "gex_percentile",
  "gex_as_of",
  "spot",
  "realized_move",
  "vp_nodes",
  "session_time",
  "mode",
  "as_of",
] as const;

export type AlgoFeedAllowKey = (typeof ALGO_FEED_ALLOWLIST)[number];

const ALLOW = new Set<string>(ALGO_FEED_ALLOWLIST);

/** House base / instructions prompt. No structure-as-level words. */
export const ALGO_REASON_HOUSE_BASE =
  "Narrate this OTM debit butterfly trail from measurements only. " +
  "Stamp every figure with an as-of. Report net GEX as a percentile with that as-of. " +
  "At the body say: short-gamma region — profit-at-risk elevated. " +
  "Do not recommend stay or leave. Do not quote a chance of profit. " +
  "Reason does not drive the engine. Stay-in / don't-give-back is the job.";

export const ALGO_FEED_APEX =
  "short-gamma region — profit-at-risk elevated";

export const ALGO_FEED_QUIET = "AI quiet";

const FORBIDDEN_LEVEL = /\b(wall|flip|pin|magnet|support|resistance)\b/i;
const FORBIDDEN_ADVICE =
  /\b(hold|fold|buy|sell|flatten)\b|\btarget\b|\bprobabilit/i;

export function pickAllowlist(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (ALLOW.has(k)) out[k] = v;
  }
  return out;
}

export function feedPostForbidden(text: string): string[] {
  const hits: string[] = [];
  if (FORBIDDEN_LEVEL.test(text)) hits.push("level-vocab");
  if (FORBIDDEN_ADVICE.test(text)) hits.push("advice");
  return hits;
}

export type AlgoFeedPost = {
  t: string;
  body: string;
  source: "local" | "model";
  quiet?: boolean;
};

export function localMeasurementPost(opts: {
  asOf: string;
  gexPercentile?: number | null;
  paR?: number | null;
  atBody?: boolean;
}): AlgoFeedPost {
  const bits: string[] = [`as-of ${opts.asOf}`];
  if (opts.gexPercentile != null && Number.isFinite(opts.gexPercentile)) {
    bits.push(
      `net GEX in the close band is in the ${Math.round(opts.gexPercentile)}th percentile (estimate, as-of ${opts.asOf})`,
    );
  }
  if (opts.atBody) bits.push(ALGO_FEED_APEX);
  if (opts.paR != null && Number.isFinite(opts.paR)) {
    bits.push(`profit-at-risk ${opts.paR}`);
  }
  return { t: opts.asOf, body: bits.join(" · "), source: "local" };
}

export function quietPost(asOf: string): AlgoFeedPost {
  return { t: asOf, body: ALGO_FEED_QUIET, source: "local", quiet: true };
}

/** AI inference only while Managing (v1 armed). Fold suggested keeps last tape. */
export function algoFeedMayInfer(
  phase: string | null | undefined,
): boolean {
  return phase === "armed" || phase === "managing";
}

export function algoFeedTape(opts: {
  reasonOn: boolean;
  phase: string | null | undefined;
  asOf: string;
  measurements: Record<string, unknown>;
  lastTape: AlgoFeedPost[];
  modelFailed?: boolean;
}): AlgoFeedPost[] {
  if (!opts.reasonOn) return [];
  const handed = pickAllowlist(opts.measurements);
  const gex =
    typeof handed.gex_percentile === "number" ? handed.gex_percentile : null;
  const paR = typeof handed.PaR === "number" ? handed.PaR : null;
  const local = localMeasurementPost({
    asOf: opts.asOf,
    gexPercentile: gex,
    paR,
  });
  if (!algoFeedMayInfer(opts.phase)) {
    return opts.lastTape.length ? opts.lastTape : [local];
  }
  if (opts.modelFailed) {
    return [...opts.lastTape, local, quietPost(opts.asOf)];
  }
  return [...opts.lastTape, local];
}

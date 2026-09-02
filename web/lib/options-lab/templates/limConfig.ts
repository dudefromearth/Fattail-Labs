/**
 * LIM config — Spec v0.4.3 Appendix A.
 *
 * Parse on first LIM activation (C2 / JR1). Do not throw at module load.
 * Errors name the Appendix A key (`LABS_LIM_*`), never dump process.env.
 * Bundler seam (JR1): Next.js inlines only *literal* `process.env.NEXT_PUBLIC_*`
 * member expressions. PUBLIC_LIM_ENV is that map — no computed keys.
 */

export const LABS_LIM_ENV_KEYS = [
  "LABS_LIM_CENTRE_SCALE_PTS",
  "LABS_LIM_BAND_CLOSE_PCT",
  "LABS_LIM_BAND_MEDIUM_PCT",
  "LABS_LIM_W_NET",
  "LABS_LIM_W_CONC",
  "LABS_LIM_W_MAG",
  "LABS_LIM_CONC_FLOOR",
  "LABS_LIM_CONC_SPAN",
  "LABS_LIM_MAG_FLOOR",
  "LABS_LIM_MAG_SPAN",
  "LABS_LIM_XPROX_FLOOR_PCT",
  "LABS_LIM_XPROX_CEIL_PCT",
  "LABS_LIM_TRAIL_INTERVAL_S",
  "LABS_LIM_TRAIL_WINDOW_MIN",
  "LABS_LIM_DRIFT_MIN_RATE",
  "LABS_LIM_SHOW_TRANSITION",
  "LABS_LIM_SHOW_ANNOTATIONS",
] as const;

export type LabsLimEnvKey = (typeof LABS_LIM_ENV_KEYS)[number];

export type LimConfig = {
  LIM_CENTRE_SCALE_PTS: Record<string, number>;
  LIM_BAND_CLOSE_PCT: number;
  LIM_BAND_MEDIUM_PCT: number;
  LIM_W_NET: number;
  LIM_W_CONC: number;
  LIM_W_MAG: number;
  LIM_CONC_FLOOR: number;
  LIM_CONC_SPAN: number;
  LIM_MAG_FLOOR: number;
  LIM_MAG_SPAN: number;
  LIM_XPROX_FLOOR_PCT: number;
  LIM_XPROX_CEIL_PCT: number;
  LIM_TRAIL_INTERVAL_S: number;
  LIM_TRAIL_WINDOW_MIN: number;
  LIM_DRIFT_MIN_RATE: number;
  LIM_SHOW_TRANSITION: boolean;
  LIM_SHOW_ANNOTATIONS: boolean;
};

export type LimEnv = Record<string, string | undefined>;

const W_SUM_EPS = 1e-9;

/**
 * Client-inlinable seam. Keys are Appendix A; values are literal
 * `process.env.NEXT_PUBLIC_LABS_LIM_*` member expressions (no loops, no `env[k]`).
 */
const PUBLIC_LIM_ENV: Record<LabsLimEnvKey, string | undefined> = {
  LABS_LIM_CENTRE_SCALE_PTS: process.env.NEXT_PUBLIC_LABS_LIM_CENTRE_SCALE_PTS,
  LABS_LIM_BAND_CLOSE_PCT: process.env.NEXT_PUBLIC_LABS_LIM_BAND_CLOSE_PCT,
  LABS_LIM_BAND_MEDIUM_PCT: process.env.NEXT_PUBLIC_LABS_LIM_BAND_MEDIUM_PCT,
  LABS_LIM_W_NET: process.env.NEXT_PUBLIC_LABS_LIM_W_NET,
  LABS_LIM_W_CONC: process.env.NEXT_PUBLIC_LABS_LIM_W_CONC,
  LABS_LIM_W_MAG: process.env.NEXT_PUBLIC_LABS_LIM_W_MAG,
  LABS_LIM_CONC_FLOOR: process.env.NEXT_PUBLIC_LABS_LIM_CONC_FLOOR,
  LABS_LIM_CONC_SPAN: process.env.NEXT_PUBLIC_LABS_LIM_CONC_SPAN,
  LABS_LIM_MAG_FLOOR: process.env.NEXT_PUBLIC_LABS_LIM_MAG_FLOOR,
  LABS_LIM_MAG_SPAN: process.env.NEXT_PUBLIC_LABS_LIM_MAG_SPAN,
  LABS_LIM_XPROX_FLOOR_PCT: process.env.NEXT_PUBLIC_LABS_LIM_XPROX_FLOOR_PCT,
  LABS_LIM_XPROX_CEIL_PCT: process.env.NEXT_PUBLIC_LABS_LIM_XPROX_CEIL_PCT,
  LABS_LIM_TRAIL_INTERVAL_S: process.env.NEXT_PUBLIC_LABS_LIM_TRAIL_INTERVAL_S,
  LABS_LIM_TRAIL_WINDOW_MIN: process.env.NEXT_PUBLIC_LABS_LIM_TRAIL_WINDOW_MIN,
  LABS_LIM_DRIFT_MIN_RATE: process.env.NEXT_PUBLIC_LABS_LIM_DRIFT_MIN_RATE,
  LABS_LIM_SHOW_TRANSITION: process.env.NEXT_PUBLIC_LABS_LIM_SHOW_TRANSITION,
  LABS_LIM_SHOW_ANNOTATIONS: process.env.NEXT_PUBLIC_LABS_LIM_SHOW_ANNOTATIONS,
};

let cached: LimConfig | null = null;

export function resetLimConfigCache(): void {
  cached = null;
}

export class LimConfigError extends Error {
  readonly key: string;
  constructor(message: string, key: string) {
    super(message);
    this.name = "LimConfigError";
    this.key = key;
  }
}

function bundlerKey(appendixKey: string): string {
  return `NEXT_PUBLIC_${appendixKey}`;
}

function readRaw(env: LimEnv, appendixKey: LabsLimEnvKey): string | undefined {
  const prefixed = env[bundlerKey(appendixKey)];
  if (prefixed != null && String(prefixed).trim() !== "") return String(prefixed);
  const logical = env[appendixKey];
  if (logical != null && String(logical).trim() !== "") return String(logical);
  return undefined;
}

function missing(key: LabsLimEnvKey): never {
  throw new LimConfigError(`Missing required environment variable: ${key}`, key);
}

function invalid(key: LabsLimEnvKey, detail: string): never {
  throw new LimConfigError(`Invalid environment variable: ${key} (${detail})`, key);
}

function parseNumber(env: LimEnv, key: LabsLimEnvKey): number {
  const raw = readRaw(env, key);
  if (raw == null) missing(key);
  const n = Number(raw);
  if (!Number.isFinite(n)) invalid(key, "not a finite number");
  return n;
}

function parseBool(env: LimEnv, key: LabsLimEnvKey): boolean {
  const raw = readRaw(env, key);
  if (raw == null) missing(key);
  const v = raw.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  invalid(key, "not a boolean");
}

function parseScaleMap(env: LimEnv): Record<string, number> {
  const key: LabsLimEnvKey = "LABS_LIM_CENTRE_SCALE_PTS";
  const raw = readRaw(env, key);
  if (raw == null) missing(key);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    invalid(key, "not JSON");
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    invalid(key, "not a JSON object");
  }
  const out: Record<string, number> = {};
  for (const [sym, val] of Object.entries(parsed as Record<string, unknown>)) {
    const n = Number(val);
    if (!Number.isFinite(n) || n === 0) {
      invalid(key, `scale for ${sym} is not a non-zero finite number`);
    }
    out[sym] = n;
  }
  return out;
}

function parseLimConfig(env: LimEnv): LimConfig {
  for (const key of LABS_LIM_ENV_KEYS) {
    if (readRaw(env, key) == null) missing(key);
  }

  const cfg: LimConfig = {
    LIM_CENTRE_SCALE_PTS: parseScaleMap(env),
    LIM_BAND_CLOSE_PCT: parseNumber(env, "LABS_LIM_BAND_CLOSE_PCT"),
    LIM_BAND_MEDIUM_PCT: parseNumber(env, "LABS_LIM_BAND_MEDIUM_PCT"),
    LIM_W_NET: parseNumber(env, "LABS_LIM_W_NET"),
    LIM_W_CONC: parseNumber(env, "LABS_LIM_W_CONC"),
    LIM_W_MAG: parseNumber(env, "LABS_LIM_W_MAG"),
    LIM_CONC_FLOOR: parseNumber(env, "LABS_LIM_CONC_FLOOR"),
    LIM_CONC_SPAN: parseNumber(env, "LABS_LIM_CONC_SPAN"),
    LIM_MAG_FLOOR: parseNumber(env, "LABS_LIM_MAG_FLOOR"),
    LIM_MAG_SPAN: parseNumber(env, "LABS_LIM_MAG_SPAN"),
    LIM_XPROX_FLOOR_PCT: parseNumber(env, "LABS_LIM_XPROX_FLOOR_PCT"),
    LIM_XPROX_CEIL_PCT: parseNumber(env, "LABS_LIM_XPROX_CEIL_PCT"),
    LIM_TRAIL_INTERVAL_S: parseNumber(env, "LABS_LIM_TRAIL_INTERVAL_S"),
    LIM_TRAIL_WINDOW_MIN: parseNumber(env, "LABS_LIM_TRAIL_WINDOW_MIN"),
    LIM_DRIFT_MIN_RATE: parseNumber(env, "LABS_LIM_DRIFT_MIN_RATE"),
    LIM_SHOW_TRANSITION: parseBool(env, "LABS_LIM_SHOW_TRANSITION"),
    LIM_SHOW_ANNOTATIONS: parseBool(env, "LABS_LIM_SHOW_ANNOTATIONS"),
  };

  const w = cfg.LIM_W_NET + cfg.LIM_W_CONC + cfg.LIM_W_MAG;
  if (Math.abs(w - 1) > W_SUM_EPS) {
    throw new LimConfigError(
      `Invalid environment variable: LABS_LIM_W_NET (W_NET + W_CONC + W_MAG must sum to 1.0)`,
      "LABS_LIM_W_NET",
    );
  }
  if (cfg.LIM_XPROX_CEIL_PCT <= cfg.LIM_XPROX_FLOOR_PCT) {
    invalid(
      "LABS_LIM_XPROX_CEIL_PCT",
      "must be greater than LABS_LIM_XPROX_FLOOR_PCT",
    );
  }
  return cfg;
}

/** First LIM activation. Side-effect free at import. */
export function loadLimConfig(env?: LimEnv): LimConfig {
  if (env == null && cached) return cached;
  const source = env ?? PUBLIC_LIM_ENV;
  const parsed = parseLimConfig(source);
  if (env == null) cached = parsed;
  return parsed;
}

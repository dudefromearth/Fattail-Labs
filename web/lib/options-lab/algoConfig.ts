/**
 * AZ-ALGO Appendix A — fail loud. Missing or invalid aborts, naming the key.
 * Next.js inlines only literal `process.env.NEXT_PUBLIC_*` member expressions.
 * No computed lookup (`env[prefix + key]`).
 */

export const LABS_ALGO_ENV_KEYS = [
  "LABS_ALGO_ENTRY_PCT",
  "LABS_ALGO_TRAIL_START_PCT",
  "LABS_ALGO_TRAIL_END_PCT",
  "LABS_ALGO_MOVE_WINDOW_MIN",
  "LABS_ALGO_K_BASE",
  "LABS_ALGO_GAMMA_FACTOR_MIN",
  "LABS_ALGO_GAMMA_FACTOR_MAX",
  "LABS_ALGO_PROXIMITY_FACTOR_MIN",
  "LABS_ALGO_PROXIMITY_FACTOR_MAX",
  "LABS_ALGO_K_CLAMP_MIN",
  "LABS_ALGO_K_CLAMP_MAX",
  "LABS_ALGO_CONVEXITY_MIN_PCT",
  "LABS_ALGO_CONVEXITY_MAX_PCT",
  "LABS_ALGO_FREEWING_CENTS",
  "LABS_ALGO_PULSE_ON_PCT",
  "LABS_ALGO_PULSE_OFF_PCT",
  "LABS_ALGO_TRIGGER_FORMULA_ID",
  "LABS_ALGO_MOVE_SIGMA",
  "LABS_ALGO_MOVE_MIN_SAMPLES",
  "LABS_ALGO_GEX_NORM_WINDOW_MIN",
  "LABS_ALGO_GEX_NORM_MIN_SAMPLES",
  "LABS_ALGO_REENTRY_BARS",
  "LABS_ALGO_FLOOR_REMAINING_H",
] as const;

export type LabsAlgoEnvKey = (typeof LABS_ALGO_ENV_KEYS)[number];

export type AlgoConfig = {
  ALGO_ENTRY_PCT: number;
  ALGO_TRAIL_START_PCT: number;
  ALGO_TRAIL_END_PCT: number;
  ALGO_MOVE_WINDOW_MIN: number;
  ALGO_K_BASE: number;
  ALGO_GAMMA_FACTOR_MIN: number;
  ALGO_GAMMA_FACTOR_MAX: number;
  ALGO_PROXIMITY_FACTOR_MIN: number;
  ALGO_PROXIMITY_FACTOR_MAX: number;
  ALGO_K_CLAMP_MIN: number;
  ALGO_K_CLAMP_MAX: number;
  ALGO_CONVEXITY_MIN_PCT: number;
  ALGO_CONVEXITY_MAX_PCT: number;
  ALGO_FREEWING_CENTS: number;
  ALGO_PULSE_ON_PCT: number;
  ALGO_PULSE_OFF_PCT: number;
  ALGO_TRIGGER_FORMULA_ID: string;
  ALGO_MOVE_SIGMA: number;
  ALGO_MOVE_MIN_SAMPLES: number;
  ALGO_GEX_NORM_WINDOW_MIN: number;
  ALGO_GEX_NORM_MIN_SAMPLES: number;
  ALGO_REENTRY_BARS: number;
  ALGO_FLOOR_REMAINING_H: number;
};

export type AlgoEnv = Record<string, string | undefined>;

export class AlgoConfigError extends Error {
  readonly key: string;
  constructor(message: string, key: string) {
    super(message);
    this.name = "AlgoConfigError";
    this.key = key;
  }
}

/** Literal member expressions — do not loop this map's construction. */
export const PUBLIC_ALGO_ENV: Record<LabsAlgoEnvKey, string | undefined> = {
  LABS_ALGO_ENTRY_PCT: process.env.NEXT_PUBLIC_LABS_ALGO_ENTRY_PCT,
  LABS_ALGO_TRAIL_START_PCT: process.env.NEXT_PUBLIC_LABS_ALGO_TRAIL_START_PCT,
  LABS_ALGO_TRAIL_END_PCT: process.env.NEXT_PUBLIC_LABS_ALGO_TRAIL_END_PCT,
  LABS_ALGO_MOVE_WINDOW_MIN: process.env.NEXT_PUBLIC_LABS_ALGO_MOVE_WINDOW_MIN,
  LABS_ALGO_K_BASE: process.env.NEXT_PUBLIC_LABS_ALGO_K_BASE,
  LABS_ALGO_GAMMA_FACTOR_MIN: process.env.NEXT_PUBLIC_LABS_ALGO_GAMMA_FACTOR_MIN,
  LABS_ALGO_GAMMA_FACTOR_MAX: process.env.NEXT_PUBLIC_LABS_ALGO_GAMMA_FACTOR_MAX,
  LABS_ALGO_PROXIMITY_FACTOR_MIN: process.env.NEXT_PUBLIC_LABS_ALGO_PROXIMITY_FACTOR_MIN,
  LABS_ALGO_PROXIMITY_FACTOR_MAX: process.env.NEXT_PUBLIC_LABS_ALGO_PROXIMITY_FACTOR_MAX,
  LABS_ALGO_K_CLAMP_MIN: process.env.NEXT_PUBLIC_LABS_ALGO_K_CLAMP_MIN,
  LABS_ALGO_K_CLAMP_MAX: process.env.NEXT_PUBLIC_LABS_ALGO_K_CLAMP_MAX,
  LABS_ALGO_CONVEXITY_MIN_PCT: process.env.NEXT_PUBLIC_LABS_ALGO_CONVEXITY_MIN_PCT,
  LABS_ALGO_CONVEXITY_MAX_PCT: process.env.NEXT_PUBLIC_LABS_ALGO_CONVEXITY_MAX_PCT,
  LABS_ALGO_FREEWING_CENTS: process.env.NEXT_PUBLIC_LABS_ALGO_FREEWING_CENTS,
  LABS_ALGO_PULSE_ON_PCT: process.env.NEXT_PUBLIC_LABS_ALGO_PULSE_ON_PCT,
  LABS_ALGO_PULSE_OFF_PCT: process.env.NEXT_PUBLIC_LABS_ALGO_PULSE_OFF_PCT,
  LABS_ALGO_TRIGGER_FORMULA_ID: process.env.NEXT_PUBLIC_LABS_ALGO_TRIGGER_FORMULA_ID,
  LABS_ALGO_MOVE_SIGMA: process.env.NEXT_PUBLIC_LABS_ALGO_MOVE_SIGMA,
  LABS_ALGO_MOVE_MIN_SAMPLES: process.env.NEXT_PUBLIC_LABS_ALGO_MOVE_MIN_SAMPLES,
  LABS_ALGO_GEX_NORM_WINDOW_MIN: process.env.NEXT_PUBLIC_LABS_ALGO_GEX_NORM_WINDOW_MIN,
  LABS_ALGO_GEX_NORM_MIN_SAMPLES: process.env.NEXT_PUBLIC_LABS_ALGO_GEX_NORM_MIN_SAMPLES,
  LABS_ALGO_REENTRY_BARS: process.env.NEXT_PUBLIC_LABS_ALGO_REENTRY_BARS,
  LABS_ALGO_FLOOR_REMAINING_H: process.env.NEXT_PUBLIC_LABS_ALGO_FLOOR_REMAINING_H,
};

function bundlerKey(appendixKey: string): string {
  return `NEXT_PUBLIC_${appendixKey}`;
}

function readRaw(env: AlgoEnv, appendixKey: LabsAlgoEnvKey): string | undefined {
  const prefixed = env[bundlerKey(appendixKey)];
  if (prefixed != null && String(prefixed).trim() !== "") return String(prefixed);
  const logical = env[appendixKey];
  if (logical != null && String(logical).trim() !== "") return String(logical);
  return undefined;
}

function missing(key: LabsAlgoEnvKey): never {
  throw new AlgoConfigError(`Missing required environment variable: ${key}`, key);
}

function invalid(key: LabsAlgoEnvKey, detail: string): never {
  throw new AlgoConfigError(`Invalid environment variable: ${key} (${detail})`, key);
}

function parseNumber(env: AlgoEnv, key: LabsAlgoEnvKey): number {
  const raw = readRaw(env, key);
  if (raw == null) missing(key);
  const n = Number(raw);
  if (!Number.isFinite(n)) invalid(key, "not a finite number");
  return n;
}

function parseString(env: AlgoEnv, key: LabsAlgoEnvKey): string {
  const raw = readRaw(env, key);
  if (raw == null) missing(key);
  const s = raw.trim();
  if (s === "") invalid(key, "empty");
  return s;
}

/** Parse Appendix A. Throws AlgoConfigError naming the key. No silent default. */
export function parseAlgoConfig(env: AlgoEnv): AlgoConfig {
  for (const key of LABS_ALGO_ENV_KEYS) {
    if (readRaw(env, key) == null) missing(key);
  }
  return {
    ALGO_ENTRY_PCT: parseNumber(env, "LABS_ALGO_ENTRY_PCT"),
    ALGO_TRAIL_START_PCT: parseNumber(env, "LABS_ALGO_TRAIL_START_PCT"),
    ALGO_TRAIL_END_PCT: parseNumber(env, "LABS_ALGO_TRAIL_END_PCT"),
    ALGO_MOVE_WINDOW_MIN: parseNumber(env, "LABS_ALGO_MOVE_WINDOW_MIN"),
    ALGO_K_BASE: parseNumber(env, "LABS_ALGO_K_BASE"),
    ALGO_GAMMA_FACTOR_MIN: parseNumber(env, "LABS_ALGO_GAMMA_FACTOR_MIN"),
    ALGO_GAMMA_FACTOR_MAX: parseNumber(env, "LABS_ALGO_GAMMA_FACTOR_MAX"),
    ALGO_PROXIMITY_FACTOR_MIN: parseNumber(env, "LABS_ALGO_PROXIMITY_FACTOR_MIN"),
    ALGO_PROXIMITY_FACTOR_MAX: parseNumber(env, "LABS_ALGO_PROXIMITY_FACTOR_MAX"),
    ALGO_K_CLAMP_MIN: parseNumber(env, "LABS_ALGO_K_CLAMP_MIN"),
    ALGO_K_CLAMP_MAX: parseNumber(env, "LABS_ALGO_K_CLAMP_MAX"),
    ALGO_CONVEXITY_MIN_PCT: parseNumber(env, "LABS_ALGO_CONVEXITY_MIN_PCT"),
    ALGO_CONVEXITY_MAX_PCT: parseNumber(env, "LABS_ALGO_CONVEXITY_MAX_PCT"),
    ALGO_FREEWING_CENTS: parseNumber(env, "LABS_ALGO_FREEWING_CENTS"),
    ALGO_PULSE_ON_PCT: parseNumber(env, "LABS_ALGO_PULSE_ON_PCT"),
    ALGO_PULSE_OFF_PCT: parseNumber(env, "LABS_ALGO_PULSE_OFF_PCT"),
    ALGO_TRIGGER_FORMULA_ID: parseString(env, "LABS_ALGO_TRIGGER_FORMULA_ID"),
    ALGO_MOVE_SIGMA: parseNumber(env, "LABS_ALGO_MOVE_SIGMA"),
    ALGO_MOVE_MIN_SAMPLES: parseNumber(env, "LABS_ALGO_MOVE_MIN_SAMPLES"),
    ALGO_GEX_NORM_WINDOW_MIN: parseNumber(env, "LABS_ALGO_GEX_NORM_WINDOW_MIN"),
    ALGO_GEX_NORM_MIN_SAMPLES: parseNumber(env, "LABS_ALGO_GEX_NORM_MIN_SAMPLES"),
    ALGO_REENTRY_BARS: parseNumber(env, "LABS_ALGO_REENTRY_BARS"),
    ALGO_FLOOR_REMAINING_H: parseNumber(env, "LABS_ALGO_FLOOR_REMAINING_H"),
  };
}

let cached: AlgoConfig | null = null;

export function resetAlgoConfigCache(): void {
  cached = null;
}

/** Abort naming the key when the inlined public map is incomplete. */
export function getAlgoConfig(): AlgoConfig {
  if (cached) return cached;
  cached = parseAlgoConfig(PUBLIC_ALGO_ENV);
  return cached;
}

/** Appendix A v1 values — tests only. Production reads env. */
export const ALGO_APPENDIX_A_V1: Record<LabsAlgoEnvKey, string> = {
  LABS_ALGO_ENTRY_PCT: "75",
  LABS_ALGO_TRAIL_START_PCT: "75",
  LABS_ALGO_TRAIL_END_PCT: "25",
  LABS_ALGO_MOVE_WINDOW_MIN: "20",
  LABS_ALGO_K_BASE: "1.5",
  LABS_ALGO_GAMMA_FACTOR_MIN: "0.7",
  LABS_ALGO_GAMMA_FACTOR_MAX: "1.3",
  LABS_ALGO_PROXIMITY_FACTOR_MIN: "0.8",
  LABS_ALGO_PROXIMITY_FACTOR_MAX: "1.2",
  LABS_ALGO_K_CLAMP_MIN: "1.0",
  LABS_ALGO_K_CLAMP_MAX: "2.5",
  LABS_ALGO_CONVEXITY_MIN_PCT: "5",
  LABS_ALGO_CONVEXITY_MAX_PCT: "10",
  LABS_ALGO_FREEWING_CENTS: "10",
  LABS_ALGO_PULSE_ON_PCT: "20",
  LABS_ALGO_PULSE_OFF_PCT: "25",
  LABS_ALGO_TRIGGER_FORMULA_ID: "manual_confirm",
  LABS_ALGO_MOVE_SIGMA: "1.0",
  LABS_ALGO_MOVE_MIN_SAMPLES: "10",
  LABS_ALGO_GEX_NORM_WINDOW_MIN: "90",
  LABS_ALGO_GEX_NORM_MIN_SAMPLES: "30",
  LABS_ALGO_REENTRY_BARS: "3",
  LABS_ALGO_FLOOR_REMAINING_H: "1.0",
};

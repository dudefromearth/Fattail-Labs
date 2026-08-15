/** ToS order-script handoff into the Trade Log sheet (DL-360). */

import type { Trade } from "@/lib/tradeLog";
import {
  parseTosScript,
  type ParsedTosTrade,
} from "@/lib/options-lab/tosParser";

/**
 * Cheap first look — not a full parse.
 * Not text → no. First line must start like a ToS ticket
 * (`BUY +1 …` / `SELL -1 …`). Anything else is a pass.
 */
const TOS_HEAD = /^(?:BUY|SELL)\s+[+\-]?\d+\b/i;

export function looksLikeTosScript(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const first = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find(Boolean);
  if (!first) return false;
  return TOS_HEAD.test(first);
}

export function detectTosScript(
  raw: unknown,
): ParsedTosTrade | null {
  if (!looksLikeTosScript(raw)) return null;
  const text = String(raw).trim();
  const first = text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .find(Boolean);
  if (!first) return null;
  return parseTosScript(first) || parseTosScript(text);
}

export function tosStrategyCode(parsed: ParsedTosTrade): string {
  switch (parsed.structure) {
    case "butterfly":
      return "BUTTERFLY";
    case "vertical":
      return "VERTICAL";
    case "single":
      return "SINGLE";
    default:
      return "CUSTOM";
  }
}

const TOS_MEMORY_KEY = "ft.tos.lastScript";

/** Remember a ticket we already have (Labs copy or a normal paste). Never reads the OS clipboard. */
export function rememberTosScript(raw: unknown): string | null {
  const parsed = detectTosScript(raw);
  if (!parsed) return null;
  try {
    sessionStorage.setItem(TOS_MEMORY_KEY, parsed.raw);
  } catch {
    /* private mode */
  }
  return parsed.raw;
}

export function lastRememberedTosScript(): string | null {
  try {
    const raw = sessionStorage.getItem(TOS_MEMORY_KEY);
    return detectTosScript(raw) ? String(raw).trim() : null;
  } catch {
    return null;
  }
}

/**
 * Read the OS clipboard from a user gesture (New Trade click).
 * This is the only browser API that can see a ticket copied in thinkorswim.
 * Chrome/Safari may show their own Paste chip; we do not add one.
 */
export function peekClipboardForTos(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
    return Promise.resolve(null);
  }
  return navigator.clipboard
    .readText()
    .then((text) => {
      if (typeof text !== "string" || !text.trim()) return null;
      if (!looksLikeTosScript(text)) return null;
      return text;
    })
    .catch(() => null);
}

/** Same book, symbol, expiry, and strike set as an unmatched open. */
export function matchOpenForTos(
  opens: Trade[],
  parsed: ParsedTosTrade,
): Trade | null {
  const symbol = parsed.symbol.toUpperCase();
  const exp = parsed.expiration;
  const strikes = [...parsed.strikes]
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b)
    .join("/");
  const strat = tosStrategyCode(parsed);
  for (const o of opens) {
    const legs = o.legs || [];
    const under = (
      legs.find((l) => l.underlier)?.underlier ||
      legs.find((l) => l.symbol)?.symbol ||
      ""
    ).toUpperCase();
    const oexp = (legs.find((l) => l.expiry)?.expiry || "").slice(0, 10);
    const ostrikes = legs
      .map((l) => l.strike)
      .filter((s): s is number => s != null && Number.isFinite(Number(s)))
      .map((s) => Number(s))
      .sort((a, b) => a - b)
      .join("/");
    const stratOk =
      !o.strategy ||
      o.strategy === "CUSTOM" ||
      o.strategy === "UNKNOWN" ||
      o.strategy === strat;
    if (under === symbol && oexp === exp && ostrikes === strikes && stratOk) {
      return o;
    }
  }
  return null;
}

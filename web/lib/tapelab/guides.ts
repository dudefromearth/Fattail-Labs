// Published Tape Labs guides. The id is an allowlist, never a path from the request.

import { readFileSync } from "node:fs";
import path from "node:path";

export const TAPE_GUIDE_IDS = ["health", "symbol", "backtest", "gaps"] as const;

export type TapeGuideId = (typeof TAPE_GUIDE_IDS)[number];

export const TAPE_GUIDE_FILES: Record<TapeGuideId, { filename: string }> = {
  health: { filename: "tape-labs-health.md" },
  symbol: { filename: "tape-labs-symbol-view.md" },
  backtest: { filename: "tape-labs-backtest.md" },
  gaps: { filename: "tape-labs-gaps.md" },
};

const ID_SET = new Set<string>(TAPE_GUIDE_IDS);

export function tapeGuideId(name: string): TapeGuideId | null {
  const base = name.endsWith(".md") ? name.slice(0, -3) : name;
  if (!ID_SET.has(base)) return null;
  return base as TapeGuideId;
}

export function readTapeGuide(id: TapeGuideId): string {
  const file = path.join(process.cwd(), "content", "tapelabs", `${id}.md`);
  return readFileSync(file, "utf8");
}

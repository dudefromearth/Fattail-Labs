import { getJSON } from "@/lib/client";
import type { ReplaySample } from "./algoDayReplay";

export type AlgoReplayDay = { day: string; source: string };

export type AlgoReplayPath = {
  day: string;
  symbol: string;
  source: string | null;
  vol: boolean;
  samples: ReplaySample[];
  sample_count: number;
  hole?: string | null;
};

export async function fetchAlgoReplayDays(
  symbol: string,
): Promise<AlgoReplayDay[]> {
  const doc = await getJSON<{ days?: AlgoReplayDay[] }>(
    `/api/me/options-lab/algo-replay/days?symbol=${encodeURIComponent(symbol)}`,
  );
  return doc?.days ?? [];
}

export async function fetchAlgoReplayPath(
  symbol: string,
  day: string,
): Promise<AlgoReplayPath | null> {
  try {
    const r = await fetch(
      `/api/me/options-lab/algo-replay/path?symbol=${encodeURIComponent(symbol)}&day=${encodeURIComponent(day)}`,
      { credentials: "same-origin" },
    );
    if (!r.ok) {
      return {
        day,
        symbol,
        source: null,
        vol: false,
        samples: [],
        sample_count: 0,
        hole: r.status === 401 || r.status === 403 ? "NO PATH" : "NO PATH",
      };
    }
    return (await r.json()) as AlgoReplayPath;
  } catch {
    return {
      day,
      symbol,
      source: null,
      vol: false,
      samples: [],
      sample_count: 0,
      hole: "NO PATH",
    };
  }
}

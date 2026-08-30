/**
 * VIX (and other tapes) at the playhead — Labs marks route. TMI-94 / TMI-95.
 * Source travels with the mid. Never live. Never generation.vix.
 */

import { useEffect, useState } from "react";
import { defaultArchiveGet, marksUrl } from "./archiveApi";
import { useTmReplayActive } from "./useTmReplayActive";
import { playheadMeta } from "./tmChainAtT";
import { subscribeTmSlots } from "./tmSlots";

export type TmMarkRow = {
  symbol: string;
  mid: number | null;
  source: string | null;
  label: string | null;
  hole: string | null;
  captured_at: string | null;
};

export async function fetchMarksAtT(opts: {
  day: string;
  tMs: number;
  symbols?: string;
}): Promise<TmMarkRow[]> {
  const t = new Date(opts.tMs).toISOString();
  const url = marksUrl({
    day: opts.day,
    t,
    symbols: opts.symbols ?? "VIX",
  });
  const res = await defaultArchiveGet(url);
  const body = res.body as { marks?: TmMarkRow[]; hole?: string | null } | null;
  if (!body || !Array.isArray(body.marks)) return [];
  return body.marks;
}

export function useTmArchiveVix(): {
  mid: number | null;
  source: string | null;
  label: string | null;
  hole: string | null;
} {
  const replay = useTmReplayActive();
  const [row, setRow] = useState<{
    mid: number | null;
    source: string | null;
    label: string | null;
    hole: string | null;
  }>({ mid: null, source: null, label: null, hole: null });
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeTmSlots(() => setTick((n) => n + 1)), []);
  const meta = playheadMeta();
  useEffect(() => {
    if (!replay || !meta.day || meta.tMs == null) {
      setRow({ mid: null, source: null, label: null, hole: null });
      return;
    }
    let live = true;
    void fetchMarksAtT({ day: meta.day, tMs: meta.tMs, symbols: "VIX" }).then(
      (rows) => {
        if (!live) return;
        const vix = rows.find((r) => r.symbol === "VIX");
        if (!vix) {
          setRow({ mid: null, source: null, label: null, hole: "VIX NO" });
          return;
        }
        setRow({
          mid: vix.mid,
          source: vix.source,
          label: vix.label,
          hole: vix.hole,
        });
      },
    );
    return () => {
      live = false;
    };
  }, [replay, tick, meta.day, meta.tMs]);
  if (!replay) return { mid: null, source: null, label: null, hole: null };
  return row;
}

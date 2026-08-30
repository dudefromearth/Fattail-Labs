"use client";

import { useCallback, useEffect, useState } from "react";
import { nyYmd } from "./algoDayReplay";
import {
  ensureTmHost,
  getTmHost,
  loadTmDay,
  subscribeTmHost,
  tmNeedMonth,
  tmPause,
  tmPlay,
  tmSeek,
  tmSetSpeed,
  tmStop,
  type TmHostView,
} from "./tmHost";
import { useTmReplayActive } from "./useTmReplayActive";
import { getTmSlots, subscribeTmSlots } from "./tmSlots";

export function useTimeMachineHost(symbol: string) {
  const [view, setView] = useState<TmHostView>(() => {
    ensureTmHost(symbol);
    return { ...getTmHost() };
  });
  const replayOn = useTmReplayActive();
  const [tMs, setTMs] = useState(() => getTmSlots().playhead.t_ms);

  useEffect(() => {
    ensureTmHost(symbol);
    setView({ ...getTmHost() });
    return subscribeTmHost(() => setView({ ...getTmHost() }));
  }, [symbol]);

  useEffect(
    () =>
      subscribeTmSlots(() => {
        setTMs(getTmSlots().playhead.t_ms);
      }),
    [],
  );

  const tmActive = replayOn || view.loading;
  const onNeedMonth = useCallback(
    (from: string, to: string) => tmNeedMonth(symbol, from, to),
    [symbol],
  );
  return {
    ...view,
    replayOn,
    tmActive,
    tMs,
    loadDay: (day: string) => void loadTmDay(day, symbol),
    onNeedMonth,
    onPlay: tmPlay,
    onPause: tmPause,
    onStop: tmStop,
    onLeave: () => void loadTmDay("", symbol),
    onSeek: tmSeek,
    onSpeed: tmSetSpeed,
    today: nyYmd(),
  };
}

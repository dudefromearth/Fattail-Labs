"use client";

import AnalyzerDayReplayHud from "@/components/options-lab/AnalyzerDayReplayHud";
import AnalyzerTimeMachineStrip from "@/components/options-lab/AnalyzerTimeMachineStrip";
import ReplayWatermark from "@/components/options-lab/ReplayWatermark";
import { useTimeMachineHost } from "@/lib/options-lab/useTimeMachineHost";

/** Shared strip + HUD + watermark for Heatmap and Surface. One playhead. */
export default function TimeMachineChrome(props: {
  symbol: string;
  watermarkTestId: string;
}) {
  const tm = useTimeMachineHost(props.symbol);
  return (
    <>
      <AnalyzerTimeMachineStrip
        day={tm.day}
        onDay={tm.loadDay}
        onUncovered={tm.loadDay}
        coverage={tm.coverage}
        onNeedMonth={tm.onNeedMonth}
        fidelity={tm.fidelity}
        hole={tm.hole}
        samples={tm.samples}
        playing={tm.playing}
        speed={tm.speed}
        onSpeed={tm.onSpeed}
        replayActive={tm.tmActive}
        onPlay={tm.onPlay}
        onPause={tm.onPause}
        onLeave={tm.onLeave}
        onStop={tm.onStop}
        loading={tm.loading}
        playheadT={tm.tMs}
      />
      {tm.tmActive ? (
        <ReplayWatermark testId={props.watermarkTestId} layer="over-canvas" />
      ) : null}
      {tm.tmActive ? (
        <AnalyzerDayReplayHud
          day={tm.day}
          samples={tm.samples}
          cursor={tm.cursor}
          hole={tm.hole}
          loading={tm.loading}
          onSeek={tm.onSeek}
        />
      ) : null}
    </>
  );
}

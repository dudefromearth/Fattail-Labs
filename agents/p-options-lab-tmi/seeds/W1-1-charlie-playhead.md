# Seed W1-1 — Charlie playhead owner + adapter

**Project:** p-options-lab-tmi  
**Agent:** Charlie  
**Phase:** W1  
**Depends:** W0-BA  
**Law:** TMI-17, 18, 19, 42 · reuse `algoDayReplay.ts` · plan §5.2  
**Gate it feeds:** W1-G

## In scope

- New `web/lib/options-lab/instantReplay.ts` + tests  
- `slotsToReplaySamples(slots)` with sample→slot map  
- Playhead owner singleton (engagement, `t_ms`, transport, speed) beside the stream book  
- Reuse `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` / `REPLAY_SPEEDS` (`10`\|`20`\|`50`)

## Out of scope

`HeatmapChainPanel.tsx` · `HeatmapControlsColumn.tsx` · `OpfRiskAnalyzer.tsx` · `SurfaceApp.tsx` · `AnalyzerTimeMachineStrip.tsx` · inspector chrome · glow

## Done when

AT-TMI-10, 25 fixtures green. Hosts can bind later; no private cursor type in a host file. Diff contains **none** of the chrome files above.

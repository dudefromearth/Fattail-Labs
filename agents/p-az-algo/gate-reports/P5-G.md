# P5-G — Delta LIVE EVAL

**Verdict:** **HOLD**  
**Date:** 2026-09-03  
**Clock:** 08:10 EDT Thursday. **RTH is 09:30–16:00 ET.** Market was closed when this fire ran.

AT-ALGO-18’s exit is a **live-session transcript** during RTH. A mocked clock is not that exit. No fixture was substituted.

## Code that is ready (not the exit)

Trap **inverted**, not weakened:

- Deleted `if (!alert.algo.demo) return alert` from `tickAlgoAlert`.
- Deleted the test literally named `non-demo does not tick`.
- New test: `AT-ALGO-18 live (demo false) ticks on the raw mark`.
- Call site ticks **live** alerts on `rawMarkForAlerts`. Demo remains a **clock** (What-if / TM / rehearsal playhead).

```
cd web && npx --yes tsx lib/options-lab/algoEval.test.ts
algoEval AT-ALGO-18
  ok  AT-ALGO-18 live (demo false) ticks on the raw mark
  ok  demo: move spot to arm, time to tighten f
  ok  AT-ALGO-12 algoEval has no 1s heavy resolve
```

Keep-Warm idle is 30s, never 1s (`opfPollInterval.test.ts` ok). Frozen gex / Advanced Fly / Width Fit: `gex.limLink.test.ts` ok · `advancedFly.structure.test.ts` ok · `widthFit.test.ts` ok.

## Missing (the actual gate)

Live-session transcript: Algo, **Demo OFF**, live raw mark, gate → Managing, guide moves, **timestamps, during RTH**.

**Do not PASS this gate until that transcript exists.** Re-fire after 09:30 ET.

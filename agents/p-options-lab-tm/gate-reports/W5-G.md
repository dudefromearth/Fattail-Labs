# W5-G — past-day StudioOne into the archive slot

**Agent:** Delta  
**Date:** 2026-08-28  
**Verdict:** **PASS**

**Law:** plan v1.2 W5-G · TMI-79 v0.7.4 · TMI-70 · TMI-71 · ATM-H2 · AT-TM-C4

## AT-SOAR-45 (before this gate closes)

**09:32:00 ET FIRED** — waiter pid 62786, not a missed schedule.

The 09:32 process died in **1 second**, `rc=1`, **no cadence numbers**:

```
ImportError: cannot import name 'today_ny' from 'market_data.ssr_archive_read'
```

`today_ny` lives in `ssr_live_capture.py`. Import corrected. Recovery run on StudioOne in the same Friday RTH window (`at45 start 09:32:48`).

**Recovery RESULT PASS** — `agents/p-studioone-archive-read/evidence/at45-20260828-093352.json`

| Window | count / 60s | median s | p95 s | gaps |
|--------|-------------|----------|-------|------|
| Baseline (no archive load) | 22 | 2.243 | 4.527 | 0 |
| During full-pool load (2026-08-25 SPX, 94 hits / 0 err) | 24 | 2.212 | 4.436 | 0 |

Ladder W5 is building on: live snap spacing sits in the as-built **[2, 5] s** band (median ~2.2 s, p95 ~4.5 s). ~22–24 snaps / minute. No new GAP under archive load.

## Occupancy — shown on a loaded archive day

Not inferred from an empty slot. Live walk `e2e/tm-w5-archive.spec.ts` **PASS** (8.2 s) on this workspace `:3000`. Day A = **2026-08-26** (coarse **82** gens).

| Proof | Evidence |
|-------|----------|
| Switch discards first | `setArchive` emits `null` between day A and day B (`2026-08-17`). Occupancy log contains A → `null` → B. |
| Reset drops archive; today survives | `w5-reset-keeps-today.png` — date back to today, watermark gone. Today hashes still include `e2e-pre-a` and in-load ticks. |
| Capture continues while archive is open | Occupancy log: `archiveDay=2026-08-26` with `archiveCount=0` then `82`, while `todayCount` grew **2 → 50** with contiguous `e2e-tick-*` hashes. Pre-load hashes remain a prefix. **No hole in today's cache across the load.** |
| Coarse then infill | Level 0 lands the whole session (open through close), not a left-to-right prefix. Fidelity chip on `w5-archive-loaded.png`. Mini line from those gens. |
| NO PATH greys | `w5-no-path.png` — 2026-08-22 grey, strip + HUD **NO PATH**. |
| No 1-minute walk | `OpfRiskAnalyzer` / `archiveLoad` / `archiveApi` do not call `fetchAlgoReplayPath` or `ohlc_1m`. |

Unit: `tmSlots.test.ts` ok · `archiveLoad.test.ts` ok (continuous hashes `pre-a, pre-b, during-coarse, after-coarse, during-infill`).

Shots: `evidence/w5-archive-loaded.png` · `w5-reset-keeps-today.png` · `w5-no-path.png`.

## Fail-closed (none tripped)

1-minute past-day fetch · serial left-to-right-only fill · uncovered date selectable without NO PATH · capture paused · today discarded · two archive days held.

## Not closed here

- **Surface high-IV watermark** — still open (W3). WAITING / CHECK LEGS is not that field.
- Watermark + badge together remains **W7**.
- ATM-O1 RTH-open park: the W5 walk shot parked the first generation (clock read 12:00:08 AM on 2026-08-26). `sessionOpenCursor` now prefers the first print at/after 09:30 ET. Not re-walked this gate.
- Fidelity chip on the walk shot rounded 82/20841 to **0%**; strip now labels that band **coarse**.
- Month-wide calendar greying waits on coverage of that month; 08-22 is grey because the archive named NO PATH.

## Unblocks

W6 — Heatmap, Surface, Width Fit Replay (sticky `t_ms`).

# W0-2 India — Time Machine v0.7.4 / plan v1.2

**Verdict:** **APPROVED** (build readiness)

**Agent:** India  
**Date:** 2026-08-27  
**Law:** spec v0.7.4 BUILD AUTHORITY · DL-598 · plan v1.2 · DL-599

Findings labeled **BLOCKING** vs **ADVISORY**. Nothing BLOCKING against W0-G. As-built leftovers are W1/W3/W5 work, named.

---

## Must-say (first)

1. **One surface, one playhead, two derivations, two browser slots.** Not two products. Not two cursors. Today = held (thinning) cache because you cannot archive and replay the same session at once. Past day = StudioOne chain in the archive slot.
2. **TMI-79:** today always capturing; at most one archive day. Capture does not pause. Today is not discarded because a past day was opened. Dies on TMI-73 trading-date change only.
3. **Two blobs, one playhead** (TMI-42). Opening Tuesday does not fork a cursor.
4. **Return to live** drops the archive slot and parks on **today’s newest**, not a leftover Tuesday `t_ms`.
5. **Tuesday → Monday** discards Tuesday **before** Monday is accepted.
6. Today’s slot is the continuous capture. Scrubbing today windows that slot; it does not occupy the archive slot.
7. `heldDay: Date | null` as a single occupancy variable is **BLOCKING at W2** if it appears in a diff. It is not in this tree yet. W2-G fail-closed already names it.
8. Heatmap Redis generation cache is **not** this cache. TR14 `getStreamBook()` is a **client RAM** ring for Heatmap/Width Fit, not TM film, not server Redis film.

---

## As-built quotes (path + line)

**Toolbar — Strikes/in already left of Autofit; PiP splits Autofit from TM.** Spec §11 `ml-auto` row is **stale**.

`web/components/options-lab/OpfRiskAnalyzer.tsx`:

```
1928:              "grid-cols-[auto_minmax(min-content,1fr)_auto]"
1931:            data-testid="analyzer-viewport-toolbar"
2019:            <div className="flex min-w-min flex-wrap items-center justify-center gap-2">
2025:                  Strikes/in
2051:                data-testid="analyzer-autofit"
2061:                data-testid="analyzer-pip-toggle"
2084:            <div className="flex shrink-0 items-center justify-end">
2085:              <AnalyzerTimeMachineStrip
```

No `ml-auto` in this file. W1 job: seat `AnalyzerTimeMachineStrip` **immediately right of Autofit**; PiP not between them.

**Strip already exists** — `web/components/options-lab/AnalyzerTimeMachineStrip.tsx` date, Play/Pause/Stop, `REPLAY_SPEEDS` 10/20/50 (`algoDayReplay.ts` L14–15), Reset. W4 is behaviour, not greenfield chrome.

**What-if misnomer.** Inspector heading is “What-if”; the boolean is still `timeMachineEnabled`:

`web/components/options-lab/AnalyzerControlsColumn.tsx` L410–421 `InspectorSection title="What-if"` · `aria-checked={timeMachineEnabled}` · `data-testid="analyzer-whatif-enable"`. Do not bless the identifier.

**As-built Time Machine glow (retired by TMI-25).** Analyzer still paints a **blue** inset when `tmActive`:

`OpfRiskAnalyzer.tsx` L2139–2144 `data-testid="analyzer-viewport-glow"` `data-glow="timemachine"` `rgba(59,130,246,0.55)`. What-if red at L2146–2151 `data-glow="whatif"` `rgba(239,68,68,0.5)`. W3 kills the TM glow; What-if red stays. **ADVISORY for W0** (named for W3). Not a W0 RETURN — no product code this wave.

**Past-day leftover `ohlc_1m`.** `server/market_data/algo_replay_path.py` L158 `source: "ohlc_1m"`. Client `web/lib/options-lab/algoReplayApi.ts` hits `/api/me/options-lab/algo-replay/path`. Analyzer `loadTmDay` (`OpfRiskAnalyzer.tsx` L298–311) still walks that path. **W5 retires it as a replay walk.** Fail-closed at W5-G.

**TR14 stream book.** `web/lib/runner/streamBook.ts` L1–4 “Client RAM ring of subscribed OPF generations.” `atTime` L209, `window` L235, `clear` L226 / L299. `getStreamBook()` used from `HeatmapChainPanel.tsx`. This is **not** the TM two-slot cache and **not** Heatmap Redis. India does not wrap it into server film.

**TM contract harness.** `server/tests/tm_archive_contract.py` L1–5 consumer proofs. W5 consumes; do not rebuild SO-AR.

**Cadence (named fact, not a ruling).** As-built writer: `server/market_data/ssr_live_capture.py` L53–55 `CHAIN_EVERY_S_MIN = 2.0`, `MAX = 5.0`, `DEFAULT = 2.0`. Spec §12.4 still points at DL-400’s historical [3,5] vs §0.26’s 2 s. **ADVISORY:** archive `/api/cadence` (filename deltas) was **not** hit this review (no StudioOne bounce). Named hole: **cadence distribution on disk not recorded at W0-2.** Carry into W5 / C11. Do not freeze the ladder.

**Corpus bytes.** Coach’s ~70–80 MB/day. **Named hole:** not measured on disk this review. AT-TM-C11 is the gate. Do not assume 70–80 + today fits.

**Parents *confirm* (files exist, read):**

| Parent | File |
|--------|------|
| Analyzer v0.2.1 | `Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` |
| What-If T/σ | `Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md` |
| Heatmap Templates | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` |
| Width Fit | `Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md` |
| Surface §4.6 | `Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md` (Time machine = snap rebind) |
| TR14 | `Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md` |
| Trade Log §4.4 | `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md` — `entry_source` is **three** channels (manual · import · automated). No fourth value. Matches TMI-80 (rehearsal never reaches the log). |
| AZ-ALGO | `Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md` |
| Arch 28 | `Architecture/28-massive-market-bus.md` |

**Leftover boards.** `agents/p-options-lab-tmi/PARKED.md` and `agents/p-az-atm/PARKED.md` exist. Not live law.

**§12** is a record. 12.10 is a label question, not a fourth collision. Do not ticket 12.7–12.19.

**Cache identity:** no member identity in either browser slot (spec §15 Mike). Invariant for W2.

---

## Out of GO (confirmed)

Basic chrome · TPO · 1× · Spaces · Factory · 1-minute past-day fetch · `server/` film · Redis as TM film.

---

## § Bench delta

Next invocation can quote the toolbar grid, the blue `data-glow="timemachine"` leftover, `ohlc_1m` as the W5 kill, CHAIN_EVERY_S as-built [2,5] default 2 s, and the named holes (archive cadence distribution, corpus MB on disk) without re-discovering them.

## § Flagged ideas

Inventory intact. No new flag. C11 remains the memory gate (A3): if resident blows the tab, later packet — not silent `server/` film.

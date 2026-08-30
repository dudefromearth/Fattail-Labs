# Time Machine - Instant Replay — Full Agent Bench Plan v1.0

**SUPERSEDED** as stamp target by [`docs/Options-Lab-Time-Machine-Full-Agent-Bench-Plan-v1.2.md`](./Options-Lab-Time-Machine-Full-Agent-Bench-Plan-v1.2.md) (spec **v0.7.4 BUILD AUTHORITY**). Do not stamp this revision. Board `p-options-lab-tmi` is **PARKED**.

**Date:** 2026-08-26  
**Plan revision:** **v1.0** (superseded)  
**Canonical filename:** `docs/Options-Lab-Time-Machine-Instant-Replay-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/TMI-W0.md`](../agents/go/TMI-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-options-lab-tmi/`](../agents/p-options-lab-tmi/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **TMI Spec v0.1.1** | [`Specs/FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1_1.md`](../Specs/FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1_1.md) | **DRAFT** · reviewed · **not BUILD AUTHORITY** until **W0-BA** |
| Design proposal | [`docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md`](./Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md) | Parent of the spec |
| Time Machine (Day) | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md) | Seat · ATM-* · **confirm version at W0-2** |
| Runner **TR14** | [`Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md`](../Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md) | Stream book SoR · Instant Replay = named Scrubber · **confirm filename/version** |
| Heatmap Templates | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM1–HM21 · **confirm HM21 revision** |
| Width Fit | [`Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md`](../Specs/FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md) | WF4 Average · this program adds Replay |
| Analyzer | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Host · Autofit strip · package quote |
| Surface §4.6 | [`Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md`](../Specs/FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md) | Snap-rebind · **in-program OPEN §11.5** |
| What-If T/σ | [`Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md) | Overlay allowed · never labeled Instant Replay |
| OT-EF / **DL-309** | OPF Truth doctrine v1.1 | Named holes · no invented prints |
| Arch **28** | Market bus | One WS · **no client Massive** |
| Arch **29** | Heatmap as-built | |
| HI Spec v1.0 | Dark-pinned tokens · ≥44pt · no emoji chrome | |
| North Star v1.2 | Process outcomes only · green ≠ go | |
| **DL-539** | Scope · three-OK outside program | |
| **DL-593** | Cache = raw OPF chain, any template | |
| **DL-594** | Instant Replay fractal (DRAFT spec) | Points at v0.1 file — Lima retargets at W0-1 |

**Juliet does not invent WHAT.** Coach wrote TMI §0. This plan **sequences**. §11 opens are **Coach ticks on `TMI-W0.md`**, not silent defaults.

Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
Coach overrule = **DL with reasoning**, not a waived gate.  
Reviews: findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion).  
Coach Content Law: nothing in spec §0 is removed.

---

## 0. Why this program exists

Coach (TMI §0, compressed, not rewritten):

The Heatmap cache stores **raw OPF chain** used to construct **all** Heatmap views. Play that cache and Instant Replay **any template**. Reconstruct Analyzer charts / listed strategy positions inside the cached window. Substitute live with cached; a **scrubber in the Time Machine seat**, range = the cache. Playback time instead of MB; granularity degrades as span grows; going forward only; morning slider then trailing film. Same place as Day, different fractal. **Green** inner frame on Heatmap, Analyzer, and Surface. Day stays **blue**.

v0.1.1 folded Claude + Grok review: one recorder (placement OPEN), one playhead owner, playhead by `t_ms`, TRAIL MOVED, atomic append, sampling rule, coalescing, AT-TMI-1…32.

---

## 1. Mission

```text
W0     Review + Coach §11 ticks (India · Echo · Tango · Hotel)
         → Delta W0-G → Coach W0-BA (BUILD AUTHORITY)
W1     Playhead owner + adapter (NO host chrome)
         slotsToReplaySamples · t_ms owner beside StreamBook · reuse replayCursor
W2     Recorder policy + Cache slider
         TMI-44 sampling · wipe+confirm · replayHorizon · placement per §11.4
W3     Heatmap host
         Live|Replay · strip/HUD · green glow · Cache valuetext · wings inert
W4     Analyzer projector
         fractal Day|Instant · package mark · NO FILM · Autofit-not-every-tick
W5     Width Fit Replay third
         Live | Average | Replay — Average stays a window mean
W6     Surface projector          ← own packet; HOLD unless §11.5 in-program
W7     Kilo AT-TMI-1…32
W8     Lima honesty (parents · help · DL)
W-G    Delta
```

**No product code in W0.** W1+ fire **only** after W0-BA.  
W6 does **not** fire if Coach ticks Surface **outside** this program until a **three-OK count Coach starts** (DL-539).

### 1.1 Neighbor serialization (chrome)

Instant Replay **reuses** Day transport (`AnalyzerTimeMachineStrip`, `AnalyzerDayReplayHud`, `algoDayReplay.ts`) and writes Heatmap inspector Cache (`HeatmapControlsColumn`, HM21 blob). Those files are live on other boards.

| Order | Board | Why |
|-------|--------|-----|
| **1** | `p-az-atm` **W2-G** | Strip + HUD + glow already on Analyzer. Landing: **W2-G PASS** (Basic). Do not fork a second strip. |
| **2** | `p-template-runner-stream-book` **SB1–SB4** | TR14 book + Cache MB detent + Width Fit Average. **SB5 Scrubber is this program** — TRSB must not ship a second scrubber. |
| **3** | `p-options-lab-heatmap-width-fit` | Closed Wave. Replay third does not reopen WF math. |

W1 (playhead owner + adapter) **must not** edit `OpfRiskAnalyzer.tsx`, `HeatmapChainPanel.tsx`, `HeatmapControlsColumn.tsx`, or `SurfaceApp.tsx`.  
W2+ chrome waits for W0-2 / W2-0 **live quotes** of those boards (not this table as SoR).

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | Spec v0.1.1 architecture-safe. Day ≠ Instant Replay ≠ What-if ≠ gold Surface. Arch 28: **no client Massive**. Quote **as-built** paths+lines for StreamBook `atTime`/`clear`/`push`, surviving `as_of` on same-hash replace (TMI-8), **who writes the book today** (`host.ts` and/or `HeatmapChainPanel`). Quote neighbor boards (§1.1). Confirm parent filenames (*confirm* markers). BLOCKING vs ADVISORY labeled. | Echo · Tango · Hotel · W0-G |
| **W0-3 Echo** | Green inner blur token: **not** Labs success/go green. `data-glow="instant-replay"` on three host canvases (Surface subject to §11.5). Motion vs static per Coach §11.1. Reduced-motion = static inset. 44pt strip. Cache slider HIG. | W0-G · Charlie W3 |
| **W0-4 Tango** | Copy: Instant Replay / playback time / coarser film expected / wipe confirm / TRAIL MOVED / inert wings / **this session's trail, not a saved movie**. Green ≠ go. NO FILM copy. No profit claims. | W0-G |
| **W0-5 Hotel** | Inspection of listed marks, not fills. 10 s film is a **sampled record**, not a print history. Clock shows step size. Missing leg / IV NO. Do not interpolate. Do not upsample 10s→2s. | W0-G |
| **W0-G Delta** | Spec v0.1.1 + this plan v1.0 + board on disk. India as-built quotes filed. **`TMI-W0.md` has every §11 tick.** No product code in W0. | W0-BA |
| **W0-BA Coach** | BUILD AUTHORITY. §11 ticks are law. Silent leftover ODs do **not** apply to §11. | W1 |
| **W1-G** | Adapter + playhead owner tests. Hosts bind, none owns a private cursor. **Diff must not** contain Heatmap/Analyzer/Surface chrome. | W2 |
| **W2-G** | Sampling TMI-44 · wipe+confirm · `replayHorizon` in HM21 · recorder placement AT-TMI-24 for the **named** option. | W3 |
| **W3-G** | AT-TMI-1, 2, 3, 7, 11 (Heatmap), 13 (non-WF Live\|Replay), 14, 32 | W4 · W5 |
| **W4-G** | AT-TMI-8, 9, 10, 12, 15, 17, 18, 21, 23, 28, 29 | W7 |
| **W5-G** | AT-TMI-13 Width Fit three modes | W7 |
| **W6-G** | AT-TMI-11 Surface · 16 · IV NO. **Skipped** if §11.5 out (packet HOLD, not waived). | W7 |
| **W7-G** | AT-TMI-1…32 evidence table. Skip Surface rows only if W6 HOLD with Coach tick. | W-G |
| **W-G Delta** | Ternary. Fail-closed on client Massive, second socket, invented print, color-only glow, forked strip, TRSB second scrubber, chrome before W0-BA. | Coach ship / MiniTwo **when asked** |

---

## 3. Locked (not ODs)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | Instant Replay **is Time Machine**. Same seat. Not a second product. | TMI-1 · DL-594 |
| **FP2** | Day and Instant Replay exclusive. Switching parks the other playhead. | TMI-2 |
| **FP3** | Film = TR14 raw OPF dual-side gens, this tab, RAM. Templates stay pure. | TMI-5 · TMI-6 · DL-593 |
| **FP4** | One recorder per tab; one playhead owner per tab. Hosts bind. | TMI-4 · TMI-41 · TMI-42 |
| **FP5** | Playhead is `t_ms` via `StreamBook.atTime`. Never `cursor.idx` onto the slot array. | TMI-17 · TMI-19 |
| **FP6** | Member Cache story = **playback time**. Internal ceiling **32 MiB**. | TMI-11 · TMI-12 |
| **FP7** | `max` interval **2 s** (law). `long` interval **10 s** (law). Three stops. Spans + `mid` interval = §11.6. | TMI-12 |
| **FP8** | Slider change: confirm, wipe, trail from next gen. Going forward only. | TMI-13 · TMI-14 |
| **FP9** | Reuse `replayCursor` / speeds **10 / 20 / 50**. No extra 1×. No second clock module. | TMI-18 |
| **FP10** | Green inner frame; Day blue; What-if red; Instant Replay + What-if → **green wins**. Not color-only. | TMI-25–28 |
| **FP11** | Width Fit Live \| Average \| Replay. Average ≠ Replay. | TMI-29 |
| **FP12** | Algo Alert **out** of v1 on Instant Replay. | TMI-34 |
| **FP13** | No client Massive. No gold fill. No upsample. No invented strikes/package. | TMI-37 · TMI-39 · Arch 28 · DL-309 |
| **FP14** | W1 must not edit host chrome files (§1.1). | This plan |
| **FP15** | Juliet does not invent WHAT. Coach Content Law. Delta ternary. | Doctrine |

**§11 — Coach must tick. Juliet recs are opinion. Spec forbids silent default.**

| # | Question | Juliet rec (opinion) |
|---|---------|----------------------|
| **§11.1** | Green token + motion | Named token, **not** success green; **static** inset; reduced-motion = same |
| **§11.2** | Enter playhead | **Newest** gen (live edge) |
| **§11.3** | Wipe scope · Surface strip | Wipe **current book key**. Surface: **same strip + HUD** if §11.5 in; else N/A |
| **§11.4** | Recorder lifetime | **(B) Tab lifetime** beside `getStreamBook()` — §0 item 11 |
| **§11.5** | Surface in-program? | **In-program** (route `/app/options-lab/surface`) as **W6 own packet** |
| **§11.6** | Spans + mid interval | **Measure** typical 0DTE gen bytes first, derive three spans from `CEILING_MIB`; Cache line always shows actuals. Do not ship the planning ~15/30/60 as law until measured or named |
| **§11.7** | Analyzer GEX / Probability | **Later** — do not enable on a scrubbed gen in W4 |
| **§11.8** | Engagement persist · NO FILM glow | Persist **`replayHorizon` only**. NO FILM glow **off** |
| **§11.9** | HM21 MB detent migration | Slider **unset until the member re-chooses** (honest; no silent map 8 MiB → 15 min) |
| **§11.10** | Access | **Inherit** host read gates (HM13 / Analyzer / Surface as they stand) |

Coach ticks Accept / Override on `TMI-W0.md`. A missing tick **blocks W0-BA**.

---

## 4. DAG

```text
W0-0 Coach plan stamp + §11 ticks on TMI-W0.md
  → W0-1 Lima hash (spec v0.1.1 sha1 · retarget DL-594 filename)
  → W0-2 India (parents *confirm* · as-built StreamBook / writers · §1.1 quotes)
       ├── W0-3 Echo
       ├── W0-4 Tango
       └── W0-5 Hotel
  → W0-G Delta
  → W0-BA Coach BUILD AUTHORITY
       → W1 playhead owner + adapter → W1-G
            → W2 recorder + slider → W2-G
                 → W3 Heatmap host → Echo W3-2 → W3-G
                      → W4 Analyzer → W4-G
                      → W5 Width Fit Replay → W5-G
                      → W6 Surface (if §11.5 in) → W6-G
       → W7 Kilo (after W4-G; W5/W6 if fired)
       → W8 Lima
  → W-G Delta
```

W4 / W5 / W6 are **parallel after W3-G** (different hosts; one playhead owner).  
W6 HOLD is **not** a waived gate if §11.5 is out.

---

## 5. Packets

### 5.1 W0 — review (no code)

| Seed | Agent | Fire |
|------|-------|------|
| `W0-0-coach-plan-stamp.md` | Coach | First — ticks every §11 row on `TMI-W0.md` |
| `W0-1-lima-hash.md` | Lima | After W0-0 |
| `W0-2-india-parents.md` | India | After W0-1 |
| `W0-3-echo.md` | Echo | After W0-2 |
| `W0-4-tango.md` | Tango | After W0-2 |
| `W0-5-hotel.md` | Hotel | After W0-2 |
| `W0-G-delta.md` | Delta | After W0-2…5 |
| `W0-BA-coach-build-authority.md` | Coach | After W0-G |

### 5.2 W1 — playhead owner + adapter (no host chrome)

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W1-1-charlie-playhead.md` | Charlie | **New** `web/lib/options-lab/instantReplay.ts` (+ tests). Adapter `slotsToReplaySamples`. Playhead owner module next to `getStreamBook()`. Reuse `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` / `REPLAY_SPEEDS`. **No UI.** | TMI-17, 18, 19, 42 · AT-TMI-10, 25 |
| `W1-G` | Delta | Diff **must not** contain `HeatmapChainPanel.tsx`, `HeatmapControlsColumn.tsx`, `OpfRiskAnalyzer.tsx`, `SurfaceApp.tsx`, `AnalyzerTimeMachineStrip.tsx` | W1-G |

**Must implement:** `t_ms` SoR; sample→slot map (no-spot gens omitted from mini path, still selectable); hosts will bind later; no private cursor in a host.

### 5.3 W2 — recorder + Cache slider

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W2-0-india-lock.md` | India | No code. Re-quote §1.1. Confirm §11.4 option. Name the **one** writer. Dual as-built writers (`host.ts` + panel) must become **one**. | lock |
| `W2-1-charlie-recorder.md` | Charlie | `web/lib/runner/streamBook.ts` (sampling policy **or** a recorder wrapper — do not put judgment in templates). `heatmapSession.ts` `replayHorizon`. Inspector Cache `DetentSlider` stops = TMI-12 (after §11.6). Wipe confirm. | AT-TMI-1, 3, 4, 5, 20, 24, 27, 30 |
| `W2-2-echo.md` | Echo | Cache valuetext HIG | TMI-11 |
| `W2-3-tango.md` | Tango | Coarser-film line · wipe copy · scope per §11.3 | TMI-11 · TMI-14 |
| `W2-G` | Delta | Templates still do not import `getStreamBook` | W2-G |

**Recorder placement:** implement **exactly** the option Coach ticked (§11.4 A or B). AT-TMI-24 tests that option only.

### 5.4 W3 — Heatmap host

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W3-1-charlie-heatmap.md` | Charlie | `HeatmapChainPanel.tsx` · extract/mount `AnalyzerTimeMachineStrip` + HUD (fractal `instant`). Green glow `data-glow="instant-replay"`. Host **Live \| Replay**. Bind playhead owner. Coalescing TMI-46. Wings inert TMI-45. | AT-TMI-2, 6, 7, 8, 9, 11, 14, 19, 31, 32 |
| `W3-2-echo.md` | Echo | Green token on heatmap canvas | TMI-25 · TMI-27 |
| `W3-G` | Delta | Reset → Live, book remains. No date field. | W3-G |

### 5.5 W4 — Analyzer projector

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W4-1-charlie-analyzer.md` | Charlie | `OpfRiskAnalyzer.tsx` · strip fractal Day \| Instant. Date field **hidden** on Instant. Package mark from selected gen. **NO FILM**. Autofit X = gen spot; Autofit **not** every tick (AT-TMI-28). Glow green vs blue vs red. Atomic settle TMI-K3. | AT-TMI-8, 12, 15, 17, 18, 21, 23, 26, 28, 29 |
| `W4-2-echo.md` | Echo | Analyzer green inset | TMI-25 |
| `W4-G` | Delta | Algo Create Alert **not** armed from Instant Replay playhead | W4-G |

**Analyzer GEX / Probability:** off this packet unless §11.7 is **allow**.

### 5.6 W5 — Width Fit Replay

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W5-1-charlie-width-fit.md` | Charlie | Width Fit host: **Live \| Average \| Replay**. Replay = single gen under playhead. Do not collapse Average. | AT-TMI-13 |
| `W5-G` | Delta | Average still a window mean | W5-G |

### 5.7 W6 — Surface projector (gated)

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W6-0-india-surface.md` | India | No code. If §11.5 **out**: file HOLD + three-OK reminder. If **in**: quote `SurfaceApp.tsx` / T-ortho overlap. | lock |
| `W6-1-charlie-surface.md` | Charlie | `web/components/options-lab/surface/SurfaceApp.tsx` (+ canvas). Green glow. Strip per §11.3. Rebind listed-leg IV / spot / τ from slot. **IV NO**, no interpolate, no gold download. | AT-TMI-11, 16 |
| `W6-2-echo.md` | Echo | Surface green inset | TMI-25 |
| `W6-G` | Delta | Skip only if HOLD with Coach tick | W6-G |

### 5.8 W7 / W8 / W-G

| Seed | Agent |
|------|-------|
| `W7-1-kilo-ats.md` | Kilo — AT-TMI-1…32 evidence table; AT-TMI-22 network |
| `W8-1-lima.md` | Lima — parent one-liners (spec §12) · help article (spec §13.5) · Arch 29 · DL retarget |
| `W8-2-help.md` | Lima / Charlie — Heatmap Cache + Instant Replay help: morning ritual; trailing window; wipe; **not a saved movie**; coarser film expected |
| `W-G-delta.md` | Delta |

---

## 6. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | MiniTwo until Coach asks |
| **NX2** | Client Massive · second WebSocket |
| **NX3** | Gold-disk / StudioOne full-day **chain** replay |
| **NX4** | Server member cache · multi-tab film |
| **NX5** | Upsample 10s → 2s · extra 1× |
| **NX6** | Algo Alert on Instant Replay |
| **NX7** | Analyzer or Surface as recorder in v1 |
| **NX8** | Relabeling What-if knobs Instant Replay |
| **NX9** | TRSB **SB5** second scrubber |
| **NX10** | Product code before W0-BA |
| **NX11** | Silent default of any spec §11 open |
| **NX12** | MSC / thinkorswim source copy |
| **NX13** | Tradier / flatten / orders |
| **NX14** | Replacing Surface gold Time machine |
| **NX15** | Padding / inventing gens to fill a span |

---

## 7. AT → packet map

| AT | Packet |
|----|--------|
| AT-TMI-10, 25 | W1 |
| AT-TMI-1, 3, 4, 5, 20, 24, 27, 30 | W2 |
| AT-TMI-2, 6, 7, 8, 9, 11 (Heatmap), 14, 19, 31, 32 | W3 |
| AT-TMI-8, 12, 15, 17, 18, 21, 23, 26, 28, 29 | W4 |
| AT-TMI-13 | W5 |
| AT-TMI-11 (Surface), 16 | W6 |
| AT-TMI-22 | W7 |
| All 1…32 evidence | W7 · W-G |

---

## 8. Characterization (Kilo)

Prefer **pure** adapter / playhead / sampling fixtures. Do not scrape canvas pixels for the playhead. Glow = `data-glow` + token name.

**Must-have (W1):**

1. Adapter: no-spot gen omitted from mini path; scrubbing to its `t_ms` still selects **that** slot.  
2. `replayCursor` 10×: 1 wall-second → 10 session-seconds; speed change does not jump.  
3. Playhead owner is a singleton; two host binds see the same `t_ms`.

**Must-have (W2):**

1. 2 s live gens + 10 s stop → one write per ≥10 s of `as_of`; same-hash replace does not reset the clock.  
2. Stop change confirms, `clear`s, cannot recover wiped 2 s ticks.  
3. `replayHorizon` in `ft_labs_heatmap_session`; generation bytes **absent**.

**Must-have (W3+):** AT-TMI-31 coalescing (`run()` ≤ one per frame). AT-TMI-29 atomic settle (no Live mark with a replay clock). AT-TMI-22 no Massive host from the client.

---

## 9. Files (as-built to verify — not law)

Every row is an **assertion to re-read at W0-2**. Plan landing quotes:

| Path | Honesty at plan landing |
|------|-------------------------|
| `web/lib/runner/streamBook.ts` | Book exists. `atTime` / `window` / `clear` / `CEILING_MIB=32`. Member story still **MiB** (`BUDGET_STOPS_MIB` 4/8/16/32). Evict global oldest. Same-hash replace + surviving `as_of` — **read and record**. |
| `web/lib/runner/host.ts` | **`getStreamBook().push` on every `fire()`** (~L212). Writer candidate for TMI-4. |
| `web/components/options-lab/HeatmapChainPanel.tsx` | Also **`push`** (~L842). Dual-writer risk. Cache detent still MiB. |
| `web/lib/options-lab/heatmapSession.ts` | Persists `cacheBudgetMib`. **No** `replayHorizon` yet. |
| `web/lib/options-lab/algoDayReplay.ts` | Day film cursor. Reuse; do not fork. |
| `web/components/options-lab/AnalyzerTimeMachineStrip.tsx` | Day strip. Date field. Fractal prop **absent**. |
| `web/components/options-lab/AnalyzerDayReplayHud.tsx` | Day HUD. |
| `web/components/options-lab/OpfRiskAnalyzer.tsx` | `data-glow="timemachine"` \| `"whatif"`. No Instant Replay. |
| `web/components/options-lab/WidthFitRanking.tsx` | Live \| Average. No Replay. |
| `web/components/options-lab/surface/SurfaceApp.tsx` | Route `/app/options-lab/surface`. **No** Instant Replay strip/glow. |
| `web/components/options-lab/HeatmapControlsColumn.tsx` | Cache DetentSlider MiB. TRSB grant (DL-539 on TRSB-W0). |

**W1 new file:** `web/lib/options-lab/instantReplay.ts` (+ tests).  
**Do not** add a second StreamBook.

---

## 10. Coordination

| Board | Rule |
|-------|------|
| `p-az-atm` | Reuse strip/HUD/cursor. Do not steal Day calendar. Instant Replay is the **fine** fractal on the same seat. Landing: W2-G **PASS** Basic. |
| `p-template-runner-stream-book` | Book SoR. **SB5 Scrubber = this board.** Do not implement a TRSB-native scrubber. |
| `p-options-lab-heatmap-width-fit` | Closed. Replay third only. |
| `p-options-lab-heatmap` | Do not reopen AF Wave-1. |
| `p-az-what-if-tm` / What-if T/σ | Overlay allowed (TMI-35). Time/Spot% inert while Instant Replay playhead active. |
| `p-az-algo` | Algo **out** of Instant Replay v1. Day keeps ATM-A1. |
| `p-options-lab-surface-autofit` / T-ortho | W6 must not steal T-ortho chrome. Quote at W6-0. |

### 10.1 Neighbor snapshot (plan landing 2026-08-26 — not a skip of W0-2 / W2-0)

| Neighbor | Artifact | Excerpt |
|----------|----------|---------|
| `p-az-atm` | `ORCHESTRATOR.md` | W0-BA **GO**. W1-G **PASS**. W2-G **PASS** (Basic). W3 Enhanced not marked done. |
| `p-template-runner-stream-book` | `ORCHESTRATOR.md` | SB0 **GO**. SB1–SB3 **in progress**. SB4 blocked on SB3-G. **SB5 Scrubber blocked**. |
| `p-options-lab-heatmap-width-fit` | `ORCHESTRATOR.md` | WF5-G **PASS**. Program closed. |

**Implication:** W1 can BA without waiting on TRSB SB4. **W2 Cache slider** shares `HeatmapControlsColumn` with TRSB SB2 — W2-0 must quote SB2/SB3 live. **W3 Heatmap host** shares `HeatmapChainPanel` — HOLD if TRSB SB4 is in flight on that file.

---

## 11. Roster

| Callsign | Role |
|----------|------|
| **Coach** | W0-0 ticks · W0-BA · ship |
| **Juliet** | Board · seeds · DAG · NX |
| **India** | Spec integrity · as-built quotes · recorder one-writer · Surface tree |
| **Charlie** | Playhead · recorder · hosts |
| **Echo** | Green token · Cache HIG · strip 44pt |
| **Tango** | Instant Replay copy · not a movie · green ≠ go |
| **Hotel** | Sampled record ≠ print history · OT-EF holes |
| **Kilo** | AT-TMI-1…32 |
| **Delta** | All gates ternary |
| **Lima** | Hash · DL-594 retarget · parent patches · help · Arch 29 |
| **Mike** | Client-only; no new trust boundary |
| **Foxtrot** | Deploy only if Coach asks |

---

## 12. Help (after W3-G, with W8)

One Heatmap Cache + Instant Replay article:

- Morning slider ritual; trailing window from set/reset — not 9:30 unless they set it at 9:30  
- Wipe on change; going forward only  
- Live paints at full speed; film records at the stop  
- **Instant Replay is this session's trail in this tab, not a saved movie**  
- Closing the tab clears the book  
- Named holes: NO FILM · WAITING · TRAIL MOVED · NOT TRADED / CHECK LEGS / IV NO

Hotel + Tango review copy before live help.

---

## 13. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0** | 2026-08-26 | Full bench from TMI Spec **v0.1.1**. W0 includes Coach §11 ticks (no silent default). W1 playhead owner (no chrome) → W2 recorder/slider → W3 Heatmap → W4 Analyzer → W5 Width Fit Replay → W6 Surface (gated) → Kilo AT-TMI-1…32. TRSB SB5 assigned here. Dual as-built writers named for India. **DL-595**. |

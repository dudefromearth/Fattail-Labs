# FatTail Labs — Options Lab Time Machine - Instant Replay Spec v0.1.1

**Status:** DRAFT v0.1.1 — advisor revision after the v0.1 reviews (Claude external advisor · Grok external review), 2026-08-26. Design settled (Coach). **Not BUILD AUTHORITY** until Coach Phase 5.  
**Type:** Product Spec — **Time Machine - Instant Replay** (fine fractal of Time Machine: this tab's OPF chain ring).  
**Short name:** **TMI**  
**Routes:** `/app/options-lab/heatmap` · `/app/options-lab/analyzer` · `/app/options-lab/surface`  
**Filename:** `FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1_1.md`  
**Supersedes:** `FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1.md`  
**Design:** [`docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md`](../docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md)

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine - Instant Replay.

**Files / trees this spec touches** (names as the parents and as-built table use them; **exact paths are confirmed by reading the repo at bench review, not assumed here**):

- Heatmap host and inspector (`HeatmapChainPanel`, inspector Cache section, HM21 blob `ft_labs_heatmap_session`)
- TR14 stream book module (`getStreamBook()`, `StreamBook.atTime` / `window` / `clear`, `CEILING_MIB`)
- Time Machine transport (`AnalyzerTimeMachineStrip.tsx`, `AnalyzerDayReplayHud.tsx`, `algoDayReplay.ts` — `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` / `REPLAY_SPEEDS`)
- Analyzer host (viewport glow, Autofit strip, package quote)
- Width Fit host view (Live | Average | **Replay**)
- Surface canvas host (glow, strip + HUD mount, listed-leg IV rebind per Surface §4.6)
- `Specs/` parent one-line amendments (§12) and `Architecture/00-decision-log.md` (DL-594 proposed)

**Touches outside program:** **OPEN — §11.5.** The Surface host is specified against a document named as a Strategy Lab spec while its route is `/app/options-lab/surface`. Coach rules whether Surface is inside this program. If outside, the Surface items in this spec require a **three-OK count started by Coach** before the first edit (DL-539), and the build plan carries Surface as a separately gated packet. Nothing else in this spec touches identity/auth, payments, the market bus server, or MSC.

---

**Parents (normative where noted).** Cited at the **as-built** version. Post-amendment versions are named only in §12. Versions marked *confirm* are to be verified by reading `Specs/` at bench review; the cited version must match the filename (recurring drift pattern — do not inherit it).

| Doc | Role |
|-----|------|
| Time Machine Spec **v0.1.7** (as-built per design proposal; *confirm*) | **Day** fractal · transport (Play/Pause/Stop · 10×/20×/50× · Reset · HUD · `replayCursor`) · **ATM-*** IDs stay on Day. Time Machine is the **seat**; Day and Instant Replay are **fractals**. Day glow **blue**; Instant Replay glow **green**. |
| Template Runner Spec v0.1 **TR14** (*confirm*) | Stream book SoR. Templates remain pure (TR5). Instant Replay is the named **Scrubber** host view. |
| Heatmap Templates Spec **v0.2.x** (*confirm* — project copy v0.2 carries HM1–HM20; **HM21** is cited from a later revision) | HM1–HM21. Heatmap is the **recorder** (placement per §11.4). Inspector blob **HM21** persists Instant Replay *choices*, never generation bytes. |
| Width Fit Spec **v0.1.x** (*confirm*) | **WF4** Average is a TR14 host view. This spec adds **Replay** as a third host mode, not a second ranking formula. |
| Analyzer Spec **v0.2.x** (*confirm*) | Host surface · Autofit strip · package quote |
| 3D Surface App Spec **v0.1.8** §4.6 (*confirm*; filename convention `vX_Y_Z` on landing) | Surface **Time machine** = snap-rebind of listed-leg IV at \(t\). Instant Replay **supplies** TR14 gens as lawful snaps-at-\(t\) in this tab. Gold `live_capture` remains a later Day-scale feed — **not** this ring. |
| What-If T/σ Spec v0.1 | What-if = ad-hoc knobs. Overlay **allowed** (ATM-B4 / ATM-K3). Not labeled Instant Replay. |
| OT-EF / **DL-309** | Representable or named state. Never invent a print or a package debit. |
| Arch **28** | One market WebSocket. **No client Massive.** Instant Replay does not add a socket. |
| Arch **29** | Heatmap as-built map |
| Human Interface Spec v1.0 | Dark-pinned tokens · ≥44pt hits · no emoji chrome |
| North Star v1.2 | Process outcomes only. **No profit claims.** Green glow is a **mode tell**, not a go/profit signal. |
| **DL-539** | Scope statement; three-OK on trees outside the active program. |

**Does not:** MiniTwo until asked · Tradier / close / orders · gold-disk full-day chain replay · server member cache · multi-tab film · upsampling 10s→2s · a second market WebSocket · copying MSC · Algo Alert on Instant Replay in v1 · inventing strikes or package prices.

**Review protocol:** findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion). Coach Content Law: nothing in §0 is removed.

---

## Changes from v0.1 (read this first)

**Nothing in §0 was removed, reordered, reworded, or altered.** Every change below is outside §0 and is tied to a review finding. Existing TMI IDs are **not renumbered**; new laws append as TMI-41 onward. Where a v0.1 law made a choice Coach had not directed, the choice moved to §11 as a question and the law now names the open.

| Change | Where | Source |
|--------|-------|--------|
| Scope statement added; Surface in-program question raised | top · §11.5 | Claude BLOCKING 3 |
| Recorder lifetime: v0.1 contradicted itself once the Heatmap host is unmounted; laws rewritten to name one writer with placement **OPEN** | TMI-4 · TMI-22 · TMI-41 · §11.4 · AT-TMI-24 | Claude BLOCKING 1 · Grok issue 1 |
| One engagement + playhead owner, not three cursors | TMI-42 | Grok issue 1 |
| Playhead resolves by `t_ms`, not array index; explicit sample→slot map; eviction under a parked playhead named | TMI-17 · TMI-19 · TMI-43 · AT-TMI-25 · AT-TMI-26 | Claude BLOCKING 2 |
| Append-at-edge rule made atomic and testable | TMI-22 · AT-TMI-27 | Grok issue 2 |
| Playback stops: structure stays law; **span values and the mid interval are OPEN** (Coach names or build measures gen bytes and derives) | TMI-12 · §11.6 | Claude ADVISORY 4 |
| Analyzer GEX / Probability on a scrubbed gen: **OPEN** (design deferred it; v0.1 decided it) | TMI-33 · §11.7 | Claude ADVISORY 5 |
| Persisting Instant Replay engagement across reload, and glow in NO FILM: **OPEN** | TMI-16 · TMI-38 · §11.8 | Claude ADVISORY 6 · Grok issue 8 |
| Sampling rule defined; same-hash replace must show the surviving `as_of` | TMI-8 · TMI-9 · TMI-44 | Claude ADVISORY 7 |
| Slot wings / strike step govern under replay | TMI-45 | Claude ADVISORY 8 |
| Parent versions cited as-built; *confirm* markers; filename convention | Parents · §12 | Claude ADVISORY 9 |
| Playback coalescing budget; ATs for Autofit-not-every-tick, atomic settle, eviction, reload | TMI-46 · AT-TMI-28–31 | Claude ADVISORY 10 · Grok issue 2 |
| Existing HM21 megabyte detent → `replayHorizon` migration: **OPEN** | §11.9 | Claude ADVISORY 11 |
| Coarser-film copy so a 10s film under 2s live paint is expected, not a bug | TMI-11 · §5.1 | Grok issue 3 |
| Help: Instant Replay is this session's trail, not a saved movie | §13 | Grok issue 8 |
| §14 heading corrected; pulse folded into the Echo token open | §14 · §11.1 | Claude ADVISORY 12 |

---

## 0. Coach intent (do not drop)

Verbatim Coach, this thread, preserved in order:

1. The cache is a store of the **raw data coming from OPF as a chain** that is used to construct **all** the possible views created by Heatmap templates.
2. Theoretically, play back the cache and get an **instant replay of any template**.
3. If it is the raw data, then it should be **applicable to any template**.
4. It should also be able to **reconstruct a chart in the Analyzer** — e.g. construct a butterfly over the last so many minutes of cached raw data.
5. **Instant replay of heatmaps and strategy positions.** In fact **any strategy position within the timeframe of the cached data.**
6. In the Heatmap or the Analyzer, **substitute the live data with the cached data**, and create a **runner tool** that would allow the user to **scrub through the data**.
7. A data scrubber **similar to the Time Machine**, with a **range equal to the cached data**.
8. Even at **10 second intervals realtime playback is not terrible**.
9. Give the user the option of capturing **max detail for so many minutes** or **decimated detail for longer playback**. Put the cache in terms of **playback time instead of MB**, with a note that **granularity degrades as time to replay increases**. A slider that makes that relationship clear.
10. This would have to be a **setting once made, it would be going forward.** Any cached data after making the choice **might be destroyed or altered.**
11. Optimally they would **set the slider in the morning**, then they would have a **trailing replay starting at market open**. Or whenever they **reset the slider the trail would start from there**.
12. If you are scrubbing, you are **not concerned about realtime accuracy**.
13. **Start with the design.** Once details are worked out: technical spec, then build plan.
14. **Name: Time Machine - Instant Replay** — mostly because it will **play in the same place as Time Machine**, just in a **different fractal**.
15. Instant Replay mode should be **obvious**. Time Machine Day uses a **blue** blurred highlight or frame. Instant Replay uses a **green** blurred frame around the canvas while it is active. **This includes Heatmap, Analyzer, and Surface.**

Tango / Hotel / Echo / India notes sit in **§14** beside this text. They do not delete it.

---

## 1. Job

**Time Machine - Instant Replay** is the **fine fractal** of Time Machine: OnDemand for the **chain this tab already watched**.

The member is already subscribed to one OPF book (symbol + listed expiration + wing window). Live ticks paint as today. Those ticks are **also recorded** into the Heatmap Cache (TR14 stream book): raw listed chain generations, this browser tab, RAM.

Instant Replay **does not change templates or structures**. It **swaps the input**:

| Mode | Input stream | What you see |
|------|----------------|--------------|
| **Live** | Current OPF generation (WebSocket) | Now |
| **Instant Replay** | A **selected slot** in the tab cache | That `as_of` |

Any Heatmap template and any **strategy position whose legs are listed on that cached chain** can be rebuilt at that tick. Surface rebinds listed-leg IV from that same slot (Surface §4.6 snap-at-\(t\)).

**One Time Machine, two fractals** (same strip, HUD, Play/Pause/Stop/speeds/Reset; different film, range control, and glow):

| Fractal | Scale | Film | Range | Glow |
|---------|-------|------|-------|------|
| **Day** (AZ-ATM) | Session (~390 min) | Downloaded underlier path | Calendar date | **Blue** inner (Analyzer) |
| **Instant Replay** (this spec) | Trailing minutes–hour | This tab's OPF **chain** ring | Heatmap Cache | **Green** inner on Heatmap, Analyzer, **and Surface** |

Day is the session underlier. Instant Replay is the recent listed chain. The member stays in Time Machine and changes fractal.

---

## 2. Vocabulary (do not collide)

| Name | This spec | Not this spec |
|------|-----------|----------------|
| **Time Machine** | The **seat**: strip + HUD + playhead + inner glow | Inspector What-if knobs |
| **Day** | Calendar download of a 390-minute underlier path (AZ-ATM) | Instant Replay |
| **Instant Replay** | Fine fractal: TR14 OPF chain ring, this tab | Gold disk · Surface `live_capture` day |
| **What-if** | Ad-hoc time · spot · vol | Must **not** be labeled Time Machine or Instant Replay |
| **Surface Time machine** (gold) | Later snap-rebind from disk / Method v0.2 | Instant Replay may **feed** Surface with TR14 snaps; it does not download gold |
| **Recorder** (v0.1.1) | The **one** writer of TR14 slots for this tab; placement per §11.4 | A per-host writer; a second ring |
| **Playhead owner** (v0.1.1) | The **one** module holding Instant Replay engagement + playhead `t_ms` for the tab | Per-route cursor state |
| **ATM-*** | Day fractal IDs (Time Machine Spec) | Do not reuse for Instant Replay |
| **TMI-*** | This spec | — |
| **AZ-TM-*** | What-if T/σ spec | Do not reuse |

Analyzer suite map bucket 4 remains: What-if (ad-hoc) and Time Machine (replay). Time Machine now has **two fractals**. Inspector knobs stay **What-if**.

---

## 3. Laws

### 3.1 Seat and fractals

| ID | Law |
|----|-----|
| **TMI-1** | Instant Replay **is Time Machine**. Same Analyzer (and Heatmap / Surface) transport seat as Day. Not a second product with copied buttons. |
| **TMI-2** | Day and Instant Replay cannot both drive a canvas. Switching fractal **parks** the other playhead. Does not delete gold. Does not wipe the cache unless the playback-time slider itself changed (**TMI-14**). |
| **TMI-3** | Heatmap v1 hosts Instant Replay only (no Day calendar). Analyzer hosts Day **and** Instant Replay. Surface hosts Instant Replay on this film; gold Surface Time machine remains a later feed. |
| **TMI-4** (v0.1.1) | **One recorder per tab.** Exactly one writer records TR14 slots for the current book key. Analyzer and Surface **project** the same tab's `getStreamBook()` singleton; they do **not** write. Reload or a new tab is empty. **Where the recorder lives — Heatmap-host lifetime or tab lifetime — is OPEN §11.4** and decides whether the film has holes whenever Heatmap is not mounted. Until ruled, no packet may assume either. |

### 3.2 Film (TR14)

| ID | Law |
|----|-----|
| **TMI-5** | Film = TR14 `StreamSlot[]` for the current book key (`symbol\|expiration`). Each slot is the **raw OPF-held dual-side generation** already subscribed: listed contracts, spot, wings, strike step, `content_hash`, `as_of`, stale/quality. Optional Width Fit color memo is a shortcut, not a second SoR. |
| **TMI-6** | Templates stay **pure** (TR5 / HM6). They never read the book. The **host** selects a slot and `run()`s (Heatmap) or rebinds legs (Analyzer / Surface). |
| **TMI-7** | The recorder **writes** a slot when a generation lands, **any** template (not Width Fit only). **DL-593**. |
| **TMI-8** (v0.1.1) | Same `content_hash` as newest for this key → replace in place (no extra slot), **as TR14 already does**. The `as_of` that survives the replace is whatever TR14 as-built keeps; the build plan **reads `StreamBook` and records which**, and the HUD clock and range end (**TMI-23**) must show **that** surviving `as_of` — never an `as_of` the slot no longer carries. Gaps stay gaps. Do not interpolate skipped seconds. |
| **TMI-9** (v0.1.1) | Live paint stays on the socket (2s class). The book **samples on write** at the interval of the playback-time stop (**TMI-12**) using the rule in **TMI-44**. Scrubbing does not require 2s accuracy. |
| **TMI-10** | Changing symbol or listed expiration is a **different book**. Instant Replay of that key is empty until it fills. Do not cross-fill SPY→SPX or one expiry into another. |

### 3.3 Playback-time slider

| ID | Law |
|----|-----|
| **TMI-11** (v0.1.1) | Member-facing Cache control is **playback time**, not megabytes. Copy: longer playback uses fewer snapshots; detail gets coarser. Internal ceiling remains **32 MiB** (`CEILING_MIB`). **Second line of copy (Tango, from Grok issue 3):** the live view keeps painting at full speed; the film records at the step you chose — so a coarser film under a fast live paint is expected, not missing ticks. |
| **TMI-12** (v0.1.1) | **Three stops** with ids `max` / `mid` / `long`, ordered finest to coarsest, each labeled by playback span and sample interval on the Cache line. **What is law:** three stops; `max` samples at the live class (2 s); `long` samples at 10 s (Coach §0 item 8: 10-second playback is acceptable); the Cache line always shows **actual** gens · span · interval; no multi-hour stop; no stop the 32 MiB ceiling cannot hold for typical 0DTE. **What is OPEN (§11.6):** the three advertised spans and the `mid` interval. The v0.1 planning values are carried below as *planning values only*, not law: |

| Stop id | Planning valuetext (not law) | Sample interval | Intent |
|---------|------------------------------|-----------------|--------|
| `max` | `~15 min · 2s` | **2 s (law)** | Max detail (live class) |
| `mid` | `~30 min · 5s` | *5 s (open)* | Coarser |
| `long` | `~60 min · 10s` | **10 s (law, §0.8)** | Longer film |

Planning arithmetic for the record: 32 MiB at the design's ~50–80 KB/gen estimate holds roughly 400–650 gens, which is ~15 min at 2 s, ~35–50 min at 5 s, ~70–100 min at 10 s. The gen size is an **estimate, not a measurement** (the same unmeasured byte figure still open on the Stream Book ship note). §11.6 asks Coach to name the spans or direct the build to measure real gen bytes first and derive them.

| ID | Law |
|----|-----|
| **TMI-13** | Once chosen, **going forward only**. Changing the slider cannot invent 2s ticks from a 10s film. |
| **TMI-14** | On stop change: **confirm**, then **wipe** the book (`StreamBook.clear`), then trail starts at the next gen. Caption: replay from here uses this setting; what's already cached will be cleared. Wipe scope (current key or all keys) is **§11.4**-adjacent open **§11.3**; if all keys, the confirm copy says every book on this tab is cleared (Grok issue 4). |
| **TMI-15** | Morning ritual: set the slider → first gen starts the film. First *D* minutes fill; then a **trailing** window of length *D*. Resetting the slider starts a new trail from that moment. At 11:00 with a 15-minute max-detail stop the member has ~10:45–11:00, not 9:30–11:00. *(Whether the trail is continuous while the member is off the Heatmap route depends on §11.4.)* |
| **TMI-16** (v0.1.1) | HM21 persists `replayHorizon` (`max` \| `mid` \| `long`). It does **not** persist generation bytes. Closing the tab drops the book. **Whether HM21 also persists Instant Replay engagement (so a reload lands in Instant Replay with an empty film) is OPEN §11.8**; v0.1 persisted it without direction. Until ruled, packets persist `replayHorizon` only. |

### 3.4 Transport (reuse Day; do not fork)

| ID | Law |
|----|-----|
| **TMI-17** (v0.1.1) | Adapter `slotsToReplaySamples(slots): { samples: ReplaySample[], slotIndexOf: (sampleIdx) => slotIdx }`. `asOf` (else `receivedAt`) → `t_ms`; `spot` → `spot`. Gens with no usable time are omitted from the samples. Gens with no spot are omitted from the **mini path** samples but remain **selectable slots**; the adapter returns an explicit sample→slot map so an index into one is never used as an index into the other. **The host never maps `cursor.idx` straight onto the slot array.** |
| **TMI-18** | Use existing `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` / `REPLAY_SPEEDS` (`10` \| `20` \| `50`). No second clock module. No extra 1× in v1. |
| **TMI-19** (v0.1.1) | Use existing `StreamBook.atTime` / `window` / `clear` for lookup, trail, wipe. **The playhead is a `t_ms`, not an index.** The slot painted under the playhead is `StreamBook.atTime(key, playhead_t_ms)`, re-resolved on every append, eviction, and speed change. |
| **TMI-20** | **Play** from current playhead. **Pause** freezes paint; **does not** freeze recording. **Stop** parks at the **first stored gen** (start of the trail); does not exit. **Reset** leaves Time Machine: paint to Live, HUD hidden, green glow off; **does not** wipe the book. |
| **TMI-21** | Enter Instant Replay: playhead = **newest** gen (live edge of the trail) — **§11.2 open**. Clock America/New_York. HUD title **Instant Replay**; footer `N gens · span · interval` (not `N closes`). No calendar date field on this fractal. |
| **TMI-22** (v0.1.1) | While Instant Replay is on, the **recorder** (TMI-4, placement §11.4) keeps writing; the socket is not paused by the playhead. **Append at the edge is atomic:** an append first extends the stored range, then — if the playhead was on the last gen and Playing — advances to the new gen on the next frame; if Paused, the playhead `t_ms` does not move and only the HUD range grows. If Playing reaches the last gen, hold last until new gens append, then continue. No double paint and no jump on append. |
| **TMI-23** | Range = first stored `as_of` → last stored `as_of`. Never a clock longer than the book. |
| **TMI-24** | Speeds 10× / 20× / 50×: wall elapsed × speed = session elapsed across cached `t_ms`. Speed change does not jump. Clock shows step size (`10:42:00 · 10s`). |

### 3.5 Green frame (mode must be obvious)

| ID | Law |
|----|-----|
| **TMI-25** | While Instant Replay is active, a **green blurred inner frame** on the **Heatmap workspace canvas, Analyzer canvas, and Surface canvas**. Same grammar as Day's blue inset glow: `pointer-events: none`; inset blur; rounded to the canvas. Day remains **blue**. What-if remains **red**. |
| **TMI-26** | Instant Replay + What-if → **green wins** (replay is the clock). Instant Replay and Day cannot both glow (TMI-2). |
| **TMI-27** (v0.1.1) | Named test ids: `data-glow="instant-replay"` on each host canvas (`heatmap-viewport-glow` · `analyzer-viewport-glow` · `surface-viewport-glow`). Echo freezes the green token; it must **not** read as a profit/go signal. Motion: §0 item 15 asks for a **blurred frame**; whether it is static or animated is part of the Echo token open (§11.1). If animated, reduced-motion is a static inset. |
| **TMI-28** | HUD / strip copy names **Instant Replay** so color is not the only tell. |

### 3.6 Hosts

| ID | Law |
|----|-----|
| **TMI-29** | Width Fit: **Live \| Average \| Replay**. Average = mean of a window of memos. Replay = **single gen** under the playhead. Do not collapse Average into Replay. Other templates: **Live \| Replay**. |
| **TMI-30** | Switching template while Instant Replay is on does **not** exit Instant Replay. Same film, different `run()`. |
| **TMI-31** | Analyzer: package-mark representable legs from the selected gen. Missing listed leg → **NOT TRADED** / **CHECK LEGS** (OT-EF), never a fake debit/credit. Autofit **X** = **spot on the selected gen** (not Day's session open). Autofit does not fire on every playhead tick (**AT-TMI-28**). |
| **TMI-32** | Surface: rebind listed-leg IV, spot, and OPF \(\tau\) from the selected TR14 slot (Surface §4.6). Missing exact/locked IV → **IV NO**. Do not interpolate. Do not start a gold `live_capture` download to fill Instant Replay. |
| **TMI-33** (v0.1.1) | **Heatmap** GEX and other Heatmap templates **may** run on the selected gen (the chain is in the slot; design settled). Day's **ATM-B2** GEX-off does **not** apply to the Instant Replay fractal. **Analyzer** GEX / Probability during Instant Replay is **OPEN §11.7** — the design deferred it to Coach and v0.1 decided it without direction. Until ruled, the Analyzer build plan does not enable either on a scrubbed gen. |
| **TMI-34** | **Algo Alert is out of v1** on Instant Replay. Day fractal keeps Algo-on-day (ATM-A1). Do not silently point Demo at RAM gens. |
| **TMI-35** | What-if overlay **allowed**: Instant Replay owns spot and session time of the gen; What-if **Vol** may still apply; What-if Time / Spot% are inert while an Instant Replay playhead is active and say so (ATM-K3 grammar). |
| **TMI-36** | Playback-time slider lives on Heatmap inspector Cache only. Analyzer and Surface do not duplicate it. |

### 3.7 Honesty

| ID | Law |
|----|-----|
| **TMI-37** | OPF-held listed chain only. No invented strikes, mids, or package prices (**DL-309**). |
| **TMI-38** (v0.1.1) | Named holes, never a silent blank or a lying last paint after rebind: |

| Hole | When | Member sees |
|------|------|-------------|
| **NO FILM** | Analyzer or Surface Instant Replay; this tab's recorder never wrote the current book key | Named. Play off. Do not fetch gold. **Glow in this state: OPEN §11.8.** |
| **WAITING** | Recorder subscribed to the book; first gen not yet | Named. Green may be on if Instant Replay is engaged. |
| **NOT TRADED** / **CHECK LEGS** / **IV NO** | Leg missing or IV missing on the selected gen | Named at that tick. |
| **TRAIL MOVED** (v0.1.1) | The slot under a parked playhead was evicted by drop-oldest (**TMI-43**) | Named. Playhead re-resolves to the first stored gen. Never paints the evicted slot. |
| **Cache at your limit** | Book at 32 MiB (or oversize single gen) | Existing TR14 caption. Trail is dropping oldest. |

| ID | Law |
|----|-----|
| **TMI-39** | One market WebSocket. No client Massive. Not MiniTwo server cache. Not a 390-minute 2s day. |
| **TMI-40** | Process / inspection only. No profit claims on replay. Green is not a trade signal. |

### 3.8 Added in v0.1.1

| ID | Law |
|----|-----|
| **TMI-41** | **Recorder placement is one of two named options and nothing else** (§11.4). **(A) Heatmap-host lifetime:** the Heatmap host writes; when it unmounts, writing stops and the film has a **named** gap (`gap · 12 min · Heatmap not open`) that the HUD footer and mini path show — never a silent join across the hole. **(B) Tab lifetime:** the recorder lives beside the `getStreamBook()` singleton, subscribed under Arch 28's one socket, writes for the current book key whether or not any host is mounted, and stops only on tab close, book-key change, or slider wipe. §0 item 11 reads as (B). Either option keeps TMI-4 (one writer) true; neither may be assumed before Coach rules. |
| **TMI-42** | **One playhead owner per tab.** Instant Replay engagement (on/off, fractal), playhead `t_ms`, transport state, and speed live in one module beside the stream book singleton. Heatmap, Analyzer, and Surface hosts **bind** to it; none keeps a private cursor. SPA navigation between hosts changes the projector, not the playhead. (India, from Grok issue 1.) |
| **TMI-43** | **Eviction under a playhead.** Drop-oldest may evict the slot a parked or paused playhead sits on (Stop parks on the oldest slot by definition). When it does, the playhead re-resolves by `t_ms` through `StreamBook.atTime` to the nearest **stored** gen (the new first gen), the HUD names **TRAIL MOVED**, and no paint of the evicted slot survives (TMI-K3). Derived from OT-EF; Coach may rename the state. |
| **TMI-44** | **Sampling rule.** With interval *I* for the chosen stop: the recorder writes the first landed generation whose `as_of` is at least *I* after the `as_of` of the last **written** slot for this key (first gen after set/wipe always writes). Generations between writes are painted live and discarded. Same-`content_hash` replace (TMI-8) does not reset the interval clock. Full and diff pushes are both "a generation landed" once applied. |
| **TMI-45** | **Slot geometry governs under replay.** A slot carries its own wings and strike step (TMI-5). While an Instant Replay playhead is active, templates run on the slot's listed strikes; the inspector wing control reflects the slot's wings and is inert (named, not silently ignored). Changing wings while in Instant Replay does not re-run the slot on strikes it does not contain and does not fetch. Changing wings changes what the recorder writes **next**. |
| **TMI-46** | **Playback coalescing.** At 50× on a 2 s film the cursor crosses ~25 gens per wall-second. The host paints **at most one slot per animation frame — the slot under the playhead at frame time**; intermediate slots are skipped, not interpolated, not queued. Scrub drag is the same rule. Template `run()` is never invoked for a slot that will not paint. |

---

## 4. Member flow

```text
Morning (or whenever)
    → Heatmap inspector: set playback-time slider (stop labels per §11.6)
    → confirm wipe if a film already exists
    → live OPF paints; recorder writes sampled gens into TR14

Watch live
    → any template
    → Cache line: “47 gens · 18 min · 2s” + one line: live paints at full speed, film records at 2s
    → (leave Heatmap for Analyzer/Surface: film continues or shows a named gap — §11.4)

Enter Time Machine - Instant Replay
    → same transport seat as Day
    → green inner frame on Heatmap / Analyzer / Surface canvas
    → HUD title Instant Replay; no calendar
    → playhead on newest gen (§11.2); scrub or Play

Scrub / play
    → tiles, GEX, Width Fit Live cell, Verticals re-run() on the slot under the playhead (one per frame)
    → switch template without leaving Instant Replay
    → SPA Analyzer: tent / package mark at that gen — same playhead owner
    → SPA Surface: listed-leg IV rebound from that gen
    → missing leg → named state
    → parked on the oldest gen long enough → TRAIL MOVED, playhead on the new first gen

Switch fractal to Day (Analyzer)
    → Instant Replay parks; date field appears; blue glow
    → cache is not wiped

Reset
    → leave Time Machine; Live paint; HUD gone; green off; recorder unaffected
```

---

## 5. Chrome

### 5.1 Heatmap

- Inspector Cache: `DetentSlider` stops = **TMI-12** (not 4/8/16/32 MB as the member story). Valuetext = time · interval. Second line per **TMI-11** (coarser film is expected under fast live paint).
- Host segment: **Live \| Replay** (Width Fit: **Live \| Average \| Replay**).
- Transport strip + HUD over the workspace when Instant Replay is on (same components as Analyzer; no date field).
- Green inset glow on the heatmap canvas (**TMI-25**).
- Wing control reflects the slot and is inert under replay (**TMI-45**).

### 5.2 Analyzer

- Time Machine strip **to the right of Autofit** (ATM §5.1) — **same place**.
- Fractal: **Day** shows the date field; **Instant Replay** hides it and shows the trail span or the words Instant Replay.
- Shared Play / Pause / Stop / 10× / 20× / 50× / Reset.
- HUD upper-right canvas corner (ATM-H1 grammar); captions per **TMI-21**.
- Green inset glow on the Analyzer canvas. Day uses existing blue.

### 5.3 Surface (subject to §11.5)

- Same transport strip + HUD on the Surface canvas when Instant Replay is on (v1 completeness per §11.3 open: same strip, or glow + rebind first).
- Green inset glow on the Surface canvas.
- Do not label a What-if τ playhead Instant Replay (Surface §4.6 stands).

Component surgery (prefer extract, not copy): `AnalyzerTimeMachineStrip` gains fractal `day` \| `instant`; HUD gains title/footer props. Heatmap and Surface mount the same components and bind to the playhead owner (**TMI-42**).

---

## 6. Clock and projectors

**TMI-K1.** While Instant Replay has a playhead: **spot** = selected gen's spot; **as-of** = that gen's `t_ms`; chain = that gen's listed contracts. OPF \(\tau\) / remaining use **that** clock, not wall now.

**TMI-K2.** Heatmap `run(context_from_slot)`. Analyzer package quote from slot contracts. Surface \(\sigma_i(t)\) from slot IV.

**TMI-K3.** Last paint of Live must not remain as a lying Instant Replay mark after rebind (OT-EF elegant failure). Atomic settle on playhead change, on append at the edge (TMI-22), and on eviction (TMI-43).

---

## 7. Ideas inventory (Phase 0 — nothing omitted)

| Idea | Status |
|------|--------|
| Cache = raw OPF chain for **all** Heatmap templates | **IN-SCOPE** · TMI-5 · TMI-7 · **DL-593** |
| Instant replay of any template | **IN-SCOPE** · TMI-30 |
| Reconstruct Analyzer chart / butterfly from cached minutes | **IN-SCOPE** · TMI-31 |
| Any representable position in the cached timeframe | **IN-SCOPE** · TMI-31 · TMI-37 |
| Substitute live with cached; runner scrubber | **IN-SCOPE** |
| Scrubber similar to Time Machine; range = cached data | **IN-SCOPE** · TMI-1 · TMI-23 |
| 10s interval acceptable playback | **IN-SCOPE** · TMI-12 `long` (10 s is law) |
| Playback time instead of MB; granularity degrades | **IN-SCOPE** · TMI-11–16 (spans §11.6) |
| Setting going forward; cached data may be destroyed | **IN-SCOPE** · TMI-13 · TMI-14 |
| Morning slider; trailing replay from open / reset | **IN-SCOPE** · TMI-15 · TMI-41 (placement §11.4) |
| Scrubbing not realtime-accurate | **IN-SCOPE** · TMI-9 · TMI-44 |
| Name **Time Machine - Instant Replay**; same place, different fractal | **IN-SCOPE** · TMI-1 |
| **Green** blurred frame; **Heatmap, Analyzer, and Surface** | **IN-SCOPE** · TMI-25–28 (Surface tree §11.5) |
| Width Fit Live \| Average \| Replay | **IN-SCOPE** · TMI-29 |
| Record while scrubbing | **IN-SCOPE** · TMI-22 |
| Wipe + confirm on slider change | **IN-SCOPE** · TMI-14 |
| Heatmap records; Analyzer (and Surface) project | **IN-SCOPE** · TMI-4 · TMI-41 |
| Algo Alert on Instant Replay | **OUT** of v1 · TMI-34 |
| Speeds 10× / 20× / 50× | **IN-SCOPE** · TMI-18 |
| What-if overlay | **IN-SCOPE** · TMI-35 |
| Gold / StudioOne full-day chain replay | **FLAGGED** · later Day-scale feed · not this RAM ring |
| Server-side member cache | **OUT** |
| Multi-tab / multi-device film | **OUT** |
| Upsample 10s → 2s | **OUT** |
| Extra 1× speed | **FLAGGED** (Coach kept TM speeds) |
| Analyzer records the book too | **OUT** of v1 · TMI-4 |

---

## 8. Acceptance (AT-TMI)

| ID | Criterion |
|----|-----------|
| **AT-TMI-1** | Recorder writes TR14 on any template when a gen lands; GEX-only session still fills the book. |
| **AT-TMI-2** | Templates do not import `getStreamBook`. Host selects a slot then `run()`. |
| **AT-TMI-3** | Cache control valuetext is playback time · interval (e.g. `~15 min · 2s`), not `N megabytes` as the primary story; second copy line present (TMI-11). |
| **AT-TMI-4** | Changing the playback stop confirms, wipes the book, and starts a new trail. Cannot recover wiped 2s ticks. Confirm copy names the wipe scope (§11.3). |
| **AT-TMI-5** | Book sample interval matches the stop per **TMI-44** while live paint may still be 2s: with 2 s gens and a 10 s stop, exactly one write per ≥10 s of `as_of`; a same-hash replace does not reset the clock. |
| **AT-TMI-6** | Range of HUD / playhead never exceeds first–last stored `as_of`, including after a same-hash replace (TMI-8 surviving `as_of`). |
| **AT-TMI-7** | Instant Replay strip has Play / Pause / Stop / 10× / 20× / 50× / Reset and **no** date field. |
| **AT-TMI-8** | Enter Instant Replay: playhead = newest gen (or per §11.2). Stop → first stored gen. Reset → Live; book remains. |
| **AT-TMI-9** | Pause does not stop recording; new gens still land. |
| **AT-TMI-10** | Adapter: `replayCursor` walks TR14 `t_ms` at 10×: one wall-second advances ten session-seconds. Speed change does not jump. |
| **AT-TMI-11** | Heatmap Instant Replay on → **green** inset glow (`data-glow="instant-replay"`). Analyzer same. Surface same (subject to §11.5). |
| **AT-TMI-12** | Analyzer Day on → **blue** (`data-glow="timemachine"`). What-if only → **red**. Instant Replay + What-if → green. |
| **AT-TMI-13** | Width Fit exposes Live \| Average \| Replay; Average is a window mean; Replay is one gen. Other templates: Live \| Replay. |
| **AT-TMI-14** | Switch template (e.g. GEX → Verticals) while Instant Replay is on: stay in Instant Replay; tiles recompute on the same slot. |
| **AT-TMI-15** | SPA Heatmap → Analyzer same tab: same playhead `t_ms` from the one owner (TMI-42); representable butterfly shows listed package mark at that gen. |
| **AT-TMI-16** | SPA to Surface same tab: listed-leg IV rebound from that gen; missing IV → IV NO, not interpolated. |
| **AT-TMI-17** | Analyzer Instant Replay with empty book → **NO FILM**; no gold fetch; no client Massive. |
| **AT-TMI-18** | Missing listed leg on the selected gen → named OT-EF state, never an invented debit. |
| **AT-TMI-19** | Changing symbol or expiration does not play the previous book's gens. |
| **AT-TMI-20** | `replayHorizon` round-trips in `ft_labs_heatmap_session`; generation slots are absent from the blob; engagement persistence per §11.8. |
| **AT-TMI-21** | Algo Create Alert is not armed from Instant Replay playhead in v1. |
| **AT-TMI-22** | Browser network: no Massive host from the client on this path. |
| **AT-TMI-23** | Day and Instant Replay exclusive: entering one parks the other; cache not wiped. |
| **AT-TMI-24** (v0.1.1) | **Recorder placement per §11.4 ruling.** Under (A): navigate Heatmap → Analyzer for *N* minutes → back; HUD footer and mini path show a **named** gap of ~*N* min; no silent join. Under (B): same navigation; film is continuous; gen count grew by ~*N*·60/*I*. |
| **AT-TMI-25** (v0.1.1) | Adapter with a no-spot gen in the middle of the book: mini path omits it; scrubbing to its `t_ms` paints **that** slot (sample→slot map), HUD clock equals that slot's `as_of`. |
| **AT-TMI-26** (v0.1.1) | Stop (parked on oldest), then let drop-oldest evict it: HUD shows **TRAIL MOVED**, painted slot is the new first gen, clock equals its `as_of`; no paint of the evicted slot at any frame. |
| **AT-TMI-27** (v0.1.1) | Playing at the last gen while a gen appends: range extends first, playhead advances on the next frame, one paint per frame, no jump. Paused at the last gen while a gen appends: playhead `t_ms` unchanged; range grew. |
| **AT-TMI-28** (v0.1.1) | Analyzer Autofit does not fire on every playhead tick: Play 30 session-seconds on a 2 s film → Autofit invoked ≤ once (on entry) unless the member acts. |
| **AT-TMI-29** (v0.1.1) | Atomic settle (TMI-K3): screenshot at any frame during Live → Instant Replay entry, playhead change, append, or eviction shows one `as_of` in HUD and one chain on canvas; never a Live mark with a replay clock. |
| **AT-TMI-30** (v0.1.1) | Reload with `replayHorizon` persisted: `replayHorizon` restored; book empty; state per §11.8 ruling (NO FILM if engagement persisted; Live if not). |
| **AT-TMI-31** (v0.1.1) | Coalescing: Play at 50× on a 2 s film for 10 wall-seconds → `run()` invoked ≤ one per animation frame; no template `run()` for a slot that did not paint. |
| **AT-TMI-32** (v0.1.1) | Wings changed while Instant Replay active: painted slot unchanged, wing control shows the slot's wings and is inert with a named reason; next **written** slot carries the new wings. |

---

## 9. Out of scope

- MiniTwo / production deploy until Coach asks  
- Tradier, flatten, broker orders  
- Gold-disk / StudioOne full-day **chain** replay (FLAGGED cousin)  
- Server-side member cache; multi-tab film  
- Upsampling; extra 1×  
- Algo on Instant Replay  
- Analyzer or Surface as recorder in v1  
- Replacing Surface gold Time machine  
- Rewriting What-if T/σ domain  
- Any access rule beyond what the host surfaces already carry (see §11.10)

---

## 10. As-built (check first — not law)

Every row below is an **assertion to be verified by reading the file**, not evidence. The build plan cites the path and line for each before a packet depends on it.

| As-built | Honesty |
|----------|---------|
| TR14 `StreamBook` · 4/8/16/32 MiB detent · `atTime` / `window` / `clear` | Book exists. Member story is still **megabytes**. Same-hash replace behavior and surviving `as_of` — **read and record** (TMI-8). |
| Recorder write on any template (**DL-593**) | Write path exists in the Heatmap host today. Whether it survives Heatmap unmount — **read and record** (§11.4). |
| Width Fit Live \| Average | No Replay third. |
| `AnalyzerTimeMachineStrip` + HUD + `replayCursor` | Day film only. Date field always shown. Glow `timemachine` = blue. Cursor state today lives in the Analyzer host (**read and record** — TMI-42 moves it). |
| Heatmap / Surface | No Time Machine strip, no green glow. |
| Analyzer package quote | Live/held OPF only. |
| HM21 blob | Persists a **megabyte** detent today (**read and record** the key name — §11.9). |

---

## 11. Open for Coach (not silently decided)

Interview format. Each item names the v0.1 default that was struck and what changes under each answer. Nothing here is pre-answered.

1. **Echo green token and motion.** Law is a **green blurred inner frame** (§0.15). Token (emerald vs Labs success green) is Echo's, subject to "not a go/profit green." Static or animated is also Echo's; v0.1 implied a pulse without direction.
2. **Enter playhead.** v0.1 says **newest** gen (live edge). Alternative: first stored gen (trail start). Grok and Claude both lean newest; recognition is yours.
3. **Slider-wipe scope, and Surface strip completeness.** (a) Wipe **current book key** or **all keys** on stop change — v0.1 said all keys; if all keys, confirm copy says every book on this tab is cleared. (b) Surface v1: same full strip + HUD, or glow + rebind first and strip later — v0.1 said same strip.
4. **Recorder lifetime — highest-leverage ruling.** **(A)** Heatmap-host lifetime: film has named gaps whenever Heatmap is not mounted; morning ritual holds only while the member stays on Heatmap. **(B)** Tab lifetime: recorder beside the singleton; film continuous across Heatmap / Analyzer / Surface; §0 item 11 reads this way. TMI-41 carries both; AT-TMI-24 tests whichever you name.
5. **Surface: inside this program, or a separate tree?** Route is `/app/options-lab/surface`; the parent spec is named Strategy Lab. If in-program, §5.3 proceeds in this spec's packets. If a separate tree, Surface becomes its own packet behind a three-OK count you start (DL-539).
6. **Playback stops.** Three stops, `max` = 2 s and `long` = 10 s are law. The advertised spans (v0.1 planning: ~15 / ~30 / ~60 min) and the `mid` interval (v0.1: 5 s) are yours: name them, or direct the build to measure real 0DTE generation bytes first and derive spans from `CEILING_MIB`, with the Cache line always showing actuals either way.
7. **Analyzer GEX / Probability on a scrubbed gen.** Heatmap GEX on the slot is settled (design). Analyzer GEX and Probability during Instant Replay: allow, disallow, or later. v0.1 allowed without direction.
8. **Engagement persistence and NO FILM glow.** (a) Should HM21 persist "Instant Replay engaged" so a reload lands in Instant Replay with an empty film, or persist `replayHorizon` only? (b) In NO FILM, is the green frame on (mode engaged, nothing to show) or off? Tango's beside-note leans off; yours to rule.
9. **HM21 migration.** A member's persisted megabyte detent exists today. On first load after this ships, what does it become — a fixed stop, or the member re-chooses (slider unset until they do)? No default is proposed.
10. **Access.** This spec introduces no access rule; Instant Replay inherits the read gate of whichever host surface it sits on (HM13 on Heatmap; the Analyzer and Surface gates as they stand). If that inheritance is **undirected** rather than decided, say so and it becomes an open; no advisor default is offered in either direction.

Everything in §0 is **law**, not an open.

---

## 12. Parent amendments (this DRAFT)

When this spec reaches BUILD AUTHORITY, parents gain these one-line pointers (drafted in the same packet as this file; each parent's new version is the next patch of its **confirmed** as-built version, and the filename lands as `vX_Y_Z`):

- Time Machine Spec → next patch: Time Machine is the seat; Instant Replay is the fine fractal (this document); Day glow stays blue; Instant Replay glow is green; one playhead owner per tab (TMI-42).  
- Runner TR14 → Instant Replay is the named Scrubber; member story = playback time; sample interval is recorder write policy (TMI-44); recorder placement per §11.4 ruling.  
- Heatmap Templates → HM21 persists `replayHorizon` (and engagement only if §11.8 says so); Instant Replay host mode.  
- Width Fit → Live \| Average \| Replay.  
- Surface §4.6 → TR14 slot is a lawful snap-at-\(t\) for Instant Replay in this tab (subject to §11.5).

---

## 13. Suggested path after BUILD AUTHORITY

1. Phase 2 **India:** singleton book; one recorder (per §11.4) and one playhead owner (TMI-42); no second socket; no Massive; wipe scope; NO FILM path; Surface tree ruling applied.  
2. Phase 3 **Echo + Tango:** green token and motion; HUD "Instant Replay"; Cache valuetext and the coarser-film line (TMI-11); wipe-scope confirm copy; TRAIL MOVED and inert-wing copy; no profit chrome.  
3. Phase 4 **Hotel:** inspection-only; green ≠ signal; missing-leg and IV-missing states; decimated film cannot be read as a print history.  
4. Coach Phase 5 stamp → full-agent bench plan (Grok Build): extract strip/HUD fractal props → playhead owner + adapter → Heatmap host → Analyzer → Surface (own packet if §11.5 says so) → Width Fit Replay third → Kilo AT-TMI-1…32 → Delta.  
5. Help article (Heatmap Cache + Instant Replay): morning slider ritual; trailing window; wipe on change; **Instant Replay is this session's trail in this tab, not a saved movie** — closing the tab clears it (Grok issue 8); coarser film is expected under fast live paint.  
6. Lima DL already proposed as **DL-594**.

No implementation until Coach Phase 5 / GO.

---

## 14. Reviewer notes (beside §0; more land in Phase 2–4)

India / Echo / Tango / Hotel / Victor write **beside** §0. They do not delete Coach text.

**Beside (Tango, not a deletion):** green must not read as "good trade / go." HUD names Instant Replay. Observation-only copy on replay. A green frame over an empty film (NO FILM) is the state most likely to read as "something is on" — see §11.8.

**Beside (Hotel, not a deletion):** Instant Replay of listed marks is inspection of what was on the chain, not a forecast and not a fill. A 10 s film is a sampled record, not a print history; the step size on the clock is the honesty.

**Beside (India, from Grok issue 1, not a deletion):** one engagement + playhead owner per tab; hosts bind, never fork (TMI-42).

---

## 15. Document control

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-08-26 | Coach Instant Replay: Time Machine fine fractal; TR14 film; playback-time slider; green inner frame on Heatmap, Analyzer, and Surface; Heatmap records; Analyzer + Surface project; Width Fit Live\|Average\|Replay; Algo out; What-if overlay on. **DL-594** proposed. |
| **v0.1.1** | 2026-08-26 | Advisor revision after Claude and Grok reviews. §0 unchanged. Scope statement (DL-539). Recorder lifetime named as one writer with placement OPEN (TMI-4, TMI-41, §11.4). One playhead owner (TMI-42). Playhead by `t_ms`; explicit sample→slot map; eviction named TRAIL MOVED (TMI-17, TMI-19, TMI-43). Atomic append at edge (TMI-22). Sampling rule (TMI-44). Slot geometry governs (TMI-45). Coalescing (TMI-46). Stops: structure law, spans and mid interval OPEN (TMI-12, §11.6). Analyzer GEX/Prob OPEN (§11.7). Engagement persistence + NO FILM glow OPEN (§11.8). HM21 migration OPEN (§11.9). Access inheritance named, not defaulted (§11.10). Coarser-film copy; session-trail help line. Parents cited as-built with *confirm* markers. AT-TMI-24…32 added. |

**One-line law:**  
**Time Machine stays one machine; Instant Replay is the fine fractal — this tab's trailing OPF chain, one recorder and one playhead, same transport as Day, green frame on Heatmap / Analyzer / Surface, any template or listed-leg position, never a second market, never a fake print, never a paint the clock doesn't own.**

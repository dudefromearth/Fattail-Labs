# FatTail Labs — Options Lab Time Machine - Instant Replay Spec v0.1

**Status:** DRAFT — Coach 2026-08-26. Design settled. **Not BUILD AUTHORITY** until Coach Phase 5.  
**Type:** Product Spec — **Time Machine - Instant Replay** (fine fractal of Time Machine: this tab’s OPF chain ring).  
**Short name:** **TMI**  
**Routes:** `/app/options-lab/heatmap` · `/app/options-lab/analyzer` · `/app/options-lab/surface`  
**Filename:** `FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1.md`  
**Design:** [`docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md`](../docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md)

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [Time Machine Spec v0.1.8](./FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md) | **Day** fractal · transport (Play/Pause/Stop · 10×/20×/50× · Reset · HUD · `replayCursor`) · **ATM-*** IDs stay on Day. Time Machine is the **seat**; Day and Instant Replay are **fractals**. Day glow **blue**; Instant Replay glow **green**. |
| [Template Runner Spec v0.1](./FatTail-Labs-Template-Runner-Spec-v0_1.md) **TR14** | Stream book SoR. Templates remain pure (TR5). Instant Replay is the named **Scrubber** host view. |
| [Heatmap Templates Spec v0.2.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM1–HM21. Heatmap is the **recorder**. Inspector blob **HM21** persists Instant Replay *choices*, never generation bytes. |
| [Width Fit Spec v0.1.2](./FatTail-Labs-Options-Lab-Heatmap-Width-Fit-Spec-v0_1.md) | **WF4** Average is a TR14 host view. This spec adds **Replay** as a third host mode, not a second ranking formula. |
| [Analyzer Spec v0.2.1](./FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Host surface · Autofit strip · package quote |
| [3D Surface App Spec v0.1.8](./FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md) §4.6 | Surface **Time machine** = snap-rebind of listed-leg IV at \(t\). Instant Replay **supplies** TR14 gens as lawful snaps-at-\(t\) in this tab. Gold `live_capture` remains a later Day-scale feed — **not** this ring. |
| [What-If T/σ Spec v0.1](./FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md) | What-if = ad-hoc knobs. Overlay **allowed** (ATM-B4 / ATM-K3). Not labeled Instant Replay. |
| OT-EF / **DL-309** | Representable or named state. Never invent a print or a package debit. |
| Arch **28** | One market WebSocket. **No client Massive.** Instant Replay does not add a socket. |
| Arch **29** | Heatmap as-built map |
| Human Interface Spec v1.0 | Dark-pinned tokens · ≥44pt hits · no emoji chrome |
| North Star v1.2 | Process outcomes only. **No profit claims.** Green glow is a **mode tell**, not a go/profit signal. |

**Does not:** MiniTwo until asked · Tradier / close / orders · gold-disk full-day chain replay · server member cache · multi-tab film · upsampling 10s→2s · a second market WebSocket · copying MSC · Algo Alert on Instant Replay in v1 · inventing strikes or package prices.

**Review protocol:** findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion). Coach Content Law: nothing in §0 is removed.

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
| **Instant Replay** (this spec) | Trailing minutes–hour | This tab’s OPF **chain** ring | Heatmap Cache | **Green** inner on Heatmap, Analyzer, **and Surface** |

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
| **TMI-4** | **Heatmap records.** Analyzer and Surface **project** the same tab’s `getStreamBook()` singleton. Opening Analyzer or Surface first does not start a chain ring. Reload or a new tab is empty. |

### 3.2 Film (TR14)

| ID | Law |
|----|-----|
| **TMI-5** | Film = TR14 `StreamSlot[]` for the current book key (`symbol\|expiration`). Each slot is the **raw OPF-held dual-side generation** already subscribed: listed contracts, spot, wings, strike step, `content_hash`, `as_of`, stale/quality. Optional Width Fit color memo is a shortcut, not a second SoR. |
| **TMI-6** | Templates stay **pure** (TR5 / HM6). They never read the book. The **host** selects a slot and `run()`s (Heatmap) or rebinds legs (Analyzer / Surface). |
| **TMI-7** | Heatmap **writes** a slot when a generation lands, **any** template (not Width Fit only). **DL-593**. |
| **TMI-8** | Same `content_hash` as newest for this key → replace in place (no extra slot). Gaps stay gaps. Do not interpolate skipped seconds. |
| **TMI-9** | Live paint stays on the socket (2s class). The book **samples on write** at the interval of the playback-time stop (**TMI-12**). Scrubbing does not require 2s accuracy. |
| **TMI-10** | Changing symbol or listed expiration is a **different book**. Instant Replay of that key is empty until it fills. Do not cross-fill SPY→SPX or one expiry into another. |

### 3.3 Playback-time slider

| ID | Law |
|----|-----|
| **TMI-11** | Member-facing Cache control is **playback time**, not megabytes. Copy: longer playback uses fewer snapshots; detail gets coarser. Internal ceiling remains **32 MiB** (`CEILING_MIB`). |
| **TMI-12** | Frozen v1 stops (busy 0DTE planning; actual span is named on the Cache line): |

| Stop id | Member valuetext | Sample interval | Intent |
|---------|------------------|-----------------|--------|
| `max` | `~15 min · 2s` | 2 s | Max detail (live class) |
| `mid` | `~30 min · 5s` | 5 s | Coarser |
| `long` | `~60 min · 10s` | 10 s | Longer film; 10s playback is acceptable |

If a generation is so large that the trail is shorter than the label, the Cache line shows **actual** gens · span · interval. Do not advertise a stop the 32 MiB ceiling cannot hold for typical 0DTE. Do not show a multi-hour stop.

| ID | Law |
|----|-----|
| **TMI-13** | Once chosen, **going forward only**. Changing the slider cannot invent 2s ticks from a 10s film. |
| **TMI-14** | On stop change: **confirm**, then **wipe** the book (`StreamBook.clear`), then trail starts at the next gen. Caption: replay from here uses this setting; what’s already cached will be cleared. |
| **TMI-15** | Morning ritual: set the slider → first gen starts the film. First *D* minutes fill; then a **trailing** window of length *D*. Resetting the slider starts a new trail from that moment. At 11:00 with a 15-minute max-detail stop the member has ~10:45–11:00, not 9:30–11:00. |
| **TMI-16** | HM21 persists `replayHorizon` (`max` \| `mid` \| `long`) and host Replay engagement. It does **not** persist generation bytes. Closing the tab drops the book. |

### 3.4 Transport (reuse Day; do not fork)

| ID | Law |
|----|-----|
| **TMI-17** | Adapter `slotsToReplaySamples(slots): ReplaySample[]`. `asOf` (else `receivedAt`) → `t_ms`; `spot` → `spot`. Omit gens with no usable time. Default: omit gens with no spot from the mini path. Host maps `cursor.idx` → slot. |
| **TMI-18** | Use existing `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` / `REPLAY_SPEEDS` (`10` \| `20` \| `50`). No second clock module. No extra 1× in v1. |
| **TMI-19** | Use existing `StreamBook.atTime` / `window` / `clear` for lookup, trail, wipe. |
| **TMI-20** | **Play** from current playhead. **Pause** freezes paint; **does not** freeze recording. **Stop** parks at the **first stored gen** (start of the trail); does not exit. **Reset** leaves Time Machine: paint to Live, HUD hidden, green glow off; **does not** wipe the book. |
| **TMI-21** | Enter Instant Replay: playhead = **newest** gen (live edge of the trail). Clock America/New_York. HUD title **Instant Replay**; footer `N gens · span · interval` (not `N closes`). No calendar date field on this fractal. |
| **TMI-22** | While Instant Replay is on, the socket **keeps recording**. If Playing reaches the last gen, hold last until new gens append, then continue. If Paused, playhead stays; HUD range may grow. |
| **TMI-23** | Range = first stored `as_of` → last stored `as_of`. Never a clock longer than the book. |
| **TMI-24** | Speeds 10× / 20× / 50×: wall elapsed × speed = session elapsed across cached `t_ms`. Speed change does not jump. Clock shows step size (`10:42:00 · 10s`). |

### 3.5 Green frame (mode must be obvious)

| ID | Law |
|----|-----|
| **TMI-25** | While Instant Replay is active, a **green blurred inner frame** on the **Heatmap workspace canvas, Analyzer canvas, and Surface canvas**. Same grammar as Day’s blue inset glow: `pointer-events: none`; inset blur; rounded to the canvas. Day remains **blue**. What-if remains **red**. |
| **TMI-26** | Instant Replay + What-if → **green wins** (replay is the clock). Instant Replay and Day cannot both glow (TMI-2). |
| **TMI-27** | Named test ids: `data-glow="instant-replay"` on each host canvas (`heatmap-viewport-glow` · `analyzer-viewport-glow` · `surface-viewport-glow`). Echo freezes the green token; it must **not** read as a profit/go signal. Reduced-motion: static inset, not a pulse. |
| **TMI-28** | HUD / strip copy names **Instant Replay** so color is not the only tell. |

### 3.6 Hosts

| ID | Law |
|----|-----|
| **TMI-29** | Width Fit: **Live \| Average \| Replay**. Average = mean of a window of memos. Replay = **single gen** under the playhead. Do not collapse Average into Replay. Other templates: **Live \| Replay**. |
| **TMI-30** | Switching template while Instant Replay is on does **not** exit Instant Replay. Same film, different `run()`. |
| **TMI-31** | Analyzer: package-mark representable legs from the selected gen. Missing listed leg → **NOT TRADED** / **CHECK LEGS** (OT-EF), never a fake debit/credit. Autofit **X** = **spot on the selected gen** (not Day’s session open). Autofit does not fire on every playhead tick. |
| **TMI-32** | Surface: rebind listed-leg IV, spot, and OPF \(\tau\) from the selected TR14 slot (Surface §4.6). Missing exact/locked IV → **IV NO**. Do not interpolate. Do not start a gold `live_capture` download to fill Instant Replay. |
| **TMI-33** | GEX and other Heatmap templates **may** run on the selected gen (the chain is in the slot). Day’s **ATM-B2** GEX-off does **not** apply. Analyzer GEX/Probability during Instant Replay: **allowed**. |
| **TMI-34** | **Algo Alert is out of v1** on Instant Replay. Day fractal keeps Algo-on-day (ATM-A1). Do not silently point Demo at RAM gens. |
| **TMI-35** | What-if overlay **allowed**: Instant Replay owns spot and session time of the gen; What-if **Vol** may still apply; What-if Time / Spot% do not fight the playhead (ATM-K3). |
| **TMI-36** | Playback-time slider lives on Heatmap inspector Cache only. Analyzer and Surface do not duplicate it. |

### 3.7 Honesty

| ID | Law |
|----|-----|
| **TMI-37** | OPF-held listed chain only. No invented strikes, mids, or package prices (**DL-309**). |
| **TMI-38** | Named holes, never a silent blank or a lying last paint after rebind: |

| Hole | When | Member sees |
|------|------|-------------|
| **NO FILM** | Analyzer or Surface Instant Replay; this tab’s Heatmap never wrote the current book key | Named. Play off. Do not fetch gold. |
| **WAITING** | Heatmap subscribed to the book; first gen not yet | Named. Green may be on if Instant Replay is engaged. |
| **NOT TRADED** / **CHECK LEGS** / **IV NO** | Leg missing or IV missing on the selected gen | Named at that tick. |
| **Cache at your limit** | Book at 32 MiB (or oversize single gen) | Existing TR14 caption. Trail is dropping oldest. |

| ID | Law |
|----|-----|
| **TMI-39** | One market WebSocket. No client Massive. Not MiniTwo server cache. Not a 390-minute 2s day. |
| **TMI-40** | Process / inspection only. No profit claims on replay. Green is not a trade signal. |

---

## 4. Member flow

```text
Morning (or whenever)
    → Heatmap inspector: set playback-time slider (~15 min · 2s  or  ~60 min · 10s)
    → confirm wipe if a film already exists
    → live OPF paints; host records sampled gens into TR14

Watch live
    → any template
    → Cache line: “47 gens · 18 min · 2s”

Enter Time Machine - Instant Replay
    → same transport seat as Day
    → green inner frame on Heatmap / Analyzer / Surface canvas
    → HUD title Instant Replay; no calendar
    → playhead on newest gen; scrub or Play

Scrub / play
    → tiles, GEX, Width Fit Live cell, Verticals re-run() on the selected slot
    → switch template without leaving Instant Replay
    → SPA Analyzer: tent / package mark at that gen
    → SPA Surface: listed-leg IV rebound from that gen
    → missing leg → named state

Switch fractal to Day (Analyzer)
    → Instant Replay parks; date field appears; blue glow
    → cache is not wiped

Reset
    → leave Time Machine; Live paint; HUD gone; green off; book still recording
```

---

## 5. Chrome

### 5.1 Heatmap

- Inspector Cache: `DetentSlider` stops = **TMI-12** (not 4/8/16/32 MB as the member story). Valuetext = time · interval.
- Host segment: **Live \| Replay** (Width Fit: **Live \| Average \| Replay**).
- Transport strip + HUD over the workspace when Instant Replay is on (same components as Analyzer; no date field).
- Green inset glow on the heatmap canvas (**TMI-25**).

### 5.2 Analyzer

- Time Machine strip **to the right of Autofit** (ATM §5.1) — **same place**.
- Fractal: **Day** shows the date field; **Instant Replay** hides it and shows the trail span or the words Instant Replay.
- Shared Play / Pause / Stop / 10× / 20× / 50× / Reset.
- HUD upper-right canvas corner (ATM-H1 grammar); captions per **TMI-21**.
- Green inset glow on the Analyzer canvas. Day uses existing blue.

### 5.3 Surface

- Same transport strip + HUD on the Surface canvas when Instant Replay is on.
- Green inset glow on the Surface canvas.
- Do not label a What-if τ playhead Instant Replay (Surface §4.6 stands).

Component surgery (prefer extract, not copy): `AnalyzerTimeMachineStrip` gains fractal `day` \| `instant`; HUD gains title/footer props. Heatmap and Surface mount the same components.

---

## 6. Clock and projectors

**TMI-K1.** While Instant Replay has a playhead: **spot** = selected gen’s spot; **as-of** = that gen’s `t_ms`; chain = that gen’s listed contracts. OPF \(\tau\) / remaining use **that** clock, not wall now.

**TMI-K2.** Heatmap `run(context_from_slot)`. Analyzer package quote from slot contracts. Surface \(\sigma_i(t)\) from slot IV.

**TMI-K3.** Last paint of Live must not remain as a lying Instant Replay mark after rebind (OT-EF elegant failure). Atomic settle on playhead change.

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
| 10s interval acceptable playback | **IN-SCOPE** · TMI-12 `long` |
| Playback time instead of MB; granularity degrades | **IN-SCOPE** · TMI-11–16 |
| Setting going forward; cached data may be destroyed | **IN-SCOPE** · TMI-13 · TMI-14 |
| Morning slider; trailing replay from open / reset | **IN-SCOPE** · TMI-15 |
| Scrubbing not realtime-accurate | **IN-SCOPE** · TMI-9 |
| Name **Time Machine - Instant Replay**; same place, different fractal | **IN-SCOPE** · TMI-1 |
| **Green** blurred frame; **Heatmap, Analyzer, and Surface** | **IN-SCOPE** · TMI-25–28 |
| Width Fit Live \| Average \| Replay | **IN-SCOPE** · TMI-29 |
| Record while scrubbing | **IN-SCOPE** · TMI-22 |
| Wipe + confirm on slider change | **IN-SCOPE** · TMI-14 |
| Heatmap records; Analyzer (and Surface) project | **IN-SCOPE** · TMI-4 |
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
| **AT-TMI-1** | Heatmap writes TR14 on any template when a gen lands; GEX-only session still fills the book. |
| **AT-TMI-2** | Templates do not import `getStreamBook`. Host selects a slot then `run()`. |
| **AT-TMI-3** | Cache control valuetext is playback time · interval (`~15 min · 2s`), not `N megabytes` as the primary story. |
| **AT-TMI-4** | Changing the playback stop confirms, wipes the book, and starts a new trail. Cannot recover wiped 2s ticks. |
| **AT-TMI-5** | Book sample interval matches the stop (2s / 5s / 10s) while live paint may still be 2s. |
| **AT-TMI-6** | Range of HUD / playhead never exceeds first–last stored `as_of`. |
| **AT-TMI-7** | Instant Replay strip has Play / Pause / Stop / 10× / 20× / 50× / Reset and **no** date field. |
| **AT-TMI-8** | Enter Instant Replay: playhead = newest gen. Stop → first stored gen. Reset → Live; book remains. |
| **AT-TMI-9** | Pause does not stop recording; new gens still land. |
| **AT-TMI-10** | Adapter: `replayCursor` walks TR14 `t_ms` at 10×: one wall-second advances ten session-seconds. Speed change does not jump. |
| **AT-TMI-11** | Heatmap Instant Replay on → **green** inset glow (`data-glow="instant-replay"`). Analyzer same. Surface same. |
| **AT-TMI-12** | Analyzer Day on → **blue** (`data-glow="timemachine"`). What-if only → **red**. Instant Replay + What-if → green. |
| **AT-TMI-13** | Width Fit exposes Live \| Average \| Replay; Average is a window mean; Replay is one gen. Other templates: Live \| Replay. |
| **AT-TMI-14** | Switch template (e.g. GEX → Verticals) while Instant Replay is on: stay in Instant Replay; tiles recompute on the same slot. |
| **AT-TMI-15** | SPA Heatmap → Analyzer same tab: same playhead; representable butterfly shows listed package mark at that gen. |
| **AT-TMI-16** | SPA to Surface same tab: listed-leg IV rebound from that gen; missing IV → IV NO, not interpolated. |
| **AT-TMI-17** | Analyzer Instant Replay with empty book → **NO FILM**; no gold fetch; no client Massive. |
| **AT-TMI-18** | Missing listed leg on the selected gen → named OT-EF state, never a invented debit. |
| **AT-TMI-19** | Changing symbol or expiration does not play the previous book’s gens. |
| **AT-TMI-20** | `replayHorizon` round-trips in `ft_labs_heatmap_session`; generation slots are absent from the blob. |
| **AT-TMI-21** | Algo Create Alert is not armed from Instant Replay playhead in v1. |
| **AT-TMI-22** | Browser network: no Massive host from the client on this path. |
| **AT-TMI-23** | Day and Instant Replay exclusive: entering one parks the other; cache not wiped. |

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

---

## 10. As-built (check first — not law)

| As-built | Honesty |
|----------|---------|
| TR14 `StreamBook` · 4/8/16/32 MiB detent · `atTime` / `window` / `clear` | Book exists. Member story is still **megabytes**. |
| Heatmap write on any template (**DL-593**) | Write path. No Instant Replay host view yet. |
| Width Fit Live \| Average | No Replay third. |
| `AnalyzerTimeMachineStrip` + HUD + `replayCursor` | Day film only. Date field always shown. Glow `timemachine` = blue. |
| Heatmap / Surface | No Time Machine strip, no green glow. |
| Analyzer package quote | Live/held OPF only. |

---

## 11. Open for Coach (not silently decided)

1. Exact Echo green token (emerald vs Labs success green) — law is **green inset**, token is Echo.  
2. Enter playhead = **newest** (this spec) vs first stored gen. Override if Coach wants trail-start.  
3. Whether Surface Instant Replay HUD is v1-complete or glow + rebind first, strip later. This spec says **same strip**.  
4. Whether slider wipe is **current book key** or **all keys**. This spec says **all keys** (one interval going forward).

Everything else in §0 is **law**, not an open.

---

## 12. Parent amendments (this DRAFT)

When this spec reaches BUILD AUTHORITY, parents gain these one-line pointers (drafted in the same packet as this file):

- Time Machine Spec → v0.1.8: Time Machine is the seat; Instant Replay is the fine fractal (this document); Day glow stays blue; Instant Replay glow is green.  
- Runner TR14 → Instant Replay is the named Scrubber; member story = playback time; sample interval is host write policy.  
- Heatmap Templates → HM21 persists `replayHorizon`; Instant Replay host mode.  
- Width Fit → Live \| Average \| Replay.  
- Surface §4.6 → TR14 slot is a lawful snap-at-\(t\) for Instant Replay in this tab.

---

## 13. Suggested path after BUILD AUTHORITY

1. Full-agent bench plan (Echo tokens/labels → Charlie host + adapter → Kilo ATs → Delta).  
2. Help article (Heatmap Cache + Instant Replay).  
3. Lima DL already proposed as **DL-594**.

No implementation until Coach Phase 5 / GO.

---

## 14. Reviewer notes (empty until Phase 2–4)

India / Echo / Tango / Hotel / Victor write **beside** §0. They do not delete Coach text.

**Beside (Tango, not a deletion):** green must not read as “good trade / go.” HUD names Instant Replay. Observation-only copy on replay.

**Beside (Hotel, not a deletion):** Instant Replay of listed marks is inspection of what was on the chain, not a forecast and not a fill.

---

## 15. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-26 | Coach Instant Replay: Time Machine fine fractal; TR14 film; playback-time slider; green inner frame on Heatmap, Analyzer, and Surface; Heatmap records; Analyzer + Surface project; Width Fit Live\|Average\|Replay; Algo out; What-if overlay on. Design [`docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md`](../docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md). **DL-594**. |

**One-line law:**  
**Time Machine stays one machine; Instant Replay is the fine fractal — this tab’s trailing OPF chain, same transport as Day, green frame on Heatmap / Analyzer / Surface, any template or listed-leg position, never a second market, never a fake print.**

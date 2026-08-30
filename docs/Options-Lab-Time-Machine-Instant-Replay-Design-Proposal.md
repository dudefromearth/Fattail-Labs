# Options Lab — Time Machine - Instant Replay (design proposal)

**Status:** Design settled (Coach ticks §9 + name, 2026-08-26). Not a Specification. Not BUILD AUTHORITY.  
**Date:** 2026-08-26  
**Name:** **Time Machine - Instant Replay** (Coach 2026-08-26). Earlier working name *Chain Replay* is retired.  
**Next:** technical Spec, then a full-agent build plan — after this design is settled.

**Type:** Product / interaction design — Instant Replay fractal of **Time Machine**: play **OPF-held chain generations** already in the member’s Heatmap **Cache** (TR14 stream book), **in the same place** as Time Machine Day.

This document is the design we work out before a Spec. It does not replace Time Machine Spec v0.1.7, Heatmap Templates, OPF, or TR14. Instant Replay is a **fractal of that Time Machine seat**, not a second product.

---

## 0. Coach intent (do not drop)

Verbatim from this thread, in order:

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

---

## 1. What it is

**Time Machine - Instant Replay** is the **fine fractal** of Time Machine: OnDemand for the **chain you already watched this tab** — not a downloaded day from gold disk.

The member is already subscribed to one OPF book (symbol + listed expiration + wing window). Live ticks paint Heatmap / Analyzer as today. Those ticks are **also recorded** into the Heatmap Cache (TR14 stream book): raw listed chain generations, this browser tab, RAM, member budget.

Replay **does not change templates or structures**. It **swaps the input**:

| Mode | Input stream | What you see |
|------|----------------|--------------|
| **Live** | Current OPF generation (WebSocket) | Now |
| **Instant Replay** | A **selected slot** in the tab cache | That `as_of` |

Any Heatmap template (Advanced flies, Verticals, GEX, Width Fit, …) and any **strategy position whose legs are listed on that cached chain** can be rebuilt at that tick. Same film, different projector.

**One Time Machine, two fractals** (same strip, HUD, blue glow, Play/Pause/Stop/speeds/Reset):

| Fractal | Scale | Film | Range comes from |
|---------|-------|------|------------------|
| **Day** (as-built Time Machine Spec v0.1.7) | Session (~390 min) | Downloaded underlier path (gold / server) | Calendar date |
| **Instant Replay** (this design) | Trailing minutes–hour | This tab’s OPF **chain** ring | Heatmap Cache already in RAM |

Same structure at different grain: Day is the session underlier; Instant Replay is the recent listed chain. The member does not learn a second video language. They stay in Time Machine and change fractal.

---

## 2. Same place as Time Machine, different fractal

Members already know: play / pause / stop, a small window, a **draggable scrubber**, a clock, a range, a blue inner-edge when Time Machine is on. Instant Replay **is Time Machine at that chrome** — not a cousin with copied buttons.

The as-built stack is already split into **transport** (clock math + buttons + HUD) and **film**. Instant Replay keeps the transport **in the same viewport seat**. It swaps the film and the left-hand range control (no calendar; range = the book).

### 2.1 Seats (do not collide)

| Seat | Job | Film / clock | Glow |
|------|-----|--------------|------|
| **What-if** | Ad-hoc time · spot · vol knobs | Member sliders on the live/held sheet | **Red** inner |
| **Time Machine - Day** | Pick a **calendar day**, download, play | Gold / server 1-minute underlier path (390 closes or TPO) | **Blue** inner (Analyzer) |
| **Time Machine - Instant Replay** | Scrub **this tab’s** OPF chain ring | TR14 `StreamSlot[]` already in RAM | **Green** inner on **Heatmap, Analyzer, and Surface** canvases |
| **Surface Time machine** (gold / live_capture) | 3D snap-rebind of listed-leg IV from a **disk day** | Surface App Spec §4.6 later feed | Not Instant Replay. Instant Replay on Surface is the **same green** + this tab’s TR14 snaps |

Time Machine Spec **ATM-B2** turns GEX / Probability **off** on the **Day** fractal because that film is **underlier-only** — there is no chain at \(t\). Instant Replay **has** the listed chain at each tick, so Heatmap GEX (and any other template) is honest on the selected gen. That is why Instant Replay does **not** inherit Day’s GEX lock.

**One playhead (design law):** Day and Instant Replay cannot both drive the canvas. They are two films of **one** Time Machine. Switching fractal **parks** the other (Reset that film’s playhead; do not delete gold, do not wipe the cache unless the playback-time slider itself changed). What-if may still overlay Instant Replay as ad-hoc σ/τ (same as TM **ATM-B4**).

**Green frame (Coach):** while Instant Replay is active, a **green blurred inner frame** on the **Heatmap workspace, Analyzer canvas, and Surface canvas** — same grammar as Day’s blue inset glow (`pointer-events: none`). It must be obvious which fractal is on. Green is a **mode tell**, not a profit/go signal. What-if stays red. Day stays blue. Instant Replay + What-if → **green wins** (replay clock).

**Projectors:** Heatmap **records**. Analyzer and Surface **project** the same tab film. Surface Instant Replay rebinds listed-leg IV from the selected TR14 gen (Surface §4.6 snap-at-\(t\) with RAM snaps). Gold `live_capture` remains a later Day-scale chain film, not this ring.

Heatmap v1 only has the Instant Replay fractal (no gold day on that surface). Analyzer has Day and Instant Replay. Surface has Instant Replay on this film (gold Surface Time machine stays its own later feed). The strip **lives in the same place** on Analyzer as today’s Time Machine; Heatmap and Surface host the **same strip + HUD** so the machine is recognizable.

### 2.2 Reuse the transport as-built (no second video clock)

The Time Machine clock already walks an array of `{ t_ms, spot }`. A cached generation already has `asOf` and `spot`. The adapter is one function; the rest of the stack is unchanged.

```
TR14 StreamSlot[]  ──adapter──►  ReplaySample[]   ({ t_ms, spot })
                                      │
                                      ├── replayCursor / replayFrac / sampleAtFrac
                                      ├── AnalyzerTimeMachineStrip  (Play / Pause / Stop / 10·20·50× / Reset)
                                      └── AnalyzerDayReplayHud      (corner glass, drag, clock, mini path)
```

**Adapter (new, small):** `slotsToReplaySamples(slots): ReplaySample[]`

| StreamSlot field | ReplaySample field | Rule |
|------------------|--------------------|------|
| `asOf` (ISO) or `receivedAt` | `t_ms` | Prefer listed `asOf`; fall back to receive time; drop slots with no usable time |
| `spot` | `spot` | Skip or keep last-named if null — Spec; design default: **omit** gens with no spot from the mini path, still selectable by hash if the host needs them |
| `contentHash` / index | (host, not HUD) | Host maps `cursor.idx` → slot → `run()` |

`StreamBook.atTime(key, tMs)` **already exists** — nearest cached gen to a playhead. Instant Replay’s host should use it (or `cursor.idx` into `window()`) instead of a new lookup.

**Reuse (as-built Time Machine tools — same place)**

| Existing piece | Path | How Instant Replay uses it |
|----------------|------|---------------------------|
| The Time Machine strip | `AnalyzerTimeMachineStrip.tsx` — same Analyzer (and Heatmap) seat | Same hits, same labels. **Day** fractal shows the calendar `<input type="date">`. **Instant Replay** hides it; left caption is the book span (`10:32–10:51`) or the words **Instant Replay**. |
| Play / Pause / Stop | `IconPlay` / `IconPause` / `IconStop` | Unchanged. |
| Speeds 10× / 20× / 50× | `REPLAY_SPEEDS` in `algoDayReplay.ts` | Same detents. `replayCursor` already multiplies wall elapsed by speed and binary-searches `t_ms`. 10s film at 10× is still readable. **Do not fork** a second cursor. |
| Seek math | `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` | Unchanged if the adapter emits `ReplaySample[]`. Clock stays America/New_York. |
| Mini HUD + scrubber | `AnalyzerDayReplayHud.tsx` | **Same corner window** (dark glass, drag, sky path, playhead line). Caption: **Instant Replay** + book span; footer `N gens · 10s` instead of `N closes`. Extract shared caption props rather than copying the HUD. |
| Inner glow | Analyzer viewport when Time Machine is on | **Day = blue.** **Instant Replay = green** on Heatmap, Analyzer, **and Surface**. Same inset-blur grammar; different color so the fractal is obvious. What-if stays red. |
| Reset | Time Machine **Reset** (v0.1.7, ATM-S3) | **Reset** leaves Time Machine: paint returns to **Live**, HUD hides, blue glow off. Does **not** wipe the book (recording continues). Analogous to leaving the day, not deleting gold. |
| Stop | ATM-S2 | Stop parks at the **first stored gen** (start of the trail), does **not** exit Time Machine. Same as Day Stop → first print. |
| HI `DetentSlider` | Cache slider today (MB stops) | **Repurpose:** playback-time stops, valuetext shows interval (`~20 min · 2s`). This is the Instant Replay **range** control (Day’s range control is the date). |

**Component surgery (one machine, fractal-dependent chrome — prefer extract, not copy)**

1. **`AnalyzerTimeMachineStrip`** stays the strip. Add a **fractal**: `day` \| `instant`. Day shows the date field. Instant hides it and shows the trail span. Play / Pause / Stop / speeds / Reset are shared. Do not ship a second strip.
2. **`AnalyzerDayReplayHud`** stays the HUD. Title/footer props: Instant Replay → `Instant Replay` / `47 gens · 18 min · 10s`; Day → date / `390 closes`.
3. **`algoDayReplay.ts`** — no second clock module. Optional: `ReplaySample` may grow an optional `hash?: string` later; v1 host keeps idx→slot beside the samples.

Heatmap does not have this strip today. **Same components, same visual place** (HUD over the workspace; strip where Time Machine would sit — inspector-adjacent or a thin bar above the grid). Do not invent Heatmap-only video buttons.

**Do not reuse from the Day fractal (different film, same machine)**

| Day piece | Why Instant Replay differs |
|-----------|----------------------------|
| Day calendar / download | No gold fetch. Range **is** the book. |
| 390 candles / close-to-close vs TPO | Different film (underlier minutes vs chain hashes). Mini path is **spot-from-gen**, one vertex per slot, not OHLC candles. |
| Autofit X = session **open** (ATM-O1) | Instant Replay X is the **spot on the selected gen**, or live Autofit when Live. |
| Basic Day: GEX and Probability **off** (ATM-B2) | Instant Replay **may** show GEX — the chain is in the slot. Analyzer GEX/Prob during Instant Replay is a later Spec choice; default design: **allow** Heatmap GEX on scrubbed gens. |
| WAITING / NO PATH / NO MARKS (ATM-B5) | Named holes stay, **different copy**: **NO FILM** (empty book) · **WAITING** (first gen not yet) · NOT TRADED / CHECK LEGS on legs. Do not say NO PATH (that is a missing gold day). |
| “Add the fly after the day, then Algo” (ATM-A1) | Algo-on-gold-day stays the **Day** fractal. Instant Replay v1 is inspection; do not silently point Algo at RAM gens without a Spec line. |
| Server day fetch / OnDemand | Never for Instant Replay. One market WebSocket already subscribed. |

Time Machine’s **later vol plane** (FI-036 — full chain snaps from gold / StudioOne) is a **coarser cousin**: same *kind* of chain film, different SoR (disk day vs tab RAM). This design does not implement that plane. A future Spec can feed gold chain snaps into the **same** adapter + HUD as another Day-scale chain fractal.

---

## 3. The film (cache)

**SoR:** TR14 stream book — `getStreamBook()` — this tab’s RAM.

**Each slot:** raw OPF generation already subscribed: listed dual-side contracts, spot, wings, strike step, `content_hash`, `as_of`, stale/quality. Optional Width Fit color memo is a **shortcut**, not a second store of truth. Templates stay **pure** (TR5): they never read the book; the **host** selects a slot and `run()`s.

**Write (as-built + this design):** Heatmap records a slot when a generation lands, **any** template (not Width Fit only). Analyzer in the **same tab** may read the same singleton after SPA navigation; a reload or new tab is empty.

**Budget:** internal ceiling remains 4 / 8 / 16 / 32 MiB. The member does **not** see megabytes as the primary control.

**Live vs record:** Live paint stays on the socket (2s class). The book **samples on write** at the interval implied by the playback slider. Scrubbing does not require 2s accuracy.

**Gaps stay gaps.** Same hash → one slot. Skipped seconds (decimation) are named on the playhead, not interpolated.

---

## 4. Playback-time slider (replaces “Cache MB” as the member story)

**Job:** set **how long I want to be able to scrub**, going **forward**. Granularity is the consequence. This is Instant Replay’s range control (Day’s is the calendar).

Planning detents (busy 0DTE, ~50–80 KB/gen, ~32 MB ceiling — tune in Spec):

| Member-facing stop | Sample interval | Feel |
|--------------------|-----------------|------|
| ~15–20 min | ~2s | Max detail (what we collect) |
| ~30–45 min | ~5s | Coarser |
| ~60 min | ~10s | Longer film; 10s steps are acceptable playback |

Copy on the control (Tango/Echo in Spec): **Longer playback uses fewer snapshots. Detail gets coarser.**

Valuetext example: `~20 min · 2s steps` / `~60 min · 10s steps`.

**Once chosen, going forward only.** Changing the slider **cannot** invent 2s ticks from a 10s film.

On change (design law):

1. Confirm (or a single destructive detent with a caption): replay from here uses this setting; **what’s already cached will be cleared**.
2. Wipe the book (preferred v1 — clean trail).
3. Trail **starts now** (or at the next gen). Same as a new morning.

**Morning ritual:** set the slider before or at the open → first gen after open starts the film. First *D* minutes **fill**; after that it is a **trailing** window of length *D*. At 11:00 with a 20-minute max-detail setting the member has **~10:40–11:00**, not 9:30–11:00. Resetting the slider starts a **new** trail from that moment.

8 MB today is ~3–5 min of max-detail 0DTE — too short for “hour replay.” The slider **uses the 32 MB ceiling** (or the highest detent needed) as an internal cap; if a stop cannot fit, the stop is omitted or the interval coarsens further. Spec will freeze the stop list. Do not show a 6-hour stop that does not fit.

---

## 4a. Member walkthrough (the design in use)

```text
Morning (or whenever)
    → Heatmap inspector: set playback-time slider (~20 min · 2s  or  ~60 min · 10s)
    → confirm wipe if a film already exists
    → live OPF paints; host records sampled gens into TR14

Watch live
    → any template (flies, Verticals, GEX, Width Fit, …)
    → Cache line: “47 gens · 18 min · 2s” (span grows until D, then trails)

Enter Time Machine - Instant Replay
    → same place as Time Machine (strip + HUD + blue glow)
    → Live | Replay (or Width Fit Live | Average | Replay)
    → no calendar; HUD title Instant Replay; range = the book
    → playhead on last gen (or first — Spec); member scrubs or hits Play

Scrub / play
    → tiles, GEX, Width Fit Live cell, Verticals — all re-run() on the selected slot
    → switch template without leaving Instant Replay (same film)
    → SPA to Analyzer in this tab: same book, same playhead, same Time Machine seat
    → missing listed leg → named state, never a fake debit

Switch fractal to Day (Analyzer)
    → Instant Replay playhead parks; date field appears; gold day is a different film
    → cache is not wiped

Reset
    → leave Time Machine; paint back to Live; HUD gone; blue off; book still recording
```

The member never picks a calendar day for Instant Replay. They never wait for a download. If they never opened Heatmap this tab, Analyzer Instant Replay says **NO FILM** — not a gold fetch, not a silent fall-through to Day.

---

## 5. Runner / scrubber (the tool)

**One Time Machine**, two hosts, Instant Replay film.

```
Live OPF ──► host records into TR14 book (sampled)
                │
                ├── Live mode: templates/sheet read current gen
                └── Instant Replay: playhead selects a slot → same templates/sheet run()
```

**Range** = first stored `as_of` → last stored `as_of` (and gen count). Never a clock longer than the book.

**Controls (Time Machine, Instant Replay fractal):**

- Play / Pause / Stop  
- Speed 10× / 20× / 50×  
- Draggable scrubber on a mini path  
- Clock: session time of the selected gen + step size (`10:42:00 · 10s`)  
- Optional: `n` gens · span (e.g. `47 gens · 18 min`)
- No date field

**While Instant Replay is on:** Live socket **keeps recording** into the book (trail still grows; playhead does not have to stick to live). Pause is **paint-only** — it does not freeze the book. Stop parks at the first stored gen. Reset returns **paint** to Live (book still recording).

**Heatmap host:** tiles, GEX profile, Width Fit. Average remains a **mean of a window**; Instant Replay is a **single gen** under the playhead. Do not collapse Average and Replay. Coach: **Live | Average | Replay** on Width Fit; **Live | Replay** on other templates.

**Analyzer host:** substitute the chain used to **package-mark** representable legs with the selected gen. A butterfly whose three strikes are on that chain shows listed debit/credit (and listed greeks if present) **at that tick**. Missing leg → named state (NOT TRADED / CHECK LEGS), never a fake tent. The Risk graph vs **spot** is still a model sheet at that tick’s spot; the **time path** of the package is the scrubber (mini HUD). This is **not** the Day fractal’s 390-minute underlier walk unless the member switches fractal and loads gold.

---

## 6. Heatmap vs Analyzer vs Surface (where chrome lives)

| | Heatmap | Analyzer | Surface |
|--|---------|----------|---------|
| **Record** | Yes — this is where the book is filled today | Same tab may **read** the book | Same tab may **read** the book |
| **Playback-time slider** | Inspector **Cache** section, relabeled to time | Do not duplicate | Do not duplicate |
| **Time Machine chrome** | Same strip + HUD over the grid (Instant Replay fractal only) | **Same place as today’s Time Machine.** Fractal Day \| Instant Replay. Instant hides the date; Day shows it | Same strip + HUD; Instant Replay fractal on this film |
| **Green frame** | Workspace canvas while Instant Replay is on | Analyzer canvas | Surface canvas |
| **Enter Instant Replay** | Host control (Live/Replay or Width Fit three-way) | Viewport strip: Instant Replay on if the book has gens; else **NO FILM**. Parks Day | Instant Replay on if the book has gens; else **NO FILM**. Does not start gold `live_capture` |
| **Cross-route** | SPA same tab: singleton survives Heatmap → Analyzer → Surface. Full reload: empty | **NO FILM** if Heatmap never filled this tab — don’t fetch gold | Same — TR14 snaps, not disk day |

**Heatmap is the recorder.** Analyzer and Surface are **projectors** on the same tab’s film. Opening Analyzer or Surface first does not create a chain ring (v1). Instant Replay with an empty book is **NO FILM**.

---

## 7. Honesty (non-negotiable)

- OPF-held listed chain only. No invented strikes, mids, or package prices (DL-309 / OT-EF).
- Representable or **named** failure at that tick.
- Decimation and slider-clear are **named** (interval on the clock; confirm on slider change).
- Process / inspection only. No profit claims on replay.
- One market WebSocket. Instant Replay does not add a socket or a Massive path.
- Not gold disk. Not a full session day at 2s. Not MiniTwo server cache.
- Name honestly: this is **Time Machine** at Instant Replay grain, not a downloaded day, not Surface snap-rebind.

---

## 8. What already exists vs this design

| Exists | This design |
|--------|-------------|
| TR14 book, 4–32 MB detent, drop-oldest | Member story = **playback time**; interval derived |
| Write on Width Fit only (until DL-593) | Write **any Heatmap template** (as-built now) |
| Width Fit Average | Unchanged; Instant Replay is a different host view |
| Time Machine strip + HUD + `replayCursor` | **Same place, same transport**; adapter `StreamSlot[]` → `ReplaySample[]`; hide date on Instant fractal |
| `StreamBook.atTime` / `window` / `clear` | Playhead lookup, trail window, slider-wipe |
| Analyzer package quote on live/held chain | Package quote on **selected cached gen** when Instant Replay |

---

## 9. Coach ticks (2026-08-26)

| # | Question | Coach |
|---|----------|--------|
| 1 | **Product name** | **Time Machine - Instant Replay.** Plays in the **same place** as Time Machine, **different fractal.** (Earlier tick *Chain Replay* is superseded — same feature, Coach name.) |
| 2 | **Width Fit modes** | **Live \| Average \| Replay**. Average = mean of a window. Replay = single gen under the playhead. Other templates: **Live \| Replay**. |
| 3 | **Record while scrubbing** | **Yes.** Socket still fills the book. Pause is paint-only. |
| 4 | **Slider change** | **Wipe the book + confirm.** Going forward only. Trail starts now. |
| 5 | **Who records (v1)** | **Heatmap records; Analyzer projects.** Analyzer with no Heatmap film this tab → **NO FILM**. |
| 6 | **Algo Alert in v1** | **Out.** Day fractal keeps Algo-on-day. Instant Replay is inspection, not a trail bot. |
| 7 | **Speeds** | **Keep TM 10× / 20× / 50×.** Clock shows step size. No extra 1× in v1. |
| 8 | **What-if overlay** | **Allow.** Instant Replay owns the gen’s spot and session time; What-if may still apply ad-hoc σ/τ (same as TM ATM-B4). |
| 9 | **Mode tell** | **Green** blurred inner frame while Instant Replay is active — **Heatmap, Analyzer, and Surface**. Day stays **blue**. What-if stays **red**. |

§9 is **settled** (name updated same day). Next document is the technical Spec when Coach opens it.

---

## 10. Out of this design

- Gold-disk / StudioOne full-day **chain** replay (that can **feed** Time Machine Day later; it is not this RAM ring)  
- Server-side member cache  
- Multi-tab or multi-device film  
- Upsampling 10s slots to 2s  
- Second Massive pipe  

---

## 11. Suggested path after this document

1. ~~Coach names the feature and ticks §9.~~ **Done 2026-08-26** — name **Time Machine - Instant Replay**.  
2. **Specification** (Heatmap + Analyzer host, TR14 amendment, Time Machine Spec fractal amendment, ATs).  
3. **Full-agent bench plan** (Echo labels → Charlie/Alpha → Kilo → Delta).  

No implementation until that Spec has BUILD AUTHORITY / GO.

---

## Key decisions (design)

| Decision | Rationale |
|----------|-----------|
| Name = **Time Machine - Instant Replay** | Same place as Time Machine; different fractal (Coach) |
| Instant Replay glow = **green** on Heatmap, Analyzer, Surface | Mode must be obvious; not Day’s blue; not What-if’s red |
| Film = TR14 tab RAM, not gold | Instant; already subscribed; minutes-to-an-hour, not 390 |
| Swap **input stream**, keep templates | Pure templates; any view; any representable position |
| One Time Machine **transport**, two films | Adapter into existing `ReplaySample` / cursor / HUD / strip; no second video language |
| Day and Instant Replay **exclusive playheads** | One machine, one playhead; switching fractal parks the other |
| Heatmap GEX **on** during Instant Replay | Film includes the chain; Day’s GEX-off does not apply |
| Slider = **playback time**; MB internal | Time is the job; granularity is the cost |
| Going forward + wipe on change | Cannot invent finer ticks; trail starts at set/reset |
| Heatmap records; Analyzer may project | One book; Analyzer empty until Heatmap has filled this tab |
| Live keeps painting 2s; book samples | Scrub does not need realtime accuracy |
| Range = cached gens only | Never a longer clock than the book |

---

**One-line:** Time Machine stays one machine; Instant Replay is the fine fractal — this tab’s trailing OPF chain, same strip and HUD as Day, any Heatmap template or listed-leg position, never a second market, never a fake print.

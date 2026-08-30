# FatTail Labs — Options Lab Time Machine - Instant Replay Spec v0.2

**Status:** DRAFT v0.2 — rewrite after Coach rulings of 2026-08-26 (film moves to the server; decay replaces the slider; opt-in Record; session collection; whole-panel frame). **Not BUILD AUTHORITY** until Coach Phase 5.  
**Type:** Product + technical spec — **Time Machine - Instant Replay** (fine fractal of Time Machine: the book's recorded chain film).  
**Short name:** **TMI**  
**Routes:** `/app/options-lab/heatmap` · `/app/options-lab/analyzer` · `/app/options-lab/surface`  
**Filename:** `FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_2.md`  
**Supersedes:** v0.1.1 (`…-Spec-v0_1_1.md`), v0.1  
**Design:** [`docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md`](../docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md) — the design's *client-RAM film* is superseded by §0.18; its seat, transport, and honesty sections stand.

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine - Instant Replay.

**Files / trees this spec touches** (names as parents and as-built use them; **exact paths confirmed by reading the repo at bench review, not assumed here**):

- **`server/`** — new replay film module (Redis film keys, Record on/off, decay pass, collection); a replay read path (message on the existing market WebSocket **or** HTTP GET — India names one at Phase 2); config; characterization tests (invariant 10)
- **Redis** — Labs-native replay keys beside the existing generation cache (HM10: no MSC schemas)
- Heatmap host and inspector (`HeatmapChainPanel`; the inspector Cache section becomes the Record / film status line)
- TR14 stream book module — retained as the **client read-through window** of the server film (`getStreamBook()`, `atTime` / `window` / `clear`)
- Time Machine transport (`AnalyzerTimeMachineStrip.tsx`, `AnalyzerDayReplayHud.tsx`, `algoDayReplay.ts`)
- Analyzer host (panel frame, Autofit strip, package quote)
- Width Fit host view (Live | Average | **Replay**)
- Surface host (panel frame, strip + HUD mount, listed-leg IV rebind per Surface §4.6) — **in-program by Coach ruling §0.16**
- `Specs/` parent one-line amendments (§12); `Architecture/00-decision-log.md` (DL-594 proposed; reversals per §11.10)

**Touches outside program:** **NONE.** Surface is in-program (§0.16). Identity/auth, payments, the market bus server's Massive pull, MSC: untouched. `server/` is touched for the film module only.

---

**Parents (normative where noted).** Cited at the **as-built** version; *confirm* = verify by reading `Specs/` at bench review; cited version must match the filename.

| Doc | Role |
|-----|------|
| Time Machine Spec **v0.1.7** (*confirm*) | **Day** fractal · transport (Play/Pause/Stop · 10×/20×/50× · Reset · HUD · `replayCursor`) · **ATM-*** IDs stay on Day. Time Machine is the **seat**; Day and Instant Replay are **fractals**. Day glow **blue**; Instant Replay glow **green**. |
| Template Runner Spec v0.1 **TR14** (*confirm*) | Stream book. In v0.2 the book is the **client window** of the server film, not the film's SoR. Templates remain pure (TR5). Instant Replay is the named **Scrubber** host view. |
| Heatmap Templates Spec **v0.2.x** (*confirm*; HM21 cited from a later revision) | HM1–HM21. §8 already names **Redis as the generation cache** — the film sits beside it. HM10: no MSC Redis schemas. HM4/HM5: after-hours hold. |
| Width Fit Spec **v0.1.x** (*confirm*) | **WF4** Average is a host view. This spec adds **Replay** as a third host mode. |
| Analyzer Spec **v0.2.x** (*confirm*) | Host surface · Autofit strip · package quote |
| 3D Surface App Spec **v0.1.8** §4.6 (*confirm*) | Surface **Time machine** = snap-rebind of listed-leg IV at \(t\). Instant Replay supplies film generations as lawful snaps-at-\(t\). Gold `live_capture` remains its own feed; lineage per §11.8. |
| What-If T/σ Spec v0.1 | What-if = ad-hoc knobs. Overlay **allowed**. Not labeled Instant Replay. |
| OT-EF / **DL-309** | Representable or named state. Never invent a print or a package debit. |
| **DL-400** (*confirm*) | StudioOne OPF chain capture with greeks at `CHAIN_EVERY_S` (default 4 s, fail-loud outside [3,5]). Lineage to this film per §11.8. |
| Arch **28** | One market WebSocket. **No client Massive.** Instant Replay adds no socket and no Massive path. |
| Arch **29** | Heatmap as-built map |
| Human Interface Spec v1.0 | Dark-pinned tokens · ≥44pt hits · no emoji chrome |
| North Star v1.2 | Process outcomes only. **No profit claims.** Green frame is a **mode tell**, not a go/profit signal. |
| **DL-539** | Scope statement; three-OK on trees outside the active program. |
| Sacred invariants **2** (config-driven, fail loud) · **8** (no profit claims) · **10** (server tests green) | Apply to the server film module directly. |

**Does not:** MiniTwo until asked · Tradier / close / orders · replace the gold disk capture · a per-member film · upsampling a thinned tier · a second market WebSocket · a client Massive path · copying MSC · Algo Alert on Instant Replay in v1 · inventing strikes or package prices · storing any member identity in the film.

**Review protocol:** findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion). Coach Content Law: nothing in §0 is removed.

---

## Changes from v0.1.1 (read this first)

**§0 items 1–15 are unchanged.** Items 16–23 are Coach's rulings of 2026-08-26, verbatim, appended in order. Where a later item supersedes an earlier one, the supersession is Coach's and is pointed forward in §0 itself. No TMI law ID is renumbered: changed laws keep their ID with new text marked **(v0.2)**; laws with no successor are marked **RETIRED (v0.2)** with a pointer; new laws append from TMI-47. Acceptance tests are regenerated (they are tests, not laws) because the film moved.

| Change | Where | Source |
|--------|-------|--------|
| Film moves from this tab's RAM to a **server-side, per-book Redis cache shared by every member on that book** | §1 · TMI-4 · TMI-5 · TMI-47–49 | §0.18 |
| Slider retired; **decay by age** replaces it; a full session fits | TMI-11–15 RETIRED · TMI-50–52 | §0.17 · §0.16 (3a) |
| **Record** is opt-in per book per session: off by default, any member turns it on, film starts at that press | TMI-53–55 | §0.19 · §0.21 |
| **Collection**: film wiped and Record reset at a session boundary; boundary is a config value; which boundary is **§11.2** | TMI-56 · §11.2 | §0.19 · §0.21 · §0.22 |
| Whole-**panel** green blurred frame, same seat and grammar as What-If red and Day blue | TMI-25 | §0.23 |
| Surface is in-program, same strip and HUD as Analyzer | scope · TMI-3 · §5.3 | §0.16 (2, 3b) |
| Enter on newest | TMI-21 | §0.16 (4) |
| Recorder lifetime (v0.1.1 §11.4, ruled B) is **moot**: the server records | TMI-41 RETIRED | §0.16 (1) → §0.18 |
| TR14 book becomes the client **read-through window**; adapter and playhead-by-`t_ms` stand | TMI-17 · TMI-19 · TMI-57 | carried |
| Holes renamed for a server film: NOT RECORDING · WAITING · COLLECTED; TRAIL MOVED retired | TMI-38 · TMI-43 RETIRED | consequence of §0.21 |
| Same-hash handling restated for the server film | TMI-8 | carried |
| Sampling-on-write (TMI-44) retired; decay pass is the thinning | TMI-44 RETIRED → TMI-51 | §0.17 |
| Two v0.1 "Does not" lines (server cache; MiniTwo cache) reversed by Coach; Lima logs the reversal | §11.10 | §0.18 |
| Server-side concerns added: config keys, memory budget, Massive terms, no member data in film | TMI-58–61 · §11.6–11.8 | consequence of §0.18 |

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
9. Give the user the option of capturing **max detail for so many minutes** or **decimated detail for longer playback**. Put the cache in terms of **playback time instead of MB**, with a note that **granularity degrades as time to replay increases**. A slider that makes that relationship clear. *(Coach superseded the slider in item 17; "granularity degrades with age" is kept as the decay law.)*
10. This would have to be a **setting once made, it would be going forward.** Any cached data after making the choice **might be destroyed or altered.** *(Coach: "altered" is now thinning by age — item 17; "destroyed" is collection at the session boundary — items 19, 21, 22.)*
11. Optimally they would **set the slider in the morning**, then they would have a **trailing replay starting at market open**. Or whenever they **reset the slider the trail would start from there**. *(Coach: the morning act is now turning Record on — item 21; the film runs from that press with no trailing cutoff — item 17.)*
12. If you are scrubbing, you are **not concerned about realtime accuracy**.
13. **Start with the design.** Once details are worked out: technical spec, then build plan.
14. **Name: Time Machine - Instant Replay** — mostly because it will **play in the same place as Time Machine**, just in a **different fractal**.
15. Instant Replay mode should be **obvious**. Time Machine Day uses a **blue** blurred highlight or frame. Instant Replay uses a **green** blurred frame around the canvas while it is active. **This includes Heatmap, Analyzer, and Surface.** *(Coach widened "canvas" to the entire panel — item 23.)*
16. *(§11 pass on v0.1.1)* "1. B, 2. Surface is just another view of the same data, so it works as normal. 3a. Follows #1 the cache continues to record. If you had a decay rate that the older cached ticks would get thinner, you could stick to a full day of cache. Like #2. the Surface is just a reflection of the data, same as the Analyzer. 4. OK 5. See #3." *(Ruling 1 — tab-lifetime recorder — is superseded by item 18: the server records.)*
17. "I came up with a better idea than giving a slider. Decay older cache ticks by thinning them out, that way it is easy to hold a full day and older ticks are wider intervals."
18. "You could do that with a decay function similar to redis. In fact you could use redis for the cache maybe and get it for free."
19. "Record or cache must be turned on and then wiped before the next session, maybe at midnight."
20. "This is like a controlled memory leak then garbage collected at the end of a session."
21. "Always off by default, but can be turned on at any time by the user and it starts from there, then at the eod it wipes clean, resets."
22. "Or it wipes before the next market session. Or the user can set when it wipes, so many hours past the market close." *(Three boundary options — §11.2.)*
23. "The entire panel must display it is in Instant Replay mode with a blurred border, like What-If and Time Machine."

Tango / Hotel / Echo / India / Mike / Foxtrot notes sit in **§14** beside this text. They do not delete it.

---

## 1. Job

**Time Machine - Instant Replay** is the **fine fractal** of Time Machine: scrub the **book's recorded chain film** for this session.

The member is subscribed to one OPF book (symbol + listed expiration + wing window). Live generations paint as today. When **Record** is on for that book, the **server** also writes each generation into the book's **film** — a Labs-native Redis cache beside the existing generation cache — and thins it by age so a whole session fits. The film is **per book**, **shared by every member on that book**, holds **no member data**, and is **collected** (wiped, Record reset) at the session boundary.

Instant Replay **does not change templates or structures**. It **swaps the input**:

| Mode | Input | What you see |
|------|-------|--------------|
| **Live** | Current OPF generation (WebSocket) | Now |
| **Instant Replay** | A **selected generation** in the book's film | That `as_of` |

Any Heatmap template and any **strategy position whose legs are listed on that generation** can be rebuilt at that tick. Surface rebinds listed-leg IV from the same generation (Surface §4.6 snap-at-\(t\)).

**One Time Machine, two fractals** (same strip, HUD, Play/Pause/Stop/speeds/Reset; different film, range, and glow):

| Fractal | Scale | Film | Range | Glow |
|---------|-------|------|-------|------|
| **Day** (AZ-ATM) | Session (~390 min) | Downloaded underlier path | Calendar date | **Blue** panel frame (Analyzer) |
| **Instant Replay** (this spec) | Record press → now, thinned by age | The book's server film | Record start → newest | **Green** panel frame on Heatmap, Analyzer, **and Surface** |

Coach's picture (§0.20): a controlled memory leak, garbage-collected at the end of the session — and a **generational** one: young generations kept whole, older ones compacted, the whole heap freed at the boundary.

---

## 2. Vocabulary (do not collide)

| Name | This spec | Not this spec |
|------|-----------|----------------|
| **Time Machine** | The **seat**: strip + HUD + playhead + panel frame | Inspector What-if knobs |
| **Day** | Calendar download of a 390-minute underlier path (AZ-ATM) | Instant Replay |
| **Instant Replay** | Fine fractal: the book's server film, this session | Gold disk · Surface `live_capture` |
| **Film** (v0.2) | Server-side, per-book, Redis; generations thinned by age; collected at the boundary | This tab's RAM; a per-member store |
| **Window** (v0.2) | The client's TR14 book, now a read-through cache of the film around the playhead | A second film |
| **Record** (v0.2) | The member act that starts a book's film for this session | A per-member switch |
| **Collection** (v0.2) | Wipe of the film and reset of Record at the session boundary | A member action |
| **Tier** (v0.2) | An age band of the film with its own step (raw · 10 s · 30 s · 2 min) | A member setting |
| **What-if** | Ad-hoc time · spot · vol | Must **not** be labeled Time Machine or Instant Replay |
| **Surface Time machine** (gold) | Later snap-rebind from disk | Instant Replay may **feed** Surface with film generations |
| **Playhead owner** | The one client module holding engagement + playhead `t_ms` per tab | Per-route cursor state |
| **ATM-*** | Day fractal IDs | Do not reuse |
| **TMI-*** | This spec | — |
| **AZ-TM-*** | What-if T/σ spec | Do not reuse |

---

## 3. Laws

### 3.1 Seat and fractals

| ID | Law |
|----|-----|
| **TMI-1** | Instant Replay **is Time Machine**. Same Analyzer / Heatmap / Surface transport seat as Day. Not a second product with copied buttons. |
| **TMI-2** | Day and Instant Replay cannot both drive a panel. Switching fractal **parks** the other playhead. Does not delete gold. Does not touch the film. |
| **TMI-3** (v0.2) | Heatmap v1 hosts Instant Replay only (no Day calendar). Analyzer hosts Day **and** Instant Replay. **Surface hosts Instant Replay with the same strip and HUD as Analyzer** (§0.16: Surface is another view of the same data). Gold Surface Time machine remains its own feed. |
| **TMI-4** (v0.2) | **The server records.** No client records. Heatmap, Analyzer, and Surface are all **projectors** of the same film. Which host is open, whether any host is open, reload, new tab, new device — none of it changes the film. |

### 3.2 Film (server)

| ID | Law |
|----|-----|
| **TMI-5** (v0.2) | Film = ordered generations for the book key (`symbol\|expiration`), held in Labs-native Redis keys beside the existing generation cache. Each entry is the **raw OPF-held dual-side generation** as generated: listed contracts, spot, wings, strike step, `content_hash`, `as_of`, stale/quality — the same object the socket pushes. **No member identity, session, or preference is ever written into the film** (TMI-60). |
| **TMI-6** | Templates stay **pure** (TR5 / HM6). They never read the film or the window. The **host** selects a generation and `run()`s (Heatmap) or rebinds legs (Analyzer / Surface). |
| **TMI-7** (v0.2) | While Record is on for a book, the server writes **every** generation it produces for that book into the film, regardless of which templates any member is viewing. The film is not template-specific. |
| **TMI-8** (v0.2) | A generation whose `content_hash` equals the newest film entry's is **not** a new entry; the newest entry's `as_of_last` advances. Each entry carries `as_of` (first seen) and `as_of_last`. HUD range end (TMI-23) = newest `as_of_last`. The clock under a playhead shows that entry's `as_of`. Gaps stay gaps; nothing is interpolated. |
| **TMI-9** RETIRED (v0.2) | Sampling-on-write is replaced by decay (TMI-50–52). Live paint and the film head are both the server's raw generation cadence. |
| **TMI-10** (v0.2) | Changing symbol or listed expiration is a **different book** with its own film and its own Record state. Do not cross-fill SPY→SPX or one expiry into another. |

### 3.3 Slider — RETIRED

| ID | Law |
|----|-----|
| **TMI-11 · TMI-12 · TMI-13 · TMI-14 · TMI-15 · TMI-16** RETIRED (v0.2) | The playback-time slider, its three stops, going-forward-only, wipe-on-change, the morning slider ritual, and `replayHorizon` in HM21 are all superseded by Coach (§0.17, §0.21). "Granularity degrades with age" survives as TMI-50. "10-second playback is acceptable" (§0.8) survives as a tier step. HM21 no longer persists any Instant Replay setting (there is none); §11.9 asks what happens to an existing persisted megabyte detent. |

### 3.4 Record and collection (v0.2)

| ID | Law |
|----|-----|
| **TMI-53** | **Record is off by default for every book, every session.** No book is filmed unless a member turns it on. |
| **TMI-54** | **Any member may turn Record on for a book at any time.** The film starts at the first generation after that press. Because the film is per book, that press starts it **for every member on the book**; later arrivals see the film from that start, not from the open. The film carries `record_started_at`; HUD and status line name it (`Recording since 10:14`). The identity of the member who pressed is **not** stored in the film and **not** shown (Mike). |
| **TMI-55** | **Record cannot be turned off before collection.** Coach: "it starts from there, then … it wipes clean" (§0.21). Reading confirmed at §11.5; no stop control is drawn. |
| **TMI-56** | **Collection.** At the session boundary the server deletes the book's film keys and resets Record to off. Boundary is a **config value** (illustrative `LABS_REPLAY_COLLECT`; missing → boot aborts, invariant 2), expressed against the platform session calendar in America/New_York. Implementation is `EXPIREAT` on every film key at write time plus a meta reset — no cron to forget. **Which boundary — next-session pre-market, midnight, or hours-past-close — is §11.2.** After collection the hosts show **COLLECTED** (TMI-38) until someone presses Record again. |

### 3.5 Decay (v0.2)

| ID | Law |
|----|-----|
| **TMI-50** | **Older generations are thinner.** The film is tiered by age: the youngest tier keeps every generation at the server's raw cadence; each older tier keeps one generation per wider step. Steps widen with age; they never narrow; nothing is interpolated to refill a thinned tier. The HUD clock always shows the step of the tier under the playhead (`10:42:03 · 4s` near the edge; `09:47:00 · 2m` near the open). |
| **TMI-51** | **Thinning pass.** A server pass (interval config) walks each film and, for every entry that has aged into a wider tier, keeps the entry nearest each step grid point and drops the rest. Per-entry `as_of` is never altered. The pass is idempotent and fail-loud (an entry it cannot classify stops the pass, never silently keeps or drops). Mechanism — generations as whole blobs in a Redis stream/sorted set with this pass, versus per-field RedisTimeSeries compaction rules — is **§11.4**; the visible law is the same either way. |
| **TMI-52** | **Tiers are law once Coach recognizes them (§11.3); a candidate is carried there.** Tier boundaries and steps are config (illustrative `LABS_REPLAY_TIERS`, JSON, fail-loud), and a full session at the candidate tiers fits a per-book budget Foxtrot sizes (§11.6). The Cache/Record line always shows actuals: `Recording since 10:14 · 1,180 gens · 4s→2m`. |

### 3.6 Transport (reuse Day; do not fork)

| ID | Law |
|----|-----|
| **TMI-17** (v0.2) | Adapter `filmToReplaySamples(entries): { samples: ReplaySample[], entryOf: (sampleIdx) => entryRef }`. `as_of` → `t_ms`; `spot` → `spot`. Entries with no usable time are omitted. Entries with no spot are omitted from the **mini path** but remain selectable; an explicit sample→entry map is returned so an index into one is never used as an index into the other. The samples for the mini path come from a **film index** (timestamps + spot + hash only, small) so the HUD can draw the whole session without fetching generations. |
| **TMI-18** | Use existing `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` / `REPLAY_SPEEDS` (`10` \| `20` \| `50`). No second clock module. No extra 1× in v1. |
| **TMI-19** (v0.2) | **The playhead is a `t_ms`, not an index.** The generation painted under it is the film entry nearest `t_ms` **in the tier that owns that age**, resolved through the window (`StreamBook.atTime` on the window; a miss fetches per TMI-57). Re-resolved on every append, thinning, and speed change. |
| **TMI-20** | **Play** from current playhead. **Pause** freezes paint; recording is the server's and unaffected. **Stop** parks at the **film start** (`record_started_at`); does not exit. **Reset** leaves Time Machine: paint to Live, HUD hidden, green frame off; film untouched. |
| **TMI-21** (v0.2) | Enter Instant Replay: playhead = **newest** entry (§0.16 ruling 4). Clock America/New_York. HUD title **Instant Replay**; footer `Recording since 10:14 · N gens · step` (not `N closes`). No calendar date field on this fractal. |
| **TMI-22** (v0.2) | While Instant Replay is on, the server keeps writing. **Append at the edge is atomic** on the client: an append first extends the range, then — if the playhead was on the newest entry and Playing — advances on the next frame; if Paused, the playhead `t_ms` does not move and only the range grows. Playing at the newest entry holds until a newer one appends. No double paint, no jump. |
| **TMI-23** (v0.2) | Range = `record_started_at` → newest `as_of_last`. Never a clock longer than the film, never earlier than the Record press. |
| **TMI-24** | Speeds 10× / 20× / 50×: wall elapsed × speed = session elapsed across film `t_ms`. Speed change does not jump. Clock shows the step under the playhead. (At 10× across a 2-minute tier the playhead advances one entry per 12 wall-seconds; that is honest, not a defect — §0.8.) |
| **TMI-57** (v0.2) | **Window.** The client keeps a read-through window of film entries around the playhead — the TR14 book, repurposed: `getStreamBook()` holds fetched entries keyed by `as_of`; `atTime` resolves; `clear` on book-key change or collection. On a miss, the host fetches the entry (and prefetches a bounded number of neighbours in the playhead's tier and direction) over the replay read path (TMI-58). Window size and prefetch count are client constants named in the build plan. The window is never the SoR and never outlives the film. |

### 3.7 Panel frame (mode must be obvious)

| ID | Law |
|----|-----|
| **TMI-25** (v0.2) | While Instant Replay is active, a **green blurred inner frame on the entire panel** — the Heatmap panel (inspector **and** workspace), the whole Analyzer panel, the whole Surface panel. **Same seat and same grammar** as What-If red and Day blue: `pointer-events: none`, inset blur, rounded to the panel. If red and blue are drawn on the viewport rather than the panel today, Echo brings all three to the panel so the three tells are the same size (§11.1). Day remains **blue**. What-if remains **red**. |
| **TMI-26** | Instant Replay + What-if → **green wins** (replay is the clock). Instant Replay and Day cannot both frame (TMI-2). |
| **TMI-27** (v0.2) | Named test ids: `data-glow="instant-replay"` on each panel root (`heatmap-panel-glow` · `analyzer-panel-glow` · `surface-panel-glow`). Echo freezes the green token; it must **not** read as a profit/go signal. Static or animated is Echo's (§11.1); if animated, reduced-motion is a static inset. |
| **TMI-28** | HUD / strip / status-line copy names **Instant Replay** so color is not the only tell. |

### 3.8 Hosts

| ID | Law |
|----|-----|
| **TMI-29** | Width Fit: **Live \| Average \| Replay**. Average = mean of a window of memos. Replay = **single generation** under the playhead. Do not collapse Average into Replay. Other templates: **Live \| Replay**. |
| **TMI-30** | Switching template while Instant Replay is on does **not** exit Instant Replay. Same film, different `run()`. |
| **TMI-31** | Analyzer: package-mark representable legs from the selected generation. Missing listed leg → **NOT TRADED** / **CHECK LEGS** (OT-EF), never a fake debit/credit. Autofit **X** = **spot on the selected generation**. Autofit does not fire on every playhead tick. |
| **TMI-32** | Surface: rebind listed-leg IV, spot, and OPF \(\tau\) from the selected generation (Surface §4.6). Missing exact/locked IV → **IV NO**. Do not interpolate. Do not start a gold `live_capture` download to fill Instant Replay. |
| **TMI-33** | **Heatmap** GEX and other Heatmap templates **may** run on the selected generation. Day's **ATM-B2** GEX-off does not apply to this fractal. **Analyzer** GEX / Probability during Instant Replay: **§11.7 open** (unchanged from v0.1.1). |
| **TMI-34** | **Algo Alert is out of v1** on Instant Replay. Day keeps Algo-on-day (ATM-A1). Do not silently point Demo at film generations. |
| **TMI-35** | What-if overlay **allowed**: Instant Replay owns spot and session time of the generation; What-if **Vol** may still apply; What-if Time / Spot% are inert while an Instant Replay playhead is active and say so (ATM-K3 grammar). |
| **TMI-36** (v0.2) | **Record control placement: §11.5.** Candidate carried there: Record sits in the Time Machine strip on all three hosts (the member can press it "at any time," §0.21); the Heatmap inspector Cache section becomes the film **status line** (Record state, since, gens, steps), not a control panel. No slider anywhere. |
| **TMI-42** | **One playhead owner per tab.** Instant Replay engagement, playhead `t_ms`, transport state, and speed live in one client module; Heatmap, Analyzer, and Surface hosts bind to it; none keeps a private cursor. SPA navigation changes the projector, not the playhead. |
| **TMI-45** | **Generation geometry governs under replay.** An entry carries its own wings and strike step. While a playhead is active, templates run on the entry's listed strikes; the inspector wing control reflects the entry's wings and is inert (named). Changing wings changes what the server generates — and therefore films — **next**. |
| **TMI-46** | **Playback coalescing.** The host paints at most one generation per animation frame — the one under the playhead at frame time; intermediate entries are skipped, not queued, not interpolated. Scrub drag is the same rule. Template `run()` is never invoked for an entry that will not paint. Prefetch (TMI-57) is sized so Play at 50× in the youngest tier does not stall on fetches; if it must wait, the HUD names **FETCHING** rather than freezing on the last paint. |

### 3.9 Honesty

| ID | Law |
|----|-----|
| **TMI-37** | OPF-held listed chain only. No invented strikes, mids, or package prices (**DL-309**). |
| **TMI-38** (v0.2) | Named holes, never a silent blank or a lying last paint after rebind: |

| Hole | When | Member sees |
|------|------|-------------|
| **NOT RECORDING** | Record is off for this book (default, or after collection) | Named, with the Record control. Play off. Frame **off** — there is no playhead. |
| **WAITING** | Record on; first generation not yet written | Named. Frame on if Instant Replay is engaged. |
| **FETCHING** | Playhead resolved to an entry not yet in the window | Named; last paint is **not** shown as the new tick (TMI-K3). |
| **NOT TRADED** / **CHECK LEGS** / **IV NO** | Leg missing or IV missing on the selected generation | Named at that tick. |
| **COLLECTED** | Session boundary passed; film wiped; Record reset | Named once per host until Record is pressed again; then NOT RECORDING. |
| **BUDGET** | Book film at its per-book memory budget (TMI-59) | Named on the status line; server thins the oldest tier further rather than dropping the head; never silent. |

| ID | Law |
|----|-----|
| **TMI-39** (v0.2) | One market WebSocket. No client Massive. The replay read path is a message on that socket **or** an HTTP GET to Labs — never a client pull from Massive, never a second market connection. |
| **TMI-40** | Process / inspection only. No profit claims on replay. Green is not a trade signal. |
| **TMI-43** RETIRED (v0.2) | TRAIL MOVED had no meaning once the film has no trailing cutoff: thinning is handled by `t_ms` resolution and the step on the clock; the day boundary is COLLECTED. |
| **TMI-44** RETIRED (v0.2) | See TMI-51. |
| **TMI-41** RETIRED (v0.2) | Recorder placement is moot; the server records (TMI-4). |

### 3.10 Server (v0.2)

| ID | Law |
|----|-----|
| **TMI-58** | **Read path.** Two lawful shapes; India names one at Phase 2, not both: (a) `replay.index` / `replay.get` request–response messages on the existing market WebSocket (Arch 28 intact, no second connection); (b) `GET /api/me/market/replay/{key}/index` and `…/at?t=` behind the same session and tool-member read gate as the chain ladder (HM13). Either returns whole generations as generated; neither computes template matrices (Heatmap Templates §8). |
| **TMI-59** | **Per-book memory budget** is config (illustrative `LABS_REPLAY_MAX_MB_PER_BOOK`, fail-loud). At budget the server thins the oldest tier a step further before it drops anything from the head, and names BUDGET on the status line. Foxtrot sizes the budget and the host (§11.6); the spec does not assume 32 MiB or any other number. |
| **TMI-60** | **No member data in the film.** Keys, entries, and meta carry the book key, generations, timestamps, hashes, Record state and start time, tier stats. Never a member id, session, IP, or the identity of who pressed Record. The film is safe to share by construction (Mike). |
| **TMI-61** | **Labs-native keys.** Illustrative shape `labs:replay:{symbol}|{expiration}:film` and `…:meta`; Alpha names them. Nothing copied from MSC (HM10, invariant 1). Every key carries `EXPIREAT` at the collection boundary from the moment it is written. |
| **TMI-62** | **Massive terms.** Serving a session of stored chain snapshots back to members is closer to redistribution than the live stream. Mike confirms against Massive's terms at Phase 2 and records the answer in the decision log (§11.8 lineage to DL-400 capture applies). |
| **TMI-63** | **Tests.** Characterization tests for Record on/off, write, dedupe, thinning survivors, collection, budget, and both read-path shapes land in the same change as the module (invariant 10). |

---

## 4. Member flow

```text
Any time
    → NOT RECORDING on the book (default)
    → member presses Record (in the Time Machine strip — §11.5)
    → server films every generation for the book from that press
    → status line: “Recording since 10:14 · 47 gens · 4s”

Watch live
    → any template, any host; film grows on the server; older tiers thin

Enter Time Machine - Instant Replay
    → same transport seat as Day; Surface same as Analyzer
    → green frame on the entire panel
    → HUD title Instant Replay; footer Recording since 10:14 · N gens · step
    → playhead on the newest generation; scrub or Play

Scrub / play
    → host fetches the entry under the playhead (window read-through, prefetch)
    → tiles, GEX, Width Fit Replay cell, Verticals re-run() on it, one per frame
    → switch template without leaving Instant Replay
    → SPA Analyzer / Surface: same playhead owner; tent / package mark / IV rebind at that generation
    → clock shows the tier step; missing leg → named state

Another member, same book
    → sees the same film from 10:14; cannot stop it

Switch fractal to Day (Analyzer)
    → Instant Replay parks; date field appears; blue frame; film untouched

Reset
    → leave Time Machine; Live paint; HUD gone; frame off; server still filming

Session boundary (§11.2)
    → film collected; Record reset; hosts show COLLECTED, then NOT RECORDING
```

---

## 5. Chrome

### 5.1 Heatmap

- Inspector Cache section → **film status line**: Record state · since · gens · steps · BUDGET if hit. No slider. No megabytes.
- Host segment: **Live \| Replay** (Width Fit: **Live \| Average \| Replay**).
- Transport strip + HUD over the workspace when Instant Replay is on (same components as Analyzer; no date field).
- Green frame on the **entire Heatmap panel** (TMI-25).
- Wing control reflects the entry and is inert under replay (TMI-45).

### 5.2 Analyzer

- Time Machine strip to the right of Autofit (ATM §5.1) — same place.
- Fractal: **Day** shows the date field; **Instant Replay** hides it and shows `Recording since 10:14`.
- Shared Play / Pause / Stop / 10× / 20× / 50× / Reset; **Record** per §11.5.
- HUD upper-right (ATM-H1 grammar); captions per TMI-21.
- Green frame on the whole Analyzer panel. Day uses blue on the same seat.

### 5.3 Surface

- **Same strip + HUD as Analyzer** on the Surface panel when Instant Replay is on (§0.16).
- Green frame on the whole Surface panel.
- Do not label a What-if τ playhead Instant Replay (Surface §4.6 stands).

Component surgery (prefer extract, not copy): `AnalyzerTimeMachineStrip` gains fractal `day` \| `instant` and a Record control per §11.5; HUD gains title/footer props. Heatmap and Surface mount the same components and bind to the playhead owner (TMI-42).

---

## 6. Clock and projectors

**TMI-K1.** While Instant Replay has a playhead: **spot** = selected generation's spot; **as-of** = its `as_of`; chain = its listed contracts. OPF \(\tau\) / remaining use **that** clock, not wall now.

**TMI-K2.** Heatmap `run(context_from_generation)`. Analyzer package quote from its contracts. Surface \(\sigma_i(t)\) from its IV.

**TMI-K3.** The last paint of Live — or of the previous generation — must not remain as a lying Instant Replay mark. Atomic settle on playhead change, on append at the edge (TMI-22), and on fetch (FETCHING is named; the stale paint is not the new tick).

---

## 7. Ideas inventory (Phase 0 — nothing omitted)

| Idea | Status |
|------|--------|
| Cache = raw OPF chain for **all** Heatmap templates | **IN-SCOPE** · TMI-5 · TMI-7 |
| Instant replay of any template | **IN-SCOPE** · TMI-30 |
| Reconstruct Analyzer chart / butterfly from cached minutes | **IN-SCOPE** · TMI-31 |
| Any representable position in the cached timeframe | **IN-SCOPE** · TMI-31 · TMI-37 |
| Substitute live with cached; runner scrubber | **IN-SCOPE** |
| Scrubber similar to Time Machine; range = cached data | **IN-SCOPE** · TMI-1 · TMI-23 |
| 10s interval acceptable playback | **IN-SCOPE** · a tier step · TMI-50 |
| Playback time instead of MB; granularity degrades | **IN-SCOPE** · decay · TMI-50–52 (slider superseded by Coach §0.17) |
| Setting going forward; cached data may be destroyed / altered | **IN-SCOPE** · thinning (TMI-51) · collection (TMI-56) |
| Morning slider; trailing replay from open / reset | **IN-SCOPE** as Record from the press · TMI-54 (Coach §0.21) |
| Scrubbing not realtime-accurate | **IN-SCOPE** · TMI-50 |
| Name **Time Machine - Instant Replay**; same place, different fractal | **IN-SCOPE** · TMI-1 |
| **Green** blurred frame; Heatmap, Analyzer, Surface; **entire panel** | **IN-SCOPE** · TMI-25–28 |
| Width Fit Live \| Average \| Replay | **IN-SCOPE** · TMI-29 |
| Record while scrubbing | **IN-SCOPE** · TMI-22 |
| Decay older ticks; full day | **IN-SCOPE** · TMI-50–52 |
| Redis for the cache; decay "for free" | **IN-SCOPE** · TMI-5 · TMI-51 · TMI-61 · §11.4 |
| Record on; wiped before next session | **IN-SCOPE** · TMI-53–56 · §11.2 |
| Controlled leak, collected at session end | **IN-SCOPE** · TMI-56 |
| Off by default; user turns on; starts there; EOD reset | **IN-SCOPE** · TMI-53–56 |
| Wipe before next session / user-set hours past close | **§11.2** |
| Surface = another view of the same data | **IN-SCOPE** · TMI-3 · TMI-4 |
| Algo Alert on Instant Replay | **OUT** of v1 · TMI-34 |
| Speeds 10× / 20× / 50× | **IN-SCOPE** · TMI-18 |
| What-if overlay | **IN-SCOPE** · TMI-35 |
| Gold / StudioOne full-day chain capture | **FLAGGED** · lineage §11.8 · not replaced |
| Per-member film; multi-device sync of playhead | **OUT** (film is per book; playhead is per tab) |
| Upsample a thinned tier | **OUT** |
| Extra 1× speed | **FLAGGED** (Coach kept TM speeds) |
| Member stop-recording before collection | **OUT** by reading of §0.21 · §11.5 confirms |

---

## 8. Acceptance (AT-TMI, regenerated for v0.2)

| ID | Criterion |
|----|-----------|
| **AT-TMI-1** | New book, no Record press → server writes nothing; hosts show NOT RECORDING; no film keys exist. |
| **AT-TMI-2** | Member presses Record → `record_started_at` set; first generation after the press is entry 1; generations before the press are absent. |
| **AT-TMI-3** | Second member on the same book → same film, same start, no Record control offered as "start" (state is on); no member id in any film key or entry. |
| **AT-TMI-4** | Templates do not import `getStreamBook` or any film client. Host selects an entry then `run()`. |
| **AT-TMI-5** | Identical `content_hash` on consecutive generations → one entry; `as_of_last` advances; HUD range end equals newest `as_of_last`; clock under that entry equals its `as_of`. |
| **AT-TMI-6** | Thinning: a synthetic film aged across a tier boundary → exactly one survivor per step, the one nearest each grid point; survivors' `as_of` unchanged; no entry with an `as_of` not originally written. |
| **AT-TMI-7** | Collection: at the configured boundary all film keys are gone (`EXPIREAT` verified on write), Record is off, hosts show COLLECTED then NOT RECORDING. Missing boundary config → boot aborts. |
| **AT-TMI-8** | Per-book budget reached → oldest tier thinned a step further before any head entry drops; BUDGET named on the status line. |
| **AT-TMI-9** | Read path (the one India names): returns the whole generation as generated; behind the same gate as the chain ladder; no template matrix computed server-side. The unchosen shape does not exist. |
| **AT-TMI-10** | Browser network during Instant Replay: no Massive host from the client; no second market connection; only the named read path. |
| **AT-TMI-11** | Enter Instant Replay: playhead = newest. Stop → film start. Reset → Live; film untouched; server still filming (entry count grows). |
| **AT-TMI-12** | Pause on the client does not stop server writes. |
| **AT-TMI-13** | `replayCursor` walks film `t_ms` at 10×: one wall-second advances ten session-seconds in the youngest tier; across a 2-minute tier the playhead advances one entry per 12 wall-seconds; speed change does not jump. |
| **AT-TMI-14** | Green frame on the **panel root** of Heatmap, Analyzer, and Surface (`data-glow="instant-replay"`), enclosing inspector and workspace on Heatmap; same seat as red and blue. NOT RECORDING → frame off. |
| **AT-TMI-15** | Analyzer Day on → blue. What-if only → red. Instant Replay + What-if → green. |
| **AT-TMI-16** | Width Fit exposes Live \| Average \| Replay; Average is a window mean; Replay is one generation. Other templates: Live \| Replay. |
| **AT-TMI-17** | Switch template while Instant Replay is on: stay in Instant Replay; tiles recompute on the same entry. |
| **AT-TMI-18** | SPA Heatmap → Analyzer → Surface same tab: same playhead `t_ms` (one owner); representable butterfly shows listed package mark at that generation; Surface listed-leg IV rebound; missing IV → IV NO. |
| **AT-TMI-19** | New tab / reload / second device on the same book: film present from the server; NOT a NO FILM state; playhead not shared (per tab). |
| **AT-TMI-20** | Missing listed leg on the selected generation → named OT-EF state, never an invented debit. |
| **AT-TMI-21** | Changing symbol or expiration → the other book's film and Record state; never the previous book's entries. |
| **AT-TMI-22** | Window: scrubbing to an entry outside the window → FETCHING named, previous paint not shown as the new tick, entry painted on arrival; prefetch sized so Play at 50× in the youngest tier does not show FETCHING on a healthy connection. |
| **AT-TMI-23** | Algo Create Alert is not armed from an Instant Replay playhead in v1. |
| **AT-TMI-24** | Day and Instant Replay exclusive: entering one parks the other; film untouched. |
| **AT-TMI-25** | Analyzer Autofit fires ≤ once on entry during 30 session-seconds of Play unless the member acts. |
| **AT-TMI-26** | Coalescing: Play at 50× for 10 wall-seconds → `run()` ≤ one per animation frame; no `run()` for an entry that did not paint. |
| **AT-TMI-27** | Wings changed while a playhead is active: painted entry unchanged; wing control shows the entry's wings and is inert with a named reason; next filmed generation carries the new wings. |
| **AT-TMI-28** | Atomic settle: no frame shows a Live mark or a previous entry under a replay clock during entry, playhead change, append, thinning, or fetch. |
| **AT-TMI-29** | Characterization suite green with the new server tests (invariant 10); config keys absent → boot aborts (invariant 2). |
| **AT-TMI-30** | Public and member copy on this feature contains no profit claim; HUD and status line name Instant Replay. |

---

## 9. Out of scope

- MiniTwo / production deploy until Coach asks  
- Tradier, flatten, broker orders  
- Replacing the gold disk / StudioOne capture (lineage only, §11.8)  
- Per-member film; per-member retention; cross-device playhead sync  
- Upsampling a thinned tier  
- Extra 1× speed  
- Algo on Instant Replay  
- Member stop-recording before collection (by reading of §0.21; §11.5 confirms)  
- Rewriting What-if T/σ domain  
- Any access rule beyond what the host surfaces already carry (§11.11)

---

## 10. As-built (check first — not law)

Every row is an assertion to be **verified by reading the file**; the build plan cites path and line before a packet depends on it.

| As-built | Honesty |
|----------|---------|
| Redis generation cache (Heatmap Templates §8) | Exists server-side. Key shape, TTL, and whether it is per book-key — **read and record**; the film sits beside it, does not replace it. |
| StudioOne OPF capture at `CHAIN_EVERY_S` (DL-400) | Separate process on disk. Whether it shares a write with the Labs generation cache — **read and record** (§11.8). |
| TR14 `StreamBook` · `atTime` / `window` / `clear` · MiB detent | Client book exists. Becomes the window (TMI-57); the MiB detent is retired from the member story (§11.9). |
| Heatmap write on any template (DL-593) | Client write path exists; **retired** as a recorder in v0.2 (TMI-4). Removal is in scope for the Heatmap packet. |
| `AnalyzerTimeMachineStrip` + HUD + `replayCursor` | Day film only. Date field always shown. Glow `timemachine` = blue — **on the viewport or the panel? read and record** (TMI-25). Cursor state lives in the Analyzer host — **read and record** (TMI-42 moves it). |
| What-if red glow | **Viewport or panel? read and record** (TMI-25). |
| Heatmap / Surface | No Time Machine strip, no frame. |
| Analyzer package quote | Live/held OPF only. |
| Session calendar (VP) | Exists for SSR / VP; reuse for the collection boundary (TMI-56). |
| HM21 blob | Persists a megabyte detent today — **read and record** the key (§11.9). |

---

## 11. Open for Coach (not silently decided)

Interview format. Candidates are marked; none is pre-answered.

1. **Echo green token; static or animated; frame seat.** Law: green blurred frame on the entire panel, same seat as red and blue. If red/blue are viewport-drawn today, Echo brings all three to the panel. Token must not read as success/go.
2. **Collection boundary.** (a) **Next-session pre-market** from the session calendar — today's film survives the evening; nothing to set. (b) **Midnight** America/New_York. (c) **Hours past the close** — because the film is shared per book, this needs an owner: the member who pressed Record sets it for everyone and it's shown on the film; or it's admin/config; or it's a per-member visibility cutoff with no server effect. *Advisor lean: (a), no member setting.*
3. **Tiers — recognition.** Candidate, with the youngest tier at the server's raw cadence: **raw** for the latest 15 min · **10 s** to 60 min · **30 s** to 2 h · **2 min** to the Record press. Name them, adjust, or direct the build to derive them from measured generation bytes and Foxtrot's budget (§11.6). 2 s-class head and a 10 s band are the two you've already named (§0.8).
4. **Decay mechanism.** Whole generations as blobs in a Redis stream / sorted set with a server thinning pass, **or** per-contract-field RedisTimeSeries with compaction rules (`TS.CREATERULE … AGGREGATION LAST`) and reassembly at read. *Advisor lean: blobs* — templates and Surface rebind want a whole generation at a tick; per-field fan-out is thousands of keys and a reassembly step. This can also be India's call at Phase 2 if you'd rather.
5. **Record control placement, and no-stop.** Candidate: Record in the Time Machine strip on all three hosts; Heatmap inspector Cache becomes the status line. Confirm the reading that Record **cannot be turned off** before collection (§0.21).
6. **Server budget and host.** Per-book memory budget and how many books may film at once are Foxtrot's to size against MiniTwo/DudeTwo RAM after generation bytes are measured; the spec carries no number. Say if you want a ceiling named now.
7. **Analyzer GEX / Probability on a scrubbed generation.** Allow, disallow, or later. *Advisor lean: later* (unchanged).
8. **Lineage to DL-400 capture.** If the StudioOne capture and the Labs generation cache are the same write, the film is that write plus `EXPIREAT` and thinning, and there is one recorder of the chain, not two. India names the relationship at Phase 2; you rule if it changes what StudioOne captures.
9. **HM21 megabyte detent.** It no longer means anything. Drop the key on next load, or leave it inert? No default proposed.
10. **Decision-log reversals to record as yours.** v0.1 "Does not: server member cache · MiniTwo server cache" are reversed by §0.18 — the film is a server-side **book** cache with no member data. Lima logs the reversal against DL-594 so Grok Build does not plan against the old line.
11. **Access.** No new rule; the read path inherits the chain-ladder gate (HM13) on every host. If that inheritance is undirected rather than decided, say so; no advisor default in either direction.
12. **Massive terms.** Mike confirms serving a session of stored snapshots to members is within terms (TMI-62). You rule if it is not.

Everything in §0 is **law**, not an open.

---

## 12. Parent amendments (this DRAFT)

When this spec reaches BUILD AUTHORITY, parents gain one-line pointers in the same packet, each as the next patch of its **confirmed** as-built version, filename `vX_Y_Z`:

- Time Machine Spec → Time Machine is the seat; Instant Replay is the fine fractal (this document); Day blue, Instant Replay green, both on the panel; one playhead owner per tab.  
- Runner TR14 → the stream book is the client **window** of the server film; Instant Replay is the named Scrubber; no client recording.  
- Heatmap Templates → §8 Redis gains the replay film beside the generation cache; HM21 persists no Instant Replay setting; Instant Replay host mode; the Cache section is a status line.  
- Width Fit → Live \| Average \| Replay.  
- Surface §4.6 → a film generation is a lawful snap-at-\(t\) for Instant Replay; Surface hosts the same strip and HUD as Analyzer.  
- Arch 28 → replay read path named (message or GET); still one socket, no client Massive.  
- DL-400 → lineage note per §11.8.

---

## 13. Suggested path after BUILD AUTHORITY

1. **Measure generation bytes** across a busy 0DTE session before tiers and budget are frozen (feeds §11.3, §11.6).  
2. Phase 2 **India:** film beside the generation cache; read-path shape; decay mechanism; one playhead owner; lineage to DL-400; no second socket; no Massive. **Mike:** no member data in film; Massive terms. **Foxtrot:** budget and host.  
3. Phase 3 **Echo + Tango:** panel frame on all three tells; Record control and status-line copy; "Recording since"; COLLECTED / BUDGET / FETCHING copy; no profit chrome.  
4. Phase 4 **Hotel:** inspection-only; green ≠ signal; a thinned tier is a sampled record, not a print history — the step on the clock is the honesty.  
5. Coach Phase 5 stamp → full-agent bench plan (Grok Build): **Alpha** film module + tests → **Charlie** playhead owner + window + adapter → Heatmap host → Analyzer → Surface → Width Fit Replay third → **Kilo** AT-TMI-1…30 → **Delta**.  
6. Help article: Record is per book and shared; the film starts at the press; older minutes are thinner; the film is collected at the boundary; Instant Replay is this session's film, not a saved movie.  
7. Lima DL already proposed as **DL-594**; reversals per §11.10 logged with it.

No implementation until Coach Phase 5 / GO.

---

## 14. Reviewer notes (beside §0; more land in Phase 2–4)

India / Echo / Tango / Hotel / Mike / Foxtrot write **beside** §0. They do not delete Coach text.

**Beside (Tango, not a deletion):** green must not read as "good trade / go." HUD names Instant Replay. Observation-only copy on replay. A shared film means a member can see a Record they did not press — the status line says "Recording since 10:14," never who.

**Beside (Hotel, not a deletion):** Instant Replay of listed marks is inspection of what was on the chain, not a forecast and not a fill. A thinned tier is a sampled record; the step on the clock is the honesty.

**Beside (India, not a deletion):** one film per book, one recorder (the server), one playhead owner per tab; hosts bind, never fork. The film sits beside the generation cache, does not replace it, and is not a second store of truth for anything but replay.

**Beside (Mike, not a deletion):** no member identity in the film, by construction; Massive terms confirmed before the read path serves a member.

---

## 15. Document control

| Version | Date | Notes |
|---------|------|-------|
| v0.1 | 2026-08-26 | Coach Instant Replay: Time Machine fine fractal; client TR14 film; playback-time slider; green frame on canvas; Heatmap records. **DL-594** proposed. |
| v0.1.1 | 2026-08-26 | Advisor revision after Claude and Grok reviews; contradictions named; undirected choices moved to §11; AT-TMI-24…32. |
| **v0.2** | 2026-08-26 | Rewrite on Coach rulings §0.16–23. Film moves to a **server-side per-book Redis cache** shared by members, no member data. **Decay by age** replaces the slider (TMI-50–52). **Record** opt-in per book per session (TMI-53–55). **Collection** at a config boundary (TMI-56; which boundary §11.2). **Whole-panel** green frame (TMI-25). Surface in-program, same strip as Analyzer. Enter on newest. TR14 book → client window (TMI-57). Read path, budget, keys, terms, tests (TMI-58–63). TMI-9, 11–16, 41, 43, 44 RETIRED with pointers. ATs regenerated (1–30). Two v0.1 "Does not" lines reversed by Coach (§11.10). |

**One-line law:**  
**Time Machine stays one machine; Instant Replay is the fine fractal — the book's session film on the server, shared by every member on the book, off until someone presses Record, thinner as it ages, collected at the boundary; same transport as Day, green frame on the whole panel of Heatmap / Analyzer / Surface, any template or listed-leg position, never a second market, never a fake print, never a paint the clock doesn't own.**

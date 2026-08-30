# FatTail Labs — Options Lab Time Machine - Instant Replay Spec v0.3

**Status:** DRAFT v0.3 — rewrite after Coach's rulings of 2026-08-26 (walk-and-talk session). **The collapse:** Instant Replay is not a separate feature; it is Time Machine's default state. One surface, one scrubber, one date control. **Not BUILD AUTHORITY** until Coach Phase 5.
**Type:** Product + technical spec — **Time Machine - Instant Replay**
**Short name:** **TMI**
**Routes:** `/app/options-lab/heatmap` · `/app/options-lab/analyzer` · `/app/options-lab/surface`
**Filename:** `FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_3.md`
**Supersedes:** v0.2, v0.1.1, v0.1
**Design:** `docs/Options-Lab-Time-Machine-Instant-Replay-Design-Proposal.md` — its client-RAM film section was superseded by §0.18 and is now itself in question under §0.45 (see §11.1). Its seat and honesty sections stand.

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine - Instant Replay.

**Files / trees this spec touches** (exact paths confirmed by reading the repo at bench review, not assumed here):

- Heatmap host and inspector (`HeatmapChainPanel`; inspector Cache section)
- TR14 stream book module (`getStreamBook()`, `StreamBook.atTime` / `window` / `clear`)
- Time Machine transport (`AnalyzerTimeMachineStrip.tsx`, `AnalyzerDayReplayHud.tsx`, `algoDayReplay.ts`)
- Analyzer host (panel frame, Autofit strip, package quote)
- Width Fit host view (Live | Average | **Replay**)
- Surface host (panel frame, strip + HUD mount, listed-leg IV rebind per Surface §4.6)
- Past-day download path for the banked capture corpus (§0.39–43)
- `Specs/` parent one-line amendments (§12); `Architecture/00-decision-log.md` (DL-594 proposed)
- **Conditional on §11.1:** `server/` replay film module, Redis film keys, and characterization tests — **in scope only if the film stays server-side.** §0.45 ("browser side") puts that in question; the resolution decides whether `server/` is touched at all.

**Touches outside program:** **NONE.** Surface is in-program (§0.16). Identity/auth, payments, the market bus server's Massive pull, and MSC are untouched.

**Review protocol:** findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion). Coach Content Law: nothing in §0 is removed.

---

## A note on §0 items 24–47 — read before anything else

Items 1–23 are typed Coach, verbatim, carried from v0.2 untouched.

**Items 24–47 came from a voice session on a walk.** They are quoted from the transcript exactly as it recorded them, including the transcription's own errors, which are marked `[sic]` with the reading in brackets. Three of them turn on a word the transcript may have mangled:

- §0.28 reads *"It's SSIS"* — a garble. The reading taken is that the decay curve is Coach's, not a member setting.
- §0.29 reads *"no rights should be allowed"* — read as **writes**.
- §0.35 reads *"a pie machine"* and §0.38 reads *"iMachine"* — both read as **Time Machine**.

Every law built on a marked item points back to it. **Coach confirms or corrects the readings before Phase 2.** No law derived from a garbled word is treated as settled (§11.2).

---

## Changes from v0.2 (read this second)

**§0 items 1–23 unchanged.** Items 24–47 appended in order. No TMI law ID renumbered: changed laws keep their ID with new text marked **(v0.3)**; superseded laws are marked **RETIRED (v0.3)** with a pointer; new laws append from **TMI-64**.

| Change | Where | Source |
|---|---|---|
| **The collapse.** Instant Replay is Time Machine's **default state**, not a second fractal. One surface, one scrubber, one component. | §1 · TMI-1 · TMI-64 · TMI-65 | §0.35–38 |
| **Date control always present, today pre-selected.** Choosing another date silently promotes to that day with no mode change the member can feel. | TMI-64 · TMI-21 · §5 | §0.36 · §0.37 · §0.38 |
| Day/Instant exclusivity and "parking" retired — there is nothing to park between | **TMI-2 RETIRED** | §0.38 |
| Heatmap gains the date control (v0.2 withheld it) | TMI-3 | §0.38 |
| **Scrubber sticky across all three hosts** — one clock for the desk | TMI-42 | §0.30 |
| **Return to live exits scrub mode** | TMI-66 | §0.31 |
| **No writes while a playhead is active** | TMI-67 · AT-TMI-31 | §0.29 |
| Decay thins the **number of intervals**, never an interval's internals; a snapshot is kept whole or dropped | TMI-50 | §0.24 · §0.25 |
| Cadence ladder named: **2 s native → ~10 s at the oldest end**, roughly half the footprint | TMI-68 | §0.26 · §0.27 |
| **Density is invisible to the member.** The step-on-the-clock readout is retired | **TMI-50 (density clause) · TMI-52 RETIRED** | §0.33 · §0.34 |
| Past-day source: full-fidelity capture, 70–80 MB/day, banked now, per-day on-demand download after ~a month | TMI-69 | §0.39 · §0.40 |
| **Stochastic download** — coarse pass across the whole day, then progressive infill | TMI-70 | §0.41 |
| **Fidelity indicator** replaces any spinner | TMI-71 | §0.43 |
| Stated download targets: usable 15–20 s, dense 3–4 min | TMI-72 | §0.42 |
| Today's cache is **browser-side**, cleared by **lazy invalidation** against **OPF's** trading date | TMI-73 | §0.44 · §0.45 · §0.47 |
| Server film (TMI-4, 5, 56, 58–63) now **contingent** on §11.1 | §11.1 | §0.45 vs §0.18 |
| Record opt-in now **contingent** on §11.3 | §11.3 | §0.38 vs §0.19–21 |
| Green/blue frame now **contingent** on §11.4 | §11.4 | §0.37 vs §0.15 |

---

## 0. Coach intent (do not drop)

### Typed, this program's earlier threads (items 1–23, carried verbatim from v0.2)

1. The cache is a store of the **raw data coming from OPF as a chain** that is used to construct **all** the possible views created by Heatmap templates.
2. Theoretically, play back the cache and get an **instant replay of any template**.
3. If it is the raw data, then it should be **applicable to any template**.
4. It should also be able to **reconstruct a chart in the Analyzer** — e.g. construct a butterfly over the last so many minutes of cached raw data.
5. **Instant replay of heatmaps and strategy positions.** In fact **any strategy position within the timeframe of the cached data.**
6. In the Heatmap or the Analyzer, **substitute the live data with the cached data**, and create a **runner tool** that would allow the user to **scrub through the data**.
7. A data scrubber **similar to the Time Machine**, with a **range equal to the cached data**.
8. Even at **10 second intervals realtime playback is not terrible**.
9. Give the user the option of capturing **max detail for so many minutes** or **decimated detail for longer playback**. Put the cache in terms of **playback time instead of MB**, with a note that **granularity degrades as time to replay increases**. A slider that makes that relationship clear. *(Coach superseded the slider in item 17.)*
10. This would have to be a **setting once made, it would be going forward.** Any cached data after making the choice **might be destroyed or altered.** *(Coach: "altered" is thinning by age — item 17; "destroyed" is the cache lifecycle — items 19, 21, 22, and now 44–47.)*
11. Optimally they would **set the slider in the morning**, then they would have a **trailing replay starting at market open**. Or whenever they **reset the slider the trail would start from there**. *(Coach: superseded by item 17 and, for the entry act, by item 38.)*
12. If you are scrubbing, you are **not concerned about realtime accuracy**.
13. **Start with the design.** Once details are worked out: technical spec, then build plan.
14. **Name: Time Machine - Instant Replay** — mostly because it will **play in the same place as Time Machine**, just in a **different fractal**. *(Item 38 goes further: it is not a different fractal, it is the default state.)*
15. Instant Replay mode should be **obvious**. Time Machine Day uses a **blue** blurred highlight or frame. Instant Replay uses a **green** blurred frame around the canvas while it is active. **This includes Heatmap, Analyzer, and Surface.** *(Widened to the whole panel — item 23. Now in tension with item 37 — §11.4.)*
16. *(§11 pass on v0.1.1)* "1. B, 2. Surface is just another view of the same data, so it works as normal. 3a. Follows #1 the cache continues to record. If you had a decay rate that the older cached ticks would get thinner, you could stick to a full day of cache. Like #2. the Surface is just a reflection of the data, same as the Analyzer. 4. OK 5. See #3."
17. "I came up with a better idea than giving a slider. Decay older cache ticks by thinning them out, that way it is easy to hold a full day and older ticks are wider intervals."
18. "You could do that with a decay function similar to redis. In fact you could use redis for the cache maybe and get it for free." *(In tension with item 45 — §11.1.)*
19. "Record or cache must be turned on and then wiped before the next session, maybe at midnight." *(In tension with item 38 — §11.3.)*
20. "This is like a controlled memory leak then garbage collected at the end of a session."
21. "Always off by default, but can be turned on at any time by the user and it starts from there, then at the eod it wipes clean, resets." *(In tension with item 38 — §11.3.)*
22. "Or it wipes before the next market session. Or the user can set when it wipes, so many hours past the market close." *(Answered by items 44–47.)*
23. "The entire panel must display it is in Instant Replay mode with a blurred border, like What-If and Time Machine." *(In tension with item 37 — §11.4.)*

### Voice, walk-and-talk 2026-08-26 (items 24–47, transcript-exact; see the note above)

**On decay.**

24. "It doesn't touch a… an interval. It only touch… it doesn't touch the internals of an inter*[val]*. It just touches the number of intervals or the frequency of the intervals."
25. "The actual timeline doesn't change. Just the number of data points."
26. "I don't think that we'll have to go that thin. I think max, we might go ten, ten seconds or so. The normal interval is two seconds."
27. "But enough to reduce the file size probably by half."
28. "They have no control. It's SSIS." *[sic — garbled. Reading: the decay curve is Coach's, not a member-facing setting. §11.2.]*

**On scope and writes.**

29. "Little things like, um, no **rights** *[sic — writes]* should be allowed while, uh, while in instant replay, for example. Uh, also, uh, which surfaces does it apply to? Does it apply to the heat map, the analyzer, and surface, which is the three d version of *[the]* analyzer? Uh, my opinion is that it should apply to everything because everything is just generated directly from this data anyways, so there's nothing really preventing you from kinda limiting one and showing the other."
30. "The scrubber should be sticky across all the views."
31. "The scrubber is sticky, and… but when you go back to live, you go back to live. You're out of scrub mode."

**On Time Machine and the collapse.**

32. "We do have a time machine feature that we're planning and have already partially implemented. And when you bring on time machine, what it does is it brings up a calendar and you select the calendar. And then it will download the day that you selected, which will be essentially the same as this cache data, but maybe full fidelity across the day. And it shows it in a mini chart in the upper right hand corner of the analyzer where you can scrub. So we're probably going to reuse that scrubber."
33. "to be totally invisible." *(Answering whether the scrubber must say which density it is showing.)*
34. "They are exactly the same kind of data, just different densities. Most of the density is pretty much the same. It's just, you know, as it gets earlier into the day… instant replay really is meant to do more things that are closer. Not have to go all the way back to the beginning of the day. Wasn't meant to do that. I really don't understand how this is different from a user's perspective. It's essentially gonna look the same to them. They're gonna hardly recognize no fidelity difference. The only real difference is how we manage cache data."
35. "It looks very much like a **pie machine** *[sic — Time Machine]* and almost exactly like it, except that you don't choose the date."
36. "In fact, you could probably keep the date control too. It just shows today's date being selected."
37. "It should definitely silently promote you. It shouldn't feel any different to the person."
38. "it is time machines default state. that's a good point and probably leave it exactly like that. You get into **iMachine** *[sic — Time Machine]* by just selecting a different date. Um, you are in instant replay just by going to the, um, to the item and showing the scrubber."

**On past days.**

39. "I'm currently collecting time machine data. So I collect every day, like, seventy, eighty megabytes worth of data. And when I get about maybe a month or so, I will hook it up so that each day can be downloaded on demand."
40. "You don't download two gigabytes. You download just the day that you select."
41. "Progressive would definitely be better, kind of like lazy loading." … "It wouldn't be a serial download. Instead, it should be kind of a stochastic download."
42. "From a user's point of view, that would seem smoother, and it would be a minor inconvenience that the day coming in just looks… that just keeps on getting more and more dense as time goes on. It shouldn't take more than three or four minutes for a full download on most people's machines if they have a gigabit Ethernet connection, even a three hundred megabit Ethernet connection. And they should be able to get enough data that it's usable almost within fifteen, twenty seconds."
43. "There will be an indicator that will say where it is in terms of full fidelity download."

**On the cache lifecycle.**

44. "We've got to manage the ca*[che]* after the user session is over. My recommendation is to not dump the ca*[che]* until sometime in the early morning hours or before data starts coming alive in the morning, you know, which is usually around four AM."
45. "browser side." *(Answering: where does that cache live — browser side, or server side per member?)*
46. "Add that as an addendum." *(Accepting: lazy invalidation on load rather than a scheduled flush, since a browser-side timer does not exist with the tab closed.)*
47. "It's really up to OP*[F]*." … "That is our market data layer." *(Answering: what defines the trading-date boundary.)*

Bench notes sit in **§14** beside this text. They do not delete it.

---

## 1. Job

**Time Machine is one surface with one scrubber.** The date control is always visible with **today pre-selected**. **Instant Replay is what that surface is called when the date is today** — it is Time Machine's default state, not a second feature (§0.38). Selecting any other date silently promotes the member to that day, with no mode change they can perceive (§0.37).

A member is in replay **the moment the scrubber is up** (§0.38). There is no enter/exit ceremony and no fractal switch.

Behind the one control there are two sources, and the difference between them is invisible by design (§0.33, §0.34):

| Date | Source | Density |
|---|---|---|
| **Today** | This session's cache of OPF chain generations | Native 2 s at the recent end, thinned toward ~10 s at the oldest end |
| **Any past day** | The banked full-fidelity capture, downloaded for that one day on demand | Full fidelity, arriving stochastically and sharpening |

Instant Replay **does not change templates or structures**. It **swaps the input**: the host selects a generation at the playhead and templates `run()` on it exactly as they do on a live one. Any Heatmap template, and any strategy position whose legs are listed on that generation, can be rebuilt at that tick.

Coach's reason for the invisibility (§0.34): the two are the same kind of data at different densities, most of the density is the same, replay's job is the recent past where the density is essentially native, and two seconds versus ten on a chain is not something a member can see. The density ladder is **cache management, not a truth claim**.

---

## 2. Vocabulary (do not collide)

| Name | This spec | Not this spec |
|---|---|---|
| **Time Machine** | The one surface: scrubber + date control + HUD + panel frame | Inspector What-if knobs |
| **Instant Replay** | Time Machine with today selected — its default state | A separate feature, a separate fractal, a separate component |
| **Promotion** | Choosing a date other than today. Silent; no perceptible mode change | A mode switch |
| **Cache** (v0.3) | Today's held generations, thinned by age | The past-day download |
| **Corpus** (v0.3) | The banked full-fidelity per-day capture, server-side | Something the client ever holds whole |
| **Infill** (v0.3) | The stochastic download sharpening a past day after the coarse pass | Serial streaming |
| **Fidelity indicator** (v0.3) | Progress toward a fully dense past-day download | A density readout on the timeline |
| **What-if** | Ad-hoc time · spot · vol | Must not be labeled Time Machine or Instant Replay |
| **Playhead owner** | The one client module holding the playhead `t_ms` per tab | Per-route cursor state |
| **ATM-*** | Prior Day-fractal IDs | Do not reuse |
| **TMI-*** | This spec | — |

---

## 3. Laws

### 3.1 One surface

| ID | Law |
|---|---|
| **TMI-1** (v0.3) | **Instant Replay is Time Machine's default state.** One component, one code path, one scrubber, one date control, on all three hosts. Not two features sharing chrome. |
| **TMI-2** RETIRED (v0.3) | Day/Instant exclusivity and "parking the other playhead" are moot — there are no two things to park between. See TMI-64. |
| **TMI-3** (v0.3) | **Heatmap, Analyzer, and Surface all host the same surface**, including the date control (v0.2 withheld it from Heatmap). §0.29: everything is generated from the same data, so gating one and showing another would be arbitrary. |
| **TMI-64** (v0.3) | **The date control is always present with today pre-selected.** Choosing another date **silently promotes** to that day: same chrome, same scrubber, same behaviour, different source behind it. No banner, no confirm, no transition the member can feel (§0.37). |
| **TMI-65** (v0.3) | **You are in replay when the scrubber is up** (§0.38). Showing the scrubber is the entry act. There is no separate Record/enter gesture on the today path — subject to §11.3. |
| **TMI-4** — CONTINGENT (v0.1 §11.1) | v0.2: "the server records; no client records." §0.45 says the today cache is **browser side**. Which of the two holds is **§11.1**, and TMI-4, TMI-5, TMI-56, and TMI-58–63 all move with it. Nothing in this section is treated as settled. |

### 3.2 Scrubber

| ID | Law |
|---|---|
| **TMI-42** (v0.3) | **One playhead owner per tab, and the scrubber is sticky across Heatmap, Analyzer, and Surface** (§0.30). One clock for the desk. SPA navigation changes the projector, not the playhead. No host keeps a private cursor. |
| **TMI-66** (v0.3) | **Going back to live exits scrub mode** (§0.31). Live paint resumes, HUD hides. Whether the scrub position is remembered for the next time the scrubber is raised is **§11.5** — it appeared in the walk read-back and was not contradicted, which is undirected, not approval. |
| **TMI-18** | Existing `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` / `REPLAY_SPEEDS` (`10` \| `20` \| `50`). No second clock module. |
| **TMI-19** | **The playhead is a `t_ms`, not an index.** The generation painted is the one nearest `t_ms`. Re-resolved on every append and speed change. |
| **TMI-20** (v0.3) | **Play** from current playhead. **Pause** freezes paint only. **Stop** parks at the start of the loaded range. **Return to live** per TMI-66. |
| **TMI-21** (v0.3) | Raising the scrubber on today places the playhead at the **newest** generation. Clock America/New_York. The "no calendar date field" clause is retired by TMI-64. |
| **TMI-22** | Append at the edge is atomic: extend the range first; advance only if the playhead was on the newest entry and Playing. No double paint, no jump. |
| **TMI-24** | Speeds 10× / 20× / 50×. Wall elapsed × speed = session elapsed. Speed change does not jump. |

### 3.3 Decay (today only)

| ID | Law |
|---|---|
| **TMI-50** (v0.3) | **Decay thins the number of intervals. It never touches an interval's internals** (§0.24). A generation is kept **whole or dropped entirely** — never stripped of strikes, greeks, or fields. **The timeline does not change; only the number of data points on it** (§0.25). Nothing is interpolated to refill a thinned stretch. **The density-step readout on the HUD clock is RETIRED** — see TMI-74. |
| **TMI-68** (v0.3) | **The ladder.** Native interval is **2 seconds**. The oldest end of the session thins to **at most about 10 seconds** (§0.26), which reduces the footprint by roughly **half** (§0.27). Boundaries between are config, fail-loud. *Two-second native conflicts with DL-400's `CHAIN_EVERY_S` fail-loud window of [3,5] — **§11.6**, blocking.* |
| **TMI-51** | The thinning pass is idempotent and fail-loud: an entry it cannot classify stops the pass, never silently keeps or drops. Per-entry `as_of` is never altered. |
| **TMI-52** RETIRED (v0.3) | The `4s→2m` step display on the status line is retired by §0.33/§0.34. What, if anything, the status line still shows is **§11.7**. |
| **TMI-74** (v0.3) | **Density is invisible to the member.** No density band, no step-on-the-clock, no source label distinguishing today's thinned cache from a past day's full-fidelity download. The ladder is cache management, not a truth claim (§0.34). The **only** density-adjacent thing shown anywhere is the fidelity indicator of TMI-71, and that reports **download completeness**, not sample spacing. |
| **TMI-28** (v0.3) | Copy still names the surface **Time Machine - Instant Replay** so the member knows what they are looking at. Naming the *feature* is not naming the *density*; TMI-74 forbids the second, not the first. |

### 3.4 Past days

| ID | Law |
|---|---|
| **TMI-69** (v0.3) | The past-day source is the **banked full-fidelity capture** — presently accumulating at **70–80 MB per day** (§0.39). Per-day on-demand download is enabled once roughly a month is banked. **The corpus stays server-side; the client pulls exactly the one selected day** (§0.40) and never the corpus. |
| **TMI-70** (v0.3) | **The download is stochastic, not serial** (§0.41). A **coarse pass across the whole day lands first**, then density **infills progressively**. The member therefore has a **complete-but-sparse timeline immediately** that sharpens — never a partial timeline with a missing tail, and never a greyed-out region. Scrubbing is available from the coarse pass onward. |
| **TMI-71** (v0.3) | **A fidelity indicator** shows where the download is in terms of full density (§0.43). It **replaces any spinner**. It is a single overall state, not a per-region readout, and it is the sole exception to TMI-74. |
| **TMI-72** (v0.3) | **Stated targets** (§0.42): usable within **15–20 seconds**; fully dense within **3–4 minutes** on a typical connection (gigabit, and still true at ~300 Mbit). Recorded as Coach's stated expectation. Whether these are gated acceptance thresholds or design intent is **§11.8**. |
| **TMI-75** (v0.3) | A past day is **read-only and complete**: it is not decayed, not thinned, and not written to. Decay (TMI-50, TMI-68) applies to today's cache only. |

### 3.5 Cache lifecycle (today)

| ID | Law |
|---|---|
| **TMI-73** (v0.3) | **Today's replay cache is browser-side** (§0.45) and is cleared by **lazy invalidation, not a scheduled flush** (§0.46). On load, compare the cached **trading date** against the current trading date; if they differ, **discard the cache before any new data is accepted**. No timer, no cron, no session-end dump — a member returning the same evening still has their day (§0.44 names the intent: nothing is dumped until the early hours, before data comes alive). |
| **TMI-76** (v0.3) | **The trading date comes from OPF** (§0.47), the market data layer — **never the browser clock**, which breaks for anyone travelling or off-timezone. If OPF's trading date is unavailable at load, the cache is **not** accepted as current and is **not** silently used; the state is named (TMI-38, NO DATE), fail-loud per invariant 2. |
| **TMI-56** — CONTINGENT | The server-side `EXPIREAT` collection boundary of v0.2 is superseded by TMI-73 **if** the cache is browser-side. If the film is server-side after all, both mechanisms exist and their relationship needs stating. **§11.1.** |

### 3.6 No writes

| ID | Law |
|---|---|
| **TMI-67** (v0.3) | **No writes are permitted while a playhead is active** (§0.29). Replay is a viewing lens, not a mutation path. Nothing on the panel may create or stage a trade log entry, a Practice journal entry, an order, or an alert. Every control that would write is **disabled with a named reason — present, not hidden, and never silently ignored**. To log something seen in replay, the member returns to live and acts on live data, so Trade Log `entry_source` stays honest: no replay tick ever reaches it. |
| **TMI-34** (v0.3) | Algo Create Alert stays out of v1 — now as one instance of TMI-67 rather than an isolated scope call. |
| **TMI-77** (v0.3) | **Position Builder under replay is OPEN — §11.9.** Building and inspecting a structure while scrubbing is arguably the feature itself (§0.5). Recording one as *taken* is plainly forbidden by TMI-67. Whether a saved **definition** counts as a write is Coach's, not the advisor's. |

### 3.7 Panel frame

| ID | Law |
|---|---|
| **TMI-25** — CONTINGENT (v0.3) | v0.2: a green blurred frame on the whole panel while Instant Replay is active, blue for a past day (§0.15, §0.23). §0.37: promotion to a past day "shouldn't feel any different to the person." Two colours **is** a felt difference. **§11.4** — Coach rules; no advisor default. |
| **TMI-26** (v0.3) | Replay + What-if: the replay tell wins (replay owns the clock). Unchanged in kind whatever §11.4 decides. |
| **TMI-27** | Named test ids on each panel root (`heatmap-panel-glow` · `analyzer-panel-glow` · `surface-panel-glow`). The token must not read as a profit/go signal. |

### 3.8 Hosts

| ID | Law |
|---|---|
| **TMI-6** | Templates stay **pure** (TR5 / HM6). They never read the cache. The host selects a generation and `run()`s. |
| **TMI-29** | Width Fit: **Live \| Average \| Replay**. Average is a window mean; Replay is a single generation. Do not collapse them. |
| **TMI-30** | Switching template while scrubbing does not exit replay. Same data, different `run()`. |
| **TMI-31** | Analyzer: package-mark representable legs from the selected generation. Missing listed leg → **NOT TRADED** / **CHECK LEGS**, never a fake debit. Autofit X = spot on that generation; Autofit does not fire on every tick. |
| **TMI-32** | Surface: rebind listed-leg IV, spot, and OPF τ from the selected generation (Surface §4.6). Missing exact/locked IV → **IV NO**. Do not interpolate. |
| **TMI-33** | Heatmap GEX and other Heatmap templates may run on the selected generation. Analyzer GEX / Probability under replay: **§11.10**, unchanged. |
| **TMI-35** | What-if overlay allowed: replay owns spot and session time; What-if **Vol** may still apply; What-if Time / Spot% are inert and say so. |
| **TMI-45** | **Generation geometry governs.** A generation carries its own wings and strike step; templates run on its listed strikes; the wing control reflects it and is inert with a named reason. |
| **TMI-46** | **Playback coalescing.** At most one generation painted per animation frame — the one under the playhead at frame time. Intermediates skipped, not queued, not interpolated. `run()` is never invoked for a generation that will not paint. |

### 3.9 Honesty

| ID | Law |
|---|---|
| **TMI-37** | OPF-held listed chain only. No invented strikes, mids, or package prices (DL-309). |
| **TMI-38** (v0.3) | Named holes, never a silent blank and never a lying last paint: |

| Hole | When | Member sees |
|---|---|---|
| **WAITING** | Today, cache empty (first generations of the session not yet held) | Named. |
| **FETCHING** | Playhead resolved to a generation not yet local | Named; the previous paint is not shown as the new tick. |
| **NO DATE** | OPF trading date unavailable at load (TMI-76) | Named; cached data is not used. |
| **NOT TRADED** / **CHECK LEGS** / **IV NO** | Leg or IV missing on the selected generation | Named at that tick. |
| **NO DAY** | A past date is selected for which no capture exists | Named; never an empty scrubber with no explanation. |

| ID | Law |
|---|---|
| **TMI-39** | One market WebSocket. No client Massive. No second market connection. |
| **TMI-40** | Process / inspection only. No profit claims on replay. The frame is not a trade signal. |
| **TMI-K1** | While a playhead is active: **spot** = the selected generation's spot; **as-of** = its `as_of`; chain = its listed contracts. OPF τ uses **that** clock, not wall now. |
| **TMI-K3** | The last live paint must never remain as a lying replay mark. Atomic settle on playhead change, on append, and on fetch. |

---

## 4. Member flow

```text
Open Heatmap / Analyzer / Surface
    → live paint, as today

Raise the scrubber
    → you are in replay (TMI-65)
    → date control shows today, pre-selected
    → playhead on the newest generation
    → all writes disabled with named reasons

Scrub / play
    → templates re-run() on the generation under the playhead, one per frame
    → move between Heatmap, Analyzer, Surface: the scrubber comes with you (TMI-42)
    → density is never mentioned anywhere (TMI-74)

Pick another date
    → silently promoted; nothing feels different (TMI-64)
    → that day's coarse pass lands, then infills (TMI-70)
    → fidelity indicator shows how sharp it is yet (TMI-71)

Return to live
    → out of scrub mode, live paint (TMI-66)

Next morning
    → on load, OPF trading date differs from the cached one
    → cache discarded before any new data is accepted (TMI-73, TMI-76)
```

---

## 5. Chrome

**One component on all three hosts.** Scrubber, date control (today pre-selected), transport, HUD, fidelity indicator when a past day is loading.

- **Heatmap** — strip + HUD over the workspace; inspector Cache section per §11.7; wing control inert under a playhead (TMI-45).
- **Analyzer** — strip to the right of Autofit; mini chart upper-right as today (§0.32); the existing scrubber is reused, not reimplemented.
- **Surface** — same strip and HUD as Analyzer on the Surface panel.

Component surgery: prefer extract over copy. The date control gains "today pre-selected"; the strip gains the fidelity indicator; all three hosts mount the same components and bind to the one playhead owner (TMI-42).

---

## 6. Ideas inventory (nothing omitted)

| Idea | Status |
|---|---|
| Cache = raw OPF chain for all templates | **IN** · TMI-6 |
| Replay of any template; Analyzer reconstruction; any listed position | **IN** · TMI-30 · TMI-31 |
| Scrubber with range = held data | **IN** · TMI-1 |
| 10 s playback acceptable | **IN** · TMI-68 |
| Playback time not MB; granularity degrades with age | **IN** · TMI-50 · TMI-68 (slider superseded by Coach §0.17) |
| Decay thins intervals only; snapshot whole or dropped | **IN** · TMI-50 |
| 2 s native → ~10 s oldest; ~half the footprint | **IN** · TMI-68 · *DL-400 conflict §11.6* |
| No member control of the curve | **IN** · TMI-68 · *reading confirmed at §11.2* |
| No writes in replay | **IN** · TMI-67 |
| Applies to Heatmap, Analyzer, Surface | **IN** · TMI-3 |
| Scrubber sticky across views | **IN** · TMI-42 |
| Back to live = out of scrub mode | **IN** · TMI-66 |
| Reuse the Time Machine scrubber and mini chart | **IN** · §5 |
| Keep the date control; today pre-selected | **IN** · TMI-64 |
| Silent promotion, no felt difference | **IN** · TMI-64 · *frame tension §11.4* |
| Instant Replay is Time Machine's default state | **IN** · TMI-1 |
| Density invisible to the member | **IN** · TMI-74 |
| 70–80 MB/day banked; per-day download after ~a month | **IN** · TMI-69 |
| Download one selected day only | **IN** · TMI-69 |
| Stochastic, not serial; coarse pass then infill | **IN** · TMI-70 |
| Usable 15–20 s; dense 3–4 min | **IN** · TMI-72 · *gate-or-intent §11.8* |
| Fidelity indicator replacing the spinner | **IN** · TMI-71 |
| Browser-side cache; lazy invalidation; no scheduled flush | **IN** · TMI-73 · *vs server film §11.1* |
| Trading date from OPF, never the browser clock | **IN** · TMI-76 |
| Redis for the cache, decay "for free" | **CONTINGENT** · §11.1 |
| Record opt-in, off by default, wipes at EOD | **CONTINGENT** · §11.3 |
| Green frame / blue frame | **CONTINGENT** · §11.4 |
| Gold / StudioOne full-day capture | **IN** as the past-day corpus · TMI-69 · lineage §11.11 |
| Position Builder under replay | **OPEN** · §11.9 |
| Algo Alert on replay | **OUT** of v1 · TMI-34 |
| Upsampling a thinned stretch | **OUT** · TMI-50 |
| Per-member film; cross-device playhead sync | **OUT** |

---

## 7. Acceptance (AT-TMI, v0.3)

| ID | Criterion |
|---|---|
| **AT-TMI-1** | Raising the scrubber on any of the three hosts puts the member in replay with the date control showing today, pre-selected, and the playhead on the newest generation. |
| **AT-TMI-2** | Selecting a past date produces no banner, no confirm, no mode transition — the same chrome, the same scrubber, the same controls. A recorded screen comparison shows no difference other than the loaded range. |
| **AT-TMI-3** | Scrubber stickiness: set the playhead on Heatmap, navigate to Analyzer then Surface in the same tab — the same `t_ms` is active on each; no host holds a private cursor. |
| **AT-TMI-4** | Return to live exits scrub mode on all three hosts; live paint resumes; HUD hidden. |
| **AT-TMI-5** | Templates do not import any cache client. The host selects a generation, then `run()`s. |
| **AT-TMI-6** | Thinning: a synthetic session aged past a ladder boundary → survivors are **whole generations**, byte-identical to what was written; no generation is present with any field removed; `as_of` values unchanged; no new `as_of` exists. |
| **AT-TMI-7** | The timeline length and endpoints are identical before and after a thinning pass; only the count of points changes. |
| **AT-TMI-8** | Ladder: native spacing at the recent end matches the capture cadence; the oldest end is no wider than the configured maximum; footprint reduction measured and recorded. Missing ladder config → boot aborts (invariant 2). |
| **AT-TMI-9** | **No density is disclosed anywhere**: no step on the clock, no band on the timeline, no source label distinguishing today from a past day. A full DOM and copy sweep of all three panels finds none. |
| **AT-TMI-10** | Past day: the coarse pass yields a **complete** timeline (both endpoints present, no missing tail) before infill begins; scrubbing works from that point. |
| **AT-TMI-11** | Fidelity indicator present during infill, absent when complete; **no spinner** anywhere on the past-day path. |
| **AT-TMI-12** | Client pulls only the selected day. Network capture shows no corpus-wide request. |
| **AT-TMI-13** | Selecting a date with no capture → **NO DAY** named; never an empty scrubber without explanation. |
| **AT-TMI-14** | Lazy invalidation: with a cache whose trading date differs from OPF's, load the app → the cache is discarded **before** any new data is accepted; nothing from the prior day survives into the new session. |
| **AT-TMI-15** | Same trading date, evening return → the cache is still there; no flush occurred at session end. |
| **AT-TMI-16** | Trading date is taken from OPF. With the browser clock set to a different date or timezone, behaviour is unchanged. OPF trading date unavailable → **NO DATE** named, cache not used. |
| **AT-TMI-17** | Playhead is a `t_ms`; speed change does not jump; append at the edge does not double-paint. |
| **AT-TMI-18** | Coalescing: Play at 50× for 10 wall-seconds → `run()` at most once per animation frame; no `run()` for a generation that did not paint. |
| **AT-TMI-19** | Missing listed leg → named state, never an invented debit. Missing IV on Surface → **IV NO**. |
| **AT-TMI-20** | Wings changed while a playhead is active: painted generation unchanged; wing control shows the generation's wings and is inert with a named reason. |
| **AT-TMI-21** | Atomic settle: no frame shows a live mark or a previous generation under a replay clock during entry, playhead change, append, thinning, or fetch. |
| **AT-TMI-22** | No client Massive host; no second market connection. |
| **AT-TMI-31** | **No writes.** With a playhead active on any host, no request that creates a trade, journal entry, order, or alert can be issued from the panel; every such control is present-but-disabled with a named reason; returning to live restores them all. |
| **AT-TMI-32** | Trade Log contains no entry whose provenance traces to a replay tick. |
| **AT-TMI-33** | Characterization suite green (invariant 10); every config key absent → boot aborts (invariant 2). |
| **AT-TMI-34** | Public and member copy on this feature contains no profit claim. |

*(AT-TMI-23…30 from v0.2 tested the server film and Record; they are held pending §11.1 and §11.3 rather than deleted.)*

---

## 8. Out of scope

MiniTwo / production deploy until Coach asks · Tradier, flatten, broker orders · replacing the StudioOne capture (it **is** the past-day corpus; lineage §11.11) · per-member film · cross-device playhead sync · upsampling a thinned stretch · extra 1× speed · Algo on replay · rewriting What-if T/σ · any access rule beyond what the hosts already carry (§11.12).

---

## 9. As-built (check first — not law)

Every row is an assertion to be **verified by reading the file**.

| As-built | Honesty |
|---|---|
| StudioOne OPF capture at `CHAIN_EVERY_S` (DL-400, default 4 s, fail-loud outside [3,5]) | Named as [3,5]; §0.26 says the normal interval is 2 s. **Read and record which is running.** §11.6. |
| ~70–80 MB/day accumulating | Coach's figure. **Confirm on disk** and record the projected corpus size at the download-enable date. |
| Redis generation cache (Heatmap Templates §8) | Exists server-side. Its relationship to a browser-side replay cache — **read and record**. §11.1. |
| TR14 `StreamBook` · `atTime` / `window` / `clear` · MiB detent | Client book exists. The MiB detent is retired from the member story; the key it persists — **read and record**. §11.7. |
| `AnalyzerTimeMachineStrip` + HUD + `replayCursor` + mini chart upper-right | Exists for the past-day path. Date field always shown — **confirm**. Cursor state location — **read and record** (TMI-42 moves it). |
| Existing glow tokens (blue, red) | **Viewport or panel? Read and record.** §11.4. |
| Heatmap / Surface | No strip, no frame today. |
| Session calendar (VP) | Exists; may serve the trading-date question if OPF does not expose one directly. §11.13. |

---

## 10. Open for Coach (not silently decided)

Interview format. The first four are blocking for Phase 2.

1. **BLOCKING — where does today's cache live?** v0.2 §0.18 moved the film to a **server-side per-book Redis cache** shared by every member on the book, and TMI-4, 5, 56, 58–63 were all written on that. §0.45 answers "browser side," and TMI-73's lazy invalidation is a browser mechanism. Two readings: **(a)** the walk reverses the server move and the cache returns to the client, retiring the server film module entirely; **(b)** both exist — a server film as the source of record and a browser cache as the local window (TMI-57 already described such a window), with §0.45 describing the second. *Advisor lean, ADVISORY: (b) is the smaller change and nothing in the walk contradicts a server film — but the walk also discussed "not dumping the cache" as if it were the whole story, so I will not write (b) as settled.* The answer decides whether `server/` is in scope at all.
2. **BLOCKING — confirm the three garbled words** (§0.28 "SSIS", §0.29 "rights", §0.35/38 "pie machine"/"iMachine"). The readings taken are: the decay curve is yours and not a member setting; **writes** are forbidden in replay; both machine words are **Time Machine**. Any law built on a misheard word is wrong law.
3. **BLOCKING — does Record survive the collapse?** §0.19/21 made recording opt-in, off by default, starting at the press. §0.38 says a member is in replay "just by showing the scrubber." Those cannot both hold: if recording is off by default, raising the scrubber shows an empty range most of the time. Either recording is now always-on for the session, or the scrubber's first appearance is itself the start. No advisor default written.
4. **BLOCKING — the frame.** §0.15/23 give Instant Replay a **green** whole-panel frame and a past day **blue**. §0.37 says promotion "shouldn't feel any different to the person." Two colours is a felt difference. Options, none picked: one colour for all scrubbing regardless of date; keep two and accept that promotion is visible; or no frame at all on the today path. This one touches your own §0.15, so it is yours alone.
5. **Scrub position after returning to live.** §0.31 rules the exit. Whether the position is remembered for the next raise appeared in the walk read-back and was not contradicted — undirected, not approval. Remember, or start at newest each time?
6. **BLOCKING — 2 s native versus DL-400.** §0.26 says the normal interval is two seconds. DL-400 sets `CHAIN_EVERY_S` to 4 s with fail-loud outside [3,5]. Either the capture has changed and DL-400 needs a reversal logged, the 2 s figure is a different cadence than the archived one, or the ladder's fast end is 3–5 s rather than 2. This is a logged decision, so it needs your word, not a bench read.
7. **What remains on the Heatmap inspector Cache line?** TMI-52's step display is retired by TMI-74. Does the line show anything at all now — an entry count, nothing, or does the section go away?
8. **Are the download targets gates or intent?** §0.42's 15–20 s and 3–4 min are written as your stated expectation. Say if Delta should hold a gate to them, and on what reference connection.
9. **Position Builder under replay.** Building and inspecting a structure while scrubbing is arguably the feature (§0.5). Recording one as *taken* is plainly out (TMI-67). Does saving a **definition** count as a write?
10. **Analyzer GEX / Probability on a scrubbed generation.** Allow, disallow, or later. *Advisor lean: later.* Unchanged from v0.2.
11. **Lineage to the StudioOne capture.** TMI-69 makes that capture the past-day corpus. If it is also the same write that feeds the live generation cache, there is one recorder of the chain rather than two. India names the relationship at Phase 2; you rule if it changes what StudioOne captures.
12. **Access.** No new rule proposed; the read paths inherit whatever gate the hosts already carry. If that inheritance is undirected rather than decided, say so — no advisor default in either direction.
13. **Trading-date source shape.** §0.47 names OPF. If OPF does not expose a trading date directly, the VP session calendar is the nearest existing thing. Naming the field is India's; naming the **authority** was yours and is recorded.

Everything in §0 is **law**, not an open.

---

## 11. Parent amendments (this DRAFT)

At BUILD AUTHORITY, parents gain one-line pointers in the same packet, each as the next patch of its confirmed as-built version:

- **Time Machine Spec** → Time Machine is one surface; Instant Replay is its default state with today pre-selected; the date control selects the source; one playhead owner per tab, sticky across hosts.
- **Runner TR14** → the stream book's role under §11.1; Instant Replay is the named Scrubber host view.
- **Heatmap Templates** → Instant Replay host mode; the Cache section per §11.7; HM21 persists no Instant Replay setting.
- **Width Fit** → Live | Average | Replay.
- **Surface §4.6** → a replay generation is a lawful snap-at-*t*; Surface hosts the same scrubber and date control as Analyzer.
- **Trade Log §4.4** → Instant Replay is not a write source; `entry_source` gains no fourth value.
- **Arch 28** → the replay read path named; still one socket, no client Massive.
- **DL-400** → lineage note (§11.11) and the cadence question (§11.6).

---

## 12. Suggested path after BUILD AUTHORITY

1. Resolve opens 1–4 and 6 — they change what gets built, not just how.
2. Measure generation bytes across a busy 0DTE session before the ladder is frozen.
3. Phase 2 **India:** cache location, read path, one playhead owner, lineage to the capture, no second socket. **Mike:** no member data held; terms on serving stored snapshots. **Foxtrot:** corpus growth and the download path.
4. Phase 3 **Echo + Tango:** the frame ruling; fidelity-indicator copy; disabled-control reasons under TMI-67; no profit chrome.
5. Phase 4 **Hotel:** inspection-only; the frame is not a signal. Hotel's v0.2 note that "the step on the clock is the honesty" is **superseded by Coach** (TMI-74) and moves to §13 beside the text rather than out of it.
6. Coach Phase 5 stamp → bench plan (Grok Build) → **Delta**.
7. Help article: one surface, the date picks the day, the indicator tells you how sharp a past day is yet, and nothing you do in replay is recorded.
8. Lima: DL-594 proposed; the v0.2 reversals and any §11.1 reversal logged with it.

No implementation until Coach Phase 5 / GO.

---

## 13. Bench notes (beside §0, never instead of it)

**Tango:** the mode tell must not read as "good trade / go." Copy names Instant Replay. A disabled control under TMI-67 says why; a hidden one teaches nothing.

**Hotel:** *(v0.2 position, superseded by Coach at TMI-74 and kept here as the record, not as a live objection)* — a thinned stretch is a sampled record, and the step on the clock was proposed as the honesty. Coach ruled it invisible on the grounds that replay's job is the recent past, where density is essentially native, and that 2 s versus 10 s on a chain is imperceptible. Hotel's remaining live concern is narrower and stands: replay is inspection of what was on the chain, never a forecast and never a fill.

**India:** one surface, one playhead owner per tab, hosts bind and never fork. Whatever §11.1 decides, there is exactly one source of record for a replay generation and the other layer is a window onto it.

**Mike:** no member identity in whatever holds the cache; terms confirmed before stored snapshots are served back.

**Echo:** three tells (replay, what-if, and whatever §11.4 decides about past days) must share one seat and one grammar. If the existing red and blue are drawn on the viewport rather than the panel, bring all of them to the panel.

---

## 14. Document control

| Version | Date | Notes |
|---|---|---|
| v0.1 | 2026-08-26 | Coach Instant Replay as a Time Machine fine fractal; client film; playback-time slider; green frame on canvas. |
| v0.1.1 | 2026-08-26 | Advisor revision after Claude and Grok reviews; contradictions named; undirected choices moved to opens. |
| v0.2 | 2026-08-26 | Film moved to a server-side per-book Redis cache; decay replaced the slider; Record opt-in; collection at a config boundary; whole-panel green frame; Surface in-program. |
| **v0.3** | 2026-08-26 | **The collapse** (§0.35–38): Instant Replay is Time Machine's default state — one surface, one scrubber, date control always present with today pre-selected, silent promotion. Scrubber sticky across hosts (TMI-42). Return to live exits scrub mode (TMI-66). No writes (TMI-67). Decay thins interval count only, generations whole or dropped (TMI-50); ladder 2 s → ~10 s (TMI-68). **Density invisible to the member** (TMI-74); step display retired. Past days: banked corpus, one-day pull, stochastic coarse-then-infill download, fidelity indicator (TMI-69–72, 75). Browser-side cache with lazy invalidation against **OPF's** trading date (TMI-73, 76). TMI-2 and TMI-52 retired. TMI-4, 5, 25, 56, 58–63 marked **CONTINGENT** pending opens 1, 3, and 4. |

**One-line law:**
**One surface, one scrubber, one date control with today pre-selected — you are in replay the moment the scrubber is up, and Time Machine is only what it is called once you have moved off today; the scrubber follows you across Heatmap, Analyzer, and Surface; nothing you do in replay is ever recorded; today's data thins by dropping whole snapshots and never by hollowing one out; a past day arrives coarse-then-sharp with an indicator saying how far along it is; and the member is never told which density they are looking at, because that is cache management, not a truth claim.**

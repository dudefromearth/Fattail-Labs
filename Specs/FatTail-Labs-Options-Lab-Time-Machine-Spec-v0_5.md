# FatTail Labs — Options Lab Time Machine Spec v0.5

**Status:** DRAFT v0.5 — the **combined** spec. One surface, one scrubber, one date control. **Not BUILD AUTHORITY** until Coach Phase 5.
**Type:** Product + technical spec — **Time Machine**
**Supersedes:** `FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_4.md` (replay chain: v0.4, v0.3.1, v0.3, v0.2, v0.1.1, v0.1) **and** `FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0_1.md` at **v0.1.8** (the Day fractal). Both are folded here; neither survives as a separate document.
**Routes:** `/app/options-lab/analyzer` · `/app/options-lab/heatmap` · `/app/options-lab/surface`
**Filename:** `FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_5.md`
**Law-ID prefixes:** **ATM-*** (from the Day document) and **TMI-*** (from the replay chain). **No ID is renumbered.** Both sets are live law in this document. `AZ-TM-*` belongs to the What-If T/σ spec and is not reused.

**Name ruling (Coach, 2026-08-26):** the spec and the surface are **Time Machine**. The day-of case is a **mode, contrived for performance**, and carries no member-facing name. "Instant Replay" is retired as a product name and survives only verbatim in §0. "Day" and "fractal" likewise retire as product vocabulary — there is one surface and a date.

**Derivation ruling (Coach, 2026-08-26):** the two sources exist because **you cannot archive and replay at the same time**. Today's session is mid-write, so replay of today is derived from a held cache; a past day is a closed archive and is read from it. That constraint, not a product distinction, is why there are two derivations behind one surface.

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine.

**Files / trees this spec touches** (exact paths confirmed by reading the repo at bench review, not assumed here):

- Analyzer host — dark strip above the canvas, Autofit strip, Strikes/in placement, mini day window, viewport glow, package quote
- Heatmap host and inspector (`HeatmapChainPanel`; inspector Cache section)
- Surface host (panel frame, strip + HUD mount, listed-leg IV rebind per Surface §4.6)
- Transport (`AnalyzerTimeMachineStrip.tsx`, `AnalyzerDayReplayHud.tsx`, `algoDayReplay.ts`, `algo_replay` route)
- TR14 stream book module (`getStreamBook()`, `atTime` / `window` / `clear`)
- Width Fit host view (Live | Average | **Replay**)
- Past-day download path: 1-minute underlier path, optional TPO payload, and the banked chain corpus (§0-A.12, §0.39–43)
- `Specs/` parent one-line amendments (§13); `Architecture/00-decision-log.md`
- **Conditional on §12.1:** `server/` replay cache module and its characterization tests

**Touches outside program:** **NONE.** Identity/auth, payments, the market bus server's Massive pull, and MSC are untouched.

**Parents (normative where noted; *confirm* = verify by reading `Specs/` at bench review):**

| Doc | Role |
|---|---|
| Analyzer Spec **v0.2.1** (*confirm*) | Host surface · six buckets · Autofit strip · GEX / Probability · OD-AZ1 |
| What-If T/σ Spec **v0.1** | **What-if** = ad-hoc time · spot % · vol. `AZ-TM-*` IDs. This spec does **not** rename or replace those knobs. TM-A1 stands: the inspector heading "Time machine" is renamed to What-if; **this** document owns the name for the replay seat. |
| AZ-ALGO **v1.0.1** (*confirm*) | Demo may point at the replay clock |
| 3D Surface App Spec **v0.1.8** §4.6 (*confirm*) | Surface **Time machine** = snap rebind of listed-leg IV at *t*. A replay generation is a lawful snap-at-*t*. |
| Heatmap Templates Spec **v0.2.x** (*confirm*) | HM1–HM21 · Redis generation cache · HM10 no MSC schemas |
| Template Runner Spec **TR14** (*confirm*) | Stream book |
| Width Fit Spec **v0.1.x** (*confirm*) | WF4 Average is a host view |
| **DL-400** (*confirm*) | StudioOne OPF chain capture with greeks at `CHAIN_EVERY_S` (default 4 s, fail-loud outside [3,5]) — §12.6 |
| OT-EF / **DL-309** | Representable or named state. Never invent a print or a package debit. |
| Arch **28** | One market WebSocket. **No client Massive.** Downloads are server fetches. |
| Human Interface Spec v1.0 | Dark-pinned tokens · ≥44pt hits · no emoji chrome |
| North Star v1.2 | Process outcomes only. **No profit claims.** |
| **DL-539** | Scope statement; three-OK on trees outside the active program. |
| Prior DLs carried | DL-485 · DL-486 · DL-487 · DL-491 · DL-492 · DL-494 · DL-499 · DL-594 · FI-031 · FI-033 · FI-036 |

**Does not:** MiniTwo until asked · Tradier / close / orders · a second market WebSocket · a client Massive path · copying MSC or thinkorswim source · inventing prints, strikes, bars, or package debits · rewriting the What-if T/σ domain · Volume Profile overlay (FI-031).

**Review protocol:** findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion). Coach Content Law: nothing in §0 or §0-A is removed.

---

## A note before anything else

**Two §0 blocks, both verbatim, neither renumbered.** §0-A is the Day thread (originally §0.1–16 of the Analyzer Time Machine spec; item *n* there is item **§0-A.*n*** here). §0 is the replay thread (items 1–47, unchanged numbering from v0.4).

**Items §0.24–47 came from a voice session on a walk** and are quoted as the transcript recorded them, including its errors, marked `[sic]` with the reading in brackets. Three turn on a word the transcript may have mangled — §0.28 "SSIS", §0.29 "rights", §0.35/38 "pie machine"/"iMachine". Coach confirms or corrects the readings before Phase 2 (§12.2).

**Four places where the two documents contradict each other** are §12.7–12.10. All four are Coach-versus-Coach, so none is resolved here.

---

## Changes in v0.5 (read this second)

| Change | Where | Source |
|---|---|---|
| **The two documents become one.** Day and the day-of case are the same surface with different derivations | §1 · TMI-1 · TMI-64 | §0.38 · Coach derivation ruling |
| The Day surface **extends from Analyzer to all three hosts** | ATM-H1 · TMI-3 | §0.29 |
| Chrome placement laws folded in whole — Strikes/in left of Autofit, transport right of it, mini window upper-right | §6 · ATM-H1–H6 | §0-A.5 · §0-A.6 · §0-A.9 |
| **Reset** is the named exit control on both derivations | ATM-S3 · TMI-66 | §0-A.16 · §0.31 |
| Basic / Enhanced folded in and now governs both derivations | ATM-B2 · ATM-E2 · TMI-33 | §0-A.10 |
| Past-day chain corpus **seats ATM §3.4's deferred vol plane** | TMI-69 · ATM-E3 | §0.39 · §0-A.11 |
| Stochastic coarse-then-infill download **supersedes** left-to-right prefix fill | TMI-70 · **ATM-D3 · ATM-H4 amended** | §0.41 |
| My `NO DAY` hole retired in favour of ATM's existing **NO PATH** | TMI-38 | advisor duplicate, not a ruling |
| Algo alert creation vs no-writes — **unresolved contradiction, both quoted** | **§12.7** | §0-A.14 vs §0.29 |
| Blue/green glow vs silent promotion — **unresolved** | **§12.9** | §0-A.7 vs §0.37 |
| Entry position differs by derivation (first print vs newest) | TMI-21 · ATM-S1 | §0-A.15 · §0.38 |
| Source label vs density invisibility — narrowed | ATM-D5 · TMI-74 | §12.10 |

---

## 0-A. Coach intent — Day thread (do not drop)

Verbatim Coach, preserved in order. Originally §0.1–16 of the Analyzer Time Machine spec.

1. **Very similar to ToS OnDemand.**
2. **Pick a day from a calendar. The system downloads the minute granular day, we pick the start time, then video controls.**
3. **There will be a calendar control to select the day to download.**
4. **As the day downloads you can see it fill the mini chart.**
5. **Add the feature onto the viewport to the right of the Autofit button.**
6. **Move the strikes per inch slider to the left of the Autofit button, and put time machine there and allow the mini chart to live in that corner with the video controls in the dark area above the canvas.**
7. **When we put it in this mode** (Time Machine) **we add a blue blurred box on the inside edge of the viewport. When What-if is on we add a red glow to the inside edge.**
8. **What-If is ad-hoc change to time, spot and vol. Time Machine is pick a day and replay.**
9. **When we replay a day, a small day window appears in the upper-right showing where in the day we are. It has a small day candle chart or line chart, with a scrubber. The scrubber is draggable.**
10. **For the basic Time Machine we turn off Probability and GEX. For enhanced Time Machine we allow GEX and Probability.**
11. Primitive plane: **simple price and time for now; later vol from full chain-snapshot days.** Point the Algo at that day. Speeds **10× / 20× / 50×**. Controls **start / pause / stop**.
12. **Each day will have 390 candles or closes. The replay can do simple move from close to close or a more complex download of TPO data and follow the path.**
13. **The spot price and price scale need to match the beginning of the day's chosen opening price.**
14. **The position can be added afterwards. The algo alert is created, just like real life.**
15. **The clear button should be called Leave Time Machine.**
16. **Change the Leave Time Machine to just "Reset" that matches the What-If Reset.**

**Beside (not a deletion):** cash RTH 09:30–16:00 ET is **390** one-minute prints — Coach's count. Index last trade **16:15 ET** is fifteen extra minutes when that product actually prints; do not pad a 390-session with invented bars, and do not silently "correct" 390 to 405. Extra prints, if they exist, append. Short sessions (early close) have **fewer** than 390 — named, not filled.

---

## 0. Coach intent — replay thread (do not drop)

### Typed (items 1–23)

1. The cache is a store of the **raw data coming from OPF as a chain** used to construct **all** the possible views created by Heatmap templates.
2. Theoretically, play back the cache and get an **instant replay of any template**.
3. If it is the raw data, then it should be **applicable to any template**.
4. It should also be able to **reconstruct a chart in the Analyzer** — e.g. construct a butterfly over the last so many minutes of cached raw data.
5. **Instant replay of heatmaps and strategy positions.** In fact **any strategy position within the timeframe of the cached data.**
6. In the Heatmap or the Analyzer, **substitute the live data with the cached data**, and create a **runner tool** that would allow the user to **scrub through the data**.
7. A data scrubber **similar to the Time Machine**, with a **range equal to the cached data**.
8. Even at **10 second intervals realtime playback is not terrible**.
9. Give the user the option of capturing **max detail for so many minutes** or **decimated detail for longer playback**. Put the cache in terms of **playback time instead of MB**, with a note that **granularity degrades as time to replay increases**. A slider that makes that relationship clear. *(Slider superseded by item 17.)*
10. This would have to be a **setting once made, it would be going forward.** Any cached data after making the choice **might be destroyed or altered.** *("Altered" is thinning — item 17; "destroyed" is the cache lifecycle — items 19, 21, 22, 44–47.)*
11. Optimally they would **set the slider in the morning**, then they would have a **trailing replay starting at market open**. Or whenever they **reset the slider the trail would start from there**. *(Superseded by items 17 and 38.)*
12. If you are scrubbing, you are **not concerned about realtime accuracy**.
13. **Start with the design.** Once details are worked out: technical spec, then build plan.
14. **Name: Time Machine - Instant Replay** — mostly because it will **play in the same place as Time Machine**, just in a **different fractal**. *(Item 38 goes further; and the name ruling of 2026-08-26 retires the product name.)*
15. Instant Replay mode should be **obvious**. Time Machine Day uses a **blue** blurred highlight or frame. Instant Replay uses a **green** blurred frame around the canvas while it is active. **This includes Heatmap, Analyzer, and Surface.** *(Widened to the whole panel — item 23. In tension with item 37 — §12.9.)*
16. *(§11 pass on v0.1.1)* "1. B, 2. Surface is just another view of the same data, so it works as normal. 3a. Follows #1 the cache continues to record. If you had a decay rate that the older cached ticks would get thinner, you could stick to a full day of cache. Like #2. the Surface is just a reflection of the data, same as the Analyzer. 4. OK 5. See #3."
17. "I came up with a better idea than giving a slider. Decay older cache ticks by thinning them out, that way it is easy to hold a full day and older ticks are wider intervals."
18. "You could do that with a decay function similar to redis. In fact you could use redis for the cache maybe and get it for free." *(In tension with item 45 — §12.1.)*
19. "Record or cache must be turned on and then wiped before the next session, maybe at midnight." *(In tension with item 38 — §12.3.)*
20. "This is like a controlled memory leak then garbage collected at the end of a session."
21. "Always off by default, but can be turned on at any time by the user and it starts from there, then at the eod it wipes clean, resets." *(In tension with item 38 — §12.3.)*
22. "Or it wipes before the next market session. Or the user can set when it wipes, so many hours past the market close." *(Answered by items 44–47.)*
23. "The entire panel must display it is in Instant Replay mode with a blurred border, like What-If and Time Machine." *(In tension with item 37 — §12.9.)*

### Voice, walk-and-talk 2026-08-26 (items 24–47, transcript-exact)

**On decay.**

24. "It doesn't touch a… an interval. It only touch… it doesn't touch the internals of an inter*[val]*. It just touches the number of intervals or the frequency of the intervals."
25. "The actual timeline doesn't change. Just the number of data points."
26. "I don't think that we'll have to go that thin. I think max, we might go ten, ten seconds or so. The normal interval is two seconds."
27. "But enough to reduce the file size probably by half."
28. "They have no control. It's SSIS." *[sic — garbled. Reading: the decay curve is Coach's, not a member setting. §12.2.]*

**On scope and writes.**

29. "Little things like, um, no **rights** *[sic — writes]* should be allowed while, uh, while in instant replay, for example. Uh, also, uh, which surfaces does it apply to? Does it apply to the heat map, the analyzer, and surface, which is the three d version of *[the]* analyzer? Uh, my opinion is that it should apply to everything because everything is just generated directly from this data anyways, so there's nothing really preventing you from kinda limiting one and showing the other."
30. "The scrubber should be sticky across all the views."
31. "The scrubber is sticky, and… but when you go back to live, you go back to live. You're out of scrub mode."

**On Time Machine and the collapse.**

32. "We do have a time machine feature that we're planning and have already partially implemented. And when you bring on time machine, what it does is it brings up a calendar and you select the calendar. And then it will download the day that you selected, which will be essentially the same as this cache data, but maybe full fidelity across the day. And it shows it in a mini chart in the upper right hand corner of the analyzer where you can scrub. So we're probably going to reuse that scrubber."
33. "to be totally invisible."
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
45. "browser side."
46. "Add that as an addendum."
47. "It's really up to OP*[F]*." … "That is our market data layer."

Bench notes sit in **§15** beside both blocks. They do not delete them.

---

## 1. Job

**Time Machine is one surface with one scrubber and one date control.** The date control is always visible with **today pre-selected**. Selecting any other date **silently promotes** the member to that day — same chrome, same scrubber, same controls, no mode change they can perceive (§0.37). A member is **in replay the moment the scrubber is up** (§0.38).

Behind that one control there are two derivations, and the reason is mechanical: **you cannot archive and replay at the same instant.**

| Date | Derivation | Why |
|---|---|---|
| **Today** | Held cache of OPF chain generations, thinned by age | The archive for today is mid-write and cannot also be the replay source |
| **Any past day** | Closed archive: the 1-minute underlier path (390 candles or closes), optional TPO path, and the banked full-fidelity chain corpus | The day is finished; the archive is readable |

The difference is **invisible to the member by design** (§0.33, §0.34). Coach's reason: the two are the same kind of data at different densities, most of the density is the same, replay of today is aimed at the recent past where density is essentially native, and two seconds against ten on a chain is not something a member can see. The ladder is **cache management, not a truth claim**.

Time Machine is **not What-if.** What-if remains the inspector's ad-hoc Time / Spot% / Vol knobs (§0-A.8). They are different seats and may both be engaged.

**Basic and Enhanced** (§0-A.10) select what overlays are permitted while a playhead is active. Basic forces Probability and GEX off; Enhanced allows them. Default Basic.

**Two walks on a past day's underlier path** (§0-A.12): **simple** close-to-close over the 390 candles or closes, and **TPO** — a more complex download that follows the path. Default v1 is simple. TPO is specified, not dropped.

---

## 2. Vocabulary (do not collide)

| Name | This spec | Not this spec |
|---|---|---|
| **Time Machine** | The one surface: scrubber + date control + transport + mini day window + glow | Inspector What-if knobs |
| **Promotion** | Choosing a date other than today. Silent; no perceptible mode change | A mode switch |
| **Derivation** | Where the data for the selected date comes from — held cache or closed archive | Anything the member is shown |
| **Cache** | Today's held generations, thinned by age | The archive |
| **Corpus** | The banked full-fidelity per-day chain capture, server-side | Something the client ever holds whole |
| **Path** | A past day's 1-minute underlier series — 390 candles or closes | The chain corpus |
| **TPO path** | The downloaded time-price-opportunity sequence for that day | Anything synthesized from OHLC |
| **Infill** | The stochastic download sharpening a past day after the coarse pass | Serial streaming |
| **Fidelity indicator** | Progress toward a fully dense past-day download | A density readout on the timeline |
| **What-if** | Ad-hoc time · spot % · vol (`AZ-TM-*`) | Must not be labeled Time Machine |
| **Surface Time machine** | Snap rebind of listed-leg IV at *t* (Surface §4.6) | The underlier path replay |
| **Playhead owner** | The one client module holding the playhead `t_ms` per tab | Per-route cursor state |
| **ATM-*** · **TMI-*** | Both live here | `AZ-TM-*`, which is What-if |

The Analyzer suite map's bucket 4 "Time machine" has **two seats**: What-if (ad-hoc, inspector chrome) and Time Machine (replay, viewport chrome). TM-A1 stands.

---

## 3. Laws — the surface

| ID | Law |
|---|---|
| **TMI-1** | **One component, one code path, one scrubber, one date control**, on all three hosts. Not two features sharing chrome. |
| **TMI-2** RETIRED | Day/day-of exclusivity and "parking the other playhead" are moot — there are no two things to park between. See TMI-64. |
| **TMI-3** | **Heatmap, Analyzer, and Surface all host the surface**, including the date control. §0.29: everything is generated from the same data, so gating one and showing another would be arbitrary. This **extends the Day surface beyond the Analyzer**, where it originally lived. |
| **TMI-64** | **The date control is always present with today pre-selected.** Choosing another date **silently promotes**: same chrome, same scrubber, different derivation. No banner, no confirm, no felt transition (§0.37). |
| **TMI-65** | **You are in replay when the scrubber is up** (§0.38). Showing the scrubber is the entry act. Subject to §12.3. |
| **ATM-K2** | What-if Enable is **not** required to run Time Machine. Different seats. |
| **TMI-42** | **One playhead owner per tab, and the scrubber is sticky across all three hosts** (§0.30). One clock for the desk. SPA navigation changes the projector, not the playhead. No host keeps a private cursor. |
| **TMI-4** — CONTINGENT | Whether today's cache is server-side or browser-side is **§12.1**; TMI-5, TMI-56, TMI-58–63 move with it. |

## 3.1 Transport

| ID | Law |
|---|---|
| **ATM-S1** | Playback on a past day starts at the **first downloaded print**. There is **no** start-time picker (Coach removed it). The scrubber still seeks. |
| **TMI-21** | Raising the scrubber on **today** places the playhead at the **newest** generation. On a **past day** it places at the first print (ATM-S1). Clock America/New_York. |
| **ATM-S2** | **Stop** returns the playhead to the first print, priced at that session's **open** (ATM-O1). Stop does **not** exit. |
| **ATM-S3 · TMI-66** | **Reset** exits. Same label and plain chrome as What-if **Reset** — not Clear, not Leave Time Machine (§0-A.16, DL-499, reversing DL-494). On exit: playhead gone, HUD hidden, glow off, Spot and Autofit X return to live, GEX / Probability prefs restore (ATM-B3), scrub mode dropped (§0.31). Changing symbol also exits. **Reset is the named control for what §0.31 calls going back to live.** Whether the scrub position survives for the next raise is **§12.5**. |
| **ATM-C2** | One selected day → one download for the suite symbol. Changing symbol or day starts a new download and clears the previous path. |
| **TMI-18** | Existing `replayCursor` / `replayFrac` / `sampleAtFrac` / `formatReplayClock` / `REPLAY_SPEEDS`. No second clock module. |
| **TMI-19** | **The playhead is a `t_ms`, not an index.** Re-resolved on every append and speed change. |
| **TMI-20 · ATM §4.4** | **Start** plays from the current playhead; at the last sample, Start again from the origin. **Pause** freezes paint only. **Stop** per ATM-S2. **Reset** per ATM-S3. |
| **TMI-24 · ATM §4.4** | Speeds **10× / 20× / 50×**. Wall elapsed × speed = session elapsed. Changing speed while playing does **not** jump the playhead. No 1× in v1; a later 1× is FLAGGED, not silently added (§12.11). |
| **TMI-22** | Append at the edge is atomic: extend the range first; advance only if the playhead was on the newest sample and Playing. No double paint, no jump. |
| **ATM-H3** | Dragging the scrubber **seeks**. Playhead, tent spot, and Demo clock jump to that sample. Playing may continue from the new time. Pause stays paused. |

## 3.2 Today — decay

| ID | Law |
|---|---|
| **TMI-50** | **Decay thins the number of intervals. It never touches an interval's internals** (§0.24). A generation is kept **whole or dropped entirely** — never stripped of strikes, greeks, or fields. **The timeline does not change; only the number of points on it** (§0.25). Nothing is interpolated to refill a thinned stretch. |
| **TMI-68** | **The ladder.** Native interval **2 seconds**; the oldest end thins to **at most about 10 seconds** (§0.26), roughly **halving** the footprint (§0.27). Boundaries are config, fail-loud. *Two seconds conflicts with DL-400's [3,5] window — **§12.6**, blocking.* |
| **TMI-51** | The thinning pass is idempotent and fail-loud: an entry it cannot classify stops the pass, never silently keeps or drops. Per-entry `as_of` is never altered. |
| **TMI-52** RETIRED | The step display on the status line is retired by §0.33/§0.34. What the status line still shows is **§12.12**. |
| **TMI-74** | **Density is invisible to the member.** No density band, no step on the clock, no label distinguishing today's thinned cache from a past day's archive. The **only** density-adjacent thing shown anywhere is the fidelity indicator (TMI-71), which reports **download completeness**, not sample spacing. Provenance honesty (PROXY, ATM-D5) is a different obligation and survives — **§12.10**. |
| **TMI-73** | **Today's cache is browser-side** (§0.45), cleared by **lazy invalidation, not a scheduled flush** (§0.46). On load, compare the cached **trading date** against the current one; if they differ, **discard before any new data is accepted**. No timer, no cron, no session-end dump — a member returning the same evening still has their day. |
| **TMI-76** | **The trading date comes from OPF** (§0.47) — never the browser clock. If OPF's trading date is unavailable at load, the cache is **not** accepted as current and **not** silently used: named **NO DATE**, fail-loud (invariant 2). |
| **TMI-56** — CONTINGENT | The server-side collection boundary is superseded by TMI-73 **if** the cache is browser-side. §12.1. |

## 3.3 Past days — path, TPO, and corpus

| ID | Law |
|---|---|
| **ATM-C1** | A **calendar control** selects the day. America/New_York session date. Not a hidden weekday list as the only picker. Under TMI-64 this control is always present, showing today by default. |
| **ATM-C3** | Weekends / holidays / empty sessions: the download may complete with **NO PATH** (named). Do not invent prints. |
| **ATM-B1 · ATM-P1** | The path is **underlier price vs time**. A full cash session is **390** one-minute candles or closes. Short sessions have fewer — named, not padded. Do not invent bars to force 390. |
| **ATM-D1** | Granularity is **1 minute**, not 5-minute as a substitute. Close (or mid, if the source is marks) is the simple playhead spot. OHLC on the bar, where the source has it, feeds the mini candle picture. |
| **ATM-P2** | **Simple replay:** the playhead moves **close to close**. Spot on the tent is the close of the current minute. No intra-bar path. Basic default. |
| **ATM-P3** | **TPO replay:** a more complex download of TPO data; the playhead **follows the path** — the sequence of time-price opportunities, not only the 390 closes. The mini chart may still show the 390 as the day skeleton. |
| **ATM-P4** | The member may select the walk when TPO is present. Missing TPO → named **NO TPO**; simple remains available. **Never fake a TPO path from OHLC.** |
| **ATM-P5** | TPO grain (tick path vs 30-minute letters vs other) is **§12.13**. Until seated, "follow the path" means the downloaded TPO sequence in time order, un-interpolated. |
| **ATM-D1b** | TPO is a **second payload** for the same calendar day. Missing TPO ≠ failed day. |
| **ATM-D2** | Fetch is **server-side**. The browser does not call Massive. Arch 28. |
| **TMI-69** | The chain source for a past day is the **banked full-fidelity capture** — presently ~**70–80 MB/day** (§0.39), per-day download enabled once roughly a month is banked. **The corpus stays server-side; the client pulls exactly the one selected day** (§0.40). **This seats the vol plane that ATM §3.4 deferred** (FI-036): with the chain at native cadence, a past day's tent is last-print honest at *t*, and ATM-E3's restriction lifts for days the corpus covers. Whether the 1-minute path is still needed alongside the chain, or becomes only the mini-chart skeleton, is **§12.14**. |
| **TMI-70 · ATM-D3 amended** | **The download is stochastic, not serial** (§0.41). A **coarse pass across the whole day lands first**, then density **infills progressively**. The member has a **complete-but-sparse timeline immediately** that sharpens — never a partial timeline with a missing tail, never a greyed region, never an empty box. *This supersedes ATM-D3's left-to-right prefix fill and **ATM-H4**'s filled-prefix scrubber domain: the domain is the whole session from the coarse pass onward.* Coach's §0-A.4 — "as the day downloads you can see it fill the mini chart" — is satisfied by either and is not disturbed. |
| **ATM-D4** | While the coarse pass is still in flight with nothing landed: play is off; named **WAITING**. |
| **TMI-71** | **A fidelity indicator** shows where the download is in terms of full density (§0.43). It **replaces any spinner**. One overall state, not a per-region readout. |
| **TMI-72** | **Stated targets** (§0.42): usable within **15–20 seconds**; fully dense within **3–4 minutes** on a typical connection. Gate or intent is **§12.8**. |
| **TMI-75** | A past day is **read-only and complete**: not decayed, not thinned, not written to. Decay applies to today only. |
| **ATM-D5** | Source label on the HUD: `ohlc_1m` · `ssr_marks` · proxy only where a universe proxy is the honest feed, labeled (OC2 — **never silent SPY→SPX**). Narrowed against TMI-74 at **§12.10**. |

## 3.4 Basic and Enhanced

| ID | Law |
|---|---|
| **ATM-B2** | **Basic: GEX off, Probability off.** Inspector switches forced off and **disabled** while Basic is engaged. Do not leave a lying overlay. |
| **ATM-B3** | Member GEX / Probability prefs are **remembered** and **restored** on Reset. |
| **ATM-E1** | Enhanced uses the same day, same transport, same mini chart. Walk may be simple or TPO. |
| **ATM-E2** | Enhanced: the member **may turn GEX and Probability on**. Allowed, not required. |
| **ATM-E3** | Enhanced is **not** Surface snap-rebind. Package IV follows the live/held OPF generation **except** on days the corpus covers, where TMI-69 seats the chain (FI-036). |
| **ATM-E4** | Chrome names the mode (**Basic** / **Enhanced**) so the member knows why GEX/Probability are locked or free. A control selects them; default **Basic**. Whether Basic/Enhanced governs the today derivation as well as past days is **§12.15**. |
| **TMI-33** | **Heatmap** templates, including GEX, may run on the selected generation. Analyzer GEX / Probability under a playhead is governed by ATM-B2 / ATM-E2 above — **the Day document already answered what the replay chain left open.** |
| **ATM-B4** | No chain-snap vol in Basic. What-if **Vol** may still apply if What-if Enable is on. Time Machine owns **spot and session time**. |

## 3.5 No writes

| ID | Law |
|---|---|
| **TMI-67** | **No writes are permitted while a playhead is active** (§0.29). Replay is a viewing lens. Nothing on the panel may create or stage a trade log entry, a Practice journal entry, an order, or an alert. Every control that would write is **disabled with a named reason — present, not hidden, never silently ignored**. Trade Log `entry_source` stays honest because no replay tick reaches it. |
| **ATM-A1** | **CONTRADICTS TMI-67 — see §12.7.** Coach §0-A.14: the book may be empty when the day loads; the member **adds the position afterwards**, then **creates the Algo alert**, "just like real life." Position Builder, Algo eligibility, and Demo ticks use the playhead. Creating Demo while Time Machine is on does not turn What-if on. **Not resolved here.** |
| **TMI-34 · ATM §7** | Also §12.7. The replay chain kept Algo Create Alert out of v1; the Day document points Demo Algo at the replay clock (ATM-K6, §0-A.11). |
| **TMI-77** | **Position Builder under replay is §12.16.** Building and inspecting a structure while scrubbing is arguably the feature itself (§0.5, §0-A.14). Recording one as *taken* is plainly forbidden by TMI-67. Whether a saved **definition** counts as a write is Coach's. |

## 3.6 Hosts and templates

| ID | Law |
|---|---|
| **TMI-6** | Templates stay **pure** (TR5 / HM6). They never read the cache. The host selects a generation and `run()`s. |
| **TMI-29** | Width Fit: **Live \| Average \| Replay**. Average is a window mean; Replay is a single generation. Do not collapse them. |
| **TMI-30** | Switching template while scrubbing does not exit. Same data, different `run()`. |
| **TMI-31** | Analyzer: package-mark representable legs from the selected generation. Missing listed leg → **NOT TRADED** / **CHECK LEGS**, never a fake debit. |
| **TMI-32** | Surface: rebind listed-leg IV, spot, and OPF τ from the selected generation (Surface §4.6). Missing exact/locked IV → **IV NO**. Do not interpolate. |
| **TMI-35 · ATM-K3** | What-if overlay allowed. **Time Machine owns spot and session time.** What-if **Vol** may still offset. What-if Time and Spot% do not fight the playhead — ignored or disabled while a playhead is engaged (Echo chooses the affordance; the law is **no double clock**). |
| **TMI-45** | **Generation geometry governs.** A generation carries its own wings and strike step; templates run on its listed strikes; the wing control reflects it and is inert with a named reason. |
| **TMI-46** | **Playback coalescing.** At most one generation painted per animation frame — the one under the playhead at frame time. Intermediates skipped, not queued, not interpolated. `run()` is never invoked for a generation that will not paint. |

## 3.7 Carried from the replay chain — data handling

| ID | Law |
|---|---|
| **TMI-8** | A generation whose `content_hash` equals the newest held entry's is **not** a new entry; that entry's `as_of_last` advances. Each entry carries `as_of` (first seen) and `as_of_last`. The clock under a playhead shows that entry's `as_of`. Gaps stay gaps; nothing is interpolated. |
| **TMI-10** | Changing symbol or listed expiration is a **different book** with its own cache. Do not cross-fill SPY→SPX or one expiry into another. Consistent with ATM-C2, which clears the path on a symbol change. |
| **TMI-17** | Adapter: `as_of` → `t_ms`, `spot` → `spot`, with an explicit sample→entry map so an index into one is never used as an index into the other. Samples for the mini day window come from a lightweight **index** (timestamps, spot, hash) so ATM-H2 can draw the whole session without fetching generations. |
| **TMI-23** | The range runs from the start of what is held to the newest sample. Never a clock longer than the data, never earlier than its start. |
| **TMI-57** | **Window.** The client keeps a read-through window of entries around the playhead — the TR14 book, repurposed: fetched entries keyed by `as_of`, `atTime` resolves, `clear` on book-key or date change. On a miss the host fetches and prefetches a bounded number of neighbours in the playhead's direction. The window is never the source of record. Its role under §12.1 moves with that ruling. |
| **ATM-B5** | Named holes, never a fake day: **WAITING** · **NO PATH** · **NO MARKS**. Full list at §8. |

**Retired, with pointers — not deleted**

| ID | Disposition |
|---|---|
| **TMI-9** RETIRED | Sampling-on-write replaced by decay (TMI-50, TMI-51). |
| **TMI-11**, **TMI-12**, **TMI-13**, **TMI-14**, **TMI-15**, **TMI-16** RETIRED | The playback-time slider, its three stops, going-forward-only, wipe-on-change, the morning slider ritual, and the persisted horizon are superseded by Coach (§0.17, §0.21). "Granularity degrades with age" survives as TMI-50; "10-second playback is acceptable" (§0.8) survives as the ladder's slow end (TMI-68). |
| **TMI-2 · TMI-52** RETIRED | See §3 and §3.2. |

---

## 4. Clock and the tent

**ATM-K1 · TMI-K1.** While a playhead is active: **spot** = the simple close of the current minute, the current TPO price when that walk is on, or the selected generation's spot on a chain derivation; **as-of clock** = that sample's `t_ms` (America/New_York). OPF τ and last-trade remaining use **that** clock, not wall-clock now. The simple walk does **not** interpolate between closes.

**TMI-K2.** Heatmap `run(context_from_generation)`. Analyzer package quote from that generation's contracts. Surface \(\sigma_i(t)\) from that generation's IV.

**ATM-K4.** Autofit does **not** run on every playhead tick. The member hits Autofit for a refit.

**ATM-K5.** The sim-spot indicator on the risk graph follows the playhead, same grammar as What-if sim spot.

**ATM-K6.** Session last trade for Algo decay EoD is **that day's** last trade (index 16:15 ET, equity 16:00 ET), not today's wall EoD.

**ATM-O1.** On day load and on Stop: the Analyzer **Spot** field and Autofit **X** scale bind to that session's **opening price** — first 1-minute bar `o` where the path has OHLC, else the first print (§0-A.13). The live underlier mid does not keep the field or the scale. Listed strikes stay in view so the tent is not clipped. Playhead ticks move the sim-spot indicator, not Autofit (ATM-K4).

**TMI-K3.** The last live paint — or the previous generation's — must never remain as a lying replay mark. Atomic settle on playhead change, on append at the edge, and on fetch; **FETCHING** is named rather than freezing on the stale paint.

---

## 5. Member flow

```text
Open Analyzer / Heatmap / Surface
    → live paint

Raise the scrubber
    → you are in replay (TMI-65)
    → date control shows today, pre-selected
    → playhead on the newest generation
    → all writes disabled with named reasons (TMI-67, subject to §12.7)
    → Basic by default: GEX and Probability off and disabled (ATM-B2)

Scrub / play
    → Start / Pause / Stop · 10× / 20× / 50×
    → mini day window shows where in the day we are; scrubber draggable (ATM-H2, H3)
    → templates re-run() on the sample under the playhead, one per frame
    → move between hosts: the scrubber comes with you (TMI-42)
    → density is never mentioned (TMI-74)

Pick another date
    → silently promoted; nothing feels different (TMI-64)
    → coarse pass across the whole day lands, then infills (TMI-70)
    → fidelity indicator shows how sharp it is yet (TMI-71)
    → Spot and Autofit X bind to that session's open (ATM-O1)
    → simple close-to-close, or TPO when present (ATM-P2, P3)

Reset
    → exits; live Spot and scale; glow off; prefs restored (ATM-S3)

Next morning
    → OPF trading date differs from the cached one
    → cache discarded before any new data is accepted (TMI-73, TMI-76)
```

---

## 6. Chrome

Time Machine **does not** live in the What-if inspector group.

### 6.1 Dark strip above the canvas (Analyzer)

| Placement | Law |
|---|---|
| **Strikes/in** (admin Autofit pad) | **Left of Autofit** (§0-A.6). No longer `ml-auto` on the far right. |
| **Autofit** | Stays. Hit ≥44pt (OD-AZ1). |
| **Time Machine** | **To the right of Autofit** in the same dark strip (§0-A.5). |
| **Video controls** | **In the dark area above the canvas** — Start / Pause / Stop · 10× / 20× / 50× · the date control (§0-A.6). Not inside the plot. No start-time field (ATM-S1). |

Compact, 44pt hits, dark-pinned tokens.

### 6.2 Mini day window (upper-right canvas corner)

**ATM-H1.** A **small day window** appears in the **upper-right** of the canvas, inside the plot frame — the corner the slider used to occupy (§0-A.9). On Heatmap and Surface the equivalent corner of the panel.

**ATM-H2.** It shows **where in the day we are**: a small **day candle or line chart** of the loaded path, a **draggable scrubber**, and a playhead mark matching the transport.

**ATM-H4** *(amended by TMI-70)*. The window paints as the download lands. The scrubber domain is the **whole session from the coarse pass onward**, not a filled prefix.

**ATM-H5.** Hide the window when no date is engaged. **Stop** does not hide it. **Reset** does.

**ATM-H6.** The mini chart is **orientation, not a second source of record.** It must not invent candles the download does not have: OHLC present → candles allowed; marks-only → line. A line of spots is always legal.

### 6.3 Glow

| Mode engaged | Inside edge |
|---|---|
| **Time Machine, any date** | **§12.9 — unresolved.** §0-A.7 and §0.15 give blue for a past day and green for today. §0.37 says promotion must not feel different. Two colours is a felt difference. |
| **What-if** Enable, Time Machine not engaged | **Red** inner glow (§0-A.7) |
| **Time Machine + What-if** | The replay tell wins — Time Machine owns the clock (ATM-K3, TMI-26) |
| Neither | No sim glow |

**TMI-25 · TMI-27.** Glow is **paint only** — `pointer-events: none`; it does not steal Autofit, handles, or the scrubber. Named test ids `analyzer-viewport-glow` / `heatmap-panel-glow` / `surface-panel-glow` with `data-glow`. Whether the frame sits on the viewport or the whole panel, and whether red moves to match, is Echo's at Phase 3 (§12.9). The token must not read as a profit or go signal.

**TMI-28.** Copy names the surface **Time Machine** so colour is not the only tell. It does **not** name the derivation (TMI-74).

---

## 7. Algo Demo

When an Algo alert is **Live** and **Demo**:

| Clock | Use |
|---|---|
| Time Machine playhead present | Tick on **replay spot** and **replay `t_ms`** |
| Else What-if Enable | Existing FI-033 / DL-485 |
| Else | No Demo tick |

Demo does **not** flatten. No LLM fire from the transport. **Whether an alert may be *created* under a playhead is §12.7.**

---

## 8. Data and named holes

Never a silent blank, never a lying last paint.

| Hole | When |
|---|---|
| **WAITING** | Download in flight, nothing landed (ATM-D4); or today's cache empty at session start |
| **NO PATH** | The day has no 1-minute bars — holiday, future, provider empty (ATM-C3). *Replaces the advisor's duplicate `NO DAY`.* |
| **NO MARKS** | SSR marks preferred but missing; 1m OHLC also empty |
| **NO TPO** | TPO walk requested, payload missing (ATM-P4). Simple walk still offered. |
| **PROXY** | The path is a labeled proxy series. Never silent SPY as SPX (OC2). |
| **FETCHING** | The playhead resolved to a sample not yet local; the previous paint is not shown as the new tick |
| **NO DATE** | OPF trading date unavailable at load (TMI-76); cached data not used |
| **NOT TRADED** / **CHECK LEGS** / **IV NO** | Leg or IV missing on the selected generation |
| **BUDGET** | The cache is at its configured ceiling; the oldest end thins further rather than dropping the head |

**Do not interpolate across a missing minute as if it printed.** Simple walk: the playhead holds the last real close until the next real close. TPO walk: downloaded TPO prints only.

**TMI-37 · DL-309.** OPF-held listed chain only. No invented strikes, mids, or package prices.
**TMI-39 · Arch 28.** One market WebSocket. No client Massive. No second market connection.
**TMI-40.** Process and inspection only. No profit claims. The glow is not a trade signal.

---

## 9. Ideas inventory (nothing omitted)

**From the Day thread**

| Idea | Status |
|---|---|
| thinkorswim OnDemand-class replay | **IN** |
| Calendar selects the day | **IN** · ATM-C1 · now always-present per TMI-64 |
| 1-minute granularity; 390 candles or closes | **IN** · ATM-B1 · ATM-P1 |
| Mini chart fills as the day downloads | **IN** · ATM-D3 as amended by TMI-70 |
| Pick start time | **RETIRED by Coach** · ATM-S1 (§0-A.15 → v0.1.3) |
| Video controls Start / Pause / Stop · 10× / 20× / 50× | **IN** · §3.1 |
| Transport in the dark strip, right of Autofit | **IN** · §6.1 |
| Strikes/in left of Autofit | **IN** · §6.1 |
| Mini day window upper-right; candle or line; draggable scrubber | **IN** · ATM-H1–H6 |
| Blue inner glow Time Machine; red What-if | **IN for red; blue is §12.9** |
| What-if is ad-hoc; Time Machine is pick a day and replay | **IN** · §2 |
| Basic GEX/Prob off; Enhanced allows them | **IN** · ATM-B2 · ATM-E2 |
| Point Algo Demo at the day | **IN** · §7 |
| Position added afterwards, then the alert created | **§12.7** — contradicts TMI-67 |
| Simple close-to-close | **IN** · ATM-P2 |
| TPO download, follow the path | **IN** · ATM-P3 · grain §12.13 |
| Vol from full chain-snapshot days | **IN — now seated** · TMI-69 (was FI-036, deferred) |
| Spot and scale match the day's opening price | **IN** · ATM-O1 |
| Exit control named Reset | **IN** · ATM-S3 |
| 1× speed | **FLAGGED** · §12.11 |
| Surface snap-rebind as Analyzer Enhanced | **OUT** — different spec |

**From the replay thread**

| Idea | Status |
|---|---|
| Cache = raw OPF chain for all templates | **IN** · TMI-6 |
| Replay of any template; Analyzer reconstruction; any listed position | **IN** · TMI-30 · TMI-31 |
| 10 s playback acceptable | **IN** · TMI-68 |
| Playback time not MB; granularity degrades with age | **IN** · TMI-50 · TMI-68 |
| Decay thins intervals only; snapshot whole or dropped | **IN** · TMI-50 |
| 2 s native → ~10 s oldest; ~half the footprint | **IN** · TMI-68 · *DL-400 conflict §12.6* |
| No member control of the curve | **IN** · TMI-68 · *reading §12.2* |
| No writes in replay | **IN** · TMI-67 · *vs ATM-A1, §12.7* |
| Applies to Heatmap, Analyzer, Surface | **IN** · TMI-3 |
| Scrubber sticky across views | **IN** · TMI-42 |
| Back to live exits scrub mode | **IN** · ATM-S3 / TMI-66 |
| Reuse the Time Machine scrubber and mini chart | **IN** · §6.2 |
| Keep the date control; today pre-selected | **IN** · TMI-64 |
| Silent promotion, no felt difference | **IN** · TMI-64 · *frame tension §12.9* |
| Time Machine's default state | **IN** · TMI-1 |
| Density invisible | **IN** · TMI-74 |
| 70–80 MB/day banked; per-day download after ~a month | **IN** · TMI-69 |
| Download one selected day only | **IN** · TMI-69 |
| Stochastic, coarse then infill | **IN** · TMI-70 |
| Usable 15–20 s; dense 3–4 min | **IN** · TMI-72 · *§12.8* |
| Fidelity indicator replacing the spinner | **IN** · TMI-71 |
| Browser-side cache; lazy invalidation | **IN** · TMI-73 · *vs server film §12.1* |
| Trading date from OPF | **IN** · TMI-76 |
| Redis for the cache, decay "for free" | **CONTINGENT** · §12.1 |
| Record opt-in, off by default | **CONTINGENT** · §12.3 |
| Upsampling a thinned stretch | **OUT** · TMI-50 |
| Per-member film; cross-device playhead sync | **OUT** |

---

## 10. Acceptance

**AT-ATM-1…20** and **AT-TMI-1…34** both stand, unrenumbered, with these amendments and additions.

**Amended**

| ID | Change |
|---|---|
| **AT-ATM-2** | The mini chart fills as the download lands. The **left-to-right** clause is superseded: the coarse pass yields the whole session first (TMI-70). |
| **AT-ATM-9** | Glow criterion is held pending §12.9. Red for What-if alone stands. |
| **AT-ATM-19** | Held pending §12.7 (alert creation under a playhead). |
| **AT-TMI-13** | `NO DAY` renamed to the existing **NO PATH**. |

**New**

| ID | Criterion |
|---|---|
| **AT-TM-C1** | The date control is present and shows today on first raise of the scrubber, on all three hosts. |
| **AT-TM-C2** | Selecting a past date produces no banner, no confirm, no transition. A recorded screen comparison shows no difference other than the loaded range and, where §12.9 lands, the glow. |
| **AT-TM-C3** | Scrubber stickiness across Analyzer → Heatmap → Surface in one tab: same `t_ms` on each; no host holds a private cursor. |
| **AT-TM-C4** | A past day covered by the corpus rebinds Surface listed-leg IV from the chain at *t*; a day not covered falls back to the 1-minute path and does **not** claim package IV (ATM-E3, FI-036). |
| **AT-TM-C5** | Entering on today parks at the newest generation; entering on a past day parks at the first print at that session's open (ATM-O1). |
| **AT-TM-C6** | Basic engaged on **either** derivation → GEX and Probability off and disabled; Reset restores prefs. |
| **AT-TM-C7** | Reset from a past day and Reset from today both return live Spot, live scale, glow off, HUD gone, scrub mode dropped. |

---

## 11. As-built (check first — not law)

| As-built | Honesty |
|---|---|
| `algo_replay` route + `algoDayReplay.ts` cursor | Sketch toward a path loader. Fallback was **5-minute** OHLC — too coarse vs ATM-D1. |
| What-if inspector `timeMachineEnabled` | This is **What-if Enable**, misnamed in code. Do not bless the identifier. |
| Autofit centered overlay; Strikes/in `ml-auto` right | **Wrong vs §6.1.** |
| No calendar, no mini chart fill, no glows, no Basic/Enhanced | Not as-built. |
| StudioOne capture at `CHAIN_EVERY_S` (DL-400) | Named [3,5]; §0.26 says 2 s. **Read and record which is running.** §12.6. |
| ~70–80 MB/day accumulating | Coach's figure. **Confirm on disk**; record projected corpus size at the enable date. |
| Redis generation cache (Heatmap Templates §8) | Exists server-side. Relationship to a browser-side cache — **read and record.** §12.1. |
| TR14 `StreamBook` + MiB detent | Client book exists; the MiB detent is retired from the member story. §12.12. |
| Existing glow tokens | **Viewport or panel? Read and record.** §12.9. |
| Session calendar (VP) | Exists; may serve the trading-date question if OPF exposes none directly. §12.17. |

---

## 12. Open for Coach (not silently decided)

The first four blocked Phase 2 before this merge. **§12.7 and §12.9 are new and are Coach-versus-Coach.**

1. **BLOCKING — where does today's cache live?** §0.18 put it in server Redis; §0.45 says browser side. Two readings: the walk reverses the server move, or both exist with the browser holding a local window onto a server source of record. *Advisor lean, ADVISORY: the second is the smaller change — but the walk discussed the cache as if it were the whole story, so I will not write it as settled.* This decides whether `server/` is in scope.
2. **BLOCKING — confirm the three garbled words** (§0.28 "SSIS", §0.29 "rights", §0.35/38 machine words). Readings taken: the decay curve is yours, not a member setting; **writes** are forbidden; both are **Time Machine**. Law built on a misheard word is wrong law.
3. **BLOCKING — does Record survive?** §0.19/21 made recording opt-in and off by default; §0.38 says you are in replay just by showing the scrubber. If recording is off by default, raising the scrubber shows an empty range most of the time.
4. **BLOCKING — 2 s native versus DL-400.** §0.26 says two seconds; DL-400 sets four with fail-loud outside [3,5]. Either the capture changed and DL-400 needs a reversal logged, the 2 s figure is a different cadence than the archived one, or the ladder's fast end is 3–5 s.
5. **BLOCKING, NEW — the Algo alert.** Two of your rulings collide, and the collapse is what made them collide:

   > §0-A.14: *"The position can be added afterwards. The algo alert is created, just like real life."*
   > §0.29: *"no rights [writes] should be allowed while in instant replay."*

   The first was said about replaying a past day; the second about the day-of case. One surface means one rule, unless you want the rule to differ by date — which is possible and defensible, since creating an alert against a closed archive is a rehearsal and creating one against today's half-written session is closer to a real act. Three shapes, none picked: writes forbidden on both and ATM-A1 retires; writes allowed on past days only; or alert creation is carved out as not-a-write on both. **This is the single largest thing in the merge.**

6. **NEW — the glow.** §0-A.7 and §0.15 give blue for a past day and green for today; §0.37 says promotion must not feel different. Two colours is a felt difference. One colour for all scrubbing, keep two and accept that promotion is visible, or no glow on the today derivation. This touches your own laws on both sides.
7. **Scrub position after Reset.** §0.31 rules the exit. Whether the position survives for the next raise appeared in the walk read-back and was not contradicted — undirected, not approval.
8. **Are the download targets gates or intent?** §0.42's 15–20 s and 3–4 min, and on what reference connection.
9. **What remains on the Heatmap inspector Cache line** now that the step display is retired?
10. **Source label vs density invisibility.** ATM-D5 puts `ohlc_1m` / `ssr_marks` / proxy on the HUD; TMI-74 says density is invisible. The **PROXY** label is provenance honesty and should survive either way. Whether `ohlc_1m` versus `ssr_marks` is provenance (keep) or density (hide) is the narrow question.
11. **1× speed** — later or never. Carried from the Day document unresolved.
12. **HM21 megabyte detent** — drop the key on next load, or leave it inert?
13. **TPO grain** — tick or second path, classic 30-minute Market Profile letters, or another feed. Carried unresolved.
14. **Does a past day still need the 1-minute path** once the chain corpus covers it, or does the path become only the mini-chart skeleton? The corpus carries spot at native cadence, so the 390 may be redundant for the walk while still being the right picture for the mini window.
15. **Does Basic/Enhanced govern the today derivation** as well as past days? §0-A.10 was said about Time Machine before the collapse.
16. **Position Builder under replay** — does saving a **definition** count as a write?
17. **Trading-date source shape** — §0.47 names OPF as the authority. If OPF exposes no trading date directly, the VP session calendar is the nearest existing thing. Naming the field is India's; naming the authority was yours.
18. **Basic vs Enhanced control shape** — strip segment or a single Advanced checkbox. Carried from the Day document.
19. **Does Enhanced ever become Surface-class snap-rebind**, or stay overlays-allowed? The Day document said the latter until a later DL; TMI-69 moves the ground under that question.

Everything in §0 and §0-A is **law**, not an open.

---

## 13. Parent amendments (this DRAFT)

At BUILD AUTHORITY, parents gain one-line pointers in the same packet:

- **Analyzer Spec** → Time Machine is viewport chrome, not inspector; Strikes/in moves left of Autofit; the mini day window occupies the upper-right canvas corner.
- **What-If T/σ Spec** → TM-A1 confirmed: the knobs are What-if; this document owns the Time Machine name for the replay seat; no double clock.
- **Heatmap Templates** → Time Machine host mode; the Cache section per §12.9; HM21 persists no replay setting.
- **Width Fit** → Live | Average | Replay.
- **Surface §4.6** → a replay generation is a lawful snap-at-*t*; Surface hosts the same scrubber and date control.
- **Trade Log §4.4** → replay is not a write source; `entry_source` gains no fourth value (subject to §12.5).
- **AZ-ALGO** → Demo on the replay clock; creation under a playhead per §12.5.
- **Arch 28** → replay read path named; one socket, no client Massive.
- **DL-400** → lineage and the cadence question (§12.4).
- **Decision log** → the supersession of both parent documents by this one; DL-486, 487, 491, 492, 494, 499, 594 carried forward, not reversed.

---

## 14. Suggested path after BUILD AUTHORITY

1. Resolve §12.1–12.6 — they change what gets built, not how.
2. Measure generation bytes across a busy 0DTE session before the ladder is frozen; confirm the corpus figure on disk.
3. Phase 2 **India:** cache location; read paths for path, TPO, and corpus; one playhead owner; whether the 1-minute path survives §12.14; no second socket. **Mike:** no member identity held; terms on serving stored snapshots. **Foxtrot:** corpus growth and the download path.
4. Phase 3 **Echo + Tango:** the glow ruling and the three tells on one seat; fidelity-indicator copy; disabled-control reasons under TMI-67; Basic/Enhanced naming; no profit chrome.
5. Phase 4 **Hotel:** inspection only; the glow is not a signal; a replayed day is what was on the chain, never a forecast and never a fill.
6. Coach Phase 5 stamp → bench plan (Grok Build) → **Delta**.
7. Help article: one surface, the date picks the day, the indicator says how sharp a past day is yet, and what you can and cannot do while scrubbing.
8. Lima: log the supersession of both parents by this document.

No implementation until Coach Phase 5 / GO.

---

## 15. Bench notes (beside §0 and §0-A, never instead of them)

**Tango:** the mode tell must not read as "good trade / go." Copy names Time Machine. A disabled control under TMI-67 says why; a hidden one teaches nothing.

**Hotel:** *(the v0.2 position, superseded by Coach at TMI-74, kept as record)* — a thinned stretch is a sampled record and the step on the clock was proposed as the honesty. Coach ruled it invisible: replay of today is aimed at the recent past where density is essentially native, and 2 s against 10 s on a chain is imperceptible. Hotel's remaining live concern stands: replay is inspection of what was on the chain, never a forecast and never a fill; and Basic must not badge itself as last-minute package truth on days the corpus does not cover.

**India:** one surface, one playhead owner per tab, hosts bind and never fork. Whatever §12.1 decides, there is exactly one source of record for a sample and the other layer is a window onto it. Two past-day payloads (path and corpus) must not become two sources of truth for spot — §12.14 decides which one the walk reads.

**Mike:** no member identity in whatever holds the cache; terms confirmed before stored snapshots are served back.

**Echo:** the tells — replay, what-if, and whatever §12.9 decides — must share one seat and one grammar. If red is drawn on the viewport and the replay frame on the panel, they are not the same size and do not read as the same seat.

**Victor / Whiskey / Yankee:** no lineage frame is in play in this document.

---

## 16. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.5** | 2026-08-26 | **The combined spec.** Folds the Analyzer Time Machine (Day) document at **v0.1.8** into the replay chain at **v0.4**. Both §0 blocks verbatim; no ATM-* or TMI-* ID renumbered. Day surface extends from Analyzer to all three hosts. Chrome placement, mini day window, Basic/Enhanced, walks, Reset, and ATM-O1 folded in whole. The banked chain corpus **seats the vol plane ATM §3.4 deferred** (FI-036). Stochastic download supersedes left-to-right prefix fill (ATM-D3, ATM-H4 amended). Advisor duplicate `NO DAY` retired for the existing **NO PATH**. **Two new Coach-versus-Coach contradictions raised, neither resolved: the Algo alert under a playhead (§12.5) and the glow against silent promotion (§12.6).** |
| v0.4 | 2026-08-26 | Name ruling: the spec and surface are Time Machine; the day-of case is a mode contrived for performance with no member-facing name. |
| v0.3.1 | 2026-08-26 | Correction pass: section numbering realigned; TMI-K2 restored; TMI-4 version label fixed. |
| v0.3 | 2026-08-26 | The collapse: one surface, one scrubber, date always present with today pre-selected, silent promotion. Sticky scrubber, no writes, decay thins interval count only, density invisible, past-day corpus with stochastic infill, browser-side cache against OPF's trading date. |
| v0.2 | 2026-08-26 | Film to a server-side per-book Redis cache; decay replaced the slider; Record opt-in; whole-panel frame; Surface in-program. |
| v0.1.1 · v0.1 | 2026-08-26 | Advisor revision; original replay spec. |
| **Day document, folded here** | | **v0.1.8** seat/fractal framing · **v0.1.7** Reset (DL-499) · **v0.1.6** Leave Time Machine (DL-494) · **v0.1.5** position then Algo (DL-492) · **v0.1.4** Spot and Autofit X to the day's open (DL-491) · **v0.1.3** start-time picker removed · **v0.1.2** speeds 10/20/50 · **v0.1.1** 390 candles, simple or TPO (DL-487) · **v0.1** OnDemand Time Machine (DL-486) |

**One-line law:**
**One surface, one scrubber, one date control with today pre-selected — you are in replay the moment the scrubber is up, and the only thing that changes when you pick another date is where the data is derived from, because you cannot archive and replay at the same instant; the scrubber follows you across Analyzer, Heatmap, and Surface; the transport sits right of Autofit with the day window in the upper-right corner and a draggable scrubber in it; a past day binds spot and scale to that session's open and walks close to close or follows the TPO path; today's data thins by dropping whole snapshots and never by hollowing one out; a past day arrives coarse-then-sharp with an indicator saying how far along it is; and the member is never told which derivation they are looking at, because that is performance, not truth.**

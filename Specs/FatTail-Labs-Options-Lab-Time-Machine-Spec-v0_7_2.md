# FatTail Labs — Options Lab Time Machine Spec v0.7.2

**Status:** DRAFT v0.7.2 — **leftover pass, no new rulings.** v0.7 answered the six blocking opens and v0.7.1 replaced the glow with a REPLAY watermark, but the body still argued with both: §12 reprinted the interview as a queue, §14 opened with "resolve the six," and four acceptance tests still asserted a glow Time Machine no longer has. All corrected here. **This is the Phase 5 stamp candidate.**
**Type:** Product + technical spec — **Time Machine**
**Supersedes:** v0.7.1, v0.7,
**Routes:** `/app/options-lab/analyzer` · `/app/options-lab/heatmap` · `/app/options-lab/surface`
**Filename:** `FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_2.md`
**Law-ID prefixes:** **ATM-*** (from the Day document) and **TMI-*** (from the replay chain). **No ID is renumbered.** Both sets are live law in this document. `AZ-TM-*` belongs to the What-If T/σ spec and is not reused.

**Name ruling (Coach, 2026-08-26):** the spec and the surface are **Time Machine**. The day-of case is a **mode, contrived for performance**, and carries no member-facing name. "Instant Replay" is retired as a product name and survives only verbatim in §0. "Day" and "fractal" likewise retire as product vocabulary — there is one surface and a date.

**Derivation ruling (Coach, 2026-08-26):** the two sources exist because **you cannot archive and replay at the same time**. Today's session is mid-write, so replay of today is derived from a held cache; a past day is a closed archive and is read from it. That constraint, not a product distinction, is why there are two derivations behind one surface.

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine.

**Files / trees this spec touches** (exact paths confirmed by reading the repo at bench review, not assumed here):

- Analyzer host — dark strip above the canvas, Autofit strip, Strikes/in placement, mini day window, **REPLAY watermark layer** (no Time Machine glow — §0.57), package quote
- Heatmap host and inspector (`HeatmapChainPanel`; inspector Cache section)
- Surface host (panel frame, strip + HUD mount, listed-leg IV rebind per Surface §4.6)
- Transport (`AnalyzerTimeMachineStrip.tsx`, `AnalyzerDayReplayHud.tsx`, `algoDayReplay.ts`, `algo_replay` route)
- TR14 stream book module (`getStreamBook()`, `atTime` / `window` / `clear`)
- Width Fit host view (Live | Average | **Replay**)
- Past-day download path: the **StudioOne chain corpus** (coverage · index · levelled fetch), its downsample for the mini window, and the optional TPO payload (§0-A.12, §0.39–43). **No 1-minute underlier fetch** — retired as a past-day source at A1.
- `Specs/` parent one-line amendments (§13); `Architecture/00-decision-log.md`
- **No `server/` replay cache module.** §12.1 is ruled: the cache is browser-side. That tree is not touched.

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
| **DL-400** (*confirm*) | StudioOne OPF chain capture with greeks at `CHAIN_EVERY_S` (default 4 s, fail-loud outside [3,5]) — §12.4 |
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

**Four places where the two documents contradict each other** are §12.5–12.10. All four are Coach-versus-Coach, so none is resolved here.

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
| Algo alert creation vs no-writes — **unresolved contradiction, both quoted** | **§12.5** | §0-A.14 vs §0.29 |
| Glow vs silent promotion — **RULED (§0.53, then §0.57)**: Time Machine has no glow; the tell is the watermark | **TMI-25** | §0-A.7 · §0.15 · §0.37 · §0.57 |
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
15. Instant Replay mode should be **obvious**. Time Machine Day uses a **blue** blurred highlight or frame. Instant Replay uses a **green** blurred frame around the canvas while it is active. **This includes Heatmap, Analyzer, and Surface.** *(Widened to the whole panel — item 23. In tension with item 37 — §12.6.)*
16. *(§11 pass on v0.1.1)* "1. B, 2. Surface is just another view of the same data, so it works as normal. 3a. Follows #1 the cache continues to record. If you had a decay rate that the older cached ticks would get thinner, you could stick to a full day of cache. Like #2. the Surface is just a reflection of the data, same as the Analyzer. 4. OK 5. See #3."
17. "I came up with a better idea than giving a slider. Decay older cache ticks by thinning them out, that way it is easy to hold a full day and older ticks are wider intervals."
18. "You could do that with a decay function similar to redis. In fact you could use redis for the cache maybe and get it for free." *(In tension with item 45 — §12.1.)*
19. "Record or cache must be turned on and then wiped before the next session, maybe at midnight." *(In tension with item 38 — §12.3.)*
20. "This is like a controlled memory leak then garbage collected at the end of a session."
21. "Always off by default, but can be turned on at any time by the user and it starts from there, then at the eod it wipes clean, resets." *(In tension with item 38 — §12.3.)*
22. "Or it wipes before the next market session. Or the user can set when it wipes, so many hours past the market close." *(Answered by items 44–47.)*
23. "The entire panel must display it is in Instant Replay mode with a blurred border, like What-If and Time Machine." *(In tension with item 37 — §12.6.)*

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

### Rulings of 2026-08-27 (items 48–56)

Coach answered the six blocking opens in a text session. Recorded as his positions; the blocks above are untouched.

48. **Cache is browser-side.** *"If the latency is too great, we can't have it on the server. What is the worst case, that we upload 10-20MB? Then we hold it on the browser, then discard as soon as another request is made."* One day at a time; switching re-downloads — *"that's the cost of flopping around."*
49. **The three transcript readings are correct** (§0.28, §0.29, §0.35/38). *"We will decide on decay, and reserve the right to change it if we decide a better setting is needed."*
50. **No writes is a browser-era limit, not doctrine.** *"There has to be limitations when using such a powerful feature and a browser that provides limited control. If we have a desktop app with greater autonomy we might do it a bit differently."*
51. **The desktop path, named:** *"If it was desktop, we could be continuously downloading the entire gold recording, and then when the user wants to replay a day, there's no going back to the server at all."*
52. **Capture is always on.** *"We were caching for the last week or so and not doing anything with it, and there were no performance hits, so let's keep it on and refresh on the next session."*
53. **Green for both.** *"I changed my mind on the blue and green glow, let's make both green. The blue is more difficult to see, and since it is essentially the same function, keeping it one color will be less disruptive to the user."*
54. **Alerts in replay, disposed after:** *"If we can do it cleanly then allow alerts during replay and dispose cleanly after switching back."* The doubt that preceded it: *"If we allow alert creation during a replay, then we have to dispose of it when back to real-time."*
55. **The reason to allow it:** *"On the other hand it could be an awesome teaching tool."*
56. **Badge, not glow, on the cards** — *"you could add a badge on both alert and position cards"* — as **half a recycle icon: a curved arrow pointing counter-clockwise.**
57. **No glow for Time Machine at all.** *"I think instead of the glow we could add a big replay watermark to the Analyzer canvas during replay. Then it would be consistent with the replay badge on the cards."* And: *"No glow. The glow is for What-if exclusively, Time Machine does badges and watermark."*

Bench notes sit in **§15** beside all three blocks.

---

## 1. Job

**Time Machine is one surface with one scrubber and one date control.** The date control is always visible with **today pre-selected**. Selecting any other date **silently promotes** the member to that day — same chrome, same scrubber, same controls, no mode change they can perceive (§0.37). A member is **in replay the moment the scrubber is up** (§0.38).

Behind that one control there are two derivations, and the reason is mechanical: **you cannot archive and replay at the same instant.**

| Date | Derivation | Why |
|---|---|---|
| **Today** | Held cache of OPF chain generations, thinned by age | The archive for today is mid-write and cannot also be the replay source |
| **Any past day** | Closed archive: the **banked full-fidelity chain corpus**, with the mini window downsampled from it, plus the optional TPO path | The day is finished; the archive is readable |

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
| **Path** RETIRED (A1) | Was a past day's 1-minute underlier series. **No longer a source.** The term survives only in retired laws and in `NO PATH`, which now names an absent *day*, not absent bars | The chain corpus, which is the walk |
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
| **TMI-65** RULED (§0.52) | **You are in replay when the scrubber is up** (§0.38), and there is always something behind it: **capture is always on for the session.** No Record control, no opt-in. Evidence, not assumption — Coach ran the cache for a week with no performance cost. The browser holds the session as it arrives, thins by decay (TMI-50, TMI-68), and discards on trading-date change (TMI-73). §0.19 and §0.21 are superseded by §0.52, recorded not removed. |
| **ATM-K2** | What-if Enable is **not** required to run Time Machine. Different seats. |
| **TMI-42** | **One playhead owner per tab, and the scrubber is sticky across all three hosts** (§0.30). One clock for the desk. SPA navigation changes the projector, not the playhead. No host keeps a private cursor. |
| **TMI-4** RULED (§0.48) | **The cache is browser-side. No server film module is built.** Latency decides it: scrubbing at 50× against a server is a round trip per frame; against a browser-held cache it is a lookup. Today costs no transfer — the browser keeps what already arrives on the live socket. A past day is the levelled download the archive API serves. TMI-5, TMI-56 and TMI-58–63 retire with the server film. |
| **TMI-79** (§0.48) | **One day is held at a time.** Selecting another date discards the one held before accepting the new one, so the memory ceiling is one session. Returning to a day just left re-downloads it. |

## 3.1 Transport

| ID | Law |
|---|---|
| **ATM-S1** | Playback on a past day starts at the **first downloaded print**. There is **no** start-time picker (Coach removed it). The scrubber still seeks. |
| **TMI-21** | Raising the scrubber on **today** places the playhead at the **newest** generation. On a **past day** it places at the first print (ATM-S1). Clock America/New_York. |
| **ATM-S2** | **Stop** returns the playhead to the first print, priced at that session's **open** (ATM-O1). Stop does **not** exit. |
| **ATM-S3 · TMI-66** | **Reset** exits. Same label and plain chrome as What-if **Reset** — not Clear, not Leave Time Machine (§0-A.16, DL-499, reversing DL-494). On exit: playhead gone, HUD hidden, glow off, Spot and Autofit X return to live, GEX / Probability prefs restore (ATM-B3), scrub mode dropped (§0.31). Changing symbol also exits. **Reset is the named control for what §0.31 calls going back to live.** Whether the scrub position survives for the next raise is **§12.7**. |
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
| **TMI-68** | **The ladder.** Native interval **2 seconds**; the oldest end thins to **at most about 10 seconds** (§0.26), roughly **halving** the footprint (§0.27). Boundaries are config, fail-loud. *Two seconds conflicts with DL-400's [3,5] window — **§12.4**, blocking.* |
| **TMI-51** | The thinning pass is idempotent and fail-loud: an entry it cannot classify stops the pass, never silently keeps or drops. Per-entry `as_of` is never altered. |
| **TMI-52** RETIRED | The step display on the status line is retired by §0.33/§0.34. What the status line still shows is **§12.9**. |
| **TMI-74** | **Density is invisible to the member.** No density band, no step on the clock, no label distinguishing today's thinned cache from a past day's archive. The **only** density-adjacent thing shown anywhere is the fidelity indicator (TMI-71), which reports **download completeness**, not sample spacing. Provenance honesty (PROXY, ATM-D5) is a different obligation and survives — **§12.10**. |
| **TMI-73** | **Today's cache is browser-side** (§0.45), cleared by **lazy invalidation, not a scheduled flush** (§0.46). On load, compare the cached **trading date** against the current one; if they differ, **discard before any new data is accepted**. No timer, no cron, no session-end dump — a member returning the same evening still has their day. |
| **TMI-76** | **The trading date comes from OPF** (§0.47) — never the browser clock. If OPF's trading date is unavailable at load, the cache is **not** accepted as current and **not** silently used: named **NO DATE**, fail-loud (invariant 2). |
| **TMI-56** RETIRED (§0.48) | The server-side collection boundary retires with the server film. TMI-73's lazy invalidation against OPF's trading date is the whole lifecycle. |

## 3.3 Past days — path, TPO, and corpus

| ID | Law |
|---|---|
| **ATM-C1** (A1) | A **calendar control** selects the day. America/New_York session date. Under TMI-64 it is always present, showing today by default. **Three states, distinguishable as built:** a whole day reports `rth_complete` with its hours; a **partial day reports the hours it actually covers**, never the hours it should have had; a date with nothing is a named absence. This is what Coach's ruling — highlight what is retrievable, grey the rest — rests on, and it is measured rather than assumed. |
| **ATM-C3** (A1) | Weekends, holidays, empty sessions, **and any date before collection began**: named **NO PATH**. Confirmed as built — a pre-collection date returns a named absence, **not a 5xx and not an empty success**. Do not invent prints. |
| **ATM-B1 · ATM-P1 · ATM-D1 · ATM-D2** RETIRED as a past-day source (A1) | **Coach, 2026-08-26: past days come from StudioOne, not the 1-minute OPF pull.** The chain is the walk — spot at every tick is the spot of the generation under the playhead (TMI-K1). The 390-candle path, its 1-minute granularity, and its server fetch describe a source this spec no longer uses for a past day. Retired, not deleted: **no 1-minute past-day fetch is built.** Consequence: exactly **one source of spot** for a past day, closing India's two-truths concern and §12.14. |
| **ATM-D1** | Granularity is **1 minute**, not 5-minute as a substitute. Close (or mid, if the source is marks) is the simple playhead spot. OHLC on the bar, where the source has it, feeds the mini candle picture. |
| **ATM-P2** | **Simple replay:** the playhead moves **close to close**. Spot on the tent is the close of the current minute. No intra-bar path. Basic default. |
| **ATM-P3** | **TPO replay:** a more complex download of TPO data; the playhead **follows the path** — the sequence of time-price opportunities, not only the 390 closes. The mini chart may still show the 390 as the day skeleton. |
| **ATM-P4** | The member may select the walk when TPO is present. Missing TPO → named **NO TPO**; simple remains available. **Never fake a TPO path from OHLC.** |
| **ATM-P5** | TPO grain (tick path vs 30-minute letters vs other) is **§12.13**. Until seated, "follow the path" means the downloaded TPO sequence in time order, un-interpolated. |
| **ATM-D1b** | TPO is a **second payload** for the same calendar day. Missing TPO ≠ failed day. |
| **ATM-D2** | Fetch is **server-side**. The browser does not call Massive. Arch 28. |
| **TMI-69** | The chain source for a past day is the **banked full-fidelity capture** — presently ~**70–80 MB/day** (§0.39), per-day download enabled once roughly a month is banked. **The corpus stays server-side; the client pulls exactly the one selected day** (§0.40). **This seats the vol plane that ATM §3.4 deferred** (FI-036): with the chain at native cadence, a past day's tent is last-print honest at *t*, and ATM-E3's restriction lifts for days the corpus covers. Whether the 1-minute path is still needed alongside the chain, or becomes only the mini-chart skeleton, is **§12.14**. |
| **TMI-70 · ATM-D3 amended** · *measured 2026-08-27* | **The download is stochastic, not serial** (§0.41). A **coarse pass across the whole day lands first**, then density **infills progressively**. The member has a **complete-but-sparse timeline immediately** that sharpens — never a partial timeline with a missing tail, never a greyed region, never an empty box. *This supersedes ATM-D3's left-to-right prefix fill and **ATM-H4**'s filled-prefix scrubber domain: the domain is the whole session from the coarse pass onward.* Coach's §0-A.4 — "as the day downloads you can see it fill the mini chart" — is satisfied by either and is not disturbed. **Measured on 2026-08-25 SPX: 5,800 snapshots, derived stride 64, seven levels, level 0 returning 91 snapshots each carrying spot, in under eight seconds.** A windowed fetch returns a single tick without the level around it, so scrubbing never requires holding a whole level. |
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
| **ATM-E4** (A1) | Chrome names the mode (**Basic** / **Enhanced**); a control selects them; default **Basic**. **The premise has changed and the law has not.** GEX and Probability were forced off in Basic because a 1-minute path carries no chain and the overlay would have been lying. Under A1 **every selectable date has a chain**, so that reason is gone. Keeping Basic as GEX-off is now a **product choice — a simpler desk — not an honesty requirement**, and should be stated as one if kept. Still **§12.15**. |
| **TMI-33** | **Heatmap** templates, including GEX, may run on the selected generation. Analyzer GEX / Probability under a playhead is governed by ATM-B2 / ATM-E2 above — **the Day document already answered what the replay chain left open.** |
| **ATM-B4** | No chain-snap vol in Basic. What-if **Vol** may still apply if What-if Enable is on. Time Machine owns **spot and session time**. |

## 3.5 No writes

| ID | Law |
|---|---|
| **TMI-67** (§0.29 · §0.50) | **Nothing created in replay persists.** No trade log entry, no Practice journal entry, no order, no stored alert. Controls that would write outside replay are **disabled with a named reason — present, not hidden, never silently ignored**. Trade Log `entry_source` stays honest because no replay tick reaches it. **The reason is recorded so it is not read as doctrine** (§0.50): this is a limit of a browser with restricted control over its own lifetime, not a position on what replay should be. §0.51 names where it changes — a desktop client holding the corpus locally. |
| **TMI-80** REHEARSAL OBJECTS (§0.54 · §0.55 · §0.56) | **Alerts and positions may be built while a playhead is active, as rehearsal objects.** Coach's reason is the teaching value: rehearsing against a day whose shape is known is practice, which is what this platform is for. Four conditions, all required: **(a)** named as a rehearsal at creation and carrying a **badge — half a recycle icon, a curved arrow pointing counter-clockwise** — on both alert and position cards, so its nature is on its face and not merely in where it sits; **(b)** it ticks on the **replay clock and replay spot** (TMI-K1), never wall time; **(c)** it **never reaches the alert store, never notifies, never enters Trade Log**; **(d)** **disposal is announced, not silent** — returning to live states that the rehearsal ended, because an object that simply vanishes reads as a defect rather than as the feature working. TMI-67 is intact: nothing persisted, so nothing was written. |
| **TMI-81** (§0.56 · §0.57) | **The badge marks a rehearsal object; the watermark marks the surface.** The same mark at two scales, so Time Machine speaks one language: the watermark says *this panel is in replay*, the badge says *this object was born there*. Different facts, and they come apart at disposal — the watermark goes when replay ends, and so does the object. **Glow is What-if's alone and Time Machine never uses it**, so no signal is shared between the two seats. Echo owns the word and the shape; the law is that a rehearsal object is identifiable **on its face**. Icon from the open set — no SF Symbols. Non-interactive paint; the badge is not a control. |
| **ATM-A1** RESOLVED (§0.54) | §0-A.14 stands and is **not** deferred: the book may be empty when the day loads, the member adds the position, and the alert is created — as a rehearsal object under TMI-80. Position Builder, Algo eligibility, and Demo ticks use the playhead. Creating Demo while a playhead is active does not turn What-if on. The contradiction with TMI-67 dissolves because nothing persists. |
| **TMI-34** SUPERSEDED (§0.54) | The replay chain kept Algo Create Alert out of v1. Coach has ruled it in, as a rehearsal object. Demo Algo ticks on the replay clock (ATM-K6, §0-A.11). |
| **TMI-77** RULED (§0.56) | **Position Builder works under replay**, producing rehearsal positions under TMI-80 with the same badge, clock, and disposal. Building and inspecting a structure while scrubbing was always arguably the feature (§0.5, §0-A.14). Nothing is recorded as *taken*, and no definition survives the return to live — so TMI-67 holds. |

## 3.6 Hosts and templates

| ID | Law |
|---|---|
| **TMI-6** | Templates stay **pure** (TR5 / HM6). They never read the cache. The host selects a generation and `run()`s. |
| **TMI-29** | Width Fit: **Live \| Average \| Replay**. Average is a window mean; Replay is a single generation. Do not collapse them. |
| **TMI-30** | Switching template while scrubbing does not exit. Same data, different `run()`. |
| **TMI-31** | Analyzer: package-mark representable legs from the selected generation. Missing listed leg → **NOT TRADED** / **CHECK LEGS**, never a fake debit. |
| **TMI-32** | Surface: rebind listed-leg IV, spot, and OPF τ from the selected generation (Surface §4.6). Missing exact/locked IV → **IV NO**. Do not interpolate. |
| **TMI-35 · ATM-K3** | What-if overlay allowed. **Time Machine owns spot and session time.** What-if **Vol** may still offset. What-if Time and Spot% do not fight the playhead — ignored or disabled while a playhead is engaged (Echo chooses the affordance; the law is **no double clock**). |
| **TMI-45** (A1) | **Generation geometry governs what is painted.** A generation carries its own **listed strikes and strike step**; templates run on those strikes and nothing else. **The wing band is a property of the day, not of the generation** — confirmed by opening a real envelope on the store 2026-08-27: the snapshot carries expiration, spot, and full call/put greeks, and **not** the band. Wings live in coverage and `PROVENANCE.json`, one figure per book per day, true of **every day already collected**. Under replay the Analyzer takes wings from coverage; the wing control stays inert with a named reason. **Nothing about the band is surfaced to the member** (Coach, 2026-08-27): the panel paints the legs that exist and follows spot. |
| **TMI-78** (A1) | **The day-level band is the widest the session reached.** The band ratchets (§1) — it grows and never drops strikes — so one figure per day is the close-of-session width, and a tick early in the session sits under a band wider than existed then. **Recorded, deliberately not surfaced and not corrected.** The strikes painted at a tick are the real listed strikes for that tick; the band is not a claim about them. No chrome may present the day band as a tick's live window — **Echo sweeps** any existing `wings = ±N` readout on the Analyzer inspector and Width Fit for that claim under replay. |
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

**ATM-O1** (A1). On day load and on Stop: the Analyzer **Spot** field and Autofit **X** scale bind to that session's **opening price** — the spot of the **first generation of that session** (§0-A.13). The 1-minute bar `o` is retired with its source; the chain carries no OHLC. The live underlier mid does not keep the field or the scale. Listed strikes stay in view so the tent is not clipped. Playhead ticks move the sim-spot indicator, not Autofit (ATM-K4).

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
    → nothing persists (TMI-67); alerts and positions may be built as rehearsal objects,
      badged with the counter-clockwise arrow (TMI-80, TMI-81)
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
    → exits; live Spot and scale; watermark gone; rehearsal objects disposed with an
      announcement; prefs restored (ATM-S3, TMI-80)

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

**ATM-H2** (A1). It shows **where in the day we are**: a small day **line** chart **downsampled from the chain**, a **draggable scrubber**, and a playhead mark matching the transport. The picture derives from the same generations the walk uses — **not a second fetch and not a second source of spot**. Candles need OHLC, which the chain does not carry, so a past day's window is a line.

**ATM-H4** *(amended by TMI-70)*. The window paints as the download lands. The scrubber domain is the **whole session from the coarse pass onward**, not a filled prefix.

**ATM-H5.** Hide the window when no date is engaged. **Stop** does not hide it. **Reset** does.

**ATM-H6.** The mini chart is **orientation, not a second source of record.** It must not invent candles the download does not have: OHLC present → candles allowed; marks-only → line. A line of spots is always legal.

### 6.3 Tells — watermark, badge, and What-if's glow

| Mode engaged | Tell |
|---|---|
| **Time Machine, any date** | **No glow.** (§0.57 — supersedes §0.53, which had superseded the blue/green split of §0.15 and §0-A.7.) Time Machine's tell is the **watermark** (TMI-25) and, on rehearsal objects, the **badge** (TMI-81). |
| **What-if** Enable, Time Machine not engaged | **Red** inner glow (§0-A.7) |
| **Time Machine + What-if** | Both tells show and neither is suppressed: the red glow says What-if is engaged, the watermark says the panel is in replay. They no longer compete for one signal. Time Machine still owns the clock (ATM-K3, TMI-26). |
| Neither | No tell of any kind |

**TMI-25** RULED (§0.57), superseding §0.53. **Time Machine has no glow. The tell is a REPLAY watermark on the canvas**, present on any date while a playhead is active, on **all three hosts** — Analyzer, Heatmap, and Surface, since the scrubber is sticky across them (TMI-42) and a surface in replay that does not say so is the thing this law exists to prevent.

Three conditions, all binding:

- **It loses to the data.** Behind the plot layer, low contrast, non-interactive. It must never make a strike, a leg, a price, or the sim-spot indicator harder to read. A tell that costs legibility on a risk graph has taken more than it gave.
- **It is not green, and not any P&L colour.** Green over a tent already means profit, and a large green mark across a risk graph is precisely the profit-signal collision Tango and Hotel guard against (TMI-40). Neutral: the word carries the meaning, not the hue.
- **Each host gets its own treatment of the same mark.** A watermark over a risk graph, a Heatmap grid, and a 3D surface are three different design problems with one meaning. Echo owns the execution; the law is that all three say it and none obscure what they sit on.

**TMI-27.** Both tells are **paint only** — `pointer-events: none`; neither steals Autofit, handles, or the scrubber. Named test ids `analyzer-replay-watermark` / `heatmap-replay-watermark` / `surface-replay-watermark` with `data-replay`; the What-if glow keeps its own. No token may read as a profit or go signal.

**TMI-28.** Copy names the surface **Time Machine** so the mark is not the only tell. It does **not** name the derivation (TMI-74).

---

## 7. Algo Demo

When an Algo alert is **Live** and **Demo**:

| Clock | Use |
|---|---|
| Time Machine playhead present | Tick on **replay spot** and **replay `t_ms`** |
| Else What-if Enable | Existing FI-033 / DL-485 |
| Else | No Demo tick |

Demo does **not** flatten. No LLM fire from the transport. **Whether an alert may be *created* under a playhead is §12.5.**

---

## 8. Data and named holes

Never a silent blank, never a lying last paint.

| Hole | When |
|---|---|
| **WAITING** | Download in flight, nothing landed (ATM-D4); or today's cache empty at session start |
| **NO PATH** (A1) | The archive holds nothing for that date and book — holiday, future, before collection began, provider empty (ATM-C3). No longer "no 1-minute bars"; the measure is the corpus. *Replaces the advisor's duplicate `NO DAY`.* |
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
**TMI-40.** Process and inspection only. No profit claims. **Neither the watermark nor the badge is a trade signal**, and neither may be drawn in a P&L colour (TMI-25).

---

## 9. Ideas inventory (nothing omitted)

**From the Day thread**

| Idea | Status |
|---|---|
| thinkorswim OnDemand-class replay | **IN** |
| Calendar selects the day | **IN** · ATM-C1 · now always-present per TMI-64 |
| 1-minute granularity; 390 candles or closes | **RETIRED as a past-day source (A1)** — the chain is the walk · Coach 2026-08-26 |
| Mini chart fills as the day downloads | **IN** · ATM-D3 as amended by TMI-70 |
| Pick start time | **RETIRED by Coach** · ATM-S1 (§0-A.15 → v0.1.3) |
| Video controls Start / Pause / Stop · 10× / 20× / 50× | **IN** · §3.1 |
| Transport in the dark strip, right of Autofit | **IN** · §6.1 |
| Strikes/in left of Autofit | **IN** · §6.1 |
| Mini day window upper-right; candle or line; draggable scrubber | **IN** · ATM-H1–H6 |
| Blue inner glow Time Machine; red What-if | **Blue RETIRED (§0.53); all Time Machine glow RETIRED (§0.57).** Red glow is What-if's alone; Time Machine uses the watermark |
| What-if is ad-hoc; Time Machine is pick a day and replay | **IN** · §2 |
| Basic GEX/Prob off; Enhanced allows them | **IN** · ATM-B2 · ATM-E2 |
| Point Algo Demo at the day | **IN** · §7 |
| Position added afterwards, then the alert created | **IN as rehearsal objects** · TMI-80 · ATM-A1 (§0.54) |
| Simple close-to-close | **IN** · ATM-P2 |
| TPO download, follow the path | **IN** · ATM-P3 · grain §12.13 |
| Vol from full chain-snapshot days | **IN — now seated** · TMI-69 (was FI-036, deferred) |
| Wings from the generation | **CORRECTED (A1)** — day-level, from coverage · TMI-45 · TMI-78 |
| Mini window from the 1-minute path | **CORRECTED (A1)** — downsampled from the chain · ATM-H2 |
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
| 2 s native → ~10 s oldest; ~half the footprint | **IN** · TMI-68 · *DL-400 conflict §12.4* |
| No member control of the curve | **IN** · TMI-68 · *reading §12.2* |
| No writes in replay | **IN — nothing persists** · TMI-67; rehearsal objects are not writes (TMI-80) |
| Applies to Heatmap, Analyzer, Surface | **IN** · TMI-3 |
| Scrubber sticky across views | **IN** · TMI-42 |
| Back to live exits scrub mode | **IN** · ATM-S3 / TMI-66 |
| Reuse the Time Machine scrubber and mini chart | **IN** · §6.2 |
| Keep the date control; today pre-selected | **IN** · TMI-64 |
| Silent promotion, no felt difference | **IN** · TMI-64 · one watermark either date (§0.57) |
| Rehearsal badge — counter-clockwise curved arrow | **IN** · TMI-81 (§0.56) |
| REPLAY watermark on the canvas, all three hosts | **IN** · TMI-25 (§0.57) |
| Desktop client holding the whole corpus locally | **NAMED as the upgrade path**, not scope · §0.51 |
| Rehearse an alert, run the day forward, see where it fires | **NAMED as a separate spec** · §14 |
| Time Machine's default state | **IN** · TMI-1 |
| Density invisible | **IN** · TMI-74 |
| 70–80 MB/day banked; per-day download after ~a month | **IN** · TMI-69 |
| Download one selected day only | **IN** · TMI-69 |
| Stochastic, coarse then infill | **IN** · TMI-70 |
| Usable 15–20 s; dense 3–4 min | **IN** · TMI-72 · *§12.8* |
| Fidelity indicator replacing the spinner | **IN** · TMI-71 |
| Browser-side cache; lazy invalidation | **IN — ruled** · TMI-73 · TMI-4 (§0.48) |
| Trading date from OPF | **IN** · TMI-76 |
| Redis for the cache, decay "for free" | **RETIRED (§0.48)** — no server film |
| Record opt-in, off by default | **RETIRED (§0.52)** — capture always on, refreshed next session |
| Upsampling a thinned stretch | **OUT** · TMI-50 |
| Per-member film; cross-device playhead sync | **OUT** |

---

## 10. Acceptance

**AT-ATM-1…20** and **AT-TMI-1…34** both stand, unrenumbered, with these amendments and additions.

**Amended**

| ID | Change |
|---|---|
| **AT-ATM-2** | The mini chart fills as the download lands. The **left-to-right** clause is superseded: the coarse pass yields the whole session first (TMI-70). |
| **AT-ATM-9** | REPLAY watermark present under a playhead on **either** date, on all three hosts; **no Time Machine glow anywhere**; red glow appears only for What-if; watermark behind the plot layer, non-interactive, and in no P&L colour. |
| **AT-ATM-19** | An alert created under a playhead is a rehearsal object: badged, ticking on the replay clock, absent from the alert store, and gone with an announcement on return to live. |
| **AT-TMI-13** | `NO DAY` renamed to the existing **NO PATH**. |

**New**

| ID | Criterion |
|---|---|
| **AT-TM-C1** | The date control is present and shows today on first raise of the scrubber, on all three hosts. |
| **AT-TM-C2** | Selecting a past date produces no banner, no confirm, no transition. A recorded screen comparison shows **no difference other than the loaded range** — the watermark is already present before the date changes and is identical after, because it marks replay and not which date is loaded. |
| **AT-TM-C3** | Scrubber stickiness across Analyzer → Heatmap → Surface in one tab: same `t_ms` on each; no host holds a private cursor. |
| **AT-TM-C4** (A1) | A past day covered by the corpus rebinds Surface listed-leg IV from the chain at *t*. **A day not covered is not selectable** — the calendar greys it and the archive names **NO PATH**. There is no 1-minute fallback: that escape hatch is the source retired at A1, and an uncovered date must never resolve to a second source (ATM-E3, FI-036). |
| **AT-TM-C5** | Entering on today parks at the newest generation; entering on a past day parks at the first print at that session's open (ATM-O1). |
| **AT-TM-C6** HELD | Basic engaged on either derivation → GEX and Probability off and disabled; Reset restores prefs. **Held pending §12.15**, as AT-ATM-9 and AT-ATM-19 are held: the acceptance asserts a rule whose premise is gone (ATM-E4). Do not gate on it until Coach rules whether Basic survives as a simpler-desk choice. |
| **AT-TM-C7** | Reset from a past day and Reset from today both return live Spot, live scale, **watermark gone**, HUD gone, scrub mode dropped, and every rehearsal object disposed with an announcement. |
| **AT-TM-C8** | No `server/` replay cache module exists; selecting a second day discards the first before accepting it; memory does not grow with days visited. |
| **AT-TM-C9** | Raising the scrubber at any point in a session shows a non-empty range with no Record gesture. |
| **AT-TM-C10** | Every rehearsal alert and rehearsal position carries the counter-clockwise badge; none appears in the alert store or Trade Log; all are gone after Reset, and the return to live states that they ended. |

---

## 11. As-built (check first — not law)

| As-built | Honesty |
|---|---|
| `algo_replay` route + `algoDayReplay.ts` cursor | Sketch toward a path loader. Fallback was **5-minute** OHLC — too coarse vs ATM-D1. |
| What-if inspector `timeMachineEnabled` | This is **What-if Enable**, misnamed in code. Do not bless the identifier. |
| Autofit centered overlay; Strikes/in `ml-auto` right | **Wrong vs §6.1.** |
| No calendar, no mini chart fill, no watermark layer, no Basic/Enhanced | Not as-built. |
| StudioOne capture at `CHAIN_EVERY_S` (DL-400) | Named [3,5]; §0.26 says 2 s. **Read and record which is running.** §12.4. |
| ~70–80 MB/day accumulating | Coach's figure. **Confirm on disk**; record projected corpus size at the enable date. |
| Redis generation cache (Heatmap Templates §8) | Exists server-side. Relationship to a browser-side cache — **read and record.** §12.1. |
| TR14 `StreamBook` + MiB detent | Client book exists; the MiB detent is retired from the member story. §12.12. |
| Existing glow tokens | **What-if's red only.** Read and record where it is drawn (viewport or panel) so the watermark sits in a coherent seat beside it. No Time Machine glow is built (§0.57). |
| Session calendar (VP) | Exists; may serve the trading-date question if OPF exposes none directly. §12.17. |

---

## 12. The record of what was asked and how it was answered

**No blocking open remains.** The six that gated Phase 2 are ruled in §0.48–0.57. This section is kept as the record — what was asked, and the answer — because a spec that erases its own questions loses the reasoning behind its law. **It is not a queue. Nothing here is to be implemented as a question.**

### 12.1–12.6 — the six, closed

| # | Asked | Ruled |
|---|---|---|
| **12.1** | Where does today's cache live — server Redis (§0.18) or browser (§0.45)? | **Browser-side** (§0.48). One day held; switching discards and re-downloads. **No `server/` film module is built.** TMI-4, TMI-79; TMI-5, TMI-56, TMI-58–63 retire. |
| **12.2** | Are the three garbled transcript words read correctly? | **Yes** (§0.49). The decay curve is Coach's, not a member setting; **writes** are forbidden; both machine words are Time Machine. The curve stays config and Coach may change it. |
| **12.3** | Does Record survive — opt-in and off by default (§0.19, §0.21) against "in replay when the scrubber is up" (§0.38)? | **Capture is always on** (§0.52). No Record control. Evidence, not assumption: a week of running it with no performance cost. |
| **12.4** | 2 s native (§0.26) against DL-400's 4 s with a fail-loud band of [3,5]? | **Answered by measurement, not ruling.** The archive's cadence pass (`/api/cadence`, filename deltas only) reports the real distribution across every collected day. Whichever it shows is the number this spec's ladder is sized on, and DL-400 is confirmed or reversed on that evidence. **Not a Phase 2 blocker** — a confirm-on-disk item carried into Phase 2 as a fact to read, not a decision to make. |
| **12.5** | Alert creation under a playhead (§0-A.14) against no writes (§0.29)? | **Rehearsal objects** (§0.54, §0.55). Alerts and positions may be built under a playhead: badged, ticking on the replay clock, never reaching the alert store or Trade Log, disposed with an announcement on return. TMI-67 holds because nothing persists. TMI-80, TMI-81; ATM-A1 resolved, TMI-34 superseded, TMI-77 ruled. The reason for the limit is recorded as a browser-era constraint with the desktop path named (§0.50, §0.51). |
| **12.6** | Blue for a past day and green for today (§0.15, §0-A.7) against silent promotion (§0.37)? | **Time Machine has no glow** (§0.57, superseding §0.53's green-for-both). The glow is What-if's exclusively. The tell is the **REPLAY watermark** on all three hosts plus the **counter-clockwise badge** on rehearsal cards — the same mark at two scales. TMI-25, TMI-81. |

### Smaller opens — never blocking, still Coach's

7. **Scrub position after Reset.** §0.31 rules the exit. Whether the position survives for the next raise appeared in a read-back and was not contradicted — undirected, not approval.
8. **Are the download targets gates or intent?** §0.42's 15–20 s and 3–4 min, and on what reference connection.
9. **What remains on the Heatmap inspector Cache line** now that the step display is retired.
10. **Source label vs density invisibility.** The **PROXY** label is provenance honesty and survives either way; whether `ssr_marks` is provenance or density is the narrow question. Note that `ohlc_1m` names a source retired at A1 and is historical.
11. **1× speed** — later or never.
12. **HM21 megabyte detent** — drop the key on next load, or leave it inert.
13. **TPO grain** — tick or second path, classic 30-minute letters, or another feed. TPO itself is untouched and unimplemented.
14. **CLOSED (A1).** Past days come from StudioOne; the chain is the walk and the mini window downsamples from it. One source of spot.
15. **Does Basic/Enhanced survive?** **Not a Phase 5 block — a later control choice.** Its premise is gone (ATM-E4): GEX-off existed because a 1-minute path carried no chain and the overlay would have lied. Every selectable date now has a chain. Keeping Basic is a simpler-desk choice, and should be stated as one if kept. AT-TM-C6, AT-ATM-9's Basic clause, and AT-ATM-19's Basic clause are held against this, and none of them gates Phase 5.
16. **Position Builder saved definitions** — **CLOSED (§0.56).** Positions build under replay as rehearsal objects; no definition survives the return to live.
17. **Trading-date source shape.** §0.47 names OPF as the authority. If OPF exposes no trading date directly, the VP session calendar is the nearest existing thing. Naming the field is India's.
18. **Basic vs Enhanced control shape** — strip segment or a single Advanced checkbox. Moot if 15 retires it.
19. **Does Enhanced ever become Surface-class snap-rebind**, or stay overlays-allowed. TMI-69 moved the ground under this.

Everything in §0 and §0-A is **law**, not an open.

---

## 13. Parent amendments (this DRAFT)

At BUILD AUTHORITY, parents gain one-line pointers in the same packet:

- **Analyzer Spec** → Time Machine is viewport chrome, not inspector; Strikes/in moves left of Autofit; the mini day window occupies the upper-right canvas corner.
- **What-If T/σ Spec** → TM-A1 confirmed: the knobs are What-if; this document owns the Time Machine name for the replay seat; no double clock.
- **Heatmap Templates** → Time Machine host mode; the Cache section per §12.6; HM21 persists no replay setting.
- **Width Fit** → Live | Average | Replay.
- **Surface §4.6** → a replay generation is a lawful snap-at-*t*; Surface hosts the same scrubber and date control.
- **Trade Log §4.4** → replay is not a write source; `entry_source` gains no fourth value (subject to §12.5).
- **AZ-ALGO** → Demo on the replay clock; creation under a playhead per §12.5.
- **Arch 28** → replay read path named; one socket, no client Massive.
- **DL-400** → lineage and the cadence question (§12.4).
- **Decision log** → the supersession of both parent documents by this one; DL-486, 487, 491, 492, 494, 499, 594 carried forward, not reversed.

---

## 14. Suggested path after BUILD AUTHORITY

1. **The six are ruled (§0.48–0.57); §12 is the record, not a queue.** Begin at Phase 2 — no cache-location debate, no glow ruling, no Record question.
2. Measure generation bytes across a busy 0DTE session before the ladder is frozen; confirm the corpus figure on disk.
3. Phase 2 **India:** cache location; read paths for the corpus and the optional TPO; the mini-window downsample as a derivation of the same generations, not a second series; one playhead owner; no second socket. **Mike:** no member identity held; terms on serving stored snapshots. **Foxtrot:** corpus growth and the download path.
4. Phase 3 **Echo + Tango:** — note that the first Analyzer packet is a **layout move**, not a new widget: Strikes/in goes left of Autofit and the transport right of it (§6.1), against as-built that has them the other way.
   Then: the **watermark** on all three hosts and the **badge** on rehearsal cards as one grammar, sized so neither reads as a signal on a tent and neither obscures a leg or a price; reduced-motion means a static mark, never a pulse; rehearsal disposal copy;
5. Phase 4 **Hotel:** inspection only; **a rehearsal alert must never read as a live working order**; the watermark is not a signal;
6. Coach Phase 5 stamp → bench plan (Grok Build) → **Delta**.
7. Help article: one surface, the date picks the day, the indicator says how sharp a past day is yet, and what you can and cannot do while scrubbing.
8. Lima: log the supersession of both parents by this document.

No implementation until Coach Phase 5 / GO.

---

## 15. Bench notes (beside §0 and §0-A, never instead of them)

**Tango:** the mode tell must not read as "good trade / go." Copy names Time Machine. A disabled control under TMI-67 says why; a hidden one teaches nothing.

**Hotel:** *(the v0.2 position, superseded by Coach at TMI-74, kept as record)* — a thinned stretch is a sampled record and the step on the clock was proposed as the honesty. Coach ruled it invisible: replay of today is aimed at the recent past where density is essentially native, and 2 s against 10 s on a chain is imperceptible. Hotel's remaining live concern stands: replay is inspection of what was on the chain, never a forecast and never a fill; and Basic must not badge itself as last-minute package truth on days the corpus does not cover.

**India:** one surface, one playhead owner per tab, hosts bind and never fork. Whatever §12.1 decides, there is exactly one source of record for a sample and the other layer is a window onto it. **The two-truths risk is closed** (§12.14): the chain is the walk and the mini window is a downsample of the same generations, so a past day has one series and one spot.

**Mike:** no member identity in whatever holds the cache; terms confirmed before stored snapshots are served back.

**Echo:** the tells — replay, what-if, and whatever §12.6 decides — must share one seat and one grammar. If red is drawn on the viewport and the replay frame on the panel, they are not the same size and do not read as the same seat.

**Victor / Whiskey / Yankee:** no lineage frame is in play in this document.

---

## 16. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.5** | 2026-08-26 | **The combined spec.** Folds the Analyzer Time Machine (Day) document at **v0.1.8** into the replay chain at **v0.4**. Both §0 blocks verbatim; no ATM-* or TMI-* ID renumbered. Day surface extends from Analyzer to all three hosts. Chrome placement, mini day window, Basic/Enhanced, walks, Reset, and ATM-O1 folded in whole. The banked chain corpus **seats the vol plane ATM §3.4 deferred** (FI-036). Stochastic download supersedes left-to-right prefix fill (ATM-D3, ATM-H4 amended). Advisor duplicate `NO DAY` retired for the existing **NO PATH**. **Two new Coach-versus-Coach contradictions raised, neither resolved: the Algo alert under a playhead (§12.5) and the glow against silent promotion (§12.6).** |
| **v0.7.2** | 2026-08-27 | **Leftover pass, no new rulings, no law added or retired.** The body had fallen a day behind its own rulings. **§12 rewritten as the record of six answers** rather than a reprinted interview a builder would implement as questions. **§14 no longer opens with "resolve §12.1–12.6"** — it begins at Phase 2. **Four acceptance and as-built items corrected off the retired glow**: AT-TM-C2, AT-TM-C7, the scope bullet, and the as-built glow-token row now speak of the watermark, with What-if's red named as the only glow. **TMI-40** extended to the watermark and the badge. **12.4 restated as confirm-on-disk**, answered by the archive cadence pass rather than by ruling, and not a Phase 2 blocker. **12.15 Basic marked explicitly non-blocking** so the held ATs do not read as a seventh gate. **One-line law now names the tell.** Echo's Phase 3 line carries the watermark, the badge, sizing, and reduced-motion. |
| **v0.7.1** | 2026-08-27 | **The tell changes; no ruling changes.** §0 gains item 57: **Time Machine has no glow.** The glow is What-if's exclusively. Time Machine's tell is a **REPLAY watermark** on the canvas (TMI-25) — all three hosts, behind the plot layer, non-interactive, and in no P&L colour, because a large green mark over a tent is a profit signal. With the badge on rehearsal cards (TMI-81) it is the same mark at two scales, so the surface and the objects born in it speak one language. Replay and What-if now share no signal and can both show at once. §0.53's green-for-both is superseded by §0.57 and recorded, not removed. |
| **v0.7** | 2026-08-27 | **All six blocking opens ruled; §0 gains items 48–56.** **Cache browser-side** — no server film module, one day held, switching re-downloads (TMI-4, TMI-79; TMI-5/56/58–63 retire). **Capture always on** — no Record control, on a week of evidence (TMI-65). **Green for all scrubbing**, blue retired, red still What-if (TMI-25). **Rehearsal objects** — alerts and positions may be built under a playhead, badged with a counter-clockwise curved arrow, ticking on the replay clock, never reaching the store or Trade Log, disposed with an announcement (TMI-80, TMI-81; ATM-A1 resolved, TMI-34 superseded, TMI-77 ruled). TMI-67 holds because nothing persists, and its **reason is recorded as a browser-era limit** with the desktop path named (§0.50, §0.51). **Three transcript readings confirmed** (§0.49). Cadence answered by the archive stats pass, not by ruling. **Phase 5 stamp candidate.** |
| **v0.6.1** | 2026-08-27 | **Fold-leftover pass, no new rulings, no law added or retired.** v0.6 folded A1 but left five places still describing the retired 1-minute source: the scope bullet, the §1 job table, the `Path` vocabulary entry, **ATM-O1**'s opening-price rule, and the `NO PATH` definition. All now read from the corpus. **AT-TM-C4** no longer keeps a 1-minute fallback for an uncovered day — an uncovered day is not selectable and names `NO PATH`. **AT-TM-C6 held pending §12.15**, alongside AT-ATM-9 and AT-ATM-19, since it asserts a rule whose premise is gone. §14 and the India bench note no longer speak of §12.14 as open. |
| **v0.6** | 2026-08-27 | **Amendment A1 folded.** **TMI-45 corrected** — the envelope carries expiration, spot, and full greeks but **not** the wing band; wings are day-level, from coverage, for every day already collected. New **TMI-78** records that the ratcheting band makes the day figure the close-of-session width, deliberately not surfaced, with an Echo sweep for any existing wings readout. **ATM-B1, P1, D1, D2 retired as a past-day source** — the chain is the walk, and **ATM-H2**'s mini window downsamples from it: one source of spot, closing §12.14. **ATM-E4** premise corrected: Basic's GEX-off was an honesty rule with no remaining reason, so keeping it is a product choice. Calendar states, seam, and coarse pass carry measured numbers from 2026-08-25 SPX. **No member-facing change. Six blocking opens untouched.** |
| **v0.5.1** | 2026-08-26 | Correction pass, no new rulings. Four cross-reference sets in v0.5 pointed at the wrong open: the Algo collision (body §12.7 → **§12.5**), the glow (body §12.9 → **§12.6**), the DL-400 cadence (body §12.6 → **§12.4**), and the status line (body §12.12 → **§12.9**). Grok's v0.5 review inherited the error rather than catching it. One clarifying note folded into §12.15 on why Basic exists. No law text changed, added, or retired. |
| v0.4 | 2026-08-26 | Name ruling: the spec and surface are Time Machine; the day-of case is a mode contrived for performance with no member-facing name. |
| v0.3.1 | 2026-08-26 | Correction pass: section numbering realigned; TMI-K2 restored; TMI-4 version label fixed. |
| v0.3 | 2026-08-26 | The collapse: one surface, one scrubber, date always present with today pre-selected, silent promotion. Sticky scrubber, no writes, decay thins interval count only, density invisible, past-day corpus with stochastic infill, browser-side cache against OPF's trading date. |
| v0.2 | 2026-08-26 | Film to a server-side per-book Redis cache; decay replaced the slider; Record opt-in; whole-panel frame; Surface in-program. |
| v0.1.1 · v0.1 | 2026-08-26 | Advisor revision; original replay spec. |
| **Day document, folded here** | | **v0.1.8** seat/fractal framing · **v0.1.7** Reset (DL-499) · **v0.1.6** Leave Time Machine (DL-494) · **v0.1.5** position then Algo (DL-492) · **v0.1.4** Spot and Autofit X to the day's open (DL-491) · **v0.1.3** start-time picker removed · **v0.1.2** speeds 10/20/50 · **v0.1.1** 390 candles, simple or TPO (DL-487) · **v0.1** OnDemand Time Machine (DL-486) |

**One-line law:**
**One surface, one scrubber, one date control with today pre-selected — you are in replay the moment the scrubber is up, and the only thing that changes when you pick another date is where the data is derived from, because you cannot archive and replay at the same instant; the scrubber follows you across Analyzer, Heatmap, and Surface; the transport sits right of Autofit with the day window in the upper-right corner and a draggable scrubber in it; a past day binds spot and scale to that session's open and walks close to close or follows the TPO path; today's data thins by dropping whole snapshots and never by hollowing one out; a past day arrives coarse-then-sharp with an indicator saying how far along it is; the panel says REPLAY on its face and anything born there wears the same mark and dies with it; and the member is never told which derivation they are looking at, nor which wing band produced the strikes, because both are how the data was made rather than what it says.**

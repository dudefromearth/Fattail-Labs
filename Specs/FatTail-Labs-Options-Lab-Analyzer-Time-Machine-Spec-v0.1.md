# FatTail Labs — Options Lab Analyzer Time Machine Spec v0.1

**Status:** DRAFT — Coach 2026-08-20. **v0.1.6** **Leave Time Machine** exits. **v0.1.5** add position after the day, then Algo. **v0.1.4** Spot field + Autofit X = session **open**. **v0.1.3** no start-time picker. **v0.1.2** speeds 10× / 20× / 50×. **v0.1.1** 390 candles/closes · close-to-close **or** TPO path. Not BUILD AUTHORITY until Coach Phase 5.  
**Type:** Product Spec — Analyzer **Time Machine** (calendar day replay of underlier price and time).  
**Short name:** **AZ-ATM**  
**Route:** `/app/options-lab/analyzer`  
**Filename:** `FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md`

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [Analyzer Spec v0.2.1](./FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Host surface · six buckets · Autofit strip · GEX / Probability |
| [What-If T/σ Spec v0.1](./FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md) | **What-if** = ad-hoc time · vol · spot %. This spec does **not** rename or replace those knobs. |
| [AZ-ALGO v1.0.1](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) | Demo may point at this clock (price + time of the downloaded day) |
| [3D Surface App Spec v0.1.8](./FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md) §4.6 | Surface **Time machine** = snap rebind of listed-leg IV. **Not this spec.** Do not collapse the two. |
| OT-EF / **DL-309** | Representable or named state. Never invent a print or a package debit. |
| Arch **28** | One market WebSocket. **No client Massive.** Day download is a **server** fetch. |
| Human Interface Spec v1.0 | Dark-pinned tokens · ≥44pt hits · no emoji chrome |
| North Star v1.2 | Process outcomes only. **No profit claims.** |

**Does not:** MiniTwo until asked · Tradier / close / orders · Surface snap-rebind Time machine · a second market WebSocket · copying MSC or thinkorswim code · inventing 1-minute prints · shipping vol from full chain snaps in Basic.

**Review protocol:** findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion). Coach Content Law: nothing in §0 is removed.

---

## 0. Coach intent (do not drop)

Verbatim Coach, this thread, preserved in order:

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
11. Primitive plane (same session, earlier): **simple price and time for now; later vol from full chain-snapshot days.** Point the Algo at that day. Speeds **10× / 20× / 50×**. Controls **start / pause / stop**.
12. **Each day will have 390 candles or closes. The replay can do simple move from close to close or a more complex download of TPO data and follow the path.**
13. **The spot price and price scale need to match the beginning of the day's chosen opening price.**
14. **The position can be added afterwards. The algo alert is created, just like real life.**
15. **The clear button should be called Leave Time Machine.**

Tango / Hotel / Echo / India notes sit in **§14** beside this text. They do not delete it.

**Beside (not a deletion):** cash RTH 09:30–16:00 ET is **390** one-minute prints — Coach’s count. Index last trade **16:15 ET** is fifteen extra minutes when that product actually prints; do not pad a 390-session with invented bars, and do not silently “correct” 390 to 405. Extra prints, if they exist, append. Short sessions (early close) have **fewer** than 390 — named, not filled.

---

## 1. Job

**Time Machine** is the Analyzer’s **OnDemand-class day replay**: the member picks a **calendar session**, the system **downloads that day’s minute-granular underlier path**, the member picks a **start time**, then **plays the day** with video controls while the risk graph (and Demo Algo, when on) walk **price and time** of that day.

It is **not** What-if. What-if remains the inspector’s **ad-hoc** Time / Spot% / Vol knobs.

| Seat | Job | Clock |
|------|-----|-------|
| **What-if** | Ad-hoc change to **time, spot, and vol** on the live (or held) sheet | Member sliders |
| **Time Machine** | **Pick a day and replay** it | Downloaded 1-minute path + playhead |

**Basic** Time Machine: price + time of the underlier that day. Probability **off**. GEX **off**.  
**Enhanced** Time Machine: same replay, and the member **may** engage GEX and Probability.  
**Later plane (not Basic):** vol from **full chain snaps** collected for that day — named, not interpolated as last-minute gold.

**Walks (Coach — two legal replays):**

| Walk | What the playhead does |
|------|------------------------|
| **Simple** | **Move from close to close** on the day’s **390 candles or closes**. |
| **TPO** | **More complex:** download **TPO** data for that day and **follow the path**. |

Default v1 walk is **simple** close-to-close. TPO is specified, not dropped.

---

## 2. Vocabulary (do not collide)

| Name | This spec | Not this spec |
|------|-----------|----------------|
| **Time Machine** | Analyzer OnDemand day replay (this document) | Inspector What-if knobs |
| **What-if** | Ad-hoc time · spot · vol (Analyzer §1.11 · AZ What-If T/σ) | Must **not** be labeled Time Machine |
| **Surface Time machine** | Snap rebind of listed-leg IV at clock \(t\) (Surface App Spec §4.6) | Analyzer 1-minute underlier replay. **Hero walk for 3D package truth** stays on Surface. AZ-ATM Basic does **not** claim last-minute package IV. |
| **AZ-TM-*** IDs | Belong to the **What-if T/σ** spec | Do not reuse for this replay. This spec uses **ATM-*** |

Analyzer suite map **bucket 4 “Time machine”** now has **two seats**: What-if (ad-hoc) and Time Machine (replay). The inspector chrome for knobs stays **What-if** (TM-A1 stands). Time Machine is **new chrome** on the viewport strip + canvas corner.

---

## 3. Modes

### 3.1 Basic (v1 ship shape)

| Law | Detail |
|-----|--------|
| **ATM-B1** | Path is **underlier price vs time**. A full cash session is **390 candles or closes** (1-minute). Replay default: **simple move from close to close**. |
| **ATM-B2** | **GEX off. Probability off.** Inspector switches forced off and **disabled** while Basic is engaged. Do not leave a lying overlay. |
| **ATM-B3** | Member GEX / Probability prefs are **remembered** and **restored** when Time Machine exits. |
| **ATM-B4** | No chain-snap vol. What-if **Vol** may still apply if What-if Enable is on (ad-hoc σ). Time Machine owns **spot and session time**. |
| **ATM-B5** | Named holes, never a fake day: **WAITING** (download) · **NO PATH** · **NO MARKS**. |

### 3.2 Enhanced

| Law | Detail |
|-----|--------|
| **ATM-E1** | Same day (**390** candles/closes), same transport, same mini chart. Walk may be simple or TPO. |
| **ATM-E2** | Member **may turn GEX and Probability on**. They are allowed, not required. |
| **ATM-E3** | Enhanced is **not** Surface snap-rebind. Package IV still follows the live/held OPF generation unless a later snap-vol plane is seated. |
| **ATM-E4** | Chrome names the mode (**Basic** / **Enhanced**) so the member knows why GEX/Probability are locked or free. |

A control (segment or equivalent) selects **Basic** vs **Enhanced**. Default **Basic**.

### 3.3 Two walks: close-to-close and TPO path

**ATM-P1.** Each downloaded day is a session of **390 candles or closes** when the cash session is full (09:30–16:00 ET). The mini chart and scrubber domain are those prints (plus any honest extra index minutes — §0 beside). Do not invent bars to force 390.

**ATM-P2. Simple replay:** the playhead **moves from close to close**. Spot on the tent is the close (or mid, if the source is marks) of the current minute. No intra-bar path. This is the Basic default.

**ATM-P3. TPO replay:** a **more complex download** of **TPO** (Time Price Opportunity) data for that day. The playhead **follows the path** — the sequence of time-price opportunities — not only the 390 closes. Mini chart may still show the 390 candles/closes as the day skeleton; the playhead traces TPO.

**ATM-P4.** Member can select the walk when TPO is present. If TPO is missing → named hole **NO TPO**; simple close-to-close remains available. Never fake a TPO path from OHLC.

**ATM-P5.** TPO grain (tick path vs 30-minute letters vs other) is **open for Coach** (§13). Until seated, “follow the path” means the downloaded TPO sequence in time order, un-interpolated.

### 3.4 Later vol plane (flagged, not Basic)

Full **chain-snapshot** days (SSR `live_capture` / successor) supply **vol** so the tent is last-print honest at \(t\). Until that plane is seated, Time Machine **must not** badge itself as last-minute package truth. **FI-036**.

---

## 4. Member flow (normative)

```text
Calendar (NY session date)
    → download 1-minute day (server)
        → mini chart fills as bars arrive
    → pick start time
    → video controls: Start / Pause / Stop · 10× / 20× / 50×
    → playhead walks the risk graph (spot + time)
    → Demo Algo, if Live+Demo, ticks on that clock
```

### 4.1 Calendar

**ATM-C1.** A **calendar control** selects the day to download. America/New_York session date. Not a hidden weekday list as the only picker.

**ATM-C2.** One selected day → one download for the **suite symbol** (SPX, etc.). Changing symbol or day starts a new download and clears the previous path.

**ATM-C3.** Weekends / holidays / empty sessions: download may complete with **NO PATH** (named). Do not invent prints.

### 4.2 Download

**ATM-D1.** Granularity is **1 minute** (not 5-minute as a substitute). A full cash day is **390** candles or closes. Close (or mid, if the source is marks) is the **simple** playhead spot. OHLC on the bar, when the source has it, feeds the mini **candle** picture.

**ATM-D1b.** **TPO download** is a second payload for the same calendar day when the member (or Enhanced/TPO walk) asks for it. Progressive fill of the mini chart still follows the **390** candles/closes as they land; TPO path may stream after or alongside. Missing TPO ≠ failed day.

**ATM-D2.** Fetch is **server-side** (Massive aggs and/or SSR marks JSONL). The browser does **not** call Massive. Arch 28.

**ATM-D3.** **As the day downloads, the member can see it fill the mini chart.** Progressive paint: bars appear left-to-right (session open → last trade) as they land. Do not wait for the last bar to show an empty box. A determinate or count readout (**n** minutes) is allowed; a silent blank is not.

**ATM-D4.** While downloading: play is off; scrubber may track the filled prefix or stay at start; named **WAITING** if nothing has landed yet.

**ATM-D5.** Source label on the HUD: `ohlc_1m` · `ssr_marks` · proxy only if universe proxy is the honest feed, labeled (OC2 — never silent SPY→SPX).

### 4.3 Playback origin

**ATM-S1.** Playback starts at the **first downloaded print**. There is **no** start-time picker (Coach removed it). The mini-chart **scrubber** still seeks.

**ATM-S2.** Stop returns the playhead to the first print, priced at that session’s **open** (**ATM-O1**). Stop does **not** exit Time Machine.

**ATM-S3.** **Leave Time Machine** (that exact label — not Clear) exits: day cleared, playhead gone, HUD hidden, blue glow off, Spot and Autofit X return to live, GEX / Probability prefs restore (**ATM-B3**). Changing symbol also exits. Clearing the date field is still lawful; the named control is the member path.

**ATM-O1.** On day load (and on Stop): Analyzer **Spot** field and Autofit **X scale** bind to that day’s **opening price** — first 1-minute bar `o` when the path has OHLC; otherwise the first print. Live underlier mid does **not** keep the field or the scale. Listed strikes stay in view so the tent is not clipped. Playhead ticks move the sim-spot indicator, not Autofit (**ATM-K4**). Simple walk after Play still steps **close to close** (**ATM-K1** / **ATM-P2**).

**ATM-A1.** The book may be **empty** when the day loads. The member **adds the position afterwards**, then **creates the Algo alert** — same sequence as a live session (session on the clock → enter → attach the trail). Position Builder ATM, Algo eligibility, and Demo ticks use the **playhead** (session open when parked). Creating Demo while Time Machine is on does **not** turn What-if on.

### 4.4 Video controls (thinkorswim OnDemand-class)

| Control | Law |
|---------|-----|
| **Start** (Play) | Play from the current playhead (start time, pause position, or scrubber). If the playhead is at the last bar, Start again from the chosen start time. |
| **Pause** | Freeze. Playhead and tent stay. |
| **Stop** | Pause + return playhead to the **session open** (first print, priced at bar `o` — **ATM-O1**). Does **not** exit. |
| **10× / 20× / 50×** | Wall elapsed × speed = session elapsed. Changing speed while playing does **not** jump the playhead. |
| **Leave Time Machine** | Exit. Label is **Leave Time Machine**, not Clear (**ATM-S3**). |

No 1× required in v1 (Coach specified 10 / 20 / 50). A later 1× is **FLAGGED**, not silently added as law.

---

## 5. Chrome (viewport)

The Time Machine **does not** live in the What-if inspector group.

### 5.1 Dark strip above the canvas

Existing Analyzer law: dark strip above the risk canvas; Autofit **≥44pt** (OD-AZ1).

| Placement | Law |
|-----------|-----|
| **Strikes/in** (admin Autofit pad) | **Left of Autofit.** No longer `ml-auto` on the far right. |
| **Autofit** | Stays. Hit ≥44pt. |
| **Time Machine** | **There** with Autofit: **to the right of Autofit** in the same dark strip. |
| **Video controls** | **In the dark area above the canvas** — Start / Pause / Stop · 10× / 20× / 50× · calendar. Not inside the plot. No start-time field. |

Calendar and start-time sit with the video controls in that strip (OnDemand transport). Compact, 44pt hits, dark-pinned tokens.

### 5.2 Mini day window (upper-right canvas corner)

**ATM-H1.** When a day is selected (download started or loaded), a **small day window** appears in the **upper-right** of the **canvas** (inside the plot frame, that corner the slider used to occupy).

**ATM-H2.** The window shows **where in the day we are**:

- A small **day candle chart or line chart** of the downloaded path.
- A **scrubber**. The **scrubber is draggable**.
- Playhead mark on the mini chart (vertical or thumb) matching the transport.

**ATM-H3.** Dragging the scrubber **seeks**. Playhead, tent spot, and Demo clock jump to that sample. Playing may continue from the new time (rebase; no jump-on-speed). Pause stays paused.

**ATM-H4.** As download fills (**§4.2 ATM-D3**), the mini chart **grows** with arriving minutes. Scrubber domain is the filled prefix until complete, then the full session.

**ATM-H5.** Hide the window when no day is selected (Time Machine idle). Stop does **not** hide it. **Leave Time Machine** does.

**ATM-H6.** The mini chart is **orientation**, not a second SoR. It must not invent candles the download does not have: OHLC present → candles allowed; marks-only → **line**. Mixed: line of spots is always legal.

### 5.3 Inner-edge glows

| Mode engaged | Viewport inside edge |
|--------------|----------------------|
| **Time Machine** (day selected / replay) | **Blue** blurred inner frame (inset glow / blurred box on the inside edge) |
| **What-if** Enable, Time Machine **not** engaged | **Red** inner glow |
| Both | **Blue wins.** Time Machine is the replay clock. |
| Neither | No sim glow |

Glow is **paint only** — `pointer-events: none`; does not steal Autofit, handles, or the scrubber.

Named test ids (implementation may match): `analyzer-viewport-glow` with `data-glow="timemachine" | "whatif"`.

---

## 6. Clock and the tent

**ATM-K1.** While Time Machine has a playhead: **spot** = simple **close** of the current minute, **or** the current **TPO path** price when that walk is on; **as-of clock** = that sample’s `t_ms` (America/New_York session). OPF τ / last-trade remaining use **that** clock, not wall-clock now. Simple walk does **not** interpolate between closes.

**ATM-K2.** What-if Enable is **not** required to run Time Machine. They are different seats.

**ATM-K3.** If both are on: Time Machine owns **spot and time**. What-if **Vol** may still offset (Basic has no snap vol). What-if Time and Spot% sliders do **not** fight the playhead (ignored for S and t while TM is engaged, or disabled — Echo chooses; law is no double clock).

**ATM-K4.** Autofit does **not** run on every playhead tick (same as What-if / live spot — Analyzer Autofit · AT-AF-7). Member hits Autofit if they want a refit.

**ATM-K5.** Sim spot indicator on the risk graph follows the playhead (same grammar as What-if sim spot, driven by the day).

**ATM-K6.** Session last trade for **Algo decay EoD** is **that day’s** last trade (index **16:15 ET**, equity **16:00 ET**), not today’s wall EoD.

---

## 7. Algo Demo

When an Algo alert is **Live** and **Demo**:

| Clock | Use |
|-------|-----|
| Time Machine playhead present | Tick on **replay spot** and **replay `t_ms`** |
| Else What-if Enable | Existing FI-033 / **DL-485** (Spot / Time / Vol sliders) |
| Else | No Demo tick |

Demo does **not** flatten. No LLM fire from the transport.

---

## 8. Data & holes

| Hole | When | Member sees |
|------|------|-------------|
| **WAITING** | Download in flight, no bars yet | Mini chart empty frame + filling affordance; named state |
| **NO PATH** | Day has no 1-minute bars (holiday, future, provider empty) | Named. Play off. |
| **NO MARKS** | SSR marks preferred but missing; 1m OHLC also empty | Named. |
| **NO TPO** | TPO walk requested; TPO payload missing | Named. Simple close-to-close still offered. |
| **PROXY** | Path is a labeled proxy series | Label. Never silent SPY as SPX. |

Do not interpolate across a missing minute as if it printed. **Simple** walk: playhead **steps close to close**. Playhead holds the last real close until the next real close. **TPO** walk: follow downloaded TPO prints only — do not synthesize a path from OHLC.

---

## 9. Ideas inventory (Phase 0 — nothing omitted)

| Idea | Status |
|------|--------|
| thinkorswim OnDemand-class replay | **IN-SCOPE** |
| Calendar control selects the day to download | **IN-SCOPE** · **ATM-C1** |
| Download **minute-granular** day (1-minute) | **IN-SCOPE** · **ATM-B1** |
| Mini chart **fills as the day downloads** | **IN-SCOPE** · **ATM-D3** |
| Pick start time | **IN-SCOPE** |
| Video controls Start / Pause / Stop · 10× / 20× / 50× | **IN-SCOPE** |
| Transport in **dark strip above the canvas**, **right of Autofit** | **IN-SCOPE** |
| **Strikes/in left of Autofit** | **IN-SCOPE** |
| Mini day window **upper-right canvas corner**; candle or line; **draggable scrubber** | **IN-SCOPE** |
| Blue inner glow Time Machine; red inner glow What-if | **IN-SCOPE** |
| What-if = ad-hoc T/S/Vol; Time Machine = pick a day and replay | **IN-SCOPE** |
| Basic: GEX + Probability **off**; Enhanced: **allow** GEX + Probability | **IN-SCOPE** (both modes specified; Juliet may sequence Basic first) |
| Point Algo Demo at the day | **IN-SCOPE** |
| Primitive price + time now | **IN-SCOPE** Basic |
| Each day **390 candles or closes** | **IN-SCOPE** · **ATM-P1** |
| Simple replay: **close to close** | **IN-SCOPE** · **ATM-P2** · Basic default |
| Complex: download **TPO** and **follow the path** | **IN-SCOPE** · **ATM-P3** (sequence after simple if needed; not dropped) |
| Vol from full chain-snapshot days | **FLAGGED** · later plane · **FI-036** · not Basic |
| 1× speed | **FLAGGED** (Coach specified 3/10/20 only) |
| Surface snap-rebind as Analyzer Enhanced | **OUT** — different spec (Surface §4.6). Do not pretend. |

---

## 10. Acceptance (AT-ATM)

| ID | Criterion |
|----|-----------|
| **AT-ATM-1** | Calendar is the day picker. Choosing a NY date starts a 1-minute download for the suite symbol. |
| **AT-ATM-2** | Mini chart in the **upper-right of the canvas** **fills as bars arrive** (not only at completion). |
| **AT-ATM-3** | After path exists, Start / Pause / Stop + 10× / 20× / 50× live in the **dark strip above the canvas** with the calendar. **No** start-time picker. |
| **AT-ATM-4** | **Strikes/in** is **left of Autofit**. |
| **AT-ATM-5** | Playhead at 10×: one wall-second advances ten session-seconds. Speed change does not jump. |
| **AT-ATM-6** | Scrubber drag seeks; tent spot and clock match the sample. |
| **AT-ATM-7** | Basic engaged → GEX overlay off and switch disabled; Probability off and switch disabled. Exit restores prefs. |
| **AT-ATM-8** | Enhanced engaged → GEX and Probability **can** be turned on. |
| **AT-ATM-9** | Time Machine engaged → **blue** inner viewport glow. What-if only → **red**. Both → blue. |
| **AT-ATM-10** | What-if sliders still exist and still mean ad-hoc T/S/Vol. They are not labeled Time Machine. |
| **AT-ATM-11** | Empty/holiday day → **NO PATH**, no invented candles. |
| **AT-ATM-12** | Demo Algo Live uses playhead spot + `t_ms` when TM is engaged. |
| **AT-ATM-13** | Browser network: no Massive host from the client on this path. |
| **AT-ATM-14** | Autofit does not fire on playhead ticks. |
| **AT-ATM-15** | A full cash session download is **390** 1-minute candles or closes (not 78 five-minute bars). Short session → fewer, not padded. |
| **AT-ATM-16** | Simple walk: tent spot steps **close to close** only. |
| **AT-ATM-17** | TPO walk: playhead follows downloaded TPO path. Missing TPO → **NO TPO**, simple walk still works. |
| **AT-ATM-18** | Choosing a day sets the yellow **Spot** field and Autofit **X** center to that session’s **open** (first bar `o`, else first print). Live SPX does not keep the scale. Playhead ticks do not Autofit. |
| **AT-ATM-19** | Day may load with an empty book. Add a fly **after** the day is on the clock; Create Alert uses that playhead for ATM / OTM eligibility; Demo defaults on and ticks the TM day (does not force What-if). |
| **AT-ATM-20** | A control labeled **Leave Time Machine** (not Clear) exits: day empty, glow off, HUD gone, live Spot/scale. Stop does not exit. |

---

## 11. Out of scope

- MiniTwo / production deploy until Coach asks  
- Tradier, flatten, broker orders  
- Copying thinkorswim or MSC source  
- Client Massive  
- Claiming last-minute **package** IV in Basic  
- Replacing Surface Time machine  
- Rewriting What-if T/σ domain (AZ-TM-* stays)  
- Volume Profile overlay (still FI-031)

---

## 12. As-built (check first — not law)

Partial dogfood exists and is **not** this spec:

| As-built | Honesty |
|----------|---------|
| `algo_replay` route + `algoDayReplay.ts` cursor | Sketch toward a path loader. Fallback was **5-minute** OHLC — **too coarse** vs ATM-B1. |
| What-if inspector `timeMachineEnabled` | **What-if Enable**, misnamed in code. Chrome already says What-if. Do not bless the identifier as Time Machine. |
| Autofit centered overlay; Strikes/in `ml-auto` right | **Wrong vs §5.1.** Spec moves Strikes/in **left of Autofit**. |
| No calendar, no mini chart fill, no glows, no Basic/Enhanced | Not as-built. |

---

## 13. Open for Coach (not silently decided)

1. **Basic vs Enhanced control:** strip segment vs a single Advanced checkbox. Default Basic.  
2. **1×** later or never.  
3. Whether Enhanced ever **becomes** Surface-class snap-rebind, or stays “overlays allowed on the 1-minute underlier path.” This spec says the latter until a later DL.  
4. **TPO grain** for “follow the path”: tick / second path vs classic 30-minute Market Profile letters vs another TPO feed. Not silently chosen.

Everything else in §0 is **law**, not an open.

---

## 14. Reviewer notes (empty until Phase 2–4)

India / Echo / Tango / Hotel / Victor write **beside** §0. They do not delete Coach text.

---

## 15. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v0.1** | 2026-08-20 | Coach OnDemand Time Machine: calendar download, 1-minute fill of mini chart, start time, video controls in the dark strip right of Autofit, Strikes/in left of Autofit, upper-right mini chart + draggable scrubber, blue/red inner glows, Basic (GEX/Prob off) vs Enhanced (allow), What-if remains ad-hoc. **DL-486**. |
| **v0.1.6** | 2026-08-20 | Exit control labeled **Leave Time Machine** (not Clear). Stop still does not exit. **ATM-S3** · **DL-494**. |
| **v0.1.5** | 2026-08-20 | Position **after** the day: add the fly, then create the Algo — live-session sequence (**ATM-A1**). **DL-492**. |
| **v0.1.4** | 2026-08-20 | **Spot** field + Autofit **X** bind to the chosen day’s **opening price** (bar `o`, else first print). Live underlier does not keep the scale. **DL-491**. |
| **v0.1.3** | 2026-08-20 | Start-time picker **removed** (Coach). Play from first print; Stop returns there; scrubber still seeks. |
| **v0.1.2** | 2026-08-20 | Replay speeds **10× / 20× / 50×** (Coach). Start time = playback origin on the downloaded day. |
| **v0.1.1** | 2026-08-20 | Each day **390 candles or closes**. Replay: **simple close-to-close** or **TPO download and follow the path**. **DL-487**. |

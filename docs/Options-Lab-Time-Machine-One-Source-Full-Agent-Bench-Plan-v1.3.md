# Options Lab Time Machine One Source — Full Agent Bench Plan v1.3

**Date:** 2026-08-29  
**Plan revision:** **v1.3**  
**Canonical filename:** `docs/Options-Lab-Time-Machine-One-Source-Full-Agent-Bench-Plan-v1.3.md`  
**Supersedes:** plan **v1.2** (against spec v0.2.1; does **not** cover TMI-91…95 — do not stamp it)  
**Owner (orchestration):** Juliet  
**W0 artifact:** [`agents/go/TMOS-W0.md`](../agents/go/TMOS-W0.md)  
**Board:** [`agents/p-options-lab-tm-os/`](../agents/p-options-lab-tm-os/)  
**Governance:** `agents/bench/doctrine.md` · `AGENTS.md` · spec-create-review-workflow

**Law Delta reads:**

| Doc | Role |
|-----|------|
| Spec **v0.4 BUILD AUTHORITY** | [`Specs/FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_4.md`](../Specs/FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_4.md) — Coach GO SPEC 2026-08-29 |
| Parent **v0.7.4** | [`Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md`](../Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md) — still binds where v0.4 does not supersede |
| Parent **SO-AR v0.8 + A1 + A2_1** | today retrieve is **in** (TMI-85). Marks **read** is A2. This GO **consumes** A2 when it lands. **It does not build a marks route.** |

Juliet does not invent WHAT. VIX does **not** come back as an open question; it is ruled at **§0.11** (TMI-94 · TMI-95). **TMI-96** is positions dark, not hidden — not TMI-92, not TMI-95. Named hole is **TMI-93**.  
Delta: **PASS / FAIL / BLOCKED**, never waived.

**No product code until Coach stamps this plan v1.3 on `TMOS-W0.md` and W0-G PASS.** Spec BUILD AUTHORITY is already granted. The plan is the remaining stamp.

---

## 0. Mission

One source for every date including today. Snapshot at raise, not tail-append. Full download, no ladder. The hold is the desk — the generation is the chain on Analyzer, Heatmap and Surface, and whatever the live feed drove, the archive drives. A gap is a named hole, never a live value, and a collection defect raised to Coach. VIX travels from the marks tape. Positions are dark, not hidden, and light when the playhead reaches their entry.

```text
W0     India · Echo · Hotel · Tango review (no product code) → W0-G
W1     SO-AR: lift TODAY_LIVE; today retrieve; day_changed in-flight only
W2     One load path, one hold; snapshot; captureToday out of the TM hold; dispose seedTodayFromSession; Average stays
W3     The desk: TMI-91 chain · TMI-92 original feed · TMI-93 named hole · TMI-94/95 VIX from A2 marks (source travels) · TMI-96 dark not hidden
W4     Hold line + calendar today dotted
W5     Lima help + parent one-liners
W6     Kilo AT-TM-OS-1…13 + C11 dense day
W-G    Delta — C11 unusable is Coach, not a quiet pass
```

The v0.7.4 GO (`p-options-lab-tm`, W-G PASS) stays closed. Instant Replay / Day boards stay **PARKED**. A2 strip is a sibling. **Module lock:** A2 owns `ssr_archive_read.py` through **A2 W2-G**. TMOS W1 (`TODAY_LIVE` lift) starts only after that gate — one at a time, A2 first. TM does not bounce the dash and does not add `/api/marks`.

### Out of this GO (NX)

| ID | Out |
|----|-----|
| **NX-B** | Basic / Enhanced chrome. AT-TM-C6 **HOLD**. |
| **NX-TPO** | TPO walk. ATM-17 **HOLD**. |
| **NX-1X** | 1× speed. |
| **NX-FILM** | Any Labs `server/` replay cache / film module. |
| **NX-REC** | Record control. |
| **NX-GLOW** | Time Machine glow. What-if red untouched. |
| **NX-1M** | 1-minute past-day fetch. |
| **NX-IR** | Instant Replay as a member-facing name. |
| **NX-SLIDER** | Heatmap megabyte Cache slider (DL-612). Do not restore. |
| **NX-DECAY** | Browser decay ladder. Returns only if C11 + Coach say so — later packet. |
| **NX-APPEND** | Tail-append / chase-the-newest (TMI-88). |
| **NX-REFRESH** | A refresh / “get newer” control. Newer range is **Reset, then raise**. |
| **NX-AVG** | Breaking Width Fit Average while retiring `captureToday` as replay. |
| **NX-SEED** | Leaving `seedTodayFromSession` alive after W1. |
| **NX-MARKS** | Building a marks route. A2 owns that. Consume when it lands. |
| **NX-VIX-OPEN** | Bringing VIX retrieve back to Coach as an open question. |
| **NX-13A** | Answering §13a: dark-position **legs**; tap writing `generation.vix`; unnamed live-feed fields. |
| **NX-SF** | Spaces. Factory. MiniTwo until asked. Tradier. Client Massive. Second WS. StudioOne **dash bounce**. |

v0.7.4 KEEP extras stay KEEP: durable live algos skip while a playhead is up; To Trade Log hidden **and** refused.

---

## 1. Locked (FP)

| ID | Decision |
|----|----------|
| **FP1** | One source: StudioOne coverage · index · levelled fetch, **every date including today** (TMI-82). |
| **FP2** | Login / tab-open is not the left edge. Maximum time = what StudioOne holds (TMI-83). |
| **FP3** | One hold. Switch discards first. Reset drops the hold. No background replay film (TMI-84). |
| **FP4** | Today retrieve is **in**. `TODAY_LIVE` is not a fetch refusal (TMI-85). Growing is selectable, not grey. |
| **FP4b** | **`day_changed` only while a fetch is in flight.** Completed hold never re-hashes (TMI-85 · TMI-88). |
| **FP5** | The tab holds a **buffer** so 50× is a lookup. Not a second source. Not a Labs film (TMI-86). |
| **FP6** | Date on today without a playhead is **live** (TMI-64). Raise on today **downloads** StudioOne’s today as it stands, parks on newest print **in that snapshot** (TMI-87). |
| **FP7** | **Snapshot, not append** (TMI-88). Newer range = **Reset, then raise**. No refresh control. |
| **FP8** | Inspector line names the **actual first downloaded print**, as what the archive **holds** (TMI-89). |
| **FP9** | **Full download** (TMI-90). Coarse-then-infill is progress, not savings. C11 measures a real dense session. Unusable number → Coach before ship. |
| **FP10** | Live desk stays on the socket (Arch 28). Replay does not. |
| **FP11** | Browser never calls StudioOne. Labs proxy only. Collection outranks reads. |
| **FP12** | Occupancy is **one downloaded day** or none. `captureToday` as today-replay **fails W2-G**. `seedTodayFromSession` leftover after W1 **fails W2-G**. |
| **FP13** | **Width Fit Average survives** (AT-TM-OS-9 · TMI-29). |
| **FP14** | **The hold is the desk** (TMI-91). Analyzer, Heatmap, Surface paint the held generation as the chain. A live-socket chain beside a playhead is a fail. |
| **FP15** | **The original feed** (TMI-92). Symbol, VIX, positions, heatmap tiles rebind from the hold. *Whatever the original feed was driving.* Not the named-hole law (that is TMI-93). Not dark-not-hidden (that is TMI-96). |
| **FP16** | **Positions dark, not hidden** (**TMI-96**). Light when the playhead reaches their entry. Own ID. **§13a item 1:** no legs until it lights. |
| **FP17** | **No live-read of a hole** (**TMI-93**). Named hole. Collection defect raised to Coach. Never a live value on a replayed panel. |
| **FP18** | **VIX comes along** (TMI-94 · §0.11). Marks tape, nearest-in-time. **`source` and `label` travel with the mid.** A replayed day carries the source it was captured with. **OS-13 = 2026-08-27 `massive_proxy_v1`.** **OS-14 = 2026-08-29 from 00:38:08 `massive_index_v1`.** Presenting proxy as native or native as proxy is a fail. |
| **FP19** | **Do not wait on `generation.vix`** (**TMI-95**). A packet that blocks VIX replay on that write **fails**. TMI-95 is the tape-read law, not positions-dark. |
| **FP20** | **Consume A2 marks.** Labs `GET /api/me/options-lab/archive/marks`. Same GAP grammar A2 locked (15 s floor). TM does **not** add `/api/marks`. W3 VIX is blocked until that retrieve returns 200. A fixture does not close OS-13 or OS-14. |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-0** | Coach stamps **this plan v1.3**. Spec v0.4 is already BUILD AUTHORITY. | W0-1 |
| **W0-2 India** | One source; snapshot; full download; desk (91–95); A2 consume not build; `seedTodayFromSession` named for W2; no Labs film; §13a not answered | W0-G |
| **W0-3 Echo** | Hold line; calendar today dotted; dark-not-hidden; no slider; no Instant Replay; VIX NO copy | W0-G |
| **W0-4 Hotel** | Named hole never live VIX/σ; tape ≠ envelope `vix`; rehearsal KEEP; late tap ≠ late login | W0-G |
| **W0-5 Tango** | Dark not hidden; light at entry; login is not a bound; archive-holds frame | W0-G |
| **W0-G** | Token stamped; four reviews; **no product code**; leftover boards PARKED | W1 |
| **W1-G** | Today retrieve 200 + snaps. No 409 `TODAY_LIVE`. `day_changed` in-flight only. No dash bounce | W2 |
| **W2-G** | One `loadTmDay`. Snapshot. `seedTodayFromSession` gone. Average lives. Fail-closed: live-socket film as replay; tail-append; two holds | W3 |
| **W3-G** | OS-10…15 characterized. OS-13 = 08-27 proxy source. OS-14 = 08-29 native source. OS-15 dark not hidden. Live VIX while playhead up = FAIL. Does not implement `/api/marks` | W4 |
| **W4-G** | Hold line real first print. Today dotted. No Instant Replay | W5 |
| **W5-G** | Help: one source, desk, VIX from tape, Reset-then-raise, no Instant Replay | W6 |
| **W6-G** | AT-TM-OS-1…**15** + C11. OS-1 live late-tab. OS-13 live 08-27 proxy. OS-14 live 08-29 native. Fixture closes neither. C11 unusable → not PASS without Coach | W-G |
| **W-G** | Fail-closed list below. **OS-1 live walk required. OS-13 and OS-14 live tape walks required.** | ship |

---

## 3. DAG

```text
W0-0 Coach stamps plan v1.3
  → W0-1 Lima sha1 + DL
  → W0-2 India ∥ W0-3 Echo ∥ W0-4 Hotel ∥ W0-5 Tango
  → W0-G
       → W1 SO-AR today retrieve → W1-G
            → W2 one load path / snapshot / dispose seed / Average stays → W2-G
                 → W3 desk (TMI-91…95, consume A2 marks) → W3-G
                      → W4 hold line + calendar → W4-G
                           → W5 Lima help → W5-G
                                → W6 Kilo OS-1…13 + C11 → W6-G
                                     → W-G
```

W1 is on the Labs reader. **Do not bounce the StudioOne dash.** W3 VIX waits on A2 marks retrieve being live; it does not bounce A2 and does not build the route.

---

## 4. Packets

Seeds under `agents/p-options-lab-tm-os/seeds/`.

### W0 — review (no code)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W0-0-coach-plan-stamp.md` | Coach | `TMOS-W0.md` W0-0 STAMP of **plan v1.3**. Spec v0.4 already BUILD AUTHORITY. |
| `W0-1-lima-hash.md` | Lima | sha1 of spec v0.4 + this plan; DL |
| `W0-2-india-parents.md` | India | TMI-82…95 vs v0.7.4; A2 consume not build; `seedTodayFromSession`; Average ring; §13a untouched |
| `W0-3-echo.md` | Echo | Hold line; dark-not-hidden; VIX NO; no Instant Replay |
| `W0-4-hotel.md` | Hotel | Named hole never live; tape ≠ `generation.vix`; OC5a |
| `W0-5-tango.md` | Tango | Dark not hidden; light at entry; login is not a bound |
| `W0-G-delta.md` | Delta | Ternary. No product diff. Plan stamped. |

### W1 — SO-AR today retrieve

Unchanged in job from plan v1.2. Law file is now v0.4. Files: `ssr_archive_read.py` + tests + proxy honesty. **No dash bounce.**

### W2 — one load path

Unchanged in job from plan v1.2: `loadTmDay` every date; snapshot; dispose `seedTodayFromSession`; Average stays. Fail-closed: live-socket film as replay.

**OS-1** is a live late-tab walk. A fixture does not close it.

### W3 — the desk (this is what v1.2 missed)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W3-1-charlie-desk.md` | Charlie | TMI-91 chain. TMI-92 original feed. TMI-93 named hole. TMI-94 VIX + **source travels**. TMI-95 do not wait on `generation.vix`. **TMI-96** dark not hidden, light at entry. **No `/api/marks` in the diff.** |
| `W3-2-kilo-desk.md` | Kilo | OS-10…15. OS-13 is 2026-08-27 `massive_proxy_v1`. OS-14 is 2026-08-29 `massive_index_v1`. OS-15 dark/light. |
| `W3-G-delta.md` | Delta | Fail-closed: live VIX while playhead up; wait on `generation.vix`; TM-built marks route; proxy day shown as native or native as proxy; hidden-not-dark; OS-13 or OS-14 closed on a fixture |

W3 is blocked until A2 marks retrieve is live (200 on 2026-08-27 through Labs). If A2 W5-GO has not happened, W3-G is **BLOCKED**, not a TM invention of `/api/marks`.

### W4 — hold line + calendar

Same job as v1.2 W3. Seeds `W3-1-charlie-echo-chrome.md` / `W3-2-tango.md` retargeted as **W4** in this plan (rename in the seed header when fired).

### W5 — Lima help

One source. Desk. VIX from the tape. Reset then raise. Dark not hidden. No Instant Replay.

### W6 — Kilo

| Seed | Agent | Done when |
|------|-------|-----------|
| `W5-1-kilo-ats.md` (fired as W6) | Kilo | **AT-TM-OS-1…15** + C11. OS-1 live late-tab. OS-13 08-27 proxy. OS-14 08-29 native. Fixture does not close 1, 13, or 14. C11 dense day. HOLD C6. |

### W-G — Delta final

Fail-closed: live-socket film as replay; live VIX / live Symbol / live position marks on a replayed panel; proxy day shown as native or native as proxy; `TODAY_LIVE` refusal; login-bounded today; megabyte slider; Instant Replay name; second hold; tail-append; refresh control; Average broken; `seedTodayFromSession` leftover; TM-built marks route; wait on `generation.vix`; answering §13a; C11 unusable without Coach; OS-1, OS-13, or OS-14 closed on a fixture only.

---

## 5. Acceptance (this GO)

| ID | Criterion |
|----|-----------|
| **OS-1** | **Live late-tab walk.** Tab opened after 13:00 ET, empty hold, raise today; left edge is StudioOne’s first print. A fixture does not close this row. |
| **OS-2** | Same retrieve path for today and a past covered date. |
| **OS-3** | Today index/fetch returns snaps when files exist. No 409 `TODAY_LIVE`. |
| **OS-4** | Switch discards first; Reset drops hold; no second blob. |
| **OS-5** | No megabyte slider; hold line = real first print; no Instant Replay. |
| **OS-6** | Today dotted when count > 0; uncovered grey + NO PATH. |
| **OS-7** | Snapshot: last sample unchanged after minutes of scrubbing; Reset then raise lengthens. |
| **OS-8** | Full download: held count matches index; fidelity reaches full. |
| **OS-9** | Width Fit Average still a window mean over live generations. |
| **OS-10** | **The hold is the desk.** Analyzer tent, Heatmap tiles, Surface listed-leg IV from the **same** generation. Live-socket chain while playhead up = fail. |
| **OS-11** | **The original feed (TMI-92).** Symbol, VIX, positions, heatmap tiles move with the hold. |
| **OS-12** | **No live-read of a hole (TMI-93).** Named hole for the whole time the playhead is up. Live VIX on that panel = fail. `generation.vix` null is **not** VIX NO. |
| **OS-13** | **VIX proxy day.** **2026-08-27.** Tape `source=massive_proxy_v1`. Replay carries that label. Never presented as native `I:VIX`. Never live. Tape gap = VIX NO. Blocking on `generation.vix` = fail. A fixture does not close this row. |
| **OS-14** | **VIX native day.** **2026-08-29** from `00:38:08.952423-04:00` (or a later native session). Tape `source=massive_index_v1`. Replay carries that source. Never assumed proxy. A fixture does not close this row. |
| **OS-15** | **Dark, not hidden (TMI-96).** Before entry: dark, present. At entry: lights. Vanished or lit-too-soon = fail. **§13a item 1 ruled:** no legs until it lights. |
| **C11** | Resident bytes of one fully infilled dense day. No ceiling. Unusable → Coach, not a pass. |
| **C6** | **HOLD.** |

---

## 6. Relationship to other boards

| Board | State |
|-------|--------|
| `agents/p-options-lab-tm/` | **W-G PASS** on v0.7.4. Closed. |
| `agents/p-options-lab-tmi/` | PARKED |
| `agents/p-az-atm/` | PARKED |
| `agents/p-studioone-archive-read/` | **A2 strip** W0-BA GO. Marks route is A2. TM consumes when it lands. Dash bounce is **Coach A2 W5-GO**, not this board. |
| This board | Plan **v1.3** stamp target. Spec v0.4 already BUILD AUTHORITY. |

---

## 7. §13a — still Coach (do not re-ask as product questions)

| # | Item |
|---|------|
| **1** | Whether a dark position shows its **legs** |
| **2** | Whether the tap writes **`generation.vix`** |
| **3** | Anything else the live feed drives that has not been named |

VIX **retrieve** is not on this list.

---

## 8. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.3** | 2026-08-29 | Against spec **v0.4 BUILD AUTHORITY**. TMI-91…**96**. TMI-96 = dark not hidden (not TMI-92, not TMI-95). OS-13 = 08-27 proxy. OS-14 = 08-29 native. Source travels. Stamp target. |
| **v1.2** | 2026-08-28 | Against v0.2.1. Does not cover TMI-91…95. **Do not stamp.** |

**One-line law:**  
**StudioOne for every date including today; snapshot at raise; full download; the hold is the desk; VIX from the marks tape with the source it was captured with; named hole never live; consume A2, do not build it; dark not hidden, light at entry (TMI-96); §13a stays Coach.**

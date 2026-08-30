# FatTail Labs — Options Lab Time Machine One Source Spec v0.1

**Status:** **DRAFT** — proposal. Not BUILD AUTHORITY. v0.7.4 remains law until Coach stamps this (or a versioned successor).
**Type:** Product + technical spec — **Time Machine** derivation
**Filename:** `DRAFT-FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_1.md`
**Parents:** Time Machine Spec **v0.7.4 BUILD AUTHORITY** · StudioOne Archive Read API Spec **v0.8** · Arch **28** · OT-EF v1.1
**Law-ID prefix:** **TMI-82…** (new). Existing ATM-* / TMI-* IDs are not renumbered. This file **supersedes** named IDs below; everything else in v0.7.4 stands.
**Routes:** `/app/options-lab/analyzer` · `/app/options-lab/heatmap` · `/app/options-lab/surface`

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine (derivation).

**Touches (when stamped):**

- Time Machine load path (`tmHost.loadTmDay`, `fillArchiveSlot`) — **one path for every date**, including today
- Today slot / `captureToday` as a **replay source** (retire)
- Heatmap inspector Time Machine hold line (how far back the **held StudioOne day** goes)
- StudioOne Archive Read: index/fetch of **today** as a growing book (lift `TODAY_LIVE` as a fetch refusal)
- Labs archive proxy (`server/routes/ssr_archive.py`) only as the existing pass-through
- Help: Time Machine article + Heatmap hold line
- Parent one-liners in TM v0.7.4 §13, Heatmap Templates, Width Fit, Surface §4.6, SO-AR §3

**Touches outside program:** **NONE.** Identity, payments, Massive, MSC, MiniTwo until asked, Tradier, a second WebSocket, a Labs `server/` film module, Volume Profile.

**Does not:** rename Time Machine · restore Instant Replay as a member-facing name · restore Record · restore a megabyte slider · restore TM glow · 1-minute past-day fetch · Basic / TPO / 1× (still HOLD from v0.7.4) · write archive days into Heatmap Redis · Spaces / Factory

**Review protocol:** BLOCKING vs ADVISORY. Coach Content Law: nothing Coach said in §0 of this file is removed.

---

## 0. Coach intent (verbatim — do not drop)

Spoken, this session, 2026-08-28:

1. **Instead of keeping a local cache for instant replay, could we instead grab the current downloaded day on StudioOne? That way the source of all replay, either long dates or today's date always comes from StudioOne.**
2. **I was not asking if as of today could we do that, I was asking could we redo the design to make it so.**
3. **This way an instant replay never has to depend on when the person logs in. The maximum time will always be available to the user.**

Prior name ruling (Coach, 2026-08-26, v0.7.4): the surface is **Time Machine**. "Instant Replay" is retired as a product name and survives only verbatim — here, in item 1 and item 3. Member copy says Time Machine.

Prior derivation ruling (Coach, 2026-08-26, v0.7.4): two sources existed because *you cannot archive and replay at the same time*. **This proposal retires that as the reason for two replay sources.** The constraint was about using the **writer** as the reader. Labs already reads StudioOne while the tap writes (AT-SOAR-45: collection outranks reads). Today is a day with `live: true`. One source.

---

## 1. Job

**One surface, one scrubber, one date control, one source.**

StudioOne's chain corpus is the sole replay source for **every selectable date**, including **today**. Login time is not a bound. The member who opens Options Lab at 14:00 ET can scrub today from the open, because StudioOne has been writing since the open — not because this tab was open at 9:30.

Live Heatmap / Analyzer **paint** still uses the live socket (Arch 28). That is not replay. Time Machine is a download of a StudioOne day, held in the tab only so scrubbing at 50× is a lookup, not a round trip.

```text
Live desk          → Massive → feeds → Redis → one WS/tab     (not replay)
Time Machine day   → StudioOne live_capture → Labs proxy      (all dates)
Playback buffer    → one held day in the tab                  (not a source)
```

---

## 2. Vocabulary

| Name | This spec | Not this spec |
|------|-----------|----------------|
| **Time Machine** | The one surface | Instant Replay (retired product name) |
| **Source** | StudioOne chain corpus, every date | Live socket `captureToday` film |
| **Hold** | The one downloaded day the tab scrubs | A second film; a megabyte budget |
| **Today** | StudioOne's in-progress NY session (`live: true`) | "From when this tab opened" |
| **Maximum time** | First print StudioOne holds for that date through last print it holds | Login clock; tab-open clock |
| **Buffer** | Browser-held copy of that download | A derivation |

---

## 3. Laws (new)

| ID | Law |
|----|-----|
| **TMI-82** ONE SOURCE | **StudioOne is the only replay source.** Past dates and today use the same retrieve path: coverage · coarse · infill · fidelity · NO PATH. There is no live-socket film for replay. `captureToday` from the chain bus is not a replay derivation. |
| **TMI-83** MAXIMUM TIME | **Replay of today does not depend on when the member logs in or when this tab opened.** The range is the session StudioOne has already written for that NY date — from its first print (session open when the tap was up) to its last print. That is the maximum time available. A late login is not a shorter day. |
| **TMI-84** ONE HOLD | The tab holds **at most one downloaded day** at a time — the date on the control, once a playhead is up. Switching date discards the previous hold before accepting the next. Reset / return to live drops the hold. There is no second slot that keeps capturing in the background for replay. |
| **TMI-85** TODAY IS A GROWING BOOK | Index and fetch of today are **allowed**. Today is `live: true`. Hash moves; `day_hash` mismatch is **409 `day_changed`** — resume, do not restart (SO-AR already). Collection still outranks reads. **`TODAY_LIVE` as a fetch refusal is retired.** Coverage may still mark today `live` so the calendar can tell growing from settled; growing is **selectable**, not grey. |
| **TMI-86** BUFFER NOT SOURCE | The held day in the tab exists so 50× is a lookup (TMI-4's latency reason **survives**). It is not a second source. It is not a Labs `server/` film module. |
| **TMI-87** RAISE TODAY | Date on today without a playhead remains **live** (TMI-64). Raising the playhead on today **downloads today's StudioOne book** (coarse then infill), then parks on the **newest** print (TMI-21). Raising on a past date parks on the **first** print (ATM-S1 · ATM-O1). |
| **TMI-88** TAIL WHILE TODAY | While a playhead is up **on today**, the hold may **append from StudioOne** at the newest edge (TMI-22): extend the range; advance only if the playhead was on the newest sample and Playing. The live socket does not feed the hold. A past date does not append. |
| **TMI-89** INSPECTOR LINE | Heatmap (and any host that shows a hold line) states how far back the **held StudioOne day** goes — first downloaded print, America/New_York. No megabyte slider. No Instant Replay name. If the first print is at/near the open, the line may say **from the open**. |

---

## 4. What this supersedes

Sat beside v0.7.4. Not erased.

| Prior law | This proposal |
|-----------|----------------|
| **Derivation ruling** (two sources because you cannot archive and replay at once) | **Retired as the reason for two replay sources.** Writer vs reader is SO-AR's job; TM has one source. |
| **TMI-4** "Today costs no transfer — the browser keeps what already arrives on the live socket" | **Superseded.** Today costs a StudioOne retrieve, same as a past day. TMI-4's **no Labs film module** and **50× is a lookup** stand (TMI-86). |
| **TMI-65** capture always on into a browser film | **Superseded as a replay derivation.** Capture always on is **StudioOne's tap**, not the tab. No Record. Raising the playhead always finds a day behind it if StudioOne has prints (else WAITING / NO PATH). |
| **TMI-79** two slots (today always capturing + one archive day) | **Superseded.** One hold (TMI-84). |
| **TMI-73** today's cache discarded only on OPF trading-date change | **Reshaped:** the hold is discarded on Reset, on date switch, and on trading-date change before accepting a new day. No background film survives Reset. |
| **TMI-75** past day not decayed; decay applies to today only | **OPEN — Coach.** If today is a StudioOne download, decay of a live-socket film has no seat. Coarse-then-infill (TMI-70) is the density story for every date. See Ideas. |
| **TMI-68 / TMI-50** browser decay ladder | **OPEN — Coach.** Collection cadence is StudioOne's [2, 5] s (DL-606). A browser ladder is not required to invent a shorter today. |
| **AT-TM-C8** today continues capturing while a past day is loaded | **Superseded.** StudioOne continues writing regardless of what the tab holds. The tab does not keep a second replay blob. |
| **AT-TM-C9** raising the scrubber uses the held cache with no Record | **Reshaped:** raising the scrubber on today **starts the StudioOne download** of today (WAITING until coarse lands). No Record. |
| **AT-TM-C11** native + decayed local session, then a past day on top | **Reshaped:** measure resident bytes of **one held StudioOne day** (today growing, fully infilled; and separately a full-fidelity past day). No dual-slot pair. No ceiling named. Ladder not frozen on a thin test. |
| **SO-AR §3 / FP6 / AT-SOAR-8** today → 409 `TODAY_LIVE`, no snapshots | **Superseded.** Today retrieve is in. Hole `TODAY_LIVE` is not used as a refusal. |
| Heatmap Cache megabyte detent (HM21 / TR14 member slider) | **Already out of the member story (DL-612).** This spec names the replacement: TMI-89. |

**Unchanged (v0.7.4 still binds):** TMI-1 · TMI-3 · TMI-64 · TMI-42 · TMI-21 (entry by date) · ATM-S2/S3 Reset/Stop · TMI-70 coarse-then-infill · TMI-71 fidelity · ATM-C1/C3 calendar + NO PATH · watermark / no TM glow · TMI-80/81 rehearsal · KEEP extras (live algos skip while playhead up; To Trade Log hidden and refused) · one WS/tab · OPF Truth · no 1-minute fetch · no Record · Basic / TPO / 1× HOLD.

---

## 5. Member flow

```text
Open Analyzer / Heatmap / Surface
    → live paint (socket). Date shows today. No playhead. No download.

Raise the scrubber (date still today)
    → REPLAY watermark
    → download StudioOne's today (coarse whole session, then infill)
    → WAITING until the coarse pass lands
    → playhead on the newest print
    → range is StudioOne's first print → last print (the open, if the tap was up)
    → login time is not a bound

Pick another date
    → discard the previous hold first
    → same download path
    → grey dates remain NO PATH

Reset
    → hold gone, watermark gone, live socket again
    → raising the scrubber later re-downloads the selected date
```

---

## 6. StudioOne retrieve of today

| Rule | Meaning |
|------|---------|
| Coverage | Today may appear with `live: true` and a real `count`. **Dot on the calendar** when `count > 0`. Not grey because it is live. |
| Index / fetch | **200** with snaps when files exist. Empty book → **NONE** / NO PATH, not `TODAY_LIVE`. |
| Hash | Moves while the tap writes. Client sends `day_hash`; mismatch → 409 `day_changed`, resume. |
| Priority | Collection outranks reads (AT-SOAR-45). Fetch niced; never pause the tap. |
| Browser | Still never calls StudioOne. Labs proxy only. |

---

## 7. Heatmap inspector

The Cache megabyte slider does not return. The line is TMI-89: how far back the held StudioOne day goes. Width Fit Average remains a **tab** ring of live generations for that template (TR14) — that is not Time Machine film and is not this source.

---

## 8. Named holes (additive)

| Name | When |
|------|------|
| **WAITING** | Coarse pass in flight, nothing landed (ATM-D4). Also: today has no snaps yet (pre-open). |
| **NO PATH** | StudioOne holds nothing for that date/book (ATM-C3). Not "you logged in late." |
| **day_changed** | Today grew under the fetch; resume. |

`TODAY_LIVE` is not a member-facing hole.

---

## 9. Ideas inventory

| Idea | Seat |
|------|------|
| StudioOne is the source of all replay, today and past dates | **IN-SCOPE** · TMI-82 |
| Replay of today does not depend on login / tab-open; maximum time is what StudioOne holds | **IN-SCOPE** · TMI-83 |
| Redo the design (not a question about as-built capability) | **IN-SCOPE** · this document |
| Instant Replay as a member-facing name | **OUT** · name ruling |
| Local live-socket film for replay | **OUT** · TMI-82 |
| Labs `server/` film module | **OUT** · TMI-86 · TMI-4 remainder |
| Megabyte Cache slider | **OUT** · TMI-89 · DL-612 |
| Browser decay ladder on a live-socket today cache | **FLAGGED** · no seat if today is a StudioOne download; Coach disposes TMI-50/68 |
| Snapshot-only today (no tail-append while scrubbing) | **FLAGGED** · TMI-88 is the proposed growing hold; Coach may prefer snapshot |
| Rehearsal, watermark, fidelity, calendar dots, Reset | **IN-SCOPE** · unchanged from v0.7.4 |
| Basic / TPO / 1× / Record | **DEFERRED** · HOLD from v0.7.4 |

---

## 10. Acceptance (this proposal, when stamped)

| ID | Criterion |
|----|-----------|
| **AT-TM-OS-1** | Raising the playhead on today with a tab that just opened after 13:00 ET still scrubs from StudioOne's first print of that session (the open if the tap was up). Login time is not the left edge. |
| **AT-TM-OS-2** | The same retrieve path loads today and a past covered date (coverage → coarse → infill). No `captureToday` from the live bus is required for the range to exist. |
| **AT-TM-OS-3** | Index/fetch of today returns snaps when files exist. No 409 `TODAY_LIVE`. |
| **AT-TM-OS-4** | Switching date discards the previous hold before accepting the next. Reset drops the hold. No second replay blob remains. |
| **AT-TM-OS-5** | Heatmap inspector has no megabyte Cache slider. The hold line names the first print of the held StudioOne day. No "Instant Replay" in member copy. |
| **AT-TM-OS-6** | Calendar: today with `count > 0` is a dotted available day, not grey-because-live. Uncovered dates remain grey + NO PATH. |
| **AT-TM-C6 / TPO / 1× / Record** | Still **HOLD**. Not this stamp. |

Fail-closed: live-socket film as a replay source; `TODAY_LIVE` refusal; login-bounded today; megabyte slider; Instant Replay as a product name; second hold slot; client Massive; Labs film module.

---

## 11. As-built (honesty — not this proposal's law)

v0.7.4 shipped two derivations: today from the live socket (`captureToday`), past days from StudioOne. SO-AR index/fetch refuse today (`TODAY_LIVE` 409). A late login's today-replay starts when this tab sees generations. Heatmap Cache slider is already gone (DL-612); a hold line exists but still describes the local film.

This DRAFT is the redesign that makes that limitation impossible.

---

## 12. Suggested path after Coach stamp

Not execution. Sequence only, if this becomes BUILD AUTHORITY:

1. SO-AR amendment: lift `TODAY_LIVE` refusal; today retrieve + tests (AT-SOAR-8 reversed).
2. One `loadTmDay` for every date; TMI-64 still does not download until the playhead is up.
3. Stop using `captureToday` as replay source.
4. TMI-88 tail-append from StudioOne while today is the hold — or snapshot, if Coach flags TMI-88 the other way.
5. Inspector line + help (TMI-89). Calendar today is dotted.
6. Kilo: AT-TM-OS-1…6. Never waive. HOLD rows stay HOLD.

India · Echo · Hotel on the stamp. Juliet plans only after Phase 5.

---

## 13. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v0.1 DRAFT** | 2026-08-28 | Proposal from Coach's redesign: one StudioOne source; today not login-bounded; maximum time always available. Not BUILD AUTHORITY. |

**Next:** Coach stamp, return, or flag TMI-88 / decay.

# FatTail Labs — Options Lab Time Machine One Source Spec v0.4

**Status:** **BUILD AUTHORITY** (Coach GO SPEC, 2026-08-29). Parent v0.7.4 remains in force where this file does not supersede it. Plan v1.2 is superseded. Juliet re-plans against this file. **No product code until the new plan is stamped.**
**Changes in v0.4 (Coach, 2026-08-28 / 2026-08-29):** **This is the spec to build.** v0.3 merge is the law (TMI-91 chain · TMI-92 original feed · TMI-93 named hole). **TMI-94** VIX from the marks tape; **source travels with the mid**. **TMI-95** do not wait on `generation.vix`. **TMI-96** positions dark, not hidden, light at entry — own ID, not folded into TMI-92; named-hole remains TMI-93; TMI-95 remains tape-read. Proof days: **08-27** proxy-labelled (`massive_proxy_v1`); **08-29 00:38:08** native (`massive_index_v1`). **§13a item 1 ruled 2026-08-29:** dark position does not show legs. Items 2–3 still Coach (`generation.vix` write; unnamed fields). Consumes A2 marks; does not build one.
**Changes in v0.3 (Coach, 2026-08-28):** **The hold is the desk.** One source for every date, including today, **and that source data affects all surfaces as if it were the real data.** TMI-91 is the chain on Analyzer, Heatmap, and Surface. TMI-92 is the rest of the desk Coach named: **Symbol, VIX, positions, heatmap tiles** — *whatever the original feed was driving.* TMI-93: a field the archive cannot supply is a **named hole, never a live-read**, and that gap is a **collection defect** raised to Coach. §11a is the envelope read. AT-TM-OS-10…12.
**Changes in v0.2.1 — leftover pass, no new rulings.** v0.2 ruled TMI-88 to snapshot and left §12 still offering tail-append. Corrected. `day_changed` in-flight only. Reset then raise. Average protected. C11 unusable is Coach-before-ship.
**Changes in v0.2 (Coach, 2026-08-28):** snapshot, not tail-append (TMI-88). Full download (TMI-90). Inspector line states the real first print.
**Type:** Product + technical spec — **Time Machine** derivation
**Filename:** `FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_4.md`
**Supersedes:** v0.3 DRAFT, v0.2.1 DRAFT, v0.2 DRAFT, v0.1 DRAFT
**Parents:** Time Machine Spec **v0.7.4 BUILD AUTHORITY** · StudioOne Archive Read API Spec **v0.8** · Arch **28** · OT-EF v1.1
**Law-ID prefix:** **TMI-82…96**. Existing ATM-* / TMI-* IDs are not renumbered. This file **supersedes** named IDs below; everything else in v0.7.4 stands.
**Routes:** `/app/options-lab/analyzer` · `/app/options-lab/heatmap` · `/app/options-lab/surface`

---

## Scope statement (DL-539)

**Active program:** Options Lab — Time Machine (derivation).

**Touches (when stamped):**

- Time Machine load path (`tmHost.loadTmDay`, `fillArchiveSlot`) — **one path for every date**, including today
- Today slot / `captureToday` as a **replay source** (retire)
- Heatmap inspector Time Machine hold line (how far back the **held StudioOne day** goes)
- **Every TM host's chain consumption** while a playhead is up: Analyzer, Heatmap (including Width Fit **Replay**), Surface — the hold's generation **is** the chain (TMI-91)
- **Every member-visible field the original feed was driving at t**, including **Symbol, VIX, positions, and heatmap tiles** (TMI-92). A field the archive cannot supply is a named hole, never a live-read (TMI-93)
- **Positions dark, not hidden, light at entry** (TMI-96 · §0.14). **A dark position does not show its legs** (§13a item 1). Presence only until it lights.
- **VIX on replay** from the existing marks tape (`marks/vix.jsonl`) — nearest-in-time to t (TMI-94). Named hole on a tape gap. Not `generation.vix`. Not live. Not waiting on a tap-writer change (TMI-95). **Source travels with the mid.** OS-13 = 08-27 proxy. OS-14 = 08-29 native
- StudioOne Archive Read: index/fetch of **today** as a growing book (lift `TODAY_LIVE` as a fetch refusal); **read** of the existing VIX marks tape (no tap-writer change)
- Labs archive proxy (`server/routes/ssr_archive.py`) only as the existing pass-through
- Help: Time Machine article + Heatmap hold line
- Parent one-liners in TM v0.7.4 §13, Heatmap Templates, Width Fit, Surface §4.6, SO-AR §3

**Touches outside program:** **NONE.** Identity, payments, Massive, MSC, MiniTwo until asked, Tradier, a second WebSocket, a Labs `server/` film module, Volume Profile.

**Does not:** rename Time Machine · restore Instant Replay as a member-facing name · restore Record · restore a megabyte slider · restore TM glow · 1-minute past-day fetch · Basic / TPO / 1× (still HOLD from v0.7.4) · write archive days into Heatmap Redis · Spaces / Factory · change the tap to start writing `generation.vix` (§13a item 2 — StudioOne, not this spec) · bounce the StudioOne dash until asked · name live-feed fields Coach has not named (§13a item 3)

**Review protocol:** BLOCKING vs ADVISORY. Coach Content Law: nothing Coach said in §0 of this file is removed.

---

## 0. Coach intent (verbatim — do not drop)

Spoken, this session, 2026-08-28:

1. **Instead of keeping a local cache for instant replay, could we instead grab the current downloaded day on StudioOne? That way the source of all replay, either long dates or today's date always comes from StudioOne.**
2. **I was not asking if as of today could we do that, I was asking could we redo the design to make it so.**
3. **This way an instant replay never has to depend on when the person logs in. The maximum time will always be available to the user.**

Prior name ruling (Coach, 2026-08-26, v0.7.4): the surface is **Time Machine**. "Instant Replay" is retired as a product name and survives only verbatim — here, in item 1 and item 3. Member copy says Time Machine.

Spoken, this session, 2026-08-28 (continued):

4. **When a user wants instant replay, they get the most recent version at that time. There's no going back and filling in the current time. They would have to disconnect, then reconnect.**
5. **Let's see what happens with a full download instead of a fade.**
6. *(Correcting the advisor on load)* **There's no blocking another user. If they simultaneously download the cached time, this is normal download latency as if you were serving up a graphics heavy page.**
7. *(Correcting the advisor on "instant")* **Stop using words as literal. Instant means pretty fast.**
8. **We are drafting a new spec, that includes one source for all Time Machine dates, including today, and to make sure the source data affects all surfaces as if it were the real data.**
9. **The position in the Analyzer was not changing. Everything should be changing including the Symbol, the VIX, the positions, and the heatmap tiles.**
10. **It should be whatever the original feed was driving.**
11. **The VIX has to come along, because future features rely on it being available.**
12. **I thought this would have been tacit.**
13. **new spec to build FatTail Labs — Options Lab Time Machine One Source Spec v0.4**

Spoken, GO SPEC 2026-08-29 (continued):

14. **Positions are dark, not hidden, and light when the playhead reaches their entry.**

Prior derivation ruling (Coach, 2026-08-26, v0.7.4): two sources existed because *you cannot archive and replay at the same time*. **This proposal retires that as the reason for two replay sources.** The constraint was about using the **writer** as the reader. Labs already reads StudioOne while the tap writes (AT-SOAR-45: collection outranks reads). Today is a day with `live: true`. One source.

---

## 1. Job

**One surface, one scrubber, one date control, one source.**

StudioOne's chain corpus is the sole replay source for **every selectable date**, including **today**. Login time is not a bound. The member who opens Options Lab at 14:00 ET can scrub today from the open, because StudioOne has been writing since the open — not because this tab was open at 9:30.

**With no playhead:** live Heatmap / Analyzer / Surface paint uses the live socket (Arch 28). That is not replay.

**With a playhead up:** the held StudioOne generation **is the chain** for every Time Machine host in this tab — Analyzer, Heatmap, Surface — as if it were the live generation. Templates `run()` on it. Package quote, listed-leg IV, spot, and OPF τ come from it. **Symbol, VIX, positions, and heatmap tiles rebind from that same hold** (TMI-92) — *whatever the original feed was driving.* **VIX comes from the marks tape, nearest-in-time** (TMI-94), not from `generation.vix` and not from live. A host that keeps reading the live socket beside the hold is broken, not "live overlay." A field the archive cannot supply shows a named hole; it does not keep reading live (TMI-93).

Time Machine is a download of a StudioOne day, held in the tab so 50× is a lookup, not a round trip.

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
| **The desk** | Analyzer, Heatmap, Surface in this tab, while a playhead is up — chain **and** Symbol, VIX, positions, tiles | A sidecar only Analyzer watches; a live VIX on a replayed panel |
| **Original feed** | The values that generation / envelope / marks tape held at t | Live socket walking beside the hold |
| **Collection defect** | A field the live desk shows that this day's envelope cannot supply | A permanent replay limitation; a license to read live |

---

## 3. Laws (new)

| ID | Law |
|----|-----|
| **TMI-82** ONE SOURCE | **StudioOne is the only replay source.** Past dates and today use the same retrieve path: coverage · coarse · infill · fidelity · NO PATH. There is no live-socket film for replay. `captureToday` from the chain bus is not a replay derivation. |
| **TMI-83** MAXIMUM TIME | **Replay of today does not depend on when the member logs in or when this tab opened.** The range is the session StudioOne has already written for that NY date — from its first print (session open when the tap was up) to its last print. That is the maximum time available. A late login is not a shorter day. |
| **TMI-84** ONE HOLD | The tab holds **at most one downloaded day** at a time — the date on the control, once a playhead is up. Switching date discards the previous hold before accepting the next. Reset / return to live drops the hold. There is no second slot that keeps capturing in the background for replay. |
| **TMI-85** TODAY IS A GROWING BOOK | Index and fetch of today are **allowed**. Today is `live: true`. **`TODAY_LIVE` as a fetch refusal is retired.** Collection still outranks reads. Coverage may still mark today `live` so the calendar can tell growing from settled; growing is **selectable**, not grey.

**`day_changed` is scoped to an in-flight fetch, and only there.** While a download is still running, the day underneath it may grow and a `day_hash` mismatch returns **409 `day_changed`** — resume, do not restart (SO-AR). **Once the download completes, the hold is fixed and nothing checks a hash against it again** (TMI-88). A member scrubbing a completed hold never meets `day_changed`, because nothing is being fetched. The two laws are consistent on that split and are not consistent without it. |
| **TMI-86** BUFFER NOT SOURCE | The held day in the tab exists so 50× is a lookup (TMI-4's latency reason **survives**). It is not a second source. It is not a Labs `server/` film module. |
| **TMI-87** RAISE TODAY | Date on today without a playhead remains **live** (TMI-64). Raising the playhead on today **downloads today's StudioOne book as it stands at that moment**, then parks on the **newest print in that snapshot** (TMI-21) — which is StudioOne's newest write, not the live socket's newest tick. The two differ by write plus fetch latency, seconds at most, and Reset returns to live paint. Raising on a past date parks on the **first** print (ATM-S1 · ATM-O1). |
| **TMI-88** SNAPSHOT, NOT APPEND (§0.4) | **The hold is a snapshot of what StudioOne held at the moment the playhead was raised.** It does not append, does not chase the newest edge, and is not topped up while scrubbing. Today and a past date behave identically in this respect, which is the point of one source.

**One member path for a newer range: Reset, then raise again.** Coach's words are disconnect, then reconnect — which is Reset (out of scrub mode) followed by raising the scrubber. **There is no refresh control and none is to be invented.** The existing exit is the mechanism.

The consequence matters and is deliberate: **the fetched range is fixed, so its hash does not move underneath the member.** There is no 409 treadmill on a live day, and the download is cacheable by range at Labs even though the *day* is still growing. The day mutates; a snapshot of it does not. |
| **TMI-89** INSPECTOR LINE | Heatmap (and any host that shows a hold line) states how far back the **held StudioOne day** goes — **the actual first downloaded print**, America/New_York. No megabyte slider. No Instant Replay name. **It does not say "from the open."** If the tap started at 09:32 the line says 09:32; a two-minute approximation is a lie in a system whose discipline is naming what it actually has (TMI-38, OT-EF).

**The copy states what the archive holds, not what it lacks.** *The hold starts at the first print StudioOne has for this date* is the frame — not a truncation notice, and never phrased so a member reads a late tap start as their own late arrival, which is the exact confusion TMI-83 exists to remove. Echo and Tango own the wording. |
| **TMI-90** FULL DOWNLOAD (§0.5) | **Every date arrives whole.** There is no thinning, no decay, and no density ladder acting as a memory mechanism. The member holds full fidelity for the date they selected.

**Coarse-then-infill survives as a progress mechanism, not a savings mechanism** (TMI-70, TMI-71): the coarse pass still yields a complete-but-sparse timeline in the first moment so scrubbing is available immediately, and infill still sharpens it — but the destination is now the whole day rather than a decayed approximation of it. The fidelity indicator reports progress toward full, which it always did.

**This is a deliberate experiment, not a settled optimum.** Coach: *let's see what happens with a full download instead of a fade.* What it costs resident is the open question, and it is answered by measurement (AT-TM-C11), not by argument. If the number is unworkable, a ladder returns as a memory mechanism — but nobody is optimising ahead of the number. |
| **TMI-91** THE HOLD IS THE DESK (§0.8) | **While a playhead is up, the held StudioOne generation is the chain — as if it were the real data — on every Time Machine host in this tab.** Analyzer, Heatmap, and Surface. Not a sidecar the Analyzer watches while Heatmap and Surface stay live.

The host selects that generation and `run()`s (TMI-6). Package quote, listed-leg IV, spot, and OPF τ come from it (TMI-K1, TMI-K2, TMI-31, TMI-32). Heatmap templates including GEX run on it (TMI-33). Width Fit **Replay** is that generation; **Average** remains a window mean over **live** generations and is not this law (TMI-29 · AT-TM-OS-9). Sticky playhead (TMI-42) is how the same generation moves between hosts — not a second copy.

A surface that keeps painting from the live socket, a second Massive path, or a leftover `captureToday` film **while the playhead is up** is a fail. Reset returns every host to live paint together.

Representable or named state still applies (OT-EF). Missing listed legs are CHECK LEGS / NOT TRADED / IV NO — never a fake debit invented to look "live."

TMI-91 is the **chain** on the three hosts. It is necessary and not sufficient. Symbol, VIX, and positions are not chain rows — they are TMI-92. |
| **TMI-92** THE ORIGINAL FEED (§0.9–0.10 · §0.12) | **While a playhead is up, every member-visible field the original feed was driving at t is the hold's value at t.** Coach named them: **the Symbol, the VIX, the positions, and the heatmap tiles.** TMI-91 is the chain. This law is the rest of the desk. *I thought this would have been tacit.*

- **Symbol** — the book's identity and underlier mark at t. Envelope `symbol`; generation `product` / `underlier` / `spot`. Not a live underlier mark walking beside a replayed chain.
- **VIX** — the VIX field at t, from the marks tape (TMI-94). Not a live VIX on a replayed panel. Not `generation.vix`.
- **Positions** — Analyzer cards, tent, and package marks reprice from the held generation (TMI-31). A position that does not move while the chain under it does is a fail. Representable or named state still applies: missing listed legs are CHECK LEGS / NOT TRADED, never a live debit invented to look alive. Dark-not-hidden is **TMI-96**, not this bullet. A dark position does **not** show its legs (§13a item 1).
- **Heatmap tiles** — templates `run()` on that generation (TMI-33 · TMI-91).

*"Whatever the original feed was driving"* is the test, not an enumerated whitelist that lets a later chip keep reading live because it was not named here. Unnamed fields stay §13a item 3. Width Fit **Average** remains the live-generation ring and is not this law (TMI-29 · AT-TM-OS-9). |
| **TMI-93** NO LIVE-READ OF A HOLE | **If the archive cannot supply a field the live desk shows, that field shows a named hole. It does not read live.** A live number on a replayed panel is the worst available failure: not obviously wrong, moves plausibly, and the member cannot tell which fields are history and which are now.

A tape gap at t is a named hole (VIX NO), not a live-read, and not a reason to skip TMI-94. Days already written cannot have a missing field backfilled into the **chain envelope**. The VIX marks tape is already on disk; reading it is TMI-94, not an open collection question. |
| **TMI-94** VIX COMES ALONG (§0.11) | **The VIX has to come along, because future features rely on it being available.** While a playhead is up, VIX is the **marks tape** (`marks/vix.jsonl`) at the **nearest-in-time** print to t. Not `generation.vix`. Not a chain book. Not a live underlier mark. Not interpolated.

**`source` and `label` travel with the mid.** A replayed day carries the source it was captured with. It is not a single assumption about what VIX is. Days **2026-08-14 through 2026-08-28** are `massive_proxy_v1` (VIXY dollars, labelled). From **2026-08-29T00:38:08.952423-04:00** the tape is `massive_index_v1` (native `I:VIX`). Presenting a proxy day as native, or a native day as proxy, is a fail.

A gap in the tape — no print to match — is **VIX NO** (TMI-93). Never a live VIX.

This is **ruled**. It is not an open question. |
| **TMI-95** READ THE TAPE THAT EXISTS | TMI-94 is a **read** of files the tap already wrote. It does **not** wait on the tap starting to write `generation.vix`. That write is §13a item 2, a **StudioOne** change, **not this spec**. A packet that blocks VIX replay until `generation.vix` is non-null is a fail.

**Two proof days, two meanings of "before":**
- **Before the marks route / before this TM feature** — **2026-08-27**. Tape exists; `generation.vix` is null on every envelope. AT-TM-OS-13. Source on that tape is **`massive_proxy_v1`**. The proof is: retrieve the labelled proxy, never live, never relabelled native.
- **Before the native feed** ends at **2026-08-29T00:38:08.952423-04:00**. AT-TM-OS-14 is a **native** day on or after that instant. Source is **`massive_index_v1`**. The proof is: retrieve native, never assumed proxy.

A fixture that assumes one VIX kind for every date fails both. |
| **TMI-96** POSITIONS DARK, NOT HIDDEN (Coach GO SPEC 2026-08-29) | **Positions are dark, not hidden, and light when the playhead reaches their entry.** TMI-92 is that they rebind with the hold. This law is how they look before entry. They are present and dark — not vanished, not a surprise debit. They light at the entry print.

This is **not** TMI-92 (original feed) and **not** TMI-95 (read the tape). Named-hole law is **TMI-93**.

**§13a item 1 ruled (Coach 2026-08-29):** a dark position does **not** show its legs. It shows that something is there and not yet taken. Seeing the structure before entry is foreshadowing the member did not have at the time; the desk as it was is the whole point. Legs appear when it lights. |

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
| **TMI-75** past day not decayed; decay applies to today only | **RESOLVED (§0.5).** No date is decayed. Every date is a full download (TMI-90). The asymmetry TMI-75 described is gone because both halves are now the same thing. |
| **TMI-68 / TMI-50** browser decay ladder | **RETIRED (§0.5).** The ladder existed to thin a live-socket film that no longer exists as a replay source. Collection cadence is StudioOne's measured [2, 5] s (DL-606), and the archive holds what arrived — replay plays back what is available. **Nothing replaces the ladder as a memory mechanism**; whether one is needed is the measurement in AT-TM-C11. TMI-50's underlying honesty rule — a snapshot is kept whole or dropped entirely, never hollowed out — is moot when nothing is dropped, and would return intact if a ladder ever did. |
| **AT-TM-C8** today continues capturing while a past day is loaded | **Superseded.** StudioOne continues writing regardless of what the tab holds. The tab does not keep a second replay blob. |
| **AT-TM-C9** raising the scrubber uses the held cache with no Record | **Reshaped:** raising the scrubber on today **starts the StudioOne download** of today (WAITING until coarse lands). No Record. |
| **AT-TM-C11** native + decayed local session, then a past day on top | **Repointed (§0.5).** Measure resident bytes of **one fully downloaded dense day** — a real 5,800-generation session, infill waited to completion, not a thin test. That single number decides whether full download is workable. No dual-slot pair, no decay, no ceiling named in advance. |
| **SO-AR §3 / FP6 / AT-SOAR-8** today → 409 `TODAY_LIVE`, no snapshots | **Superseded.** Today retrieve is in. Hole `TODAY_LIVE` is not used as a refusal. |
| Heatmap Cache megabyte detent (HM21 / TR14 member slider) | **Already out of the member story (DL-612).** This spec names the replacement: TMI-89. |
| **TMI-3** "all three hosts" as chrome-only | **Restated as TMI-91.** Hosting the strip is not enough. The generation **is** the chain on those hosts. TMI-92 is the same restatement for Symbol, VIX, positions, and tiles. |

**Unchanged (v0.7.4 still binds):** TMI-1 · TMI-64 · TMI-42 · TMI-6 · TMI-21 (entry by date) · TMI-29 (Replay ≠ Average) · TMI-31 · TMI-32 · TMI-33 · ATM-S2/S3 Reset/Stop · TMI-70 coarse-then-infill · TMI-71 fidelity · ATM-C1/C3 calendar + NO PATH · watermark / no TM glow · TMI-80/81 rehearsal · KEEP extras (live algos skip while playhead up; To Trade Log hidden and refused) · one WS/tab · OPF Truth · no 1-minute fetch · no Record · Basic / TPO / 1× HOLD. TMI-3's *intent* (all three hosts, same data) is **TMI-91** as chain-consumption law and **TMI-92** as desk-consumption law.

---

## 5. Member flow

```text
Open Analyzer / Heatmap / Surface
    → live paint (socket). Date shows today. No playhead. No download.

Raise the scrubber (date still today)
    → REPLAY watermark
    → download StudioOne's today AS IT STANDS AT THIS MOMENT
    → coarse pass first, then infill to full — no thinning
    → WAITING until the coarse pass lands
    → playhead on the newest print in that snapshot
    → range is StudioOne's first print → its last print at grab time
    → login time is not a bound; the range does not grow while you scrub
    → Analyzer, Heatmap, and Surface all paint from that generation
      as if it were the live chain (TMI-91)
    → Symbol, VIX, positions, and heatmap tiles rebind with it (TMI-92)
    → VIX from the marks tape, nearest-in-time (TMI-94); generation.vix may be null
    → a tape gap is VIX NO, never live (TMI-93)
    → a field the hold cannot supply is a named hole, never live (TMI-93)

Pick another date
    → discard the previous hold first
    → same download path
    → grey dates remain NO PATH

Reset
    → hold gone, watermark gone, live socket again
    → raising the scrubber later re-downloads the selected date,
      which is how a member gets a newer range on today (§0.4)
```

---

## 6. StudioOne retrieve of today

| Rule | Meaning |
|------|---------|
| Coverage | Today may appear with `live: true` and a real `count`. **Dot on the calendar** when `count > 0`. Not grey because it is live. |
| Index / fetch | **200** with snaps when files exist. Empty book → **NONE** / NO PATH, not `TODAY_LIVE`. |
| Hash | The **day** grows while the tap writes, but a **snapshot of it does not** (TMI-88). The fetched range is fixed at grab time, so nothing moves underneath a scrubbing member and there is no resume treadmill. A member who wants newer raises the scrubber again. |
| Cacheable | Because a snapshot is a fixed range, Labs may cache it **by range** even though the day is live. Two members raising the scrubber a minute apart share most of the same bytes. |
| Priority | Collection outranks reads (AT-SOAR-45). Fetch niced; never pause the tap. **Concurrent member downloads are ordinary serving load** (§0.6) — comparable to a graphics-heavy page, on a LAN, from a machine beside the server. Full-pool reads were measured against the tap and moved cadence slightly *faster* with zero gaps. |
| Browser | Still never calls StudioOne. Labs proxy only. |

---

## 7. Heatmap inspector

The Cache megabyte slider does not return. The line is TMI-89: how far back the held StudioOne day goes.

**Width Fit Average remains a tab ring of live generations for that template (TR14) — it is not Time Machine film, not this source, and it does not retire with `captureToday`.** Retiring `captureToday` means removing its writes **into the Time Machine hold**. A change that removes the live-generation capture outright breaks Average, which has nothing to do with replay. Average stays a window mean over live generations, as it always was.

**Width Fit Replay is TMI-91.** It is the held generation, same as Heatmap Live would be if that generation were the live tick. Do not leave Replay on the hold while the Heatmap grid still paints live.

---

## 8. Named holes (additive)

| Name | When |
|------|------|
| **WAITING** | Coarse pass in flight, nothing landed (ATM-D4). Also: today has no snaps yet (pre-open). |
| **NO PATH** | StudioOne holds nothing for that date/book (ATM-C3). Not "you logged in late." |
| **day_changed** | Today grew under the fetch; resume. |
| **VIX NO** | Playhead up and the **marks tape** has no print to match at t (TMI-94 · TMI-93). **Not a live VIX. Not `generation.vix` being null** — that key is empty on already-collected days and is not the hole. Echo and Tango own the wording. |
| **(field) NO** | Same rule for any other live-desk field the archive cannot supply at t. Named, never live. |

`TODAY_LIVE` is not a member-facing hole.

---

## 9. Ideas inventory

| Idea | Seat |
|------|------|
| StudioOne is the source of all replay, today and past dates | **IN-SCOPE** · TMI-82 |
| Replay of today does not depend on login / tab-open; maximum time is what StudioOne holds | **IN-SCOPE** · TMI-83 |
| Redo the design (not a question about as-built capability) | **IN-SCOPE** · this document |
| Source data affects all surfaces as if it were the real data | **IN-SCOPE** · TMI-91 · TMI-92 · AT-TM-OS-10 · AT-TM-OS-11 |
| Symbol, VIX, positions, heatmap tiles rebind with the hold | **IN-SCOPE** · TMI-92 · AT-TM-OS-11 · *whatever the original feed was driving* |
| Field the archive cannot supply → named hole, never live-read | **IN-SCOPE** · TMI-93 · AT-TM-OS-12 |
| VIX has to come along; future features rely on it | **RULED IN (§0.11)** · TMI-94 · TMI-95 · AT-TM-OS-13 · AT-TM-OS-14 · **not an open question** |
| Read `marks/vix.jsonl`, nearest-in-time; named hole on a gap | **RULED IN** · TMI-94 · source travels with the mid |
| Prove VIX on a **proxy-labelled** day (before native feed) | **RULED IN** · AT-TM-OS-13 · **2026-08-27** · `massive_proxy_v1` |
| Prove VIX on a **native** day | **RULED IN** · AT-TM-OS-14 · **2026-08-29** from 00:38:08 · `massive_index_v1` |
| Wait on the tap writing `generation.vix` | **OUT of this spec** · TMI-95 · §13a item 2 is StudioOne |
| This version is the spec to build | **IN-SCOPE** · §0.13 · this document |
| Positions dark, not hidden, light at entry | **IN-SCOPE** · **TMI-96** · AT-TM-OS-15 |
| Whether a dark position shows its legs | **RULED** · Coach 2026-08-29 · §13a item 1 · no; presence only until it lights |
| Whether the tap starts writing `generation.vix` | **OPEN** · Coach · §13a item 2 · StudioOne, not this spec |
| Whether anything else the live feed drives has not been named | **OPEN** · Coach · §13a item 3 |
| Instant Replay as a member-facing name | **OUT** · name ruling |
| Local live-socket film for replay | **OUT** · TMI-82 |
| Labs `server/` film module | **OUT** · TMI-86 · TMI-4 remainder |
| Megabyte Cache slider | **OUT** · TMI-89 · DL-612 |
| Browser decay ladder | **RETIRED (§0.5)** · TMI-90 · returns only if AT-TM-C11 says it must |
| Snapshot-only today, no tail-append | **RULED IN (§0.4)** · TMI-88 · a newer range means raising the scrubber again |
| Full download instead of a fade | **RULED IN (§0.5)** · TMI-90 · a deliberate experiment, answered by AT-TM-C11 |
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
| **AT-TM-OS-7** | **Snapshot, not append.** With a playhead up on today, the held range does not grow while the tap keeps writing: the last sample is the same after five minutes of scrubbing as it was at grab time. Reset and re-raise produces a longer range. |
| **AT-TM-OS-8** | **Full download.** A completed load holds every generation the archive has for that date — count matches the index, no thinning, no interpolated sample. The fidelity indicator reaches full and stops. |
| **AT-TM-OS-9** | **Width Fit Average survives.** Retiring `captureToday` as a replay derivation does not break Average: it remains a window mean over live generations for that template, distinct from Replay (TMI-29). |
| **AT-TM-OS-10** | **The hold is the desk.** With a playhead up on a StudioOne day, Analyzer tent, Heatmap tiles (Replay / live-template `run()`), and Surface listed-leg IV all resolve from the **same** generation (`content_hash` / `as_of`). A live-socket chain or mid driving any of those paints while the playhead is up is a **fail**. SPA Analyzer → Heatmap → Surface keeps that generation (TMI-42). Reset returns all three to live together. |
| **AT-TM-OS-11** | **The original feed.** With a playhead up, **Symbol, VIX, positions, and heatmap tiles** all move with the hold. Scrubbing a day whose chain is changing while the Analyzer position, the Symbol field, or the VIX field stays on live paint is a **fail**. Same generation as OS-10. Reset returns those fields to live together. |
| **AT-TM-OS-12** | **No live-read of a hole.** If the hold cannot supply a field the live desk shows, that field is a **named hole** for the whole time the playhead is up. A live VIX (or live symbol mark, or live package debit) on that panel while the playhead is up is a **fail**. `generation.vix` being `null` is **not** VIX NO (TMI-94). A **tape** gap is VIX NO. |
| **AT-TM-OS-13** | **VIX on a proxy-labelled day.** Playhead up on **2026-08-27** (before the native feed; also before this TM feature — `generation.vix` null, tape already on disk). Analyzer VIX tracks `marks/vix.jsonl` nearest-in-time. **`source` is `massive_proxy_v1`.** The number is the captured VIXY dollar, labelled, never presented as native `I:VIX`, never live. A tape gap is **VIX NO**. Blocking on `generation.vix` being written is a **fail** (TMI-95). A fixture does not close this row. |
| **AT-TM-OS-14** | **VIX on a native day.** Playhead up on a day whose tape is **`massive_index_v1`** — **2026-08-29** from `00:38:08.952423-04:00` forward, or a later session. Analyzer VIX tracks that tape nearest-in-time. **`source` is `massive_index_v1`.** Mid is native `I:VIX` (~14.4 that first line), never assumed proxy / VIXY. `generation.vix` may still be null. A fixture does not close this row. |
| **AT-TM-OS-15** | **Dark, not hidden.** With a playhead up before a position's entry print, that position is **dark, not absent**. At the entry print it **lights**. Vanished-before-entry or lit-before-entry is a fail. **A dark position does not show its legs** (§13a item 1, Coach 2026-08-29). Presence only — not yet taken. Legs appear when it lights. |
| **AT-TM-C11** | Resident bytes of **one fully downloaded dense day** — a real session, infill waited to completion, count matching the index. **Recorded, with no ceiling named in advance.** But recording is not the same as passing: **a number that makes the tab unusable is a Coach decision before ship, not a footnote on a pass.** If it is large, the remedy is a later ladder packet (TMI-90) — never a silent return to a live-socket film or a Labs `server/` film. **Coach 2026-08-29:** 2026-08-27 SPX **36,107 / 36,107**, JS heap **553 MB** — **ship and watch**. Each completed hold posts resident bytes; admin corpus row at `/admin/archive` is the watch. |
| **AT-TM-C6 / TPO / 1× / Record** | Still **HOLD**. Not this stamp. |

Fail-closed: live-socket film as a replay source; live-socket chain or mid driving Analyzer / Heatmap / Surface **while a playhead is up**; **live VIX, live Symbol mark, or live position marks on a replayed panel**; presenting a `massive_proxy_v1` day as native VIX or a `massive_index_v1` day as proxy; `TODAY_LIVE` refusal; login-bounded today; megabyte slider; Instant Replay as a product name; second hold slot; client Massive; Labs film module.

---

## 11. As-built (honesty — not this spec's law)

v0.7.4 shipped two derivations: today from the live socket (`captureToday`), past days from StudioOne. SO-AR index/fetch refuse today (`TODAY_LIVE` 409). A late login's today-replay starts when this tab sees generations. Heatmap Cache slider is already gone (DL-612); a hold line exists but still describes the local film.

This spec is the redesign that makes that limitation impossible.

---

## 11a. Envelope read (2026-08-28) — which fields the hold can supply

Not argued. One fetch. StudioOne `GET /api/fetch?symbol=SPX&day=2026-08-27&level=0` (dash left running; not bounced). `count_on_disk` 36,107 · returned 71 · `hole` null. First envelope `captured_at` `2026-08-27T01:17:30.882608-04:00` (GTH). Same read class as TMI-45's wings question.

**Envelope (snap) top-level keys:** `captured_at` · `chain_cadence` · `chain_cadence_s` · `expiration` · `generation` · `greek_count` · `hole` · `iv_count` · `phase` · `provenance` · `row_count` · **`symbol`** · `topic`. Fetch adds `_file` · `_index` · `_level`.

**Generation keys on that envelope:** `as_of` · `atm_strike` · `band` · `bus` · `content_hash` · `dte` · `dual_side` · `excluded_adjusted_count` · `expiration` · `fetched_at_unix` · `fields` · `kind` · `listed_in_window` · `massive_page_limit` · `max_strikes_per_dte` · `product` · `row_count` · `rows` · `side` · `spot` · `spot_source` · `spot_strike` · `strike_hi` · `strike_lo` · `strike_step` · `underlier` · **`vix`** · `vol_source` · `wings` · `wings_effective` · `wings_requested`.

**Coach's named fields, from that read:**

| Field Coach named | On this retrieve? | What that means for TMI-92 / TMI-93 |
|-------------------|-------------------|-------------------------------------|
| **Symbol** | **Yes.** Envelope `symbol` = `SPX`. Generation `product` = `SPX`, `underlier` = `I:SPX`, `spot` numeric. | Rebind from the hold. A live underlier mark beside a replayed chain is a fail. |
| **Heatmap tiles** | **Yes.** `generation.rows` — listed contracts (`strike`, `side`, mid/bid/ask, `iv`, greeks). | Templates `run()` on that generation (TMI-91). |
| **Positions** | **Not in the envelope.** They are member objects. | Reprice from the held generation (TMI-31 · TMI-92). Not a collection field. A tent that does not move while those rows do is a fail. |
| **VIX** | **Chain envelope cannot supply it.** `vix` is on every generation in the 71 level-0 envelopes; **71 / 71 are `null`.** Not on the envelope top level. | **TMI-94:** do not use this key. Read `marks/vix.jsonl`, nearest-in-time. `generation.vix` null is not VIX NO. A tape gap is VIX NO. Live VIX is a fail. |

**Also true, and not the chain retrieve:**

- The tap **already writes** `marks/vix.jsonl` and `marks/vix1d.jsonl` (`capture_marks` — VIX / VIX1D stay on the mark tape, not as chain books). That is the TMI-94 source.
- SO-AR **A2_1** is the marks **read**. Time Machine **consumes that route when it lands. It does not build one.** Changing the tap to write `generation.vix` is not this spec (§13a item 2). **A2 W-G PASS 2026-08-29:** StudioOne `GET /api/marks` and Labs `GET /api/me/options-lab/archive/marks` now serve the tape. TM consumption is TMOS W3, not this parent line.
- Days already written cannot have `generation.vix` backfilled. They do not need to: the tape is already there. That is why the proof is a pre-feature day.

---

## 12. Suggested path after Coach stamp

Not execution. Sequence only, if this becomes BUILD AUTHORITY:

1. SO-AR amendment: lift the `TODAY_LIVE` refusal; today retrieve + tests (AT-SOAR-8 reversed).
2. One `loadTmDay` for every date. TMI-64 still does not download until the playhead is up.
3. Stop using `captureToday` as a replay derivation. **Its writes into the Time Machine hold go; the live-generation ring that feeds Width Fit Average is a different thing and stays** (§7).
4. **Snapshot at raise (TMI-88).** The hold does not append and does not chase the newest edge. **Tail-append is not offered and is not an alternative** — it was ruled out at §0.4.
5. **TMI-91:** every TM host consumes the hold as the chain. Not Analyzer-only.
6. **TMI-92:** Symbol, VIX, positions, and heatmap tiles rebind from the same hold. Not chain-only.
7. **TMI-93:** a field the hold cannot supply is a named hole. Live-read is fail-closed.
8. **TMI-94 / TMI-95:** VIX from the marks tape, nearest-in-time. Source travels with the mid. OS-13 = 08-27 proxy. OS-14 = 08-29 native. Do **not** wait on `generation.vix`.
9. **TMI-96:** positions dark, not hidden, light at entry (OS-15). **§13a item 1:** no legs until it lights.
10. Inspector line + help (TMI-89). Calendar today is dotted when `count > 0`.
11. Kilo: **AT-TM-OS-1…15** and AT-TM-C11 on a real dense day. Never waive. HOLD rows stay HOLD. OS-13 and OS-14 are live tape walks, not fixtures.

*(v0.2 left step 4 offering tail-append "if Coach flags TMI-88 the other way." Coach had already flagged it. The laws were rewritten and this sequence was not — the same leftover class as v0.7.2, in the one section a builder reads for order.)*

India · Echo · Hotel on the stamp. Juliet plans only after Phase 5. Plan v1.2 is against v0.2.1 and does **not** cover TMI-91…95 — do not stamp it. Juliet re-plans against this file. The next plan does not reopen VIX.

---

## 13. Advisor findings on v0.1 — three withdrawn, one stood

Recorded so the reasoning is inspectable rather than lost.

**Withdrawn as wrong:**

- *Today is uncacheable because its hash moves.* Wrong once the hold is a snapshot. The **day** mutates; a fixed range of it does not, and Labs can cache by range (§6).
- *Tail-append and the 409 rule fight each other.* The conflict was real but it was created by tail-append, which Coach ruled out (§0.4). No mechanism needed.
- *Concurrent today-downloads are a new load profile on the collector.* Coach: ordinary serving latency, comparable to a graphics-heavy page, on a LAN, beside the server (§0.6). AT-SOAR-45 already measured full-pool reads leaving the tap alone.

**Also withdrawn:** an objection that raising the scrubber "stops being instant." Coach: *instant means pretty fast* (§0.7). The trade — instant-but-short becomes brief-wait-then-whole-session — is the point of the redesign, not a regression.

**Stood, and folded:** the inspector line must state the real first print rather than approximating to "from the open" (TMI-89). A two-minute approximation is a lie in a system built on naming what it actually has.

**Consequence the v0.1 opens did not connect, now closed:** retiring decay *increases* resident bytes rather than leaving them unchanged, and memory was already unmeasured with no ceiling. TMI-90 names that as the deliberate experiment and AT-TM-C11 is repointed at a real dense day rather than a thin test.

---

## 13a. Coach — item 1 ruled; 2 and 3 still open

VIX **retrieve** is ruled (TMI-94). These are not that.

| # | Item | Seat |
|---|------|------|
| **1** | Whether a **dark position** shows its legs | **RULED 2026-08-29.** It does not. Presence only — something is there and not yet taken. Legs appear when it lights. Foreshadowing the structure before entry is a fail. Not TMI-92. Completes TMI-96. |
| **2** | Whether the tap also starts writing **`generation.vix`** | Coach. **Still open.** StudioOne change, not this spec. TMI-95: VIX replay does not wait on this. |
| **3** | Whether **anything else the live feed drives** has not been named | Coach. **Still open.** TMI-92's test still applies to what is named; this item is the unnamed remainder. |

---

## 14. Document control

| Version | Date | Notes |
|---------|------|--------|
| **v0.4 §13a-1** | 2026-08-29 | **Not a reissue.** §13a item 1 ruled: dark position does not show legs. Presence only until it lights. Items 2–3 stay Coach. |
| **v0.4 BUILD AUTHORITY** | 2026-08-29 | Coach GO SPEC. TMI-91 desk · TMI-92 original feed · TMI-93 named hole · TMI-94 VIX tape + source travels · TMI-95 do not wait on `generation.vix` · **TMI-96** dark not hidden as its own §3 law, §0.14, and Touches row (Lima W0-1 — not plan-only). OS-13 = 08-27 proxy. OS-14 = 08-29 native. Consumes A2. Plan v1.3 W0-0 stamped. |
| **v0.4 DRAFT — the spec to build** | 2026-08-28 · fold 2026-08-29 | SUPERSEDED as status by BUILD AUTHORITY 2026-08-29. Text of TMI-91…95 stands. |
| **v0.3 DRAFT** | 2026-08-28 | **The hold is the desk (TMI-91 · §0.8)** — hosting the strip is not enough; the generation **is** the chain on Analyzer, Heatmap, and Surface. **TMI-92** the original feed: Symbol, VIX, positions, heatmap tiles — *whatever the original feed was driving* (§0.9–0.11 verbatim). **TMI-93** no live-read of a hole; collection defect, not a permanent limitation. **§11a** envelope read 2026-08-27 SPX: symbol yes; tiles yes; positions not in envelope; `vix` key present, 71/71 level-0 **null**; marks tape not on SO-AR. AT-TM-OS-10…12. Width Fit Replay yes; Average still live-ring (OS-9). SUPERSEDED by v0.4. |
| **v0.2.1 DRAFT** | 2026-08-28 | **Leftover pass, no new rulings.** **§12 no longer offers tail-append** — it was ruled out at §0.4 and the sequence still presented it as an open choice, in the one section a builder reads for order. Same leftover class as v0.7.2. **`day_changed` scoped** to an in-flight fetch only, which is what makes TMI-85 and TMI-88 consistent; a completed hold never meets it. **One member path** for a newer range — Reset then raise, no refresh control invented. **Width Fit Average protected** in §7 and by new **AT-TM-OS-9**: retiring `captureToday` removes its writes into the hold, not the live-generation ring Average needs. **TMI-89 copy** framed as what the archive holds rather than as a truncation notice. **AT-TM-C11** given a consequence: recorded with no advance ceiling, but an unusable number is a Coach decision before ship, not a pass. OS IDs in numeric order. `DRAFT-` drops from the filename. |
| **v0.2 DRAFT** | 2026-08-28 | **Snapshot, not append** (TMI-88 reversed, §0.4) — the hold is what StudioOne held at grab time; a newer range means raising the scrubber again. That fixes the range, so its hash cannot move underneath a member, there is no resume treadmill on a live day, and Labs may cache by range. **Full download** (TMI-90, §0.5) — every date arrives whole; the decay ladder retires with nothing replacing it, coarse-then-infill survives as progress rather than savings, and what it costs resident is measured by a repointed AT-TM-C11 on a real dense session. TMI-75 resolved, TMI-50/68 retired. **TMI-89** states the real first print, not "from the open." New AT-TM-OS-7 and OS-8. §13 records three withdrawn advisor findings. Not BUILD AUTHORITY. |
| **v0.1 DRAFT** | 2026-08-28 | Proposal from Coach's redesign: one StudioOne source; today not login-bounded; maximum time always available. Not BUILD AUTHORITY. |

**Next:** §13a items 2–3 still Coach. AT-SOAR-45 and OS-1 wait for Monday's open. Scrubber landmarks are **TMI-97 DRAFT** — a **usability law directed to the scrubber window** (parent TM §6.2; sibling `DRAFT-FatTail-Labs-Options-Lab-Time-Machine-Scrubber-Landmarks-Spec-v0_1.md`). Not calendar / AV-*. HOLD list stands.

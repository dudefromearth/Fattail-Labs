# Options Lab Time Machine One Source — Full Agent Bench Plan v1.1

**Date:** 2026-08-28  
**Plan revision:** **v1.1**  
**Canonical filename:** `docs/Options-Lab-Time-Machine-One-Source-Full-Agent-Bench-Plan-v1.1.md`  
**Supersedes:** plan v1.0 (written against spec v0.2; §12 of that spec still offered tail-append)  
**Owner (orchestration):** Juliet  
**W0 artifact:** [`agents/go/TMOS-W0.md`](../agents/go/TMOS-W0.md)  
**Board:** [`agents/p-options-lab-tm-os/`](../agents/p-options-lab-tm-os/)  
**Governance:** `agents/bench/doctrine.md` · `AGENTS.md` · spec-create-review-workflow

**Law Delta reads:**

| Doc | Role |
|-----|------|
| Spec **v0.2.1 DRAFT — stamp candidate** | [`Specs/FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_2_1.md`](../Specs/FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_2_1.md) · sha1 `8e88779018d6b096d1d27d1d39b4a3d6fe820da1` |
| Parent **v0.7.4 BUILD AUTHORITY** | [`Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md`](../Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md) · **DL-598** — still law until W0-0 promotes v0.2.1 |
| Parent **SO-AR v0.8 + A1** | retrieve of today is **in** (TMI-85). Do not rebuild SO-AR. |

**What v1.1 adds over plan v1.0** (no new product — leftover pass matching the spec):

- Law file is **v0.2.1**, not v0.2. Spec §12 **no longer offers tail-append**. Plan v1.0 already followed TMI-88; this file stops warning about a leftover that is now gone.
- **`day_changed` is in-flight only.** A completed hold never hashes again (TMI-85 split).
- **Newer range = Reset, then raise.** No refresh control. Coach: disconnect, then reconnect.
- **Width Fit Average is protected (AT-TM-OS-9).** Retiring `captureToday` removes writes **into the TM hold**, not the live-generation ring Average needs.
- **TMI-89 copy:** what the archive holds, not a truncation notice, never a late-login story.
- **AT-TM-C11:** recorded with no advance ceiling; an unusable number is a **Coach decision before ship**, not a pass footnote. OS-1…9 in numeric order.

**Coach GO overlay (spec §0, 2026-08-28):**

- StudioOne is the source of **all** replay — long dates **and** today.
- Redo the design. Not a question about as-built capability.
- Today must not depend on login. **Maximum time** is what StudioOne already holds.
- Snapshot, not tail-append. Newer range = disconnect then reconnect (§0.4).
- Full download, no fade. C11 answers; nobody optimises ahead of the number (§0.5).
- Concurrent downloads are ordinary serving load (§0.6). Collection outranks reads.
- Instant means pretty fast (§0.7). Member name is **Time Machine**.

Juliet does not invent WHAT. Delta: **PASS / FAIL / BLOCKED**, never waived.

**No product code until W0-0 stamps this plan and promotes spec v0.2.1 to BUILD AUTHORITY, and W0-G PASS.**

---

## 0. Mission

```text
W0     India · Echo · Hotel review (no product code) → W0-G
W1     SO-AR: lift TODAY_LIVE refusal; today retrieve; day_changed in-flight only
W2     One load path, one hold; snapshot; captureToday out of the TM hold; Average stays
W3     Inspector hold line (real first print, archive-holds frame) + calendar today dotted
W4     Lima help + parent one-liners
W5     Kilo AT-TM-OS-1…9 + C11 dense day
W-G    Delta — C11 unusable is Coach, not a quiet pass
```

The v0.7.4 GO (`p-options-lab-tm`, W-G PASS) stays closed. Instant Replay / Day boards stay **PARKED**.

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
| **NX-DECAY** | Browser decay ladder (TMI-50/68 **retired**). Returns only if C11 + Coach say so — later packet. |
| **NX-APPEND** | Tail-append / chase-the-newest (TMI-88). Not an alternative. |
| **NX-REFRESH** | A refresh / “get newer” control. Newer range is **Reset, then raise**. |
| **NX-AVG** | Breaking Width Fit Average while retiring `captureToday` as replay. |
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
| **FP7** | **Snapshot, not append** (TMI-88). Newer range = **Reset, then raise**. No refresh control. Hash of the held range does not move. |
| **FP8** | Inspector line names the **actual first downloaded print**, as what the archive **holds**, not a truncation or late-login story (TMI-89). |
| **FP9** | **Full download** (TMI-90). Coarse-then-infill is progress, not savings. C11 measures a real dense session. No ceiling named in advance. Unusable number → Coach before ship. |
| **FP10** | Live desk stays on the socket (Arch 28). Replay does not. |
| **FP11** | Browser never calls StudioOne. Labs proxy only. Collection outranks reads. Concurrent downloads are ordinary load (§0.6). |
| **FP12** | No two-slot film. Occupancy is **one downloaded day** or none. A packet that keeps `captureToday` as the today-replay source **fails W2-G**. |
| **FP13** | **Width Fit Average survives** (AT-TM-OS-9 · TMI-29). Live-generation ring for Average is not the TM hold. |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-0** | Coach stamps **this plan v1.1** on `TMOS-W0.md` **and** promotes spec **v0.2.1 to BUILD AUTHORITY** (or names a fold into TM v0.8). Until then the spec is DRAFT and v0.7.4 is still law. | W0-1 |
| **W0-2 India** | One source; snapshot; full download; `TODAY_LIVE` lift; `day_changed` in-flight only; Average protected; no Labs film; no refresh control; parents *confirm* | W0-G |
| **W0-3 Echo** | Hold line = real first print, archive-holds frame; calendar today dotted; no slider; no Instant Replay; no refresh control; watermark unchanged | W0-G |
| **W0-4 Hotel** | Rehearsal ≠ working order; StudioOne today is print history; no invented print; late tap ≠ member’s late arrival | W0-G |
| **W0-G** | Token stamped; spec BUILD AUTHORITY; three reviews written; **no product code**; leftover TM boards still PARKED | W1 |
| **W1-G** | Today retrieve 200 + snaps when files exist. No 409 `TODAY_LIVE`. AT-SOAR-8 reversed. `day_changed` only on in-flight hash mismatch. Fail-closed: tap paused; MiniTwo; dash bounce | W2 |
| **W2-G** | One `loadTmDay` for every date. Raise today downloads StudioOne today. `captureToday` is not required for the range. **Average still works** (OS-9). Snapshot: last sample does not grow. Switch discards first. Reset drops hold. **No refresh control.** Fail-closed: live-socket film as replay; second hold; tail-append; Average dead; 1-min; Record | W3 |
| **W3-G** | Hold line is the real first print, framed as what the archive holds. Calendar today dotted. No slider. No Instant Replay. No “you arrived late.” | W4 |
| **W4-G** | Help: one source, login is not a bound, Reset-then-raise for newer, fidelity, no Instant Replay. Parents one-liners | W5 |
| **W5-G** | AT-TM-OS-1…**9** characterized. OS-7 snapshot. OS-8 full. OS-9 Average. C11 recorded, **no ceiling**. If the number makes the tab unusable, verdict is **not PASS** without Coach. C6 HOLD. Nothing waived | W-G |
| **W-G** | Fail-closed: TM glow, Record, Labs film, 1-min, Basic chrome, TPO, 1×, Spaces, Factory, Instant Replay name, `TODAY_LIVE` refusal, login-bounded today, megabyte slider, second hold, tail-append, refresh control, Average broken, rehearsal in Trade Log. **C11 unusable without Coach = not ship** | ship |

---

## 3. DAG

```text
W0-0 Coach stamps plan v1.1 + spec v0.2.1 BUILD AUTHORITY
  → W0-1 Lima sha1 + DL
  → W0-2 India ∥ W0-3 Echo ∥ W0-4 Hotel
  → W0-G
       → W1 SO-AR today retrieve → W1-G
            → W2 one load path / snapshot / hold-only captureToday retirement / Average stays → W2-G
                 → W3 hold line + calendar today → W3-G
                      → W4 Lima help → W4-G
                           → W5 Kilo OS-1…9 + C11 → W5-G
                                → W-G
```

W1 is on the Labs reader (`ssr_archive_read` + tests + proxy honesty). **Do not bounce the StudioOne dash.** W2 must not ship a today-download that still 409s.

---

## 4. Packets

### W0 — review (no code)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W0-0-coach-plan-stamp.md` | Coach | `TMOS-W0.md` W0-0 STAMP: plan **v1.1** Accept; spec **v0.2.1 BUILD AUTHORITY** (or named fold) |
| `W0-1-lima-hash.md` | Lima | Confirm sha1 `8e88779018d6b096d1d27d1d39b4a3d6fe820da1` of spec v0.2.1; DL for the stamp; FI-042 **ADOPTED** (snapshot); FI-043 **RESHAPED** (decay retired; C11 empirical + Coach-before-ship) |
| `W0-2-india-parents.md` | India | As-built quote of `TODAY_LIVE`, `captureToday` **into the hold** vs Average ring, `engageTodayFromCache`, two-slot occupancy; TMI-82…90 vs v0.7.4; `day_changed` in-flight only; §12 of v0.2.1 matches TMI-88; no Labs film |
| `W0-3-echo.md` | Echo | APPROVED/RETURNED: TMI-89 real first print, archive-holds frame; calendar today dotted; no slider; no Instant Replay; no refresh control; watermark unchanged |
| `W0-4-hotel.md` | Hotel | APPROVED/RETURNED: StudioOne today is print history; rehearsal KEEP extras; late tap ≠ member’s late arrival |
| `W0-G-delta.md` | Delta | Ternary. No product diff. Spec BUILD AUTHORITY on the token. |

### As-built honesty (read at W0 — not law)

Quoted 2026-08-28. India W0-2 re-quotes; if the tree has moved, the quote wins.

| Seat | As-built |
|------|----------|
| Today replay | `captureToday` from `useOptionChainBus` and `useOpfRiskGraph` into `tmSlots` today slot. Left edge = first gen **this tab** received. |
| Past-day replay | `loadTmDay` → `fillArchiveSlot` → archive slot. |
| Raise today | `loadTmDay(today)` → `engageTodayFromCache()` — **does not** hit StudioOne. |
| SO-AR today | `_book_hole`: if `_is_today(day): return "TODAY_LIVE"`. Index/fetch **409**. AT-SOAR-8 asserts that. Coverage may still list today as `live`. |
| Heatmap inspector | Cache slider **gone** (DL-612). Hold line `heatmap-tm-hold` still describes the **local** film. |
| Width Fit Average | TR14 `getStreamBook()` ring of live OPF gens. **Not** the TM hold. W2 must not delete this ring when retiring `captureToday` as replay. |
| Seed attempt | `seedTodayFromSession` writes StudioOne gens into the today slot — retrieve of today is still refused, so the open cannot land. |
| Two slots | `tmSlots` today + archive. v0.7.4 law. This GO is **one hold**. |
| Leftover boards | `p-options-lab-tmi` PARKED · `p-az-atm` PARKED · `p-options-lab-tm` W-G closed. Do not fire. |

### W1 — SO-AR today retrieve

| Seed | Agent | Files (declare before touch) |
|------|-------|------------------------------|
| `W1-1-alpha-today-retrieve.md` | Alpha | `server/market_data/ssr_archive_read.py` · `server/tests/test_ssr_archive_ladder.py` · `server/tests/test_ssr_archive_read.py` · `server/tests/test_ssr_archive_tm_contract.py` · `server/tests/tm_archive_contract.py` · `server/routes/ssr_archive.py` only if hole mapping lives there |
| `W1-2-kilo.md` | Kilo | Today + snaps → 200 + snaps; empty today → NONE/empty, not TODAY_LIVE; `day_changed` only on in-flight `day_hash` mismatch; past dates unchanged |
| `W1-G-delta.md` | Delta | Fail-closed: 409 TODAY_LIVE on a day with files; tap paused; MiniTwo; dash bounce |

**Out:** rewriting the collector; MiniTwo; dash bounce; cadence change.

### W2 — one load path

| Seed | Agent | Done when |
|------|-------|-----------|
| `W2-1-charlie-one-path.md` | Charlie | `loadTmDay` uses `fillArchiveSlot` for **every** date including today. TMI-64: no download until playhead. Raise today → WAITING → coarse → infill to **full**. **Snapshot:** hold does not append; completed hold does not re-check hash. Switch discards first. Reset drops hold. **`captureToday` writes into the TM hold go.** Live-generation capture that feeds **Width Fit Average stays** (OS-9). Occupancy is one day or none. **No refresh control** — newer range is Reset then raise. |
| `W2-G-delta.md` | Delta | Fail-closed: `engageTodayFromCache` as the today walk; `captureToday` required for OS-1; tail-append; `day_changed` after complete; two holds; Average broken; refresh control; 1-min; Record |

**Proof OS-1:** empty local today slot, playhead raised after 13:00 ET (or fixture whose first StudioOne print is 09:30); left edge is StudioOne’s first print.

**Proof OS-7:** playhead up on today; last sample unchanged after wait; **Reset then raise** lengthens the range.

**Proof OS-9:** Width Fit Average still computes a window mean after `captureToday` is out of the TM hold.

### W3 — hold line + calendar

| Seed | Agent | Done when |
|------|-------|-----------|
| `W3-1-charlie-echo-chrome.md` | Charlie + Echo | TMI-89: hold line is the **actual first downloaded print** in ET, framed as what the archive **holds**. Must not say “from the open.” Must not read as “you arrived late.” Calendar: today with `count > 0` dotted. Uncovered grey + NO PATH. No Instant Replay. No refresh control. Echo APPROVED. |
| `W3-2-tango.md` | Tango | Time Machine; login is not a bound; snapshot honesty (Reset then raise); archive-holds frame. No Instant Replay. |
| `W3-G-delta.md` | Delta | Fail-closed: “from the open” lie; truncation/late-login story; slider; Instant Replay chrome; today grey when count > 0; refresh control |

### W4 — Lima help

| Seed | Agent | Done when |
|------|-------|-----------|
| `W4-1-lima.md` | Lima | Help: one source, date picks the day, raise downloads a snapshot, **Reset then raise** for newer, fidelity, login is not a bound, rehearsal. Parent one-liners (TM derivation + SO-AR today retrieve). No Instant Replay. |
| `W4-G-delta.md` | Delta | Catalog tests. `help_reference/` Instant Replay clean. |

### W5 — Kilo

| Seed | Agent | Done when |
|------|-------|-----------|
| `W5-1-kilo-ats.md` | Kilo | **AT-TM-OS-1…9** with evidence. **AT-TM-C11:** one fully infilled **dense** session (real, infill complete, count matches index). Record resident bytes. **No ceiling named.** If the tab is unusable, say so — do not pass. HOLD C6. Never waive. |
| `W5-G-delta.md` | Delta | Ternary on OS-1…9 + C11 recorded. HOLD C6 is not a fail. Unusable C11 → not PASS without Coach. |

### W-G — Delta final

| Seed | Agent | Done when |
|------|-------|-----------|
| `W-G-delta.md` | Delta | Fail-closed list in §2 W-G. C11 number in the report. Unusable resident → **not ship** without Coach. Never a silent return to live-socket film or Labs `server/` film. |

---

## 5. Acceptance (this GO)

Gate on **AT-TM-OS-1…9** and **AT-TM-C11** (repointed).

| ID | Criterion |
|----|-----------|
| **OS-1** | Late tab, raise today, left edge is StudioOne’s first print of that session. |
| **OS-2** | Same retrieve path for today and a past covered date. No `captureToday` required for the range. |
| **OS-3** | Today index/fetch returns snaps when files exist. No 409 `TODAY_LIVE`. |
| **OS-4** | Switch discards first; Reset drops hold; no second blob. |
| **OS-5** | No megabyte slider; hold line = real first print; no Instant Replay. |
| **OS-6** | Today dotted when count > 0; uncovered grey + NO PATH. |
| **OS-7** | Snapshot: last sample unchanged after minutes of scrubbing; **Reset then raise** lengthens. |
| **OS-8** | Full download: held count matches index; fidelity reaches full; no thinning. |
| **OS-9** | Width Fit Average still a window mean over live generations after TM-hold `captureToday` is gone. |
| **C11** | Resident bytes of **one** fully infilled dense day. No ceiling. Unusable → Coach, not a pass. |
| **C6** | **HOLD.** |

**Do not gate** Basic, TPO, 1×, Record.

Fail-closed: live-socket film as replay source; `TODAY_LIVE` refusal; login-bounded today; megabyte slider; Instant Replay product name; second hold; tail-append; refresh control; Average broken; `day_changed` on a completed hold; client Massive; Labs film module; 1-minute fetch; TM glow; rehearsal in Trade Log.

---

## 6. Relationship to the closed TM GO

| Board | State |
|-------|--------|
| `agents/p-options-lab-tm/` | **W-G PASS** on v0.7.4. Closed. Do not reopen packets. |
| `agents/p-options-lab-tmi/` | PARKED |
| `agents/p-az-atm/` | PARKED |
| `agents/p-studioone-archive-read/` | SO-AR v0.8 GO. This board **amends retrieve of today** in the Labs reader; it does not fire that board’s leftover W8 or bounce the dash. |

Chrome already shipped (strip, watermark, rehearsal, calendar, fidelity) is **reused**. This GO changes **derivation**, not the surface.

---

## 7. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.1** | 2026-08-28 | **Stamp target.** Law = One Source spec **v0.2.1**. Snapshot; Reset-then-raise; `day_changed` in-flight only; Average protected (OS-9); C11 unusable is Coach-before-ship; hold line archive-holds frame. Supersedes plan v1.0. |
| **v1.0** | 2026-08-28 | Written against spec v0.2. SUPERSEDED: that spec’s §12 still offered tail-append. Do not stamp v1.0. |

**One-line law:**  
**One surface, one scrubber, one source — StudioOne for every date including today; the hold is a snapshot; newer range is Reset then raise; a late login still gets what the archive holds; full download, measured not argued, unusable is Coach; Instant Replay is not a name; Average is not replay; Basic, TPO, and 1× are not this GO.**

# Options Lab Time Machine One Source — Full Agent Bench Plan v1.0

**Date:** 2026-08-28  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/Options-Lab-Time-Machine-One-Source-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**W0 artifact:** [`agents/go/TMOS-W0.md`](../agents/go/TMOS-W0.md)  
**Board:** [`agents/p-options-lab-tm-os/`](../agents/p-options-lab-tm-os/)  
**Governance:** `agents/bench/doctrine.md` · `AGENTS.md` · spec-create-review-workflow

**Law Delta reads:**

| Doc | Role |
|-----|------|
| Spec **v0.2 DRAFT** (stamp target) | [`Specs/DRAFT-FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_2.md`](../Specs/DRAFT-FatTail-Labs-Options-Lab-Time-Machine-One-Source-Spec-v0_2.md) · sha1 `474cfb0e5d7ac28cc226dfee67cdb6ea117a23c2` |
| Parent **v0.7.4 BUILD AUTHORITY** | [`Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md`](../Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md) · **DL-598** — still law until W0-0 promotes v0.2 |
| Parent **SO-AR v0.8 + A1** | retrieve of today is **in** this GO (TMI-85). Do not rebuild SO-AR. |

**Coach GO overlay (from spec §0, 2026-08-28):**

- StudioOne is the source of **all** replay — long dates **and** today.
- Redo the design. This is not a question about as-built capability.
- Today must not depend on when the member logs in. **Maximum time** is what StudioOne already holds.
- Snapshot, not tail-append: they get what StudioOne held at raise; a newer range means raise again (§0.4).
- Full download, no fade. See what it costs resident (§0.5). AT-TM-C11 answers; nobody optimises ahead of the number.
- Concurrent downloads are ordinary serving load (§0.6). Collection still outranks reads.
- Instant means pretty fast (§0.7). Member name is **Time Machine**.

Juliet does not invent WHAT. Spec §12’s “suggested path” still mentions tail-append — **stale.** This plan follows **v0.2 law** (TMI-88 snapshot). Delta: **PASS / FAIL / BLOCKED**, never waived.

**No product code until W0-0 stamps this plan and promotes spec v0.2 to BUILD AUTHORITY, and W0-G PASS.**

---

## 0. Mission

```text
W0     India · Echo · Hotel review (no product code) → W0-G
W1     SO-AR: lift TODAY_LIVE refusal; today retrieve
W2     One load path, one hold; today = past date; snapshot; kill captureToday as replay
W3     Inspector hold line (real first print) + calendar today dotted
W4     Lima help + parent one-liners
W5     Kilo AT-TM-OS-1…8 + C11 dense day
W-G    Delta
```

The v0.7.4 GO (`p-options-lab-tm`, W-G PASS) stays closed. Leftover Instant Replay / Day boards stay **PARKED**. This board does not reopen them.

### Out of this GO (NX)

| ID | Out |
|----|-----|
| **NX-B** | Basic / Enhanced chrome. AT-TM-C6 **HOLD**. |
| **NX-TPO** | TPO walk. ATM-17 **HOLD**. |
| **NX-1X** | 1× speed. |
| **NX-FILM** | Any Labs `server/` replay cache / film module. StudioOne’s tap is the collector, not a Labs film. |
| **NX-REC** | Record control. |
| **NX-GLOW** | Time Machine glow. What-if red untouched. |
| **NX-1M** | 1-minute past-day fetch. |
| **NX-IR** | Instant Replay as a member-facing name. |
| **NX-SLIDER** | Heatmap megabyte Cache slider (already gone · DL-612). Do not restore. |
| **NX-DECAY** | Browser decay ladder as a memory mechanism (TMI-50/68 **retired**). Returns only if C11 says it must — a later packet, not this GO silently. |
| **NX-APPEND** | Tail-append / chase-the-newest while scrubbing (TMI-88). |
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
| **FP5** | The tab holds a **buffer** so 50× is a lookup. Not a second source. Not a Labs film (TMI-86). |
| **FP6** | Date on today without a playhead is **live** (TMI-64). Raise on today **downloads** StudioOne’s today as it stands, parks on newest print **in that snapshot** (TMI-87). |
| **FP7** | **Snapshot, not append** (TMI-88 · §0.4). Newer range = raise again (Reset then raise, or raise on today again per spec flow). Hash of the held range does not move. |
| **FP8** | Inspector line names the **actual first downloaded print**, not “from the open” (TMI-89). |
| **FP9** | **Full download** (TMI-90). Coarse-then-infill is progress, not savings. Destination is the whole day. C11 measures a real dense session. No ceiling named in advance. |
| **FP10** | Live desk stays on the socket (Arch 28). Replay does not. |
| **FP11** | Browser never calls StudioOne. Labs proxy only. Collection outranks reads. Concurrent member downloads are ordinary load (§0.6). |
| **FP12** | No `heldDay` *and* no two-slot film. Occupancy is **one downloaded day** or none. A packet that keeps `captureToday` as the today-replay source **fails W2-G**. |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-0** | Coach stamps **this plan v1.0** on `TMOS-W0.md` **and** promotes spec **v0.2 to BUILD AUTHORITY** (or names a fold into TM v0.8). Until then the spec is DRAFT and v0.7.4 is still law. | W0-1 |
| **W0-2 India** | One source; snapshot not append; full download; `TODAY_LIVE` lift is in-program; no Labs film; parents *confirm*; v0.7.4 IDs superseded are listed not erased; Heatmap Redis ≠ this hold | W0-G |
| **W0-3 Echo** | Hold line = real first print; calendar today dotted when `count > 0`; no slider; no Instant Replay chrome; watermark grammar unchanged | W0-G |
| **W0-4 Hotel** | Rehearsal still ≠ working order; today-from-StudioOne is not a live market; no invented print | W0-G |
| **W0-G** | Token stamped; spec BUILD AUTHORITY; three reviews written; **no product code**; leftover TM boards still PARKED | W1 |
| **W1-G** | Index/fetch of today returns snaps when files exist. No 409 `TODAY_LIVE`. AT-SOAR-8 reversed. Coverage today `live: true` + count. Fail-closed: tap paused; MiniTwo; dash bounce | W2 |
| **W2-G** | One `loadTmDay` for every date. Raise today downloads StudioOne today. `captureToday` is not required for the range. Snapshot: last sample does not grow while scrubbing. Switch discards first. Reset drops hold. Fail-closed: live-socket film as replay; second hold; tail-append; 1-min fetch | W3 |
| **W3-G** | Hold line is the real first print (not “from the open”). Calendar today dotted. No megabyte slider. No Instant Replay in chrome | W4 |
| **W4-G** | Help: one source, login is not a bound, snapshot, fidelity, no Instant Replay. Parents one-liners | W5 |
| **W5-G** | AT-TM-OS-1…8 characterized. OS-7 snapshot. OS-8 full download. C11 = one fully infilled dense day, **no ceiling**. C6 HOLD. Nothing waived | W-G |
| **W-G** | Fail-closed: TM glow, Record, Labs film, 1-min, Basic chrome, TPO, 1×, Spaces, Factory, Instant Replay name, `TODAY_LIVE` refusal, login-bounded today, megabyte slider, second hold, tail-append, rehearsal in Trade Log | ship |

---

## 3. DAG

```text
W0-0 Coach stamps plan v1.0 + spec v0.2 BUILD AUTHORITY
  → W0-1 Lima sha1 + DL
  → W0-2 India ∥ W0-3 Echo ∥ W0-4 Hotel
  → W0-G
       → W1 SO-AR today retrieve → W1-G
            → W2 one load path / one hold / snapshot / no captureToday replay → W2-G
                 → W3 hold line + calendar today → W3-G
                      → W4 Lima help → W4-G
                           → W5 Kilo OS-1…8 + C11 → W5-G
                                → W-G
```

W1 is on the Labs reader (`ssr_archive_read` + tests + proxy honesty). **Do not bounce the StudioOne dash.** W2 must not ship a today-download that still 409s.

---

## 4. Packets

### W0 — review (no code)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W0-0-coach-plan-stamp.md` | Coach | `TMOS-W0.md` W0-0 STAMP: plan **v1.0** Accept; spec **v0.2 BUILD AUTHORITY** (or named fold) |
| `W0-1-lima-hash.md` | Lima | Confirm sha1 `474cfb0e5d7ac28cc226dfee67cdb6ea117a23c2` of spec v0.2; DL for the stamp; FI-042 **ADOPTED** (snapshot); FI-043 **RESHAPED** (decay retired; C11 empirical) |
| `W0-2-india-parents.md` | India | As-built quote of `TODAY_LIVE` refusal, `captureToday` call sites, two-slot occupancy; parents *confirm*; TMI-82…90 vs v0.7.4 supersession table; no Labs film; Heatmap Redis ≠ hold |
| `W0-3-echo.md` | Echo | APPROVED/RETURNED: TMI-89 real first print; calendar today dotted; no slider; no Instant Replay; watermark unchanged |
| `W0-4-hotel.md` | Hotel | APPROVED/RETURNED: StudioOne today is a **print history**, not a live working market; rehearsal KEEP extras still hold |
| `W0-G-delta.md` | Delta | Ternary. No product diff. Spec BUILD AUTHORITY on the token. |

### As-built honesty (read at W0 — not law)

Quoted 2026-08-28. India W0-2 re-quotes; if the tree has moved, the quote wins.

| Seat | As-built |
|------|----------|
| Today replay | `captureToday` from `useOptionChainBus` and `useOpfRiskGraph` into `tmSlots` today slot. Left edge = first gen **this tab** received. |
| Past-day replay | `loadTmDay` → `fillArchiveSlot` → archive slot. |
| Raise today | `loadTmDay(today)` → `engageTodayFromCache()` — **does not** hit StudioOne. |
| SO-AR today | `_book_hole`: if `_is_today(day): return "TODAY_LIVE"`. Index/fetch **409**. AT-SOAR-8 asserts that. Coverage may still list today as `live`. |
| Heatmap inspector | Cache slider **gone** (DL-612). Hold line `heatmap-tm-hold` still describes the **local** film / seed attempt. |
| Seed attempt | `seedTodayFromSession` writes StudioOne gens into the today slot — but retrieve of today is still refused, so the seed cannot land the open. |
| Two slots | `tmSlots` today + archive. v0.7.4 law. This GO replaces with **one hold**. |
| Leftover boards | `p-options-lab-tmi` PARKED · `p-az-atm` PARKED · `p-options-lab-tm` W-G closed. Do not fire. |

### W1 — SO-AR today retrieve

| Seed | Agent | Files (declare before touch) |
|------|-------|------------------------------|
| `W1-1-alpha-today-retrieve.md` | Alpha | `server/market_data/ssr_archive_read.py` (`_book_hole` / retrieve of today) · `server/tests/test_ssr_archive_ladder.py` (AT-SOAR-8 reverse) · `server/tests/test_ssr_archive_tm_contract.py` / `tm_archive_contract.py` if they encode TODAY_LIVE · proxy `server/routes/ssr_archive.py` only if hole mapping lives there |
| `W1-2-kilo.md` | Kilo | Characterization: today with snaps → 200 + snaps; empty today → NONE/empty, not TODAY_LIVE; coverage `live: true` + count; past dates unchanged |
| `W1-G-delta.md` | Delta | Fail-closed: 409 TODAY_LIVE on a day with files; tap paused; MiniTwo; dash bounce |

**Out:** rewriting the collector; MiniTwo; StudioOne dash bounce; changing cadence.

### W2 — one load path

| Seed | Agent | Done when |
|------|-------|-----------|
| `W2-1-charlie-one-path.md` | Charlie | `loadTmDay` uses `fillArchiveSlot` for **every** date including today. TMI-64: date on today without playhead does **not** download. Raise today → WAITING → coarse → infill to **full**. Snapshot: hold does not append. Switch discards first. Reset drops hold. `captureToday` is **not** a replay derivation (remove or no-op the bus/risk-graph writes into the TM hold). Occupancy is one day or none. |
| `W2-G-delta.md` | Delta | Fail-closed: engageTodayFromCache as the today walk; captureToday required for OS-1; tail-append; two holds; 1-min; Record |

**Proof OS-1:** a tab with an empty today slot, playhead raised after 13:00 ET (or a fixture whose first StudioOne print is 09:30), left edge is StudioOne’s first print — not “now.”

**Proof OS-7:** with playhead up on today, wait while the tap would have written; last sample unchanged; Reset + re-raise lengthens the range.

### W3 — hold line + calendar

| Seed | Agent | Done when |
|------|-------|-----------|
| `W3-1-charlie-echo-chrome.md` | Charlie + Echo | TMI-89: `heatmap-tm-hold` (and any host line) is the **actual first downloaded print** in ET. Must not say “from the open” as an approximation. Calendar: today with `count > 0` is dotted (`data-tm-covered="true"`), not grey-because-live. Uncovered stay grey + NO PATH. No Instant Replay copy. Echo APPROVED. |
| `W3-2-tango.md` | Tango | Member copy: Time Machine; login is not a bound; snapshot honesty. No Instant Replay. |
| `W3-G-delta.md` | Delta | Fail-closed: “from the open” lie; slider; Instant Replay chrome; today grey when count > 0 |

### W4 — Lima help

| Seed | Agent | Done when |
|------|-------|-----------|
| `W4-1-lima.md` | Lima | `options-lab-time-machine.md` + Heatmap hold: one source, date picks the day, raise downloads, snapshot, fidelity, what you cannot persist. Parent one-liners (TM §13 seats, SO-AR §3). No Instant Replay. §12 leftovers stay records. |
| `W4-G-delta.md` | Delta | Help catalog; grep Instant Replay in `help_reference/` clean |

### W5 — Kilo

| Seed | Agent | Done when |
|------|-------|-----------|
| `W5-1-kilo-ats.md` | Kilo | **AT-TM-OS-1…8** with evidence. **AT-TM-C11 repointed:** one fully downloaded dense day (real session, infill waited to completion, count matches index). Record resident bytes. **No ceiling named.** Decay not this GO. C6 HOLD. Never waive. |
| `W5-G-delta.md` | Delta | Ternary on OS-1…8 + C11 recorded. HOLD C6 is not a fail. |

### W-G — Delta final

| Seed | Agent | Done when |
|------|-------|-----------|
| `W-G-delta.md` | Delta | Fail-closed list in §2 W-G. C11 number in the report. If full download blows the tab, that is evidence for a later ladder packet — **not** a silent return to live-socket film or Labs `server/` film. |

---

## 5. Acceptance (this GO)

Gate on **AT-TM-OS-1, 2, 3, 4, 5, 6, 7, 8** and **AT-TM-C11** (repointed).

| ID | Criterion |
|----|-----------|
| **OS-1** | Late tab, raise today, left edge is StudioOne’s first print of that session. |
| **OS-2** | Same retrieve path for today and a past covered date. No `captureToday` required. |
| **OS-3** | Today index/fetch returns snaps when files exist. No 409 `TODAY_LIVE`. |
| **OS-7** | Snapshot: last sample unchanged after minutes of scrubbing; Reset+re-raise lengthens. |
| **OS-8** | Full download: held count matches index; fidelity reaches full; no thinning. |
| **OS-4** | Switch discards first; Reset drops hold; no second blob. |
| **OS-5** | No megabyte slider; hold line = real first print; no Instant Replay. |
| **OS-6** | Today dotted when count > 0; uncovered grey + NO PATH. |
| **C11** | Resident bytes of **one** fully infilled dense day. No ceiling. Ladder not frozen. |
| **C6** | **HOLD.** |

**Do not gate** Basic, TPO, 1×, Record.

Fail-closed: live-socket film as replay source; `TODAY_LIVE` refusal; login-bounded today; megabyte slider; Instant Replay product name; second hold; tail-append; client Massive; Labs film module; 1-minute fetch; TM glow; rehearsal in Trade Log.

---

## 6. Relationship to the closed TM GO

| Board | State |
|-------|--------|
| `agents/p-options-lab-tm/` | **W-G PASS** on v0.7.4. Closed. Do not reopen packets. |
| `agents/p-options-lab-tmi/` | PARKED |
| `agents/p-az-atm/` | PARKED |
| `agents/p-studioone-archive-read/` | SO-AR v0.8 GO. This board **amends retrieve of today** in Labs reader tests; it does not fire that board’s leftover W8 or bounce the dash. |

Chrome already shipped (strip, watermark, rehearsal, calendar, fidelity) is **reused**. This GO changes **derivation**, not the surface.

---

## 7. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | 2026-08-28 | Stamp target. Law = One Source spec **v0.2** once W0-0 promotes it. Snapshot (TMI-88). Full download (TMI-90). Login is not a bound (TMI-83). Spec §12 tail-append line is stale and is **not** this plan. |

**One-line law:**  
**One surface, one scrubber, one source — StudioOne for every date including today; the hold is a snapshot of what the archive had at raise; a late login still gets the open; full download, measured not argued; Instant Replay is not a name; Basic, TPO, and 1× are not this GO.**

# Options Lab Time Machine — Full Agent Bench Plan v1.2

**Date:** 2026-08-27  
**Plan revision:** **v1.2**  
**Canonical filename:** `docs/Options-Lab-Time-Machine-Full-Agent-Bench-Plan-v1.2.md`  
**Supersedes:** plan v1.1 and v1.0. **Stamp target.**  
**Parent boards PARKED:** Instant Replay `agents/p-options-lab-tmi/` (32 seeds, never stamped) and Day `agents/p-az-atm/` (15 seeds; W0-0 / W0-BA / W1-G / W2-G already ran). Census in this file §7.  
**Owner (orchestration):** Juliet  
**W0 artifact:** [`agents/go/TM-W0.md`](../agents/go/TM-W0.md)  
**Board:** [`agents/p-options-lab-tm/`](../agents/p-options-lab-tm/)  
**Governance:** `agents/bench/doctrine.md` · `AGENTS.md` · spec-create-review-workflow

**Law Delta reads:**

| Doc | Role |
|-----|------|
| Spec **v0.7.4 BUILD AUTHORITY** | `Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md` · **DL-598** |

**Coach GO (2026-08-27), this plan’s binding overlay** — the v0.7.3 GO is replaced:

- Two browser slots: **today always capturing**; at most **one archive day**.
- No `server/` film. Capture always on. No Record control.
- No TM glow. REPLAY watermark + rehearsal badge.
- Rehearsal objects die on Reset; never Trade Log / alert store.
- Past day = StudioOne chain. No 1-minute fetch.
- **TMI-79 = two slots, not one day total.** HOLD-1 is **closed** — it is spec law, not a plan tick.
- India, Echo, Hotel per spec §14 (W0).
- **First Analyzer packet = layout move.** Parents §13 one-liners in the same packet.
- Basic / TPO / 1× out of this GO.
- §12 is a record, not a question list.
- Spaces and Factory stay out.
- **Today keeps capturing while an archive day is open.**
- **No implementation until this plan is stamped.**

Juliet does not invent WHAT. Delta: **PASS / FAIL / BLOCKED**, never waived.

---

## 0. Mission

```text
W0     India · Echo · Hotel review (no product code) → W0-G
W1     Layout: Strikes/in left of Autofit + §13 parent one-liners
W2     Two-slot browser cache (today always on + empty archive slot) + playhead owner
W3     Watermark + badge grammar (Echo) on the three hosts; Tango signal check
W4     Transport + date control + today derivation (capture always on)
W5     Past-day StudioOne consumer (coarse then infill, fidelity, mini line)
W6     Heatmap + Surface + Width Fit Replay (sticky scrubber)
W7     Rehearsal objects (Hotel + Charlie) — die on Reset
W8     Kilo AT-ATM / AT-TMI / AT-TM-C (held ATs not gated)
W9     Lima help + leftover honesty
W-G    Delta
```

**No product code in W0.** W1+ only after **this plan is stamped** and **W0-G PASS**.

### Out of this GO (NX)

| ID | Out |
|----|-----|
| **NX-B** | Basic / Enhanced chrome and ATM-B2 force-off. AT-TM-C6 **held**. GEX/Probability stay live prefs. |
| **NX-TPO** | TPO payload, ATM-P3 walk, NO TPO chrome. Simple chain-spot walk only (TMI-K1 generation spot). |
| **NX-1X** | 1× speed. Speeds are 10× / 20× / 50×. FLAGGED §12.11, not built. |
| **NX-FILM** | Any `server/` replay cache / film module. |
| **NX-REC** | Record control. Capture is always on. |
| **NX-GLOW** | Time Machine glow of any colour. What-if red glow is untouched. |
| **NX-1M** | Past-day 1-minute underlier fetch. |
| **NX-SF** | Spaces. Factory. MiniTwo until asked. Tradier. Client Massive. Second WS. |

§12.4 cadence is **read and record** (India W0), not a Coach tick. §12.7–12.19 that remain “smaller opens” are **not tickets**.

---

## 1. Locked (FP)

| ID | Decision |
|----|----------|
| **FP1** | One component, one scrubber, one date control, today pre-selected (TMI-1, TMI-64). |
| **FP2** | Two slots, one playhead (**TMI-79 v0.7.4**). **Today** always capturing; dies on trading-date change only. **Archive** at most one past day; switch discards before accept; Reset / return-to-live drops the archive slot. Today’s slot is the continuous capture — scrubbing today windows that slot; it does **not** occupy the archive slot. |
| **FP3** | Capture always on. No Record (TMI-65). Loading a past day does **not** pause today’s writer. |
| **FP11** | **HOLD-1 CLOSED.** v0.7.3 wording manufactured a collision. v0.7.4 is the law. W2-G must **not** fail “today + one archive.” A packet that implements `heldDay: Date \| null` as a single variable **fails** W2-G. |
| **FP12** | Two blobs, **one** playhead (TMI-42). Opening a past day does not fork a cursor. Return to live drops the archive slot and parks on **today’s newest**, not a leftover past-day `t_ms`. Heatmap Redis generation cache is **not** this cache (A4). |
| **FP4** | No TM glow. REPLAY watermark + rehearsal badge (TMI-25, TMI-81). |
| **FP5** | Rehearsal objects: badge, replay clock, never Trade Log / alert store, announced disposal (TMI-80). |
| **FP6** | Past day = StudioOne coverage · index · levelled fetch. TM contract harness already exists (`tests/tm_archive_contract.py`). |
| **FP7** | Mini window is a **line** downsampled from the chain (ATM-H2). Not a second spot source. |
| **FP8** | First Analyzer packet is **layout only**: Strikes/in left of Autofit; transport right of Autofit in the dark strip (§6.1). |
| **FP9** | Parent §13 one-liners ship in **W1**, same packet as the layout. |
| **FP10** | SO-AR is consumed, not rebuilt. No MiniTwo. No dash bounce on this board. |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-0** | Coach stamps **this plan v1.2** on `TM-W0.md` (spec already BUILD AUTHORITY · DL-598) | W0-1 |
| **W0-2 India** | As-built quotes; two slots + one playhead; no `heldDay` singleton; no film module; Heatmap Redis ≠ TM cache; cadence **recorded**; parents *confirm*; §12 not a queue | W0-G |
| **W0-3 Echo** | Watermark/badge grammar; layout as-built vs §6.1; no TM glow | W0-G |
| **W0-4 Hotel** | Rehearsal ≠ live order; watermark ≠ P&L/go; no invented print | W0-G |
| **W0-G** | Token stamped; three reviews written; **no product code**; leftover boards PARKED; TMI-79 two slots cited | W1 |
| **W1-G** | TM immediately right of Autofit; Strikes/in left; PiP not between; §13 one-liners in parents; Echo PASS | W2 |
| **W2-G** | Two slots exist; one playhead; capture continues; no `server/` film. Fail-closed: capture paused; today discarded on past-date select; two **archive** days; `heldDay: Date \| null` singleton | W3 |
| **W3-G** | Watermark on three hosts; no TM glow; reduced-motion static; Tango does not read a go-signal | W4 |
| **W4-G** | Date today; capture always on; Reset exits; no Record | W5 |
| **W5-G** | Past day via StudioOne into the **archive slot**; today cache still filling; no 1-min fetch; coarse-then-infill; NO PATH greys. **Demonstrate** (not inferred from W2 empty slot): switch discards first; Reset drops archive and today survives; today keeps capturing while archive is open. Fail-closed: capture paused; today discarded; two archive days | W6 |
| **W6-G** | Sticky `t_ms` Analyzer→Heatmap→Surface; Width Fit Replay ≠ Average | W7 |
| **W7-G** | Rehearsal badge; Reset disposes with copy; Trade Log / alert store empty | W8 |
| **W-G** | Fail-closed: TM glow, Record, server film, 1-min past-day, Basic chrome, TPO, 1×, Spaces, Factory, capture paused, today discarded on past-day load, leftover TM boards unparked | ship |

---

## 3. DAG

```text
W0-0 Coach stamps this plan v1.2
  → W0-1 Lima sha1 + DL
  → W0-2 India ∥ W0-3 Echo ∥ W0-4 Hotel
  → W0-G
       → W1 layout + §13 one-liners → W1-G
            → W2 cache + playhead → W2-G
                 → W3 watermark/badge (+ Tango signal) → W3-G
                      → W4 transport/today → W4-G
                           → W5 past-day StudioOne → W5-G
                                → W6 Heatmap/Surface/WF Replay → W6-G
                                     → W7 rehearsal → W7-G
                                          → W8 Kilo → W8-G
                                          → W9 Lima
                                     → W-G
```

---

## 4. Packets

### W0 — review (no code)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W0-0-coach-plan-stamp.md` | Coach | `TM-W0.md` W0-0 STAMP of plan **v1.2** |
| `W0-1-lima-hash.md` | Lima | Confirm sha1 `c325711e30cf8b2791582e8b4db03a941b70960a` of spec v0.7.4 (DL-598); DL for **this plan v1.2** stamp |
| `W0-2-india-parents.md` | India | Path+line as-built (toolbar grid, strip, `algo_replay` `ohlc_1m` leftover, What-if misnomer); no film module; cadence **recorded** from archive (or named hole); corpus-bytes **recorded** (or named hole); Heatmap Redis cache vs browser TM cache **recorded**; parent filenames *confirm*; §12 is a record |
| `W0-3-echo.md` | Echo | APPROVED/RETURNED: first packet is layout (TM immediately right of Autofit; Strikes/in already left); watermark/badge grammar; glow is What-if only |
| `W0-4-hotel.md` | Hotel | APPROVED/RETURNED: rehearsal ≠ working order; watermark not a signal; past-day spot is the generation under the playhead |
| `W0-G-delta.md` | Delta | Ternary. No product diff. |

### As-built honesty (read at W0 — not law)

Quoted from the tree on 2026-08-27. India W0-2 must re-quote; if the tree has moved, the quote wins.

| Seat | As-built |
|------|----------|
| Analyzer toolbar | `data-testid="analyzer-viewport-toolbar"` is `grid-cols-[auto_minmax(min-content,1fr)_auto]`. Left: Symbol / Spot / VIX. Center wrap: **Strikes/in then Autofit then PiP**. Right column (`justify-end`): `AnalyzerTimeMachineStrip`. Spec §11's "`ml-auto` on the far right" is **stale**. Strikes/in is already left of Autofit. |
| W1 job | **Not** "move Strikes/in off `ml-auto`." Seat Time Machine **immediately right of Autofit** in the same dark strip (§6.1). PiP must not sit between Autofit and the transport. No new widget. |
| Strip already exists | `AnalyzerTimeMachineStrip.tsx`: date input, Play / Pause / Stop, speeds **10 / 20 / 50** (`REPLAY_SPEEDS`), Reset. W4 is behaviour (today pre-selected, capture always on, park rules, Stop vs Reset), not a greenfield chrome build. |
| Past-day leftover | `server/market_data/algo_replay_path.py` `list_days` still offers `source: "ohlc_1m"` when no archive is mounted; client `fetchAlgoReplayPath` hits `/api/me/options-lab/algo-replay/path`. **Retired as a past-day walk (A1).** W5 consumes StudioOne coverage · index · levelled fetch. Fail-closed: 1-minute / 5-minute OHLC as the replay path. |
| What-if misnomer | Inspector `timeMachineEnabled` is What-if Enable. Do not bless the identifier. What-if red glow stays. |
| Contract already on disk | `server/tests/tm_archive_contract.py` + `test_ssr_archive_tm_contract.py`. W5 consumes it; do not rebuild SO-AR. |

### W1 — first Analyzer packet (layout + parents)

| Seed | Agent | Files |
|------|-------|-------|
| `W1-1-charlie-layout.md` | Charlie | `web/components/options-lab/OpfRiskAnalyzer.tsx` toolbar: Strikes/in **left of Autofit** (already); `AnalyzerTimeMachineStrip` **immediately right of Autofit**; PiP not between them |
| `W1-2-lima-parents.md` | Lima | §13 one-liners in Analyzer, What-If, Heatmap Templates, Width Fit, Surface §4.6, Trade Log, AZ-ALGO, Arch 28, DL-400 lineage, decision log |
| `W1-3-echo.md` | Echo | Visual: Strikes/in left, Autofit, transport right; 44pt hits; no new widget; no mini window yet |
| `W1-G-delta.md` | Delta | Layout + parents in **one** packet. Fail-closed: watermark this wave, parent one-liners skipped, Basic chrome |

### W2 — browser cache + playhead owner (two slots)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W2-1-charlie-cache.md` | Charlie | **Today slot** + **archive slot** as two variables, never `heldDay: Date \| null`. Always capturing. One playhead. Named **NO DATE** if OPF date missing. **No `server/` film.** No Redis TM write. Capture does not pause. |
| `W2-G-delta.md` | Delta | Fail-closed: `server/` film; capture paused; today discarded because a past date was selected; Record control; a single `heldDay` occupancy variable. **Today + empty archive is lawful.** |

### W3 — tells (Echo grammar; Charlie paint; Tango signal check)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W3-1-echo-tells.md` | Echo + Charlie | REPLAY watermark on Analyzer, Heatmap, Surface (`analyzer-replay-watermark` / `heatmap-replay-watermark` / `surface-replay-watermark`). Badge = half recycle, CCW, rehearsal cards only. No TM glow. What-if red may coexist. Behind plot; no P&L colour; `pointer-events: none`; reduced-motion = static. |
| `W3-2-tango.md` | Tango | Watermark + badge do **not** read as go / profit. Copy names **Time Machine**. Spec §14 Phase 3. |
| `W3-G-delta.md` | Delta | Fail-closed: any TM glow; P&L-coloured watermark; interactive watermark |

### W4 — transport / today (as-built strip, behaviour)

| Seed | Agent | Done when |
|------|-------|-----------|
| `W4-1-charlie-transport.md` | Charlie | Date control always present, **today pre-selected**. Scrubber up = replay. Today parks **newest** gen; past parks **first print** at session open (ATM-O1). Speeds 10/20/50 only. Reset = What-if Reset (exit). Stop does not hide the mini window; Reset does. Capture always on. Mini **line** for today from the held cache. No Record. No 1×. |
| `W4-G-delta.md` | Delta | Fail-closed: Record; 1×; Reset not exiting; date missing today |

### W5 — past-day StudioOne

| Seed | Agent | Done when |
|------|-------|-----------|
| `W5-1-charlie-pastday.md` | Charlie | Fill the **archive slot** from SO-AR. Today slot **keeps capturing**. Switch past days discards first. Return to live / date=today drops archive and parks **today’s newest**, not leftover past `t_ms`. Coarse then infill. Fidelity. Mini line from the same generations. NO PATH greys. No 1-min. TPO out. |
| `W5-G-delta.md` | Delta | Fail-closed: 1-minute past-day fetch; serial left-to-right-only fill; uncovered date selectable without NO PATH; capture paused; today discarded; two archive days held |

### W6 — Heatmap, Surface, Width Fit

| Seed | Agent | Done when |
|------|-------|-----------|
| `W6-1-charlie-hosts.md` | Charlie | Same scrubber and date on Heatmap and Surface. Sticky `t_ms` (AT-TM-C3). Width Fit **Live \| Average \| Replay** — Average stays a window mean. Templates stay pure. Surface listed-leg IV rebinds from the chain at *t* (Surface §4.6). |
| `W6-G-delta.md` | Delta | Fail-closed: private per-host cursor; Replay collapsed into Average; second Massive socket |

### W7 — rehearsal objects

| Seed | Agent | Done when |
|------|-------|-----------|
| `W7-1-hotel-rehearsal.md` | Charlie + Hotel | Alerts and positions under a playhead are rehearsal: badge, replay clock, **never** alert store, **never** Trade Log. Reset announces disposal. Hotel blocks any reading as a live working order. |
| `W7-G-delta.md` | Delta | Fail-closed: rehearsal in Trade Log or alert store; silent vanish on Reset; no badge |

### W8 — Kilo ATs · W9 — Lima help

| Seed | Agent | Done when |
|------|-------|-----------|
| `W8-1-kilo-ats.md` | Kilo | AT-ATM-1…20, AT-TMI-1…34, AT-TM-C1–C5, C7–C10 as they apply without Basic / TPO / 1×. **HOLD AT-TM-C6.** **AT-TM-C11** (plan-level): full simulated session records resident bytes of today’s cache (native + decayed), then a full-fidelity past day on top; **no ceiling named**. AT-TM-C8 = memory does not grow with archive days *visited* (one archive slot + today). Never waive. |
| `W8-G-delta.md` | Delta | Ternary on the GO acceptance set. HOLD C6 is not a fail. |
| `W9-1-lima.md` | Lima | Help: one surface, date picks the day, fidelity says how sharp a past day is, what you cannot persist while scrubbing. §12 leftover items stay records, not tickets. No Instant Replay product name in member copy. |
| `W-G-delta.md` | Delta | Fail-closed: TM glow, Record, server film, 1-min past-day, Basic chrome, TPO, 1×, Spaces, Factory, rehearsal in Trade Log or alert store |

---

## 5. Acceptance (this GO)

Gate on **AT-TM-C1, C2, C3, C4, C5, C7, C8, C9, C10, C11** and the ATM/TMI rows that do not require Basic, TPO, or 1×.

**Do not gate** AT-TM-C6 (Basic held §12.15).

**AT-TM-C8** (spec v0.7.4): selecting a second *past* day discards the first before accepting it; today’s capture continues; return to live drops the archive slot; memory does not grow with days *visited*.

**AT-TM-C11** (spec v0.7.4): run a full simulated session; record resident bytes of today’s cache at native density and after decay; load one full-fidelity past day on top; record both numbers. **No ceiling is named.** §0.48’s 10–20 MB is transfer, not a budget. Do not freeze the decay ladder until C11 records a busy 0DTE day **and** an archive day together. If resident blows the tab, that is evidence for a later packet — not a silent return to `server/` film (A3).

Fail-closed: Time Machine glow; Record control; `server/` film; past-day 1-minute fetch; Basic chrome; TPO walk; 1×; Spaces; Factory; rehearsal in Trade Log or alert store; capture paused while a past day is loaded; today’s cache discarded because a past day was loaded.

---

## 6. HOLD-1 CLOSED — now TMI-79 (spec v0.7.4)

v0.7.3’s “one day held” wording manufactured a collision. v0.7.4 is BUILD AUTHORITY. There is **no** HOLD-1 tick on `TM-W0.md`.

India must not miss (not new rulings — consequences of TMI-79 + TMI-42):

- Two blobs, **one** playhead. Opening Tuesday does not fork a cursor.
- Return to live drops the archive slot and parks on **today’s newest**, not a leftover Tuesday playhead.
- Switching Tuesday → Monday discards Tuesday **before** Monday is accepted.
- Today’s slot is the continuous capture. Scrubbing today windows that slot; it does not occupy the archive slot.
- A packet that implements `heldDay: Date | null` as a single variable reintroduces the bug v0.7.4 exists to kill. **W2-G fail.**
- Heatmap Redis generation cache is still not this cache. Two slots are **browser**. Do not write archive days into Redis.

---

## 7. Leftover-board census (Coach confirm)

A banner that says “do not execute this GO” is not parking if the seeds are still live law.

| Board | Seeds | Gates | State as of 2026-08-27 |
|-------|-------|-------|------------------------|
| `agents/p-options-lab-tmi/` | **32** (W0 through W8, including recorder / Cache slider / green glow) | none | **Never stamped.** PARKED. `PARKED.md`. Token `TMI-W0.md` SUPERSEDED. |
| `agents/p-az-atm/` | **15** executable (through W2 chrome) | **W0-0 STAMP, W0-BA GO, W1-G PASS, W2-G PASS** | **Already ran.** Landed Day chrome (as-built). Remaining ORCHESTRATOR lines (W3 Enhanced, W4 TPO) are **NX-B / NX-TPO** for this GO. PARKED. `PARKED.md`. Seeds kept as history, not live law. |

Firing either board is a Delta fail on this GO. Specs those boards point at remain as record.

---

## 8. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.2** | 2026-08-27 | **Stamp target.** Law = spec v0.7.4 BUILD AUTHORITY (DL-598). HOLD-1 closed (TMI-79 two slots). C11 is spec law. India: two blobs / one playhead / no `heldDay` singleton. Today keeps capturing while an archive day is open. |
| **v1.1** | 2026-08-27 | HOLD-1 = C as a plan tick. SUPERSEDED by v1.2 when the spec took the wording. |
| **v1.0** | 2026-08-27 | First stamp candidate. SUPERSEDED before stamp. |

**One-line law:**  
**One surface, one scrubber, today pre-selected; two browser slots — today always capturing, at most one archive day — and today keeps capturing while an archive day is open; two blobs, one playhead; the panel says REPLAY and rehearsal dies on Reset; a past day is the StudioOne chain; transport sits immediately right of Autofit first; Basic, TPO, and 1× are not this GO.**

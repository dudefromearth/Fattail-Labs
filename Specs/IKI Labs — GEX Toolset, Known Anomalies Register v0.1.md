# IKI Labs — GEX Toolset, Known Anomalies Register v0.1

**Status:** **DRAFT** — proposed as a normative companion to the toolset specification, not yet
build authority.
**Date:** 2026-09-01
**Origin:** Coach instruction, 2026-09-01 — *"All tools should come with documentation and user
guides that declare the statistical anomalies that occur as a consequence of normal network
operations and inconsistencies from data providers. These things are generally statistically
inconsistent, however being a financial tool they should be declared."*
**Companions:** [`IKI-Labs-GEX-Toolset-Spec-Review-v0_1.md`](./IKI-Labs-GEX-Toolset-Spec-Review-v0_1.md) ·
[`IKI-Labs-GEX-Tool-Family-Source-Note-v0_1.md`](./IKI-Labs-GEX-Tool-Family-Source-Note-v0_1.md)
**Evidence base:** `docs/evidence/session-volume-profile/P-SV1.md`, `P-SV4.md`,
`P-SV5-day-roll.md` (StudioOne, read-only, 2026-08-31); Cboe SPX/SPXW contract specifications.

---

## 0. The instruction, and one sharpening

The instruction is right and it is a **doctrine-level** requirement, not a documentation task. Two
refinements before the register itself, because both change what gets built.

### 0.1 Most of these are not statistical anomalies. They are deterministic facts.

The framing says *"generally statistically inconsistent."* That is true of roughly a third of the
register. The rest are **structural and happen every single session**:

| Deterministic — every session, on schedule | Stochastic — varies, needs a counter |
|---|---|
| The day roll (~09:31 ET) | Collection gaps and cadence variance |
| OI staleness (T+1, always) | Vendor revisions / non-monotonic reads |
| Expiring book closes 16:00, non-expiring 16:15 | Quote-hygiene drops |
| AM-settled SPX has no session on settlement day | Band scope changes intraday |
| Multiple GEX sign crossings on a real chain | Null greeks on deep ITM |
| Dealer sign convention is unobservable | Storage read stalls |

**This distinction is the design:**

- A **deterministic** fact gets a **permanent, unconditional statement** — it is always true, so it
  is always on the surface. It never needs a counter, because the count is "always."
- A **stochastic** anomaly gets a **per-session measured counter** — the member needs to know
  whether *today* was clean, and a permanent label would teach them to ignore it.

Treating a deterministic fact as an anomaly is how it ends up in a footnote that never fires.
Treating a stochastic anomaly as a constant is how a bad day looks like a good one. Both failures
are live in tools already on the market.

### 0.2 A user guide alone is the weakest form of declaration

Nobody reads the guide during a fast tape. Declaration has to be **layered**, and the guide is the
outermost and least load-bearing layer:

```text
L1  PAYLOAD    every response and every artifact carries a coverage object.
               A payload without it is malformed — not degraded, malformed.
                    │
L2  SURFACE    a persistent chrome strip, always visible, never a hover,
               never collapsed by default. This is the layer that actually works.
                    │
L3  GUIDE      the written explanation of what each declared field means,
               with the measured magnitudes and the date they were measured.
```

This is the existing house law, arrived at the same way: SVP **SV6** ("no naked profile — a profile
with 40% unattributed volume and one with 0.5% are different claims about the world"), **SV57**
("coverage is chrome, not payload — a tooltip is how honest metadata becomes decoration"), and
**SV18** ("every 200 carries the coverage object; a response without it is malformed").

**The rule that gives it teeth:** every entry in this register must be (a) detectable in code,
(b) carried in the payload, (c) rendered on the surface, and (d) covered by an acceptance test. An
anomaly that is only in the guide is undeclared. That is the difference between this register and
a disclaimer.

---

## 1. Register

**ID scheme:** `AN-V*` vendor · `AN-N*` network and collection · `AN-M*` market structure ·
`AN-A*` model assumption.

**Evidence column is load-bearing.** *Measured* = observed in the probe transcripts with the figure
given. *Single fixture* = observed once; bounds nothing yet. *Structural* = follows from published
contract specifications. *Assumed* = a modelling choice that cannot be verified from a chain.

---

### 1.1 Vendor inconsistency

| ID | Anomaly | Evidence | Observed magnitude | Tools affected | Declaration |
|---|---|---|---|---|---|
| **AN-V1** | **Session day roll.** Cumulative volume carries the **previous** session's total until roughly 09:31 ET, then drops per contract to today's small count | **Measured**, 5 weekdays | Never at 09:30:00. 59/62 contracts in one 11 s pair (08-28); ~7 s across two groups (08-20). Post-roll values 1–451, **never 0** | Volume lens on all six | **Deterministic.** Permanent statement + `roll_detected_at`, `roll_spread_seconds`, `unattributed_pre_roll` |
| **AN-V2** | **Post-close accrual.** Cumulative volume increases after the expiring contract has ceased trading — late or out-of-sequence prints, corrections, EOD reconciliation | **Measured**, single fixture | +32 between 15:59:50 and 19:59:59 on a 0DTE SPXW that stopped trading at 16:00 | Session Path (`net_close`), any session total | **Stochastic.** `after_close_revision` counter. **Never** folded into `V_end` as trading |
| **AN-V3** | **Vendor daily aggregate disagrees with the snapshot series.** Different inclusion conventions, one-way | **Single fixture — bounds nothing** | Archive exceeded vendor daily by **+0.52 %** at last RTH read, **+0.56 %** at last snap. One contract, one day | Any tool compared against an external daily figure | Disclose the convention used and the measured delta **with its fixture count**. Never silently adjust toward the other. **`P-SV6` open**: ≥5 contracts × ≥3 days before any tolerance is claimed. If the sign ever inverts, the convention is not understood |
| **AN-V4** | **Non-monotonic reads.** Vendor revises a cumulative figure downward mid-session | **Measured** (mechanism), rate not bounded | — | Volume lens | **Stochastic.** Clamp to 0 **after** roll detection (AN-V1), increment `revision_count`. Never a negative bar |
| **AN-V5** | **Null greeks.** Vendor omits Γ on deep ITM contracts | Structural | 0/102 null at 10:00 ET in the sampled band — the band is where they are populated | GEX everywhere | Cell renders **invalid**, never zero. A zero draws structure that is not there |
| **AN-V6** | **No per-row timestamp.** The frame carries one `ts`; rows do not | **Measured** | — | Frame join (all tools) | State that row freshness is frame-level. `quote_age_ms` is the only per-row freshness signal |
| **AN-V7** | **Scope varies within a session.** The captured band changes intraday; strikes enter and leave | **Measured** | `wings` 15 **or** 25, changing inside one morning (08-28 roll pair is 15→25). 51 strikes vs spot | Pressure Field, Node Tape, back-select on any tool | **Stochastic.** `wings_seen[]`, `strike_first_seen{}`. A strike's first observation is a **first sighting, not a burst of trading** |

---

### 1.2 Network and collection

| ID | Anomaly | Evidence | Observed magnitude | Tools affected | Declaration |
|---|---|---|---|---|---|
| **AN-N1** | **Cadence variance.** The "~2 s" frame rate is a median, not a guarantee | **Measured** | Median **~2.4 s**; **max named RTH gap 54.7 s** | All time-axis tools | **Stochastic.** `max_gap_seconds`, `gap_count` per session |
| **AN-N2** | **Degraded sessions.** A session can lose hours to collection gaps | **Measured** | **08-21: 459 RTH gaps totalling 7,862 s** — ~2.2 h of a 6.5 h session. **1 of 12 days sampled** | Session Path (`pct_time_neg_0dte`), Pressure Field, Node Tape | **Stochastic.** Session marked **not complete**; time-window statistics disabled with the reason **stated on the strip**, not silently greyed. Serve the day, say why it is bad |
| **AN-N3** | **Quote-hygiene drops shift volume in time.** A row dropped for a quote reason returns with a difference spanning the gap | Structural | Bounded by gap length. **Sub-bucket drops distort nothing.** Magnitude always correct — volume is cumulative, so totals self-heal | Node Tape events, Session Path debounce **only** | **Stochastic.** Mark gap-spanning buckets; event detectors decline to fire on a marked bucket. Profile, Surface and Card are unaffected |
| **AN-N4** | **Pagination on wide scope.** The band path does not page; a full-chain pull will | **Measured** | `massive_page_limit=250`; band snaps 60–102 rows, **no `next_url`** observed | GEX Surface (needs full scope) | Batch producer follows pagination and records `pages`. The live path treats `next_url` as a **hard error** — no partial book is ever published |
| **AN-N5** | **Archive storage read stalls.** The capture volume can block on metadata operations | **Measured** | `du` stalled **20–25 s** | Back-select on any tool | Never on a live write or interactive HTTP path. Read timeouts are surfaced as an explicit error state, never as an empty result |
| **AN-N6** | **Absence of data is not absence of trading.** Any gap, dropped row, or out-of-band strike | Structural | — | All six | **Invalid marker, never a zero-length bar or a zero-valued cell.** This is the single most important rendering rule in the register |

---

### 1.3 Market structure

| ID | Anomaly | Evidence | Observed magnitude | Tools affected | Declaration |
|---|---|---|---|---|---|
| **AN-M1** | **The expiring book and the rest of the book close at different times.** Expiring SPXW ceases **16:00 ET**; non-expiring SPX/SPXW trade to **16:15 ET** | **Structural** — Cboe specifications | 15 minutes | Session Path (`net_all` vs `net_0dte`), Surface columns | **Deterministic.** Per-book window in `GexPolicy`. Between 16:00 and 16:15 the **0DTE book is frozen and settled while the rollup still moves** — render that state, do not average it away |
| **AN-M2** | **Half-day holidays.** Expiring SPXW ceases **13:00 ET** | **Structural** — Cboe | — | All | **Deterministic.** Session calendar in `GexPolicy` |
| **AN-M3** | **AM-settled SPX has open interest and no trading session on settlement day.** Trading ceases 5:00 pm ET the **preceding** business day | **Structural** — Cboe | Full session | Profile, Surface 0DTE column, Card anchor | **Deterministic.** AM-settled contracts leave the tradable book at the prior close. Left in a 0DTE bucket they contribute a day of frozen, un-hedgeable gamma |
| **AN-M4** | **Real chains cross GEX sign more than once.** "The flip" is not guaranteed unique | Structural | — | Profile, Path, Card | **Deterministic.** Publish all crossings in view with a count, so a consumer distinguishes `1 of 1` from `1 of 3` |
| **AN-M5** | **The cumulative flip depends on summation direction.** Summed from the other end it is a different picture of the same chain | Structural | — | Profile, Path, Card | **Deterministic.** Direction frozen in the algo version **and stated on the axis** |
| **AN-M6** | **Proxy basis.** When ES stands in for SPX in the underlying stream, the two are not the same number | Structural | Varies with carry and time to expiry | Frame join → all tools | Persist `basis = SPX − ES` at join; surface it whenever a proxy is in use |

---

### 1.4 Model assumptions — declared alongside, because a member cannot tell them apart from data

| ID | Assumption | Status | Tools affected | Declaration |
|---|---|---|---|---|
| **AN-A1** | **Dealer sign convention** (long calls / short puts) | **Assumed. Unobservable from a chain** | All | Stated wherever a signed GEX value is shown, not once in a legend |
| **AN-A2** | **Open interest is yesterday's.** OI settles T+1. On a same-day expiry, the positions being traded right now are **entirely absent** until tomorrow | **Structural — deterministic** | All | **Permanent surface label with the OI as-of date.** Not a hover. The largest misread vector in the category, and it lands hardest on 0DTE |
| **AN-A3** | **Volume has no side and no open/close flag.** A print cannot be attributed to a buyer, a seller, an opening or a closing trade | Structural | Volume lens | Never labelled long, short, bought, sold, opening or closing — **in copy, tooltip, legend or payload field** |
| **AN-A4** | **Single-expiration scope.** A crossing computed on one expiration is not "the market's gamma level," which is computed across all of them | Structural | Profile, Path, Card | Every gamma figure carries the expiration it belongs to |
| **AN-A5** | **Intraday GEX moves because Γ and spot moved, not because positions changed** | Structural | All | One sentence on the surface. It prevents the most common misreading of every GEX chart in the category |

---

## 2. What the user guide says

The guide is L3 — it explains the fields the surface already shows. It does not carry the burden.

**Required sections, per tool:**

1. **What the number is.** The formula, the units (`USD notional per 1% move`), the sign convention
   named as an assumption.
2. **What it is not.** The non-goals, verbatim from the spec: not MM inventory, not participant
   split, not realized hedge flow, not live official OI.
3. **What the strip means.** Every coverage field, in plain language, with the measured magnitude
   and **the date it was measured**.
4. **When to distrust the picture.** The stochastic entries: what a not-complete session looks like,
   what a band-clipped scope means, what a marked bucket means.
5. **What is always true.** The deterministic entries: the roll, OI staleness, the two closes,
   AM settlement.

**Two rules for the writing:**

- **Every magnitude carries its fixture count.** "+0.52 % on one contract on one day" — never
  "+0.52 %." A single fixture stated as a bound is the same error the register exists to prevent.
- **Guide copy is bound by the same ban as surface copy.** No pin, magnet, wall, support,
  resistance, gravitate; and no mechanism→outcome step. The guide may say what hedging *requires*
  under the convention; it may not say what price *does* as a result.

---

## 3. Acceptance tests

A register without tests is a disclaimer. Proposed set:

| ID | Test |
|---|---|
| **AT-AN1** | Every API 200 and every stored artifact carries a coverage object. A response without one **fails validation** — malformed, not degraded |
| **AT-AN2** | Every rendered tool shows the persistent strip. A tool rendering values without it fails its gate |
| **AT-AN3** | Coverage fields are **never** delivered only as a tooltip, hover, or default-collapsed panel |
| **AT-AN4** | Roll fixture (08-28 09:31:07 → 09:31:18): boundary detected **before** the clamp; pre-roll reads discarded; no bucket reports zero across the roll |
| **AT-AN5** | Degraded fixture (08-21, 459 gaps / 7,862 s): session marked **not complete**; time-window statistics disabled **with the reason on the strip** |
| **AT-AN6** | Missing data at a strike renders an invalid marker. No path produces a zero-length bar or a zero-valued cell from absent data |
| **AT-AN7** | A gap-spanning volume delta marks its bucket; Node Tape and Session Path event detectors do not fire on a marked bucket |
| **AT-AN8** | OI as-of date is on the surface wherever any gamma mark is shown; a same-day expiry additionally states that today's flow is not yet in OI |
| **AT-AN9** | The dealer sign convention is stated wherever a signed GEX value renders |
| **AT-AN10** | No copy, tooltip, legend **or payload field** labels volume as long, short, bought, sold, opening, or closing |
| **AT-AN11** | Post-close cumulative increases land in `after_close_revision` and are **absent** from `V_end` |
| **AT-AN12** | A chain fixture with three sign crossings renders three marks with a count; no "primary" crossing is selected |
| **AT-AN13** | Every magnitude in the shipped guide carries its fixture count. Reviewed at doc gate, not automated |

---

## 4. What this register does not cover, and should say so

Honesty about the register's own edges:

| | |
|---|---|
| **Unmeasured rates** | AN-V4 (revision frequency) and AN-N3 (hygiene-drop frequency) have a described mechanism and **no measured rate**. They are declared as mechanisms until a probe bounds them |
| **One fixture is not a tolerance** | AN-V3 rests on one contract on one day. It is stated with that caveat and stays that way until `P-SV6` returns ≥5 contracts × ≥3 days |
| **An inference, not a proof** | That the pre-roll value *is* the prior session's total is the best-supported reading. The archive is 0DTE-only, so no contract exists on two consecutive days to prove it. `P-SV7` is open |
| **Twelve days is the whole sample** | Every rate in this register is drawn from a 12-trading-day window in August 2026. It is not a seasonal or regime-diverse sample, and nothing here should be read as a long-run rate |
| **Unknown unknowns** | This register lists what has been observed or follows from published specifications. It is a floor, not a ceiling. New entries are added when found, and the register carries its own revision history so a member can see it grew |

---

## 5. Open items

| # | Question |
|---|---|
| **OD-AN1** | Is the register a section of each tool's spec, or one shared document all six reference? Same argument as `OD-IKI2` — shared law restated six times drifts six ways. **Recommend one register, referenced** |
| **OD-AN2** | Does the coverage strip render per tool, or once per workspace? Two tools can hold different as-of, scope and completeness; one shared strip would average two truths. **Recommend per tool** |
| **OD-AN3** | Does the agent / SSE export carry coverage? **Recommend yes** — an agent reading archive rows without scope and as-of is the same defect as a member doing it |
| **OD-AN4** | Does a tool refuse to render on a not-complete session, or render marked? **Recommend render marked** — hiding a bad day teaches less than showing why it is bad |
| **OD-AN5** | Who owns this register once `OD-IKI1` is answered? If IKI is a standalone repo it needs its own copy and a sync discipline, which is a cost worth naming before it is paid |

---

## 6. Document control

| Version | Date | Notes |
|---|---|---|
| **v0.1** | 2026-09-01 | Initial register from Coach's declaration instruction. 24 entries across vendor, network, market-structure and assumption classes. Deterministic / stochastic split established as the design driver. Three-layer declaration rule (payload → surface → guide). AT-AN1–13. Evidence base: P-SV1 / P-SV4 / P-SV5 probes (2026-08-31) and Cboe contract specifications |

**One-line law:**
**Every known way this data can be wrong is detectable in code, carried in the payload, rendered on
the surface, and covered by a test — the deterministic ones stated permanently because they are
always true, the stochastic ones counted per session because the member needs to know whether today
was clean; the guide explains them and is never the only place they appear.**
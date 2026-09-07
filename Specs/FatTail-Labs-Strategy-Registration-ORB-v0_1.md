# FatTail Labs — Strategy Registration: Opening Range Breakout (ORB-15 · ORB-30) v0.1

**Status:** **DRAFT registration** (QLAB v0.3 §4.5 — hypothesis before query). Not yet run. Needs
Coach (§6), **Hotel** (trading accuracy — every filter and invalidation below is a claim about how
the setup trades), **Sheldon** (study design, sample, falsifier), India (boundary: this is a study,
not a product), Alpha (the two integrations in §5).
**Date:** 2026-09-07 · **Short name:** **ORB** · **Owner:** Juliet (draft) → Sheldon (study)
**Parents:** ATRV v0.11 (as built) · QLAB v0.3 §4 (grid, registration, ceiling) · AZ-ALGO v2.3.4
§9.4 / §14 (the profit-management guide; era-1 evaluation is `idealised`) · DL-677 (one day is a
hypothesis) · DL-681 (the catalog compares distributions)

---

## 0. Coach intent (verbatim)

> *"Let's start with at least three different strategies to run across the 13 or 14 days we have
> captured. Perhaps the easiest is an open range breakout. On the breakout signal, we will place
> an OTM 20-wide fly with a debit equal to or less than 10% of the fly width. We can find the fly
> on the convexity heat map, and we will choose the next OTM fly if there's a >25% discount
> relative to the first price we found."*

> *"We will use both 15 and 30 as the range, the trigger we will use close outside the range with
> 15 min and touch with 30. We will institute all the common filters and invalidations. The
> targets will be our profit management algo."*

Success criterion: two registered variants run across every captured SPX day, reported as
distributions the catalog can compare, with the guide's effect shown as a shape transform beside
the untrailed line (AT-ATRV-26) — **and nothing concluded from fifteen days** (DL-677).

---

## 1. Data

| | Value | Source |
|---|---|---|
| Book | **SPX** 0DTE (era-1) — "20-wide" is an SPX width; on XSP it is a 200-point-equivalent fly | Coach |
| Days | every captured session **2026-08-14 → 2026-09-04**, weekends and 2026-09-01 holiday excluded; expected **≈15** | archive |
| Store | built per day with `quant.build` (▶ **RUN ON: StudioOne**, read-only against the archive, ~45 s/day), rsynced to the lab checkout; **none built yet except XSP 2026-09-04** | ATRV §2.1 |
| Spot | `spot[t]` at every snapshot (~3.6 s mean in session) — the range and the trigger are computed from this, **never from bars the store does not have** | store |
| Prior close | last in-session `spot` of the previous captured day; **absent for the first day** → gap filter reports `unavailable`, not skipped silently | store |
| Not available on era-1 | underlying volume · depth · VIX column | ATRV §3.6 |

---

## 2. The opening range — two variants, run as two strategies

| | **ORB-15** | **ORB-30** |
|---|---|---|
| Range window | 09:30:00–09:45:00 ET | 09:30:00–10:00:00 ET |
| Range | `hi = max spot`, `lo = min spot` over the window; `width = hi − lo`; `mid = (hi+lo)/2` | same |
| **Trigger** | **close outside**: the **last spot of a 1-minute bar** (bar = `[HH:MM:00, HH:MM+1:00)`, close = last snapshot in it) is `> hi` (long) or `< lo` (short) | **touch**: the **first snapshot** with `spot > hi` (long) or `spot < lo` (short) |
| Buffer | none — the close is the confirmation | none — a touch is a touch |
| Signal instant `t_sig` | the closing snapshot of that bar | that snapshot |
| Entry instant | `t_sig + latency` (ATRV AT-ATRV-12, one snapshot) — the order is sent then and rests per the fill model | same |

Both are declared on the grid `range_min ∈ {15, 30}` × `trigger ∈ {close, touch}`; the two
cells above are the registered ones. The other two cells (15/touch, 30/close) are **not run** in
this registration — running them later is a new registration, not a free look (QLAB §4.5).

---

## 3. "All the common filters and invalidations" — declared, one by one

A filter that is not written down with a number is a knob. Every row below is declared; Hotel
edits values, not the list's existence. Every filter that fires is **counted and reported** — a
day that produced no trade is a result, not a missing row.

### 3.1 Filters (decide whether a signal becomes an order)

| # | Filter | Rule | Why it is common |
|---|---|---|---|
| F1 | **One entry per direction per day** | first valid signal in each direction; a second long signal is ignored | prevents chasing |
| F2 | **Session cutoff** | no entry after **12:00:00 ET**; a signal after that is counted `late` | a 1 PM breakout is not an *opening* range breakout |
| F3 | **Range too wide** | skip if `width > 1.3 × median(width)` over the captured days for the same window; counted `wide` | a wide opening range is often the day's move already |
| F4 | **Range too narrow** | skip if `width < 0.4 × median(width)`; counted `narrow` | noise breaks a narrow range |
| F5 | **Gap alignment** | take only signals in the direction of the gap from prior close (`open − prior_close`); when `|gap| < 0.1 × width` the filter is **neutral** (both directions allowed); first day: `unavailable`, neutral | with-gap breakouts carry; against-gap ones fill |
| F6 | **Opposite-side first** | if the range broke the *other* way first (a failed breakout the other way), the later signal is still taken but tagged `after_fail` — reported as its own bucket, not filtered | the second break after a failure is a different animal; the data should say which |

Medians in F3/F4 are over the **captured days only** and are reported with the result — fifteen
days is a thin median and the report says so.

### 3.2 Invalidations (classify the trade after entry; the fly is the stop)

No stop is placed; the debit bounds the loss (AZ-ALGO §15, Coach). Invalidation is a
**classification** the distribution is split by, and an input the guide may use.

| # | Invalidation | Rule | Bucket |
|---|---|---|---|
| I1 | **Re-entry** | after entry, spot back inside the range by ≥ 10% of `width`, persisting ≥ 8 snapshots (~30 s) | `re_entered` |
| I2 | **Midpoint cross** | spot crosses `mid` against the trade after entry | `reversed` |
| I3 | **Ran** | neither I1 nor I2 by exit | `ran` |

Every distribution in §5 is reported **whole and split by bucket**. The bucket a path lands in is
a fact about the underlying path, so it is identical across Monte Carlo paths of the same entry —
only fills vary (ATRV §3.8).

---

## 4. The structure — Coach's placement rule, written as the heat map would apply it

| Step | Rule |
|---|---|
| S1 | Direction from the signal: long → **call fly** above `hi`; short → **put fly** below `lo` |
| S2 | Width **20**; strikes on the 5-point grid |
| S3 | Candidate bodies: strikes beyond the breakout edge in the trade direction, nearest first (`edge + 5, +10, …` for calls; mirrored for puts); wings at body ± 10 |
| S4 | Price each candidate at `t_entry` as a **complex order at the mid** (ATRV §3.7.1 `complex_mid`) |
| S5 | **A** = the nearest candidate with `debit_A ≤ $2.00` (10% of width). If none within 60 points: **no trade**, counted `no_price` |
| S6 | **B** = the next candidate outward from A. If `debit_B ≤ 0.75 × debit_A` (a >25% discount), take **B**; else take **A** |
| S7 | Limit = Coach's control (`abs $2.00` default here — the rule *is* the cap); window, re-seat, order type per the friction controls; **`fill_model` as labelled** (unfitted until P4) |
| S8 | A leg absent or one-sided such that the complex has no natural → the candidate is skipped, counted `unpriced_leg` |

This is the "find it on the convexity heat map" step made mechanical: the heat map ranks the
same candidates by debit-to-width; S5/S6 is the operator's rule for reading it.

---

## 5. Exit — the profit-management algo, and what era-1 can honestly say about it

Coach: *"The targets will be our profit management algo."* That is AZ-ALGO v2.3.4's **Guide**
(§9.4 hold-or-fold, `p`, `PaR`). Two facts from that spec bind this study:

1. **The guide is advisory in the product** (§0.2, never an automatic exit). In a study, the
   guide's **fold** is the simulated exit — that is exactly AT-ATRV-26's *trailed* line.
   **AT-ATRV-26 requires the untrailed line beside it**, same trades, each tail separately.
2. **Era-1 evaluation of the guide is `idealised`** (§14.3): the tax's probability component is
   unfitted on era-1, so the run is **legitimate for shape exploration and does not promote the
   line** (AT-ATRV-29). Every result carries that label.

| Exit line | Rule | Label |
|---|---|---|
| **guide** | the Guide's fold on the fly's **mid-mark series** from the store, fed through `market_data.algo_replay_path` (the existing replay path, `samples_from_marks_jsonl` shape) — resolved as a **resting closing order** at the fold instant (ATRV §3.7.1 F6) | `idealised` · `fill_model` as labelled |
| **untrailed** | hold to **15:45 ET** time exit, same fills law | the control AT-ATRV-26 demands |

Reported as **two shapes per variant per bucket**, never a verdict; the guide's effect is what it
did to each tail (§14.3).

### 5.1 Two integrations Alpha must declare before this runs

| | What | Why it is not free |
|---|---|---|
| **X1** | `exit_kind = guide` in `quant.simulate`, calling the replay path with the store's mark series; guide inputs (`Γ` from store `gamma`, OI, spot) on era-1 confirmed available or the run refuses `GUIDE_INPUTS_ABSENT` | a new exit kind is an ATRV change (v0.12) — spec first |
| **X2** | a **signal layer** above `simulate`: range/trigger/filters/invalidations computed once per day from `spot`, producing `(t_sig, direction, buckets, filter_counts)`; the existing `sweep_entries` pools entries by clock, not by signal | new module `quant/signals.py`; declared in a seed; store and builder untouched |

---

## 6. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-ORB-1** | F3/F4 multipliers 1.3× / 0.4× | Hotel | as written; report sensitivity at 1.5× / 0.3× as a **second registration**, not a tweak |
| **OD-ORB-2** | F5 gap-neutral band 0.1 × width | Hotel | as written |
| **OD-ORB-3** | 1-minute bar for the ORB-15 close | Coach · Hotel | 1-minute; 5-minute is a different registration |
| **OD-ORB-4** | I1 re-entry depth 10% of width for ~30 s | Hotel | as written |
| **OD-ORB-5** | Guide clauses on era-1: run with `LABS_ALGO_REGIME_FOLD_ENABLED` default (**false**, E51) | Sheldon | false; a second run with it true is its own registration |
| **OD-ORB-6** | `paths` per entry and seed | Sheldon | 2,000 · seed 7; `stability` reported |
| **OD-ORB-7** | Where the runs execute | Coach | ▶ **MacBook** against the synced store (DudeTwo when H7 lands) |

---

## 7. Acceptance (for the run report, not for a product)

| AT | Criterion |
|---|---|
| **AT-ORB-1** | Every captured SPX day appears in the report with one of: a trade per direction, or a named filter/no-price count. No silent skips. |
| **AT-ORB-2** | Range, trigger instant and direction are reproducible from `spot` alone; a second computation from the store matches byte-for-byte. |
| **AT-ORB-3** | Every fly obeys S5/S6 at its entry instant — asserted by re-pricing A and B from the store and checking the rule. |
| **AT-ORB-4** | Every distribution is reported whole and split by `ran / re_entered / reversed / after_fail`, with `n` per bucket, and **no bucket is summarised by a mean**. |
| **AT-ORB-5** | Guide and untrailed shapes appear side by side per variant; the guide run is labelled `idealised`; no sentence promotes the guide (AZ-ALGO §14.3, AT-ATRV-26/29). |
| **AT-ORB-6** | `stability{n_half_vs_n}` reported per bucket; where a bucket has `n < 5` **days** the shape is marked `insufficient` and not compared. |
| **AT-ORB-7** | The report's first line states the sample: N days, N signals, N trades, N no-fills — before any shape. |

---

## 8. What this registration is not

Not a promotion of the guide. Not a product. Not a claim about ORB on 0DTE SPX — fifteen days of
VIX 14–17 is one regime (AZ-ALGO §14.1 wants low/mid/high separately). Not a comparison against
the other two strategies yet — that needs all three registered and run on the same days.

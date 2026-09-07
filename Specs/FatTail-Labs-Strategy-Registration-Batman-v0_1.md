# FatTail Labs — Strategy Registration: 1DTE Batman (BAT-1D · BAT-0D proxy) v0.1

**Status:** **DRAFT registration** (QLAB v0.3 §4.5). Not yet run. Needs Coach (§5 — entry time,
placement, exit, proxy), **Hotel**, **Sheldon**, Alpha (the two-structure order in §4).
**Date:** 2026-09-07 · **Short name:** **BAT** · **Owner:** Juliet (draft) → Sheldon
**Parents:** ORB registration v0.1 (same data, same reporting law) · ATRV v0.11 · AZ-ALGO v2.3.4
§14.3 · **SSR-MEXP v0.8** (multi-expiration capture — the data this strategy needs) · DL-682

---

## 0. Coach intent (verbatim)

> *"The other is a 1DTE Batman, where we simply enter the trade with a 10% rule for the entire
> trade. A call fly above and a put fly below, say 20 wide each, the combined debit cannot exceed
> $2 or 10% of 20."*

---

## 1. The fact that decides where this runs

**The captured era-1 days hold one expiration per day — the 0DTE.** Measured, not assumed:
`docs/evidence/atrv-bench-2026-09-05.md` line 101 ("distinct expirations captured: 0 —
MEASURED"), and the built XSP 2026-09-04 store lists exactly one expiration, `2026-09-04`.
**A 1DTE structure cannot be priced from the 13–14 days we have.** The legs do not exist in the
archive.

1DTE legs arrive with **era-2**, the σ-scaled multi-expiration capture that starts **Tuesday
2026-09-08** (SSR-MEXP v0.8). The first 1DTE Batman the archive can price is therefore entered on
Tuesday's chain for Wednesday's expiry and evaluated at Wednesday's close — and one such day is
one sample. This registration says so up front so nobody discovers it after building a runner.

| Variant | Data | Status |
|---|---|---|
| **BAT-1D** | era-2, expiry = next session, from 2026-09-08 onward | **registered now, runnable when ≥ 1 era-2 day exists; reported when `n_days` is stated on the first line** |
| **BAT-0D** (proxy) | era-1, both flies on the day's 0DTE, entered at the open | **runs on the captured days now, labelled `proxy_0dte`** — same placement law, different convexity clock; a shape to look at, not a substitute |

Coach disposes in §5 whether BAT-0D runs at all.

---

## 2. The structure — Coach's rule, made mechanical

| Step | Rule |
|---|---|
| S1 | Two flies, **call fly above spot, put fly below spot**, each **20 wide** on the 5-point SPX grid, wings at body ± 10 |
| S2 | Candidate pairs indexed by distance `k` from spot: call body `⌈spot⌉₅ + k`, put body `⌊spot⌋₅ − k`, `k ∈ {10, 15, 20, …}` — **symmetric by default** (OD-BAT-2 asks whether skew should break the symmetry) |
| S3 | Price each fly at `t_entry` as a complex order at the mid; the **Batman is one order** (six legs, one net debit) — `debit_pair = debit_call + debit_put` |
| S4 | **A** = the nearest pair with `debit_pair ≤ $2.00`. None within `k ≤ 60`: **no trade**, counted `no_price` |
| S5 | **B** = the next pair outward. If `debit_pair_B ≤ 0.75 × debit_pair_A`, take **B** (Coach's discount rule from ORB, carried over — OD-BAT-3 confirms it applies) |
| S6 | Limit `abs $2.00` on the six-leg complex; friction controls as declared; `fill_model` as labelled. **Fills whole or not at all** — a Batman that fills one wing is not a Batman (ATRV §3.7.1 F1 extends naturally to six legs) |
| S7 | A leg absent or one-sided such that the complex has no natural → the pair is skipped, counted `unpriced_leg` |

"Simply enter" is honoured: there is no signal, no filter. The only thing that stops an entry is
price (S4) or data (S7). Every no-trade is counted.

---

## 3. Entry and exit — the two things the sentence did not say

| | Registered default | Why | Coach may change |
|---|---|---|---|
| **Entry (BAT-1D)** | **15:30 ET on day T** for expiry T+1 | the classic 1DTE entry: after the day's move, with overnight theta and the next session's gap as the convexity source | 15:00 / 15:45 / next-day 09:35 |
| **Entry (BAT-0D proxy)** | **09:35 ET** on day T for expiry T | earliest entry with a settled open | 10:00 |
| **Exit** | **the profit-management Guide** (AZ-ALGO §9.4) as a resting closing order at the fold, **untrailed beside it** (hold to 15:45 T+1 for BAT-1D; 15:45 T for the proxy) — AT-ATRV-26 | Coach's stated exit for the first strategies | a fixed `+N%` is a different registration |
| **Overnight (BAT-1D)** | the position is marked at T's last in-session snapshot and T+1's first; **the gap between them is a single step, never interpolated** (ATRV AT-ATRV-6) | there is no market overnight | — |

Era-1 and early era-2 evaluations of the Guide are **`idealised`** (AZ-ALGO §14.3) — shape
exploration, never promotion. Every result says so.

---

## 4. What must exist before this runs

| | What | Status |
|---|---|---|
| **X1** | `exit_kind = guide` in `quant.simulate` (shared with ORB; ATRV v0.12, spec first) | not built |
| **X3** | **Two-structure order:** `simulate` accepts a six-leg complex; `complex_quotes` and `rest_order` already take arbitrary legs — Kilo confirms with a six-leg fixture rather than anyone assuming | verify, likely small |
| **X4** | **Cross-day marking for 1DTE:** a position opened on day T's store and marked on day T+1's store; the store is per day, so the runner opens two `DayStore`s and joins on `(strike, side, expiration)` — contract identity already carries `expiration` (ATRV §2.2) | new in the runner; store untouched |
| **X5** | **era-2 store build with multiple expirations per book-day** — the builder keys `(strike, side, expiration)` and will hold them; `list_days`/`meta.json` gain nothing new, but this is the **first build with C > one expiration** and AT-ATRV-34 is re-asserted on it | first era-2 day |
| **Data** | SPX era-1 days built for BAT-0D (shared with ORB); the first era-2 SPX day built for BAT-1D | ▶ **StudioOne**, read-only, then synced |

---

## 5. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-BAT-1** | Run the **BAT-0D proxy** on era-1 at all, or wait for era-2 and run only the real thing | **Coach** | **Run the proxy, labelled `proxy_0dte`**, so the placement rule and the six-leg order are proven on data before the first 1DTE day arrives; never shown beside BAT-1D as if comparable |
| **OD-BAT-2** | Symmetric bodies (`±k`) or skew-aware (put body further, call body nearer) | Coach · Hotel | symmetric; skew-aware is a second registration |
| **OD-BAT-3** | Does the ≥ 25% next-out discount rule apply to the pair | Coach | yes |
| **OD-BAT-4** | Entry time for BAT-1D | Coach | 15:30 ET day T |
| **OD-BAT-5** | Exit — the Guide, or hold to T+1 close | Coach | the Guide, untrailed beside it |
| **OD-BAT-6** | Per-fly cap as well as the pair cap (e.g. neither fly > $1.50) | Hotel | none — Coach said *entire trade* |

---

## 6. Acceptance

| AT | Criterion |
|---|---|
| **AT-BAT-1** | The report's first line states `variant`, `n_days`, entries, no-price and no-fill counts before any shape; **BAT-0D is labelled `proxy_0dte` in every artifact and never appears in a comparison with BAT-1D**. |
| **AT-BAT-2** | Every entered Batman obeys S4/S5 at its entry instant — re-priced from the store and checked. |
| **AT-BAT-3** | The six-leg order fills whole or not at all; a partial structure in any path is a **fail**. |
| **AT-BAT-4** | For BAT-1D, the overnight is one step between T's last and T+1's first snapshot; no interpolated mark exists between them. |
| **AT-BAT-5** | Guide and untrailed shapes side by side, `idealised` on era-1/early era-2; no promotion language (AZ-ALGO §14.3, AT-ATRV-26/29). |
| **AT-BAT-6** | Reported whole and split by **which side was reached** (`call_side`, `put_side`, `neither`, `both`) — the Batman's natural buckets — with `n` per bucket and no mean. |

---

## 7. What this is not

Not runnable as a 1DTE on the captured days — the legs are not in the archive. Not a comparison
with ORB until both have run on the same days, and BAT-1D never will on era-1. Not a claim about
Batmans: the first era-2 sample is one day.

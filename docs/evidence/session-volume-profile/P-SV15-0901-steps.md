# P-SV15 — The same table, 09-01

**Probe request 11.** Authority: P-SV14.  
**Session:** 2026-09-01. Five P-SV11 contracts.  
**When:** 2026-09-01.

**Status unchanged:** P-SV1 stays open. The `svp_v1` freeze stays. Hotel stays blocked.

Identical construction to P-SV14: volume-change steps, `t_prev` = previous volume-change snap, `tape_delta` over `(t_prev, t_step]`. Pre-RTH on this date is **0 lots / 0 trades** on all five.

Read-only. Gold not written. Tap not restarted.

Raw JSON: `/tmp/svp-psv15/svp-psv15-summaries.json`, `tape-*.json`.

---

## Call +10 first — `O:SPXW260901C07685000`

Residual at close: tape **67863** vs archive/aggs **60864** = **−6999**. Unique `sequence_number` 15247/15247.

| | |
|--|--:|
| n_steps | 380 |
| archive decreases | **1** |
| n_trades=0 and archive_delta≠0 | **1** (15:57→15:58, +10) |
| overnight archive | 6344 |
| roll 09:31:07 | **6344 → 377** (Δ −5967) |
| tape at roll / RTH-so-far | 401 / 401 (pre-RTH 0) |
| roll after = RTH-so-far? | **no** (377 vs 401, miss 24) |
| post-roll archive accrete | 60864 − 377 = **60487** |
| post-roll tape accrete | 67863 − 401 = **67462** |
| **post-roll excess** | **−6975** |

| window | n_steps | Σ archive_delta | Σ tape_delta | **Σ gap** | n_gap0 | zero-trade moves | decreases |
|--------|--------:|----------------:|-------------:|----------:|-------:|-----------------:|----------:|
| 09:31–10:53 | 82 | 22132 | 35494 | **−13362** | 1 | 0 | 1 |
| 11:00–16:00 | 290 | 29768 | 29764 | **+4** | 67 | 1 | 0 |

Largest morning step besides the roll: **10:37:07 → 10:38:08**, archive +161, tape **7163**, gap **−7002** (105 trades). That one step is the −6999.

Morning Σ gap −13362 includes the roll (−6368). Morning without the roll ≈ −6994.

---

## The other four

Aggs = tape total = archive final on these four (P-SV13). Pre-RTH 0.

### ATM call `O:SPXW260901C07635000`

No 09:31 decrease. Overnight already **186**. 09:31:07 step is **+26** (tape 297), not a reset. n_decreases **0**. n_zero_trade_moves **0**. Close: archive 140664 = tape 140664. Cannot apply the post-roll frame (no roll).

| window | n_steps | Σ gap |
|--------|--------:|------:|
| 09:31–10:53 | 82 | **−202** |
| 11:00–16:00 | 300 | **−405** |

Afternoon is **not** net zero.

### ATM put `O:SPXW260901P07635000`

Roll 09:31:07: **2698 → 286** (Δ −2412). Tape/RTH-so-far at roll **325**. After = RTH-so-far? **no** (286 vs 325). Post-roll excess **+39**. n_decreases **1**. n_zero_trade_moves **0**.

| window | n_steps | Σ gap |
|--------|--------:|------:|
| 09:31–10:53 | 82 | **−2732** |
| 11:00–16:00 | 300 | **−76** |

### Put −10 `O:SPXW260901P07585000`

Roll 09:31:07: **1974 → 668** (Δ −1306). Tape/RTH-so-far **688**. After = RTH-so-far? **no** (668 vs 688). Post-roll excess **+20**. n_decreases **1**. n_zero_trade_moves **1** (11:52, +7).

| window | n_steps | Σ gap |
|--------|--------:|------:|
| 09:31–10:53 | 82 | **−1975** |
| 11:00–16:00 | 293 | **0** |

### Call +20 `O:SPXW260901C07735000`

Roll 09:31:11: **3962 → 298** (Δ −3664). Tape/RTH-so-far **300**. After = RTH-so-far? **no** (298 vs 300). Post-roll excess **+2**. n_decreases **1**. n_zero_trade_moves **12** (all +1 to +4 lots).

| window | n_steps | Σ gap |
|--------|--------:|------:|
| 09:31–10:53 | 79 | **−3962** |
| 11:00–16:00 | 186 | **0** |

---

## 2. Three questions

### a. Is 11:00–16:00 net gap zero on 09-01?

**Not on all five.**

| contract | 11:00–16:00 Σ gap | n_steps |
|----------|------------------:|--------:|
| Call +10 | **+4** | 290 |
| ATM call | **−405** | 300 |
| ATM put | **−76** | 300 |
| Put −10 | **0** | 293 |
| Call +20 | **0** | 186 |

Put −10 and Call +20 match the named 08-19 afternoon (Σ gap 0). Call +10 is +4. ATM call **−405** and ATM put **−76** are not zero. The afternoon is **not** a blank on every 09-01 name. Later probes cannot ignore the afternoon on ATM.

### b. Is Call +10’s −6999 a morning deficit (sign-flip of 08-19)?

**Yes, concentrated in the morning.** Post-roll excess **−6975**. 09:31–10:53 Σ gap **−13362** (includes the roll −6368). One step 10:37–10:38 gap **−7002**. Afternoon Σ gap **+4**. 08-19 named morning (09:50–10:53) was **+1506** excess; this is the other sign, same window class.

### c. Do zero-trade archive-moves appear on 09-01?

**Yes.** n=5 contracts:

| contract | count | example |
|----------|------:|---------|
| Call +10 | **1** | 15:57→15:58, +10 (60849→60859) |
| ATM call | **0** | — |
| ATM put | **0** | — |
| Put −10 | **1** | 11:52→11:53, +7 |
| Call +20 | **12** | all +1…+4, 10:28 through 15:20 |

Same species as named 08-19’s two n_trades=0 archive-up steps. Call +20 has the most (12). ATM call/put have none.

---

## Roll vs RTH-so-far (pre-RTH = 0)

On 08-19 the roll landed **exactly** on tape − pre-RTH. On 09-01, where pre-RTH is 0, the roll should land on tape-at-roll. It does **not**, on any name that has a roll:

| contract | archive after roll | tape at roll | miss |
|----------|-------------------:|-------------:|-----:|
| Call +10 | 377 | 401 | **−24** |
| ATM put | 286 | 325 | **−39** |
| Put −10 | 668 | 688 | **−20** |
| Call +20 | 298 | 300 | **−2** |
| ATM call | *(no decrease)* | — | — |

---

## 3. `last_updated` capture — still not live

The `chain_ladder.py` copy of `day.last_updated` onto generation rows is **local, uncommitted**, test-passing. It was **not** in `d79ef59` (docs-only push). The live tap has **not** loaded it. **No restart on this GO.** Until a restart, new snaps still omit `last_updated` (0 / present, as P-SV13). Say so when that restart happens; confirm on a new row. Not this probe.

---

## What the table does not do

No sixth explanation. Afternoon net-zero is **not** universal on 09-01. Call +10’s deficit is a morning event (one −7002 step). Zero-trade archive-moves exist on 09-01 (14 across three names).

---

## Source

- `/tmp/svp-psv15/svp-psv15-summaries.json`
- Tapes: `/tmp/svp-psv15/tape-{call_10,atm_call,atm_put,put_10,call_20}.json`
- P-SV14 corrections: `docs/evidence/session-volume-profile/P-SV14-accretion-steps.md`

# P-SV14 — Catch the accretion in the act

**Probe request 10.** Authority: P-SV13 (raw rows = working tape).  
**Contracts:** named `O:SPXW260819P07655000` (08-19) and 08-20 call_10 `O:SPXW260820C07690000`.  
**When:** 2026-09-01.

**Status unchanged:** P-SV1 stays open. The `svp_v1` freeze stays. Hotel stays blocked.

Read-only on the archive. Gold not written. Tap not restarted for this measurement.

`t_prev` = previous **volume-change** snap (previous row of this table). `tape_delta` = `sum(size)` of raw trades with `sip_timestamp ∈ (t_prev, t_step]`. `gap` = `archive_delta − tape_delta`.

Raw JSON: `/tmp/svp-psv13/svp-psv14-named.json`, `svp-psv14-c10.json`, `*-steps.json`.

---

## 0. `day.last_updated` on future snaps (not this probe)

Archive rows today have no `last_updated` (P-SV13: 0 / 26515 named). Landed on the generation builder so capture writes it:

- `server/market_data/chain_ladder.py` — copy `day.last_updated` onto the contract and onto `generation.rows[]`. Not added to `LADDER_FIELDS` (not a display column). Not added to `_row_signature` (product patch unchanged).
- Test: `tests/test_chain_ladder.py::test_day_last_updated_copied_onto_generation_row` — **PASS** (file: 15 passed, 1 skipped).

The live tap still has to **load this code** (process restart / deploy). Historical gold is unchanged. This is infra/capture only.

---

## Step counts

| | named 08-19 put_10 | 08-20 call_10 |
|--|-------------------:|--------------:|
| present snaps | 26515 | 38159 |
| volume-change steps | **312** | **385** |
| gap = 0 | 115 | 39 |
| gap > 0 | 113 | 192 |
| gap < 0 | 84 | 154 |
| archive decreases | **1** | **1** |
| Σ archive_delta | 13729 | 77293 |
| Σ tape_delta | 14271 | 74896 |
| Σ gap | −542 | +2397 |

Σ tape_delta equals the full raw tape on both (named 14271, call_10 74896). First-snap archive (overnight 2029 / 567) is outside the step sum.

---

## Twenty largest \|gap\| — named `O:SPXW260819P07655000`

Times ET. n=312 steps. Σ\|gap\| = **9280**. Top 20 = **7212** (77.7% of Σ\|gap\|).

| # | t_prev | t_step | archive_delta | tape_delta | gap | n_trades | dt_s | conditions (n) |
|--:|--------|--------|--------------:|-----------:|----:|---------:|-----:|----------------|
| 1 | 00:00:11 | 09:31:06 | **−1912** | 1561 | **−3473** | 532 | 34255 | `[]` 485, 232×29, 209×9, 236×4, 227×3, 233×2 |
| 2 | 09:48:10 | 09:49:07 | +653 | 144 | **+509** | 71 | 57 | 232×47, 209×19, 227×5 |
| 3 | 09:51:10 | 09:52:12 | +519 | 34 | **+485** | 24 | 62 | 209×19, 227×2, 232×2, 233×1 |
| 4 | 09:50:09 | 09:51:10 | +427 | 0 | **+427** | 0 | 61 | — |
| 5 | 10:11:10 | 10:12:08 | +93 | 345 | **−252** | 60 | 58 | 232×32, 209×21, 236×4, 227×2, 233×1 |
| 6 | 10:12:08 | 10:13:12 | +325 | 75 | **+250** | 35 | 64 | 232×19, 209×14, 227×1, 233×1 |
| 7 | 09:39:09 | 09:40:06 | +258 | 66 | +192 | 23 | 57 | 233×9, 209×7, 232×5, 236×1, 227×1 |
| 8 | 09:38:05 | 09:39:09 | +239 | 428 | −189 | 36 | 64 | 232×18, 209×9, 233×5, 236×3, 239×1 |
| 9 | 09:40:06 | 09:41:13 | +184 | 1 | +183 | 1 | 66 | 209×1 |
| 10 | 09:53:07 | 09:54:08 | +180 | 24 | +156 | 9 | 61 | 232×4, 209×4, 236×1 |
| 11 | 09:55:09 | 09:56:03 | +136 | 3 | +133 | 3 | 55 | 209×2, 232×1 |
| 12 | 09:46:11 | 09:47:04 | +158 | 27 | +131 | 4 | 53 | 232×4 |
| 13 | 09:32:11 | 09:33:08 | +151 | 22 | +129 | 2 | 57 | 232×2 |
| 14 | 11:41:12 | 11:42:09 | +133 | 25 | +108 | 12 | 58 | 233×7, 232×3, 209×1, 227×1 |
| 15 | 09:49:07 | 09:50:09 | +830 | 726 | +104 | 221 | 62 | 209×165, 232×38, 227×7, 236×6, 233×5 |
| 16 | 14:08:05 | 14:09:14 | +18 | 119 | −101 | 14 | 69 | 209×7, 232×3, 227×3, 236×1 |
| 17 | 14:09:14 | 14:10:05 | +113 | 12 | +101 | 3 | 52 | 232×1, 233×1, 209×1 |
| 18 | 09:34:11 | 09:35:11 | +121 | 22 | +99 | 4 | 59 | 209×2, 232×2 |
| 19 | 09:31:06 | 09:32:11 | +96 | 0 | +96 | 0 | 65 | — |
| 20 | 09:37:10 | 09:38:05 | +104 | 10 | +94 | 1 | 55 | 232×1 |

Row 1 is the **09:31:06 day roll** (archive 2029 → 117). Two steps have **n_trades = 0** and archive still moves (+427, +96).

---

## Twenty largest \|gap\| — 08-20 call_10 `O:SPXW260820C07690000`

n=385 steps. Σ\|gap\| = **10781**. Top 20 = **5764** (53.5% of Σ\|gap\|).

| # | t_prev | t_step | archive_delta | tape_delta | gap | n_trades | dt_s |
|--:|--------|--------|--------------:|-----------:|----:|---------:|-----:|
| 1 | 00:00:21 | 09:31:03 | **−381** | 1074 | **−1455** | 540 | 34243 |
| 2 | 09:56:08 | 09:57:06 | +471 | 29 | **+442** | 19 | 58 |
| 3 | 09:34:08 | 09:35:05 | +451 | 55 | **+396** | 30 | 56 |
| 4 | 09:42:05 | 09:43:04 | +404 | 19 | **+385** | 13 | 59 |
| 5 | 09:31:03 | 09:32:09 | +321 | 0 | **+321** | 0 | 66 |
| 6 | 09:32:09 | 09:33:09 | +348 | 40 | +308 | 16 | 60 |
| 7 | 11:02:10 | 11:03:06 | +734 | 463 | +271 | 158 | 56 |
| 8 | 09:50:09 | 09:51:08 | +271 | 14 | +257 | 10 | 60 |
| 9 | 11:01:07 | 11:02:10 | +872 | 1127 | −255 | 311 | 63 |
| 10 | 09:52:07 | 09:53:03 | +274 | 48 | +226 | 30 | 56 |
| 11 | 09:54:07 | 09:55:07 | +285 | 70 | +215 | 28 | 61 |
| 12 | 10:16:05 | 10:17:04 | +226 | 21 | +205 | 8 | 59 |
| 13 | 09:46:07 | 09:47:07 | +216 | 26 | +190 | 12 | 59 |
| 14 | 09:39:03 | 09:40:06 | +280 | 104 | +176 | 26 | 64 |
| 15 | 09:48:05 | 09:49:03 | +164 | 10 | +154 | 3 | 58 |
| 16 | 11:37:07 | 11:38:08 | +208 | 328 | −120 | 148 | 61 |
| 17 | 11:38:08 | 11:39:06 | +346 | 246 | +100 | 136 | 59 |
| 18 | 11:14:07 | 11:15:08 | +359 | 260 | +99 | 140 | 61 |
| 19 | 09:38:09 | 09:39:03 | +237 | 142 | +95 | 75 | 54 |
| 20 | 11:13:06 | 11:14:07 | +284 | 378 | −94 | 148 | 61 |

Row 1 is the **09:31:03 roll** (archive 567 → 186). One step with n_trades = 0 and archive +321.

---

## a. Concentrated or spread?

**\|gap\| histogram (n steps)**

| \|gap\| | named (n=312) | call_10 (n=385) |
|---------|--------------:|----------------:|
| 0 | 115 | 39 |
| 1 | 56 | 22 |
| 2–5 | 56 | 83 |
| 6–20 | 32 | 131 |
| 21–50 | 22 | 75 |
| 51–200 | 25 | 23 |
| 201–1000 | 5 | 11 |
| >1000 | 1 | 1 |

Named: **one** step (the roll, \|gap\|=3473) plus the next 19 = 77.7% of Σ\|gap\|. 115/312 steps have gap 0. The residual is **not** a single leftover step after the roll: 09:50–10:53 still has 49 nonzero-gap steps (below).

Call_10: top 20 = 53.5% of Σ\|gap\|. More mass in 6–50 (206/385). Spread thinner than named, still heavy in the open hour.

---

## b. Gap vs no-gap steps

**Exchange:** **302 on every tape trade in both groups, both contracts.** The table does not discriminate on exchange.

**Conditions:** empty `[]` prints sit **only** in with-gap, and **only** in the overnight→roll step (named 485, call_10 460). After 09:31 both groups carry 209, 232, 233, 227, 236. The table does **not** isolate a condition that is present on gap steps and absent on zero-gap steps after the roll.

**Trade count / size (means):**

| | named with-gap n=197 | named gap=0 n=115 | call_10 with-gap n=346 | call_10 gap=0 n=39 |
|--|---------------------:|------------------:|----------------------:|-------------------:|
| mean n_trades | 17.0 | 9.3 | 88.1 | 19.7 |
| mean tape_delta | 57.7 | 25.3 | 211.0 | 48.3 |
| mean archive_delta | 54.9 | 25.3 | 217.9 | 48.3 |
| mean dt_s | 235 | 97 | 159 | 63 |

With-gap means are pulled up by the 9.5-hour first step. Zero-gap steps: archive_delta **equals** tape_delta by construction (mean 25.3 named, 48.3 call_10).

The table does **not** give a condition or exchange that marks a gap step. It does show zero-gap steps are shorter and quieter.

---

## c. Archive volume decreases

**Named: 1 decrease** in 312 steps.  
00:00:11 → **09:31:06 ET**, archive **2029 → 117**, archive_delta **−1912**, tape_delta 1561 (532 trades), gap −3473. The day roll.

**Call_10: 1 decrease** in 385 steps.  
00:00:21 → **09:31:03 ET**, archive **567 → 186**, archive_delta **−381**, tape_delta 1074 (540 trades), gap −1455. The day roll.

No other decrease on either contract. Volume is cumulative except that one step per session.

---

## d. Named 09:50–10:53 vs 11:00–16:00

From the table, not from the residual series:

| | 09:50–10:53 ET | 11:00–16:00 ET |
|--|---------------:|---------------:|
| n_steps | 63 | 229 |
| gap = 0 | 14 | 99 |
| gap ≠ 0 | 49 | 130 |
| Σ archive_delta | 7557 | **4685** |
| Σ tape_delta | 6051 | **4685** |
| **Σ gap** | **+1506** | **0** |
| Σ\|gap\| | 2956 | 1048 |
| mean \|gap\| | 46.9 | 4.58 |
| mean n_trades | 26.6 | 7.72 |
| n_decreases | 0 | 0 |
| exchanges | 302 only | 302 only |
| conditions | 209, 232, 233, 227, 236 | 209, 232, 233, 227, 236 |

11:00–16:00: **Σ archive_delta = Σ tape_delta = 4685, Σ gap = 0.** The two series track in the aggregate. 09:50–10:53: archive adds **1506 lots more than the tape** across 63 steps (49 of them nonzero). That +1506 is the same order as the leftover residual **+1486 / +1487**. Conditions and exchange do not differ between the windows.

---

## 2. `sequence_number` vintage — record only

| session | contract | n trades | `sequence_number` | `id` |
|---------|----------|---------:|-------------------|------|
| 2026-08-19 | named put_10 | 4411 | **0 on 4411/4411** | `""` on 4411/4411 |
| 2026-09-01 | call_10 | 15247 | **unique 15247/15247** | `""` on 15247/15247 |
| 2026-09-01 | ATM call (sample) | — | populated (2116609, 3156194, …) | `""` |

The trades endpoint returns different field completeness by date. The sparse vintage sits on 08-19. **Not a story:** 09-01 Call +10 still has residual **−6999** with unique sequence numbers (P-SV13). Completeness alone does not sort the days.

---

## What the table does not do

It does not name a sixth explanation. It does not isolate a condition or exchange that accounts for the accretion. It does show: (1) exactly one archive decrease per session, the 09:31 roll; (2) named 11:00–16:00 net gap **0**; (3) named 09:50–10:53 net gap **+1506**; (4) two archive-up / tape-zero steps on the named contract.

---

## Source

- Steps: `/tmp/svp-psv13/svp-psv14-named-steps.json` (312), `svp-psv14-c10-steps.json` (385)
- Summaries: `svp-psv14-named.json`, `svp-psv14-c10.json`
- Tapes: raw P-SV12/13 rows
- Capture change: `server/market_data/chain_ladder.py` + `tests/test_chain_ladder.py`

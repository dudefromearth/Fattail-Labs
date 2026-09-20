# P-SV1 — decomposition (closes the probe)

**Probe request 7, outcome row 1.** Authority: P-SV16. GO **P-SV17**.  
**When:** 2026-09-01.  
**Sample base:** **15 contracts over 3 sessions** (2026-08-19, 2026-08-20, 2026-09-01; five roles each). Every bound below is on this sample. It is thin. The bound should widen as sessions accumulate.

**This document closes P-SV1.** The tap is faithful. The divergence is snapshot `day.volume` versus the vendor’s own aggregates / open-close / eligible tape. It is not a Labs defect.

**Does not:** choose a volume source for SVP · unfreeze `svp_v1` · unblock Hotel · fold the Spec. Labelling recommendation is Hotel’s. The ship decision is Coach’s.

Raw numbers: P-SV16 `/tmp/svp-psv16/fifteen.json`. Clock for 08-19 / 08-20 residual is archive **≤16:00** (the +22.84% clock). Clock for 09-01 is archive **final**.

---

## Outcome

Two of three numbers reconcile. The third does not, on some sessions, in both directions.

| Number | What it is | Equals |
|--------|------------|--------|
| **1. Eligible tape** | Massive `/v3/trades` lots whose `conditions` are non-empty **and** all have `updates_volume: true` | Aggregates `v` on **14/15**; open-close `volume` on the same 14/15 |
| **2. Aggregates / open-close** | `/v2/aggs` daily `v` and `/v1/open-close` `volume` | Each other on **15/15** (P-SV6 on 08-19/08-20; P-SV12 re-pull; P-SV11 16:30 on 09-01) |
| **3. Snapshot `day.volume`** | Copied by `chain_ladder.py` onto `generation.rows[].volume`; the number the tap writes | Eligible tape / aggs / open-close on the **09-01 five**. Diverges on **08-19 / 08-20** |

The tap copies (3). It does not invent (3).

---

## a. Trades (`updates_volume: true`) = aggregates = open-close

Coach’s claim: exact, every contract, every date tested. Two of three numbers reconcile.

**Measured (n=15 / 3 sessions):**

| session | role | tape_eligible | aggs `v` | open-close | equal? |
|---------|------|--------------:|---------:|-----------:|:------:|
| 08-19 | atm_call | 29017 | 29017 | 29017 | yes |
| 08-19 | atm_put | **122945** | **122944** | **122944** | **no — 1 lot** |
| 08-19 | call_10 | 49979 | 49979 | 49979 | yes |
| 08-19 | put_10 | **12827** | **12827** | 12827 | yes |
| 08-19 | far_thin | 58 | 58 | 58 | yes |
| 08-20 | atm_call | 10203 | 10203 | 10203 | yes |
| 08-20 | atm_put | 112083 | 112083 | 112083 | yes |
| 08-20 | call_10 | 74006 | 74006 | 74006 | yes |
| 08-20 | put_10 | 6718 | 6718 | 6718 | yes |
| 08-20 | far_thin | 47 | 47 | 47 | yes |
| 09-01 | atm_call | 140664 | 140664 | 140664 | yes |
| 09-01 | atm_put | 125339 | 125339 | 125339 | yes |
| 09-01 | call_10 | 60864 | 60864 | 60864 | yes |
| 09-01 | put_10 | 24600 | 24600 | 24600 | yes |
| 09-01 | call_20 | 6370 | 6370 | 6370 | yes |

**14/15 exact.** The 1-lot miss is 08-19 ATM put `O:SPXW260819P07705000`: tape_eligible **122945** vs aggs / open-close **122944**. It is not rounded away.

08-19 named put_10: tape_eligible **12827** = aggs. 08-20 call_10: tape_eligible **74006** = aggs; archive final **77860 − 74006 = +3854**.

`tape_eligible` excludes empty `[]` (undocumented; pre-RTH on 08-19/08-20) and condition **204 Late** (`updates_volume: false`). Empty is the entire ineligible mass on 08-19/08-20 except 300 Late lots on 08-19 call_10. 09-01 Call +10 ineligible is **8 Late prints / 6999 lots** at 10:37:36.149–.210 ET.

---

## b. 09-01: snapshot `day.volume` also equals both

Five contracts. Residual_eligible **0**.

| role | ticker | tape_eligible | aggs | open-close | archive final | residual_eligible |
|------|--------|--------------:|-----:|-----------:|--------------:|------------------:|
| atm_call | O:SPXW260901C07635000 | 140664 | 140664 | 140664 | 140664 | **0** |
| atm_put | O:SPXW260901P07635000 | 125339 | 125339 | 125339 | 125339 | **0** |
| call_10 | O:SPXW260901C07685000 | 60864 | 60864 | 60864 | 60864 | **0** |
| put_10 | O:SPXW260901P07585000 | 24600 | 24600 | 24600 | 24600 | **0** |
| call_20 | O:SPXW260901C07735000 | 6370 | 6370 | 6370 | 6370 | **0** |

P-SV11 live bracket (same five, same session): direct snapshot `day.volume` **equals** the tap inside the bracket at 11:00, 13:00, and 15:45 ET — exact equality, not a range. At 16:30, tap final = aggs = open-close on all five.

The capture path is **validated**, not merely un-falsified: on this session the number the tap wrote is the vendor snapshot, and that number is the vendor daily bar.

---

## c. 08-19 / 08-20: snapshot `day.volume` alone diverges

Both directions, same two sessions. Residual_eligible = archive@≤16:00 − tape_eligible.

**Three named (archive high):**

| session | role | ticker | archive@≤16:00 | tape_eligible = aggs | residual_eligible | % of aggs |
|---------|------|--------|---------------:|---------------------:|------------------:|----------:|
| 08-19 | put_10 | O:SPXW260819P07655000 | 15757 | 12827 | **+2930** | **+22.84%** |
| 08-19 | call_10 | O:SPXW260819C07755000 | 54644 | 49979 | **+4665** | **+9.33%** |
| 08-20 | call_10 | O:SPXW260820C07690000 | 77860 | 74006 | **+3854** | **+5.21%** |

**Four negative:**

| session | role | ticker | archive@≤16:00 | tape_eligible = aggs | residual_eligible | % of aggs |
|---------|------|--------|---------------:|---------------------:|------------------:|----------:|
| 08-19 | atm_call | O:SPXW260819C07705000 | 29005 | 29017 | **−12** | **−0.04%** |
| 08-20 | atm_call | O:SPXW260820C07640000 | 9228 | 10203 | **−975** | **−9.56%** |
| 08-20 | atm_put | O:SPXW260820P07640000 | 111601 | 112083 | **−482** | **−0.43%** |
| 08-20 | far_thin | O:SPXW260820C07585000 | 29 | 47 | **−18** | **−38.30%** |

The rest of the ten (not named above): 08-19 atm_put **+680**, 08-19 far_thin **0**, 08-20 put_10 **+594**.

Sign split on the full 15 (residual_eligible): **5 above, 4 below, 6 zero**. Min **−975**, max **+4665**. Min % **−38.30%**, max % **+22.84%**. Not single-signed.

---

## d. Negative side — demonstrated mechanism

P-SV10, **not** one of the 15: SPX weekly `O:SPXW260904P07685000` on session 2026-08-31 (dated expiration 2026-09-04).

| | snapshot `day` | aggs / open-close |
|--|----------------|-------------------|
| volume | **617** | **627** |
| residual | **−10** | — |
| VWAP | **37.6002** | **37.5508** |
| `n` | (absent) | 210 |
| `last_updated` | **1788207182049000000** = **2026-08-31T16:13:02.049-04:00** | daily bar through the close |

`day.last_updated` is frozen at **16:13:02**, two minutes before the **16:15** close. VWAP agrees with a smaller trade set (higher than the full-bar VWAP). Four of five SPX names on that pull were equal; this ATM put was the disagreeing row. Snapshot **below** aggs, not above.

This is the discriminator for the **negative** residual: the snapshot daily bar can stop updating before the session’s last eligible prints. Historical gold rows do **not** carry `last_updated` (P-SV13: 0 / 26515 on the named contract). That field is what would sort the four negatives in §c. Capture of it is a separate restart (P-SV17 § tap).

---

## e. Positive side — no mechanism

State that plainly. Snapshot `day.volume` sits **above** the vendor’s own eligible tape / aggs / open-close on the three named contracts, by thousands of lots. No demonstrated cause.

Five explanations died. The sixth was a wrong comparator, not a cause:

| # | Attempt | Killed by |
|---|---------|-----------|
| 1 | Truncation of the trades pull | P-SV13 unique set identical across four pulls (3561 / 12682) |
| 2 | Dedup of byte-identical rows | P-SV13: content-hash unique n 3561 is **365 below** `aggs n` 3926; working tape = raw rows. Aggs agrees with raw RTH on n **and** lots |
| 3 | Labs tap / generation-builder | P-SV11: tap = raw snapshot inside the bracket |
| 4 | Overnight carry into RTH | P-SV14: 09:31 roll **117 = 1561 − 1444** on the named contract |
| 5 | Timestamp lag between tape and snaps | P-SV14: Σ\|gap\| minimises at lag **0** |
| 6 | Raw tape (Late + empty `[]`) as the missing volume | P-SV16: wrong comparator. Closes 09-01 (8×204 Late = 6999). **Worsens** 08-19 named +1486 → **+2930** |

Earlier product-side attempts stay dead and are not reopened: vendor-vs-itself convention (P-SV6, aggs = open-close 15/15), clock window (P-SV8, two-sided error at one window), ticker/band misalignment (P-SV9 Gate 0), a documented snapshot-only inclusion set (P-SV10 conditions table).

The positive residual is a vendor snapshot-vs-aggregates fact on some sessions. It is not explained.

---

## f. Every Labs-side hypothesis is closed

| Hypothesis | Evidence | Fixture count |
|------------|----------|----------------|
| **Not truncation** | Unique set identical across four pulls of 08-19 named: unique n **3561**, unique lots **12682**. Raw `sum(size)` still moves with page size; the unique set does not. Truncation loses trades; this set lost nothing. | 1 contract, 4 pulls |
| **Not dedup** | 08-19 named RTH 09:30–16:00: raw n **3926** = `aggs n`; raw lots **12827** = `aggs v`. Identifier fields unusable on that vintage (`id=""` and `sequence_number=0` on 4411/4411). Collapsing byte-identical rows **opens** a 365-trade hole vs the vendor. | 1 contract |
| **Not the tap** | P-SV11 bracket: snapshot `day.volume` = tap before = tap after, exact, on every in-band contract at 11:00 / 13:00 / 15:45. Call +20 matches on nearby `wings=25` snaps. | 5 contracts, 3 instants + close |
| **Not overnight carry** | Named 08-19 put_10 at 09:31:06: archive **117 = 1561 − 1444** (tape at the roll minus pre-RTH empty[] lots). `day.volume` resets and counts RTH-so-far. Overnight 2029 is excluded as an explanation of the **+2930**. | 1 contract (08-20 call_10 same reset, off by 2 lots) |
| **Not lag** | Cross-correlate tape timestamps by k ∈ {−2,−1,0,+1,+2} min. Σ\|gap\| and n_gap0 both minimise at **0**, by a wide margin (named 9280 vs 15098/15826; call_10 10781 vs 40931/43511). A lag redistributes and nets to zero; the net **+2931** never reverses. Four consecutive +gaps 09:48–09:52 = **+1525**. | 2 contracts |

Sample base for the residual itself remains **15 / 3**. The mechanism tests above are subsets. Quote the subset size with the bound.

---

## What SVP shows — options, not a choice

SVP is a **session** profile. It needs **intraday** volume. Only the snapshot provides that. Aggregates and open-close exist only after the close. The eligible tape can be reconstructed after the fact; it is not available intraday at the tap’s cadence (~2.4 s).

The choice is constrained. The honest options:

### (i) Snapshot `day.volume`, declared

Intraday-capable. This is what the gold archive already holds (`generation.rows[].volume`).

Diverges from the vendor’s own end-of-day bar on some sessions. On this sample (n=15 / 3 sessions):

- 09-01 five: residual **0**
- 08-19 / 08-20: residual_eligible **−975 … +4665** lots (**−38.30% … +22.84%**)
- Named highs: **+2930 / +4665 / +3854**
- Both signs on the same two sessions

### (ii) Reconstruct from the eligible tape

Most accurate versus the vendor daily bar. Equals aggs / open-close on **14/15** (1-lot miss on 08-19 ATM put).

Not cheap: a paged `/v3/trades` pull per contract, condition-filter, RTH slice. **Not available intraday** at the tap’s cadence. Cannot paint a live profile from this path without a second, standing trades consumer Labs does not have.

### (iii) Show both and name the difference

Snapshot for the live / historical profile; vendor daily (aggs or eligible-tape reconstruct) beside it when that figure exists. The difference **is** residual_eligible. On this sample that difference is **0** on the 09-01 five and **−975 … +4665** on the 08-19 / 08-20 ten.

---

**Do not choose here.**

| Who | What |
|-----|------|
| **Hotel** | Labelling recommendation — what the member is told this number is |
| **Coach** | Ship decision — which of (i) / (ii) / (iii) |

Hotel stays blocked until that labelling decision is made. That is a decision, not a defect.

Whatever is chosen, the **coverage strip declares it**. This is the anomalies doctrine the toolset was built on. This investigation produced exactly the kind of fact it exists to disclose: a session-dependent snapshot-vs-aggregates residual, both signs, no Labs-side cause.

---

## Status after this document

| Item | State |
|------|-------|
| **P-SV1** | **Closed** on Delta PASS of this decomposition |
| **`svp_v1` freeze** | Goes to Coach. Not decided here |
| **Hotel** | Blocked until the labelling decision |
| **Spec fold** | Not this GO |

---

## Source

- P-SV6, P-SV8, P-SV9, P-SV10, P-SV11, P-SV12, P-SV13, P-SV14, P-SV15, P-SV16
- Fifteen: `/tmp/svp-psv16/fifteen.json`
- Conditions: `/tmp/svp-psv16/conditions-33.json` (33 ids; empty `[]` undocumented)
- Capture fix on `main`: `3801c0d` (`chain_ladder.py` copies `day.last_updated`; not `LADDER_FIELDS`, not `_row_signature`)

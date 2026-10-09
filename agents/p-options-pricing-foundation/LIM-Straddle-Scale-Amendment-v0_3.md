# LIM Template — Straddle-Normalised Centre Scale Amendment v0.3 (DRAFT)

**Date:** 2026-10-08
**Supersedes:** `agents/p-options-pricing-foundation/LIM-Straddle-Scale-Amendment-v0_2.md` (and v0.1). v0.3 adds to §1a the five per-symbol-scale statements India's v0.2 review found in v0.4.7: status text lines 12–13 and 827, D4 line 630, caveat 4 line 648, and §15 item 4 line 707.
**Status:** Draft. Coach decision logged as DL-817. `k` calibrated (§4). India reviewed v0.1 and v0.2 (each NEEDS REVISION, one BLOCKING; both answered). Not stamped. No build authority.
**Amends:** `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md` (BUILD AUTHORITY, confirmed by India). Clauses replaced are listed in §1a.
**Evidence:** `gate-reports/LIM-Centre-Scale-Per-Symbol-Proposal-v1_0.md` · `gate-reports/LIM-Centre-Scale-Formula-Evaluation-v1_0.md`

**Scope statement**
- Program: Options Lab Runner — GEX (Quad Window) / LIM
- Trees the build would touch: `web/lib/options-lab/templates/lim.ts`, `lim.test.ts`, the web env files holding LIM config, `Architecture/29-options-lab-heatmap-templates.md`, `Architecture/00-decision-log.md`
- Touches outside program: **Heatmap/Runner tree is frozen** — the build needs Coach's three OKs on the GO token

---

## 1. Coach decision (2026-10-08)

Adopt the ATM-straddle rule for the quad's centre scale (formula F5 in the evaluation), **"so long as the calculation automatically normalizes for the boundaries of the quad."**

Read as: the ball's position is computed so it always lies inside the quad by construction, for every symbol and every market state. There is no hand-maintained per-symbol list, and the position is not clipped against the edge.

## 1a. Parent clauses replaced (complete list)

Each clause below is **replaced** by this amendment. Anything in v0.4.7 that depends on them follows the new text.

| v0.4.7 clause | Was | Becomes |
|---|---|---|
| **LIM7** (X / lean scale and clamp) | `centrePts ÷ LIM_CENTRE_SCALE_PTS`, clamped to ±100 | §2: `x = 100·tanh(r)`, no clamp |
| **The closed interval `[−100, +100]`** for displayed X, wherever v0.4.7 states it | Closed; the ball may sit on the edge | **Open interval `(−100, +100)`**; the ball never sits on the edge |
| **LIM26** refusal sentence on the chrome | "No centre scale configured for <symbol>." | "Quad window unavailable for {symbol} {expiration}: ATM straddle not available." (§3). The old sentence is retired. |
| **LIM33** (trail and transition on `xUnclamped`) | `xUnclamped` = unclamped scale ratio | `xUnclamped = 100·r` (§2); the trail continues beyond the edge on that value |
| **LIM34** (per-symbol scale map) | Symbol map; an absent symbol means `valid: false` | Retired. One shared `k`; `valid: false` only per §3 |
| **AT-LIM19** | Symbol absent from map → `valid: false` | Replaced by AT-LIMS4/5 |
| **AT-LIM33**, and any acceptance test asserting a ball at ±100 or the closed interval | Edge reachable | Replaced by AT-LIMS1 (strictly inside) and AT-LIMS9 |
| **§9 / Appendix A**: `LABS_LIM_CENTRE_SCALE_PTS` | Required key | Removed; **`LABS_LIM_STRADDLE_K`** added |
| **Status text, lines 12–13 and line 827** | The scale map may list SPX and I:SPX | Replaced: "The horizontal scale is one shared constant `k` applied to each symbol's ATM straddle (amendment §2). There is no per-symbol scale map." |
| **D4, line 630** (declared divergence: "per-symbol scale" as the Labs rule) | Per-symbol scale | "One shared, config-driven `k` × each symbol's ATM straddle; no per-symbol constants (invariant #2)" |
| **Caveat 4, line 648** (`LIM_CENTRE_SCALE_PTS` is instrument-specific and does not transfer) | Scale does not transfer between symbols | Replaced: "The scale is measured in ATM straddles, so it transfers across symbols by construction. A symbol whose GEX centre routinely sits several straddles from spot will often read near the edge. That is a reading, not a scale error." |
| **§15 item 4, line 707** (open decision: `LIM_CENTRE_SCALE_PTS` per symbol, owner Hotel) | Open | **Closed** by DL-817 and this amendment; `k` set by Hotel calibration (§4) |

India confirms that no other v0.4.7 line references any of the following. Any line it finds is added to this table before stamp.
- the edge or the closed interval;
- the old sentence or the old key;
- a per-symbol scale, a scale map, or instrument-specific scale.

## 2. The rule

For symbol `s`, expiration `e`, at a snapshot:

```text
S        = mid(ATM call) + mid(ATM put)          ATM = listed strike nearest spot, same expiration e
r        = centrePts / (k · S)                    centrePts exactly as today (LIM7)
x        = 100 · tanh(r)                          displayed X, strictly inside (−100, +100)
xUnclamped = 100 · r                              kept for trail and transition (LIM33)
```

- **`k`** is one constant shared by every symbol. It is required config, **`LABS_LIM_STRADDLE_K`**, with no code default (invariant #2). Calibrated value: **k = 3.2712422351724415** (§4).
- **Automatic normalisation:** `tanh` maps any centre distance into the quad. A small `r` is near-linear, so central readings behave as today. A large `r` approaches the edge smoothly and never reaches it. No ball is pinned, and the order of readings is preserved.
- **Y is unchanged** (`nearSpotMix`, already bounded 0–100 with no clamp, LIM38).
- **Meaning, for the chrome:** "Horizontal position = distance of the GEX centre from spot, measured in ATM straddles." The straddle is the market's own price for the expected move, so the reading means the same thing on every symbol.

## 3. Missing data (ruling 8, DL-815)

- If either ATM mid is missing, or `S ≤ 0`: `valid: false`, and the quad shows **"Quad window unavailable for {symbol} {expiration}: ATM straddle not available."** No other strike, expiration or symbol substitutes.
- Each occurrence is reported to admins per plan MS-9 (aggregated). **Dependency:** Admin Notifications Spec v1.0 has no missing-data kind and no aggregation rule. The admin half of this clause waits on that spec's v1.1, which awaits Coach's OK. The member-facing message does not wait.
- `LABS_LIM_STRADDLE_K` missing or invalid: boot aborts.

## 4. Calibration of `k` (Hotel — done, `gate-reports/LIM-Straddle-K-Calibration-v1_0.md`)

**Result:** k = 3.2712422351724415.
- SPX median |x| is 11.13, matching today. SPX's furthest minute moves from 50.76 to 75.82 and never reaches the edge.
- Consistency spread: median 5.87, p99 2.68 (the best of all candidates).
- No straddle was missing on any symbol.
- **ADVISORY:** IWM, SLV, TLT, UNG, USO and XLF spend more than 1% of minutes above |x| > 95 (TLT 6.3%, XLF 5.1%). Their GEX centre often sits several straddles from spot. That is a real reading, but these balls will often sit near the edge. Recheck after more data.

Method, as originally specified:

Use the same sample as the evaluation (41,063 RTH minutes, wings 25, 18 symbols). Choose `k` so that **SPX's median |x| under the tanh rule equals today's 11.13** (fixed-50 scale). Then report, per symbol:
- the median, p90, p99 and max |x|;
- the share of minutes with |x| > 95;
- the consistency spread (largest ÷ smallest across symbols) for the median and p99.

Also SPX against today: the change in median and max |x|.

## 5. Change control (LIM spec §16)

This is a **breaking change** to every LIM reading members have seen. SPX's typical minute is held (calibration), and SPX's extreme minutes move toward the edge where today they stop near halfway.

- The DL entry records the old rule (fixed 50 points, SPX only) against the new rule (tanh of straddle-normalised distance, all symbols), with `k`.
- Members are told the quad's horizontal scale changed, in plain words, on the surface or in Help (Sierra).
- `LABS_LIM_CENTRE_SCALE_PTS` is **retired** from Appendix A and from the env files in the same change. LIM34 and AT-LIM19 are replaced by §3 above.

## 6. Acceptance

| ID | Case | Expect |
|---|---|---|
| AT-LIMS1 | Any snapshot, any symbol | `−100 < x < 100`, never equal to ±100 |
| AT-LIMS2 | Two snapshots with `r1 < r2` | `x1 < x2` (order preserved) |
| AT-LIMS3 | SPX on the calibration sample | median \|x\| = 11.13 ± 0.5 |
| AT-LIMS4 | ATM call or put mid missing | `valid: false`; the §3 message; admin record written |
| AT-LIMS5 | `S ≤ 0` | same as AT-LIMS4 |
| AT-LIMS6 | `LABS_LIM_STRADDLE_K` absent | boot aborts |
| AT-LIMS7 | Live, RTH: SPX, XSP, SPY, QQQ, AAPL, TSLA | ball shown on each; no "no centre scale" message anywhere |
| AT-LIMS8 | Repo grep | no `LIM_CENTRE_SCALE_PTS` remaining |
| AT-LIMS9 | `xUnclamped` | equals `100·r`; trail continues beyond the edge |

## 7. Open

None for Coach. Hotel supplies `k` (§4); India confirms the parent file.

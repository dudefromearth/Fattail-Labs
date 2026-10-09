# LIM Template — Straddle-Normalised Centre Scale Amendment v0.1 (DRAFT)

**Date:** 2026-10-08
**Status:** Draft. Coach decision recorded below; not India-reviewed; not stamped. No build authority.
**Amends:** the current LIM template spec in `Specs/` (v0_4 line; India confirms the exact file) — LIM7 (X / lean), LIM33 (trail), LIM34 (per-symbol scale), §9 and Appendix A (configuration), AT-LIM19.
**Evidence:** `gate-reports/LIM-Centre-Scale-Per-Symbol-Proposal-v1_0.md` · `gate-reports/LIM-Centre-Scale-Formula-Evaluation-v1_0.md`

**Scope statement**
- Program: Options Lab Runner — GEX (Quad Window) / LIM
- Trees the build would touch: `web/lib/options-lab/templates/lim.ts`, `lim.test.ts`, the web env files holding LIM config, `Architecture/29-options-lab-heatmap-templates.md`, `Architecture/00-decision-log.md`
- Touches outside program: **Heatmap/Runner tree is frozen** — the build needs Coach's three OKs on the GO token

---

## 1. Coach decision (2026-10-08)

Adopt the ATM-straddle rule for the quad's centre scale (formula F5 in the evaluation), **"so long as the calculation automatically normalizes for the boundaries of the quad."**

Read as: the ball's position is computed so it always lies inside the quad by construction, for every symbol and every market state. There is no hand-maintained per-symbol list, and the position is not clipped against the edge.

## 2. The rule

For symbol `s`, expiration `e`, at a snapshot:

```text
S        = mid(ATM call) + mid(ATM put)          ATM = listed strike nearest spot, same expiration e
r        = centrePts / (k · S)                    centrePts exactly as today (LIM7)
x        = 100 · tanh(r)                          displayed X, strictly inside (−100, +100)
xUnclamped = 100 · r                              kept for trail and transition (LIM33)
```

- **`k`** is one constant shared by every symbol. It is required config, **`LABS_LIM_STRADDLE_K`**, with no code default (invariant #2). Hotel calibrates it (§4).
- **Automatic normalisation:** `tanh` maps any centre distance into the quad. A small `r` is near-linear, so central readings behave as today. A large `r` approaches the edge smoothly and never reaches it. No ball is pinned, and the order of readings is preserved.
- **Y is unchanged** (`nearSpotMix`, already bounded 0–100 with no clamp, LIM38).
- **Meaning, for the chrome:** "Horizontal position = distance of the GEX centre from spot, measured in ATM straddles." The straddle is the market's own price for the expected move, so the reading means the same thing on every symbol.

## 3. Missing data (ruling 8, DL-815)

- If either ATM mid is missing, or `S ≤ 0`: `valid: false`, and the quad shows **"Quad window unavailable for {symbol} {expiration}: ATM straddle not available."** No other strike, expiration or symbol substitutes.
- Each occurrence is reported to admins per plan MS-9 (aggregated).
- `LABS_LIM_STRADDLE_K` missing or invalid: boot aborts.

## 4. Calibration of `k` (Hotel, before stamp)

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

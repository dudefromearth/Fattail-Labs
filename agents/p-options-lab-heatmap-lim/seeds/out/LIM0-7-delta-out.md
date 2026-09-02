# LIM AT ownership matrix — LIM0-7

**Agent:** Delta  
**Seat:** LIM0-7  
**Not a gate verdict.** This file is the lock. Later gates fill evidence against these rows. No AT is waived here. Tests are not run here. `OLLIM-W0.md` is not stamped here.

**Law:** LIM Spec v0.4.3 §10 (E15–E17 · AT-LIM29–32)  
**Plan:** [`docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.2.md`](../../../../docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.2.md) §8–9  
**Index:** [`characterization-list.md`](./characterization-list.md) — phase owners copied, not rewritten.

---

## Gate names (law)

This board’s gates are **LIM0-G … LIM6-G** only.

| Gate | File | Owns |
|------|------|------|
| **LIM0-G** | `gate-reports/LIM0-G.md` | LIM0-1…9 done. Board lock. **No AT-LIM\* rows.** |
| **LIM1-G** | `gate-reports/LIM1-G.md` | AT-LIM1–13, 16, 17, **17b**, 19, 20 (fields), 26, 28, **29, 30, 31** on fixtures |
| **LIM2-G** | `gate-reports/LIM2-G.md` | AT-LIM13 (trail past edge), 14, 15, 25 |
| **LIM3-G** | `gate-reports/LIM3-G.md` | AT-LIM10, 18, 20 (chrome strings), 21, 22, 23 (chrome), 24, 27, **32** |
| **LIM4-G** | `gate-reports/LIM4-G.md` | Glow / annotations / frozen GEX look. **No AT-LIM\* rows.** |
| **LIM5-G** | `gate-reports/LIM5-G.md` | Full pack AT-LIM1…**32** **including 17b**. Missing row = **FAIL**. |
| **LIM6-G** | `gate-reports/LIM6-G.md` | Docs parity. **No AT-LIM\* rows.** |

There is **no `W0-G`** on this board. Do not alias LIM0-G or LIM0-0 as `W0-G`.

**LIM0-0** is Coach’s stamp on [`agents/go/OLLIM-W0.md`](../go/OLLIM-W0.md). **Chat is not LIM0-0 (DL-328).** Delta reads that file. A Slack / thread / “Coach said GO” line is **FAIL** if offered as the stamp.

Coach stamp and the JR8 / E12 three-OK log live **only** on `OLLIM-W0.md`. They are not duplicated or pre-filled here.

---

## Ternary (every later gate)

Verdicts are **PASS / FAIL / BLOCKED** only.

| Rule | Meaning |
|------|---------|
| **Evidence or FAIL** | Command + output (or curl / browser walk) on the row. “It should work” is **FAIL**. |
| **No waive** | A missing AT is **FAIL**. Coach may overrule a specialist finding only by **DL entry with reasoning**. That is not a gate waive. |
| **BLOCKED** | Named dependency not done (e.g. LIM1-G before LIM0-0). Not a skip. |
| **Chat is not evidence** | Chat is not LIM0-0. Chat is not LIM0-G. Chat is not an AT. |

LIM0-7 does not pre-score rows. Every AT below is **ungated** until its owner gate files evidence.

---

## Ownership — AT-LIM1…32

Phase column **matches** `characterization-list.md`. Split owners stay split: LIM1 proves the compute half; LIM2/LIM3/LIM5 prove the surface half. LIM5-G still requires the full pack green.

**v0.4.2 additions** (plan v1.1 changelog · E8–E14): **AT-LIM17b, AT-LIM24, AT-LIM25, AT-LIM26, AT-LIM27, AT-LIM28**. These are first-class rows. Omitting any of them at LIM5-G is **FAIL**.

| Id | Assert | Owner phase | First evidence gate | Notes |
|----|--------|-------------|---------------------|-------|
| **AT-LIM1** | Mass above spot → x > 0 | LIM1 | LIM1-G | Hotel golden |
| **AT-LIM2** | Mass below spot → x < 0 | LIM1 | LIM1-G | Hotel golden |
| **AT-LIM3** | Mass symmetric about spot → x ≈ 0 regardless of gamma sign | LIM1 | LIM1-G | Hotel golden |
| **AT-LIM4** | All-positive net near spot → y > 50 | LIM1 | LIM1-G | Hotel golden |
| **AT-LIM5** | All-negative net near spot → y < 50 | LIM1 | LIM1-G | Hotel golden |
| **AT-LIM6** | Mass above + negative near spot → x > 0 **and** y < 50 | LIM1 | LIM1-G | Axes independent (D12) |
| **AT-LIM7** | Spot inside crossing → `crossingProximity = 0`; x, y unchanged | LIM1 | LIM1-G | |
| **AT-LIM8** | Spot beyond ceil → `crossingProximity = 1` | LIM1 | LIM1-G | `LIM_XPROX_CEIL_PCT` |
| **AT-LIM9** | Empty map → x 0, y **50** | LIM1 | LIM1-G | Not bottom-centre |
| **AT-LIM10** | Never-hydrated → centre, full opacity, not bottom-centre | LIM3 | LIM3-G | Render, not compute |
| **AT-LIM11** | Three crossings → count 3; all intervals | LIM1 | LIM1-G | Hotel golden |
| **AT-LIM12** | Cliff vs smear → `steepness` differs | LIM1 | LIM1-G | Same location |
| **AT-LIM13** | lean beyond ±100 → `xUnclamped ≠ x`; trail past edge | LIM1 · LIM2 | LIM1-G (unclamped X) · LIM2-G (trail past edge) | E1 |
| **AT-LIM14** | Held still → ghosts cluster | LIM2 | LIM2-G | |
| **AT-LIM15** | Moved fast → ghosts spread | LIM2 | LIM2-G | |
| **AT-LIM16** | `netRatio`, `concF`, `magF` published; recombine to `nearSpotMix` | LIM1 | LIM1-G | Exact recombine |
| **AT-LIM17** | Any config key absent → abort. **C2:** other templates still render with a LIM key absent. | LIM1 | LIM1-G | Isolation — see below |
| **AT-LIM17b** | `W_NET + W_CONC + W_MAG ≠ 1.0` → abort | LIM1 | LIM1-G | **v0.4.2** · E8 |
| **AT-LIM18** | `crossingCount ≠ 1` → no single crossing price in chrome | LIM3 | LIM3-G | |
| **AT-LIM19** | Symbol off the scale map → `valid: false`; no fallback | LIM1 | LIM1-G | |
| **AT-LIM20** | No `(lo+hi)/2` in any published field or chrome string | LIM1 · LIM3 | LIM1-G (fields) · LIM3-G (chrome) | |
| **AT-LIM21** | Any `crossingProximity` → dot opacity unchanged | LIM3 | LIM3-G | E3 |
| **AT-LIM22** | Chrome matches Appendix B: OI as-of **or named hole** + same-day sentence | LIM3 | LIM3-G | E6 |
| **AT-LIM23** | Grep: none of *wall, magnet, pin, gravity, intent, hostile, support, resistance, friction, muddy, slippery* | LIM3 · LIM5 | LIM3-G (chrome) · LIM5-G (shipped copy, **not** the Spec) | E4 · E7 |
| **AT-LIM24** | Compact: dot **and proximity ring** present; chip, trail, annotations absent | LIM3 | LIM3-G | **v0.4.2** · E11 |
| **AT-LIM25** | Expiration changed, then symbol changed → trail empty on first frame after each | LIM2 | LIM2-G | **v0.4.2** · E13 |
| **AT-LIM26** | `0 ≤ nearSpotMix ≤ 100` with **no clamp in the code path**; `yUnclamped` absent from payload | LIM1 | LIM1-G | **v0.4.2** · E8 |
| **AT-LIM27** | Registry: exactly one `ValueModeId` added; no `session-volume` entry | LIM3 | LIM3-G | **v0.4.2** · E14 |
| **AT-LIM28** | Grep `LIM_CONF_` → zero hits | LIM1 | LIM1-G | **v0.4.2** · E10 |
| **AT-LIM29** | Nearest crossing between XPROX floor and ceiling → `0 < crossingProximity < 1` | LIM1 | LIM1-G | **v0.4.3** · E15 · Hotel F9 |
| **AT-LIM30** | Crossing spans skipped zero-net strike → steepness uses `(hi − lo)` | LIM1 | LIM1-G | **v0.4.3** · E16 · Hotel F7 |
| **AT-LIM31** | Spot inside → `spotBelowNearestCrossing` false **and** distance 0 | LIM1 | LIM1-G | **v0.4.3** · E17 · Hotel F7 |
| **AT-LIM32** | Equal `nearSpotMix`, magF 0 vs magF > 50 → both magF values on Comfort readout | LIM3 | LIM3-G | **v0.4.3** · OD-LIM10 · Hotel F2 vs F4 |

Hotel goldens (hand-recorded before `lim.ts`): **nine** fixtures — Spec §10 / plan + AT-LIM29. Three fixtures is **FAIL** at LIM1-G.

**v0.4.3 additions:** AT-LIM29, 30, 31, 32. Omitting any at LIM5-G is **FAIL**.

---

## AT-LIM17 — C2 isolation

Spec §10: any config key absent → abort. No silent default.

**C2 (required on this row, not a new AT):** other templates still render with a LIM key absent.

Abort is scoped to LIM activation. `limConfig.ts` must **not** throw at `HeatmapChainPanel` module load. Parse on first LIM activation; the panel catches at the template boundary; LIM renders unavailable **with the missing key named**. GEX / Advanced Fly / Width Fit (and any other non-LIM template) keep rendering.

A module-load throw that takes down the Heatmap panel is **FAIL** even if LIM itself aborted. A silent default that lets LIM paint is **FAIL**. C2 does not soften AT-LIM17.

AT-LIM17b (weight sum ≠ 1.0) is the same abort class. C2 isolation is asserted on **AT-LIM17**; 17b remains the convexity abort (E8).

---

## Split-owner rows (do not collapse)

| Id | LIM1 | LIM2 | LIM3 | LIM5 |
|----|------|------|------|------|
| **AT-LIM13** | `xUnclamped ≠ x` on fixture | trail continues past the plane edge | — | pack |
| **AT-LIM20** | no `(lo+hi)/2` in published fields | — | no `(lo+hi)/2` in chrome strings | pack |
| **AT-LIM23** | — | — | chrome / field / label grep | grep of **shipped** copy sources, not the Spec |

LIM5-G re-proves the whole pack. It is not a second owner except where the characterization list names it (AT-LIM23).

---

## Not in this matrix

- LIM4-G glow / frozen-GEX look — no AT-LIM id. Still a real gate; still evidence or FAIL.
- LIM5-1 zero extra Massive on template switch — LIM5-G evidence, not an AT-LIM row.
- OD-LIM* / JR* / three-OK log — Coach token only. Not pre-filled here.

---

## LIM0-7 lock

- AT-LIM1…28 **and** AT-LIM17b each have a phase owner matching `characterization-list.md`.
- Gate names are **LIM0-G … LIM6-G** only. No `W0-G`.
- Ternary is PASS / FAIL / BLOCKED. Evidence or FAIL. Chat is not LIM0-0 (DL-328).
- AT-LIM17 carries C2: other templates still render with a LIM key absent.
- AT-LIM17b, 24–28 are v0.4.2 additions and are not optional.

**Delta will not PASS LIM5-G without command evidence on every row above.**

# AT-LIM1…28 — characterization list

**Law:** LIM Spec v0.4.2 §10.  
**Plan:** [`docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md)  
**Gate:** LIM5-G. Fixtures land in the same change as the code they prove.

| Id | Assert | Owner phase |
|----|--------|-------------|
| **AT-LIM1** | Mass above spot → x > 0 | LIM1 |
| **AT-LIM2** | Mass below spot → x < 0 | LIM1 |
| **AT-LIM3** | Mass symmetric about spot → x ≈ 0 regardless of gamma sign | LIM1 |
| **AT-LIM4** | All-positive net near spot → y > 50 | LIM1 |
| **AT-LIM5** | All-negative net near spot → y < 50 | LIM1 |
| **AT-LIM6** | Mass above + negative near spot → x > 0 **and** y < 50 | LIM1 |
| **AT-LIM7** | Spot inside crossing → `crossingProximity = 0`; x,y unchanged | LIM1 |
| **AT-LIM8** | Spot beyond ceil → `crossingProximity = 1` | LIM1 |
| **AT-LIM9** | Empty map → x 0, y **50** | LIM1 |
| **AT-LIM10** | Never-hydrated → centre, full opacity, not bottom-centre | LIM3 |
| **AT-LIM11** | Three crossings → count 3; all intervals | LIM1 |
| **AT-LIM12** | Cliff vs smear → `steepness` differs | LIM1 |
| **AT-LIM13** | lean beyond ±100 → `xUnclamped ≠ x`; trail past edge | LIM1 · LIM2 |
| **AT-LIM14** | Held still → ghosts cluster | LIM2 |
| **AT-LIM15** | Moved fast → ghosts spread | LIM2 |
| **AT-LIM16** | `netRatio`, `concF`, `magF` published; recombine to `nearSpotMix` | LIM1 |
| **AT-LIM17** | Any config key absent → abort | LIM1 |
| **AT-LIM17b** | `W_NET + W_CONC + W_MAG ≠ 1.0` → abort | LIM1 |
| **AT-LIM18** | `crossingCount ≠ 1` → no single crossing price in chrome | LIM3 |
| **AT-LIM19** | Symbol off the scale map → `valid: false`; no fallback | LIM1 |
| **AT-LIM20** | No `(lo+hi)/2` in any published field or chrome string | LIM1 · LIM3 |
| **AT-LIM21** | Any `crossingProximity` → dot opacity unchanged | LIM3 |
| **AT-LIM22** | Chrome matches Appendix B: OI as-of **or named hole** + same-day sentence | LIM3 |
| **AT-LIM23** | Grep: none of *wall, magnet, pin, gravity, intent, hostile, support, resistance, friction, muddy, slippery* | LIM3 · LIM5 |
| **AT-LIM24** | Compact: dot **and proximity ring** present; chip, trail, annotations absent | LIM3 |
| **AT-LIM25** | Expiration changed, then symbol changed → trail empty on first frame after each | LIM2 |
| **AT-LIM26** | `0 ≤ nearSpotMix ≤ 100` with **no clamp in the code path**; `yUnclamped` absent from payload | LIM1 |
| **AT-LIM27** | Registry: exactly one `ValueModeId` added; no `session-volume` entry | LIM3 |
| **AT-LIM28** | Grep `LIM_CONF_` → zero hits | LIM1 |

Hotel goldens (hand-recorded before `lim.ts`): eight fixtures — Spec §10 / plan §6.7.

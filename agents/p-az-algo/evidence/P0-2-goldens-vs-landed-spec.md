# P0-2 — Goldens vs landed spec

**Packet:** P0-2  
**Agents:** Hotel · India (Juliet records)  
**Date:** 2026-09-03  
**Landed spec:** AZ-ALGO **v2.2.2** `Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.2.md`  
**sha1 (recomputed at stamp):** `b757ba3f4b3816fcaebae857aeda70dff488ecdc`  
**1–16 freeze spec:** v2.2.1 sha1 `6f491ee8f240aa06418b8e813fdb3152ed60deb5`  
**Goldens file:** `agents/p-az-algo/evidence/ALGO-B-appendix-b-goldens.md`  
**Freeze commit for 1–16 body:** `596dc25`

## Check: E23/E24 did not move a 1–16 value

Compared fixture **1–16** arithmetic in `596dc25` (Hotel ALGO-B against v2.2.1) to the file on disk after v2.2.2 land.

**Result:** every numeric cell in fixtures 1–16 is **byte-identical**. The only 1–16-adjacent edit is the OD-ALGO-1 sentence (open → DISPOSED: Guide) and the `---` before fixture 17. That is not a golden.

| Fixture | Frozen value (still on disk) | Why E23/E24 cannot move it |
|---------|------------------------------|----------------------------|
| 1 | PaR 80 $ · trail 630 $ | No `remainingToDecayEnd`. Floor (c) not in this row. Δ≠0 at-body rule N/A (spot below body). |
| 2 | PaR **128 $** · trail 808 $ | Δ = 0 so PaR_up = PaR_down = 128. E24 max-of-equals is the same number. No floor window. |
| 3 | PaR **72 $** · trail 892 $ | Wing. E1 partner. No floor window. |
| 4 | PaR 80 $ · trail 630 $ | Mirror of 1. |
| 5 | k **2.34** · trail 562.8 $ | k-only. Floor not applied. |
| 6 | k **1.0** (0.84 clamped) · trail 670 $ | k-only. |
| 7 | k **1.8** · trail 606 $ | k-only. |
| 8 | gamma_factor 1.0 · trail 630 $ | GEX unavailable. No remaining clock. |
| 9 | proposed WAITING | Unmeasured Δ/Γ. No PaR number to move. |
| 10 | working_side call · gate 375 $ | Batman resolve. No PaR/floor. |
| 11 | working_side ambiguous | No guide. |
| 12 | legacy S **550 $** · remaining_now 2 h | Legacy clock-only. 2 h > `FLOOR_REMAINING_H` 1.0 so even proposed floor would be inactive. Floor is not applied to legacy. |
| 13 | proposed WAITING (6 < 10 samples) | No PaR number. |
| 14 | gamma_factor 1.0 · warming 12/30 | No remaining clock. |
| 15 | H resets to 220 $ | Side switch. No floor. |
| 16 | no re-fire · `guide: overridden` | Override. trail_level 630 $ carried from fixture 1, not recomputed. |

**E1 still holds:** 128 > 72.

## Fixtures 17–18 vs v2.2.2 (E23 (c) · E24)

| Fixture | Recorded | Spec claim |
|---------|----------|------------|
| 17 | remaining 0.5 h → floor_active. proposed_raw 700.48 → trail **750 $**. legacy S **700 $**. morning remaining 4 h → 700.48 unfloored. | AT-ALGO-33. (a) and (b) rejected. |
| 18 | Δ=2, PaR_up 112 ≠ PaR_down 144, PaR **144 $**, trail **784 $**. | AT-ALGO-34. Fixture 2 did not exercise the rule. |

## Teaching note (Tango, before P3)

Inside the floor window the **proposed** line prints **tighter** than legacy (fixture 17: **750 vs 700**). The two lines **cross near the close**. Copy must not describe proposed as “usually wider” — the sign of the gap **flips**, and that flip is the teaching moment. Seed **P3-1** carries this.

## Modules

P0 did not open product code. `algoConfig.ts` / `algoMoveUnit.ts` / `algoGexNorm.ts` / `algoProfitAtRisk.ts` are **absent**. `algoEval.ts` exists as W1–W4 as-built; **NX13** — not a file of P0–P4; P5 owns live-eval changes.

**Verdict:** **PASS.** 1–16 freeze holds. 17–18 match landed v2.2.2. Safe to gate P0-G.

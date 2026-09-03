# ALGO-B — Hotel Appendix B goldens

**Agent:** Hotel  
**Packet:** ALGO-B  
**Board:** `agents/p-az-algo/`  
**Date:** 2026-09-02  
**Verdict:** **BLOCKED**

**Asked law:** AZ-ALGO **v2.2.1**, sha1 `8b977726b9d7b8bcf255b311fd4ac8b2a93bbf57` (FROZEN).  
**Constraint:** fixtures 1–16 by hand, before `algoProfitAtRisk.ts` / `algoMoveUnit.ts` / `algoGexNorm.ts`. No code. No module-emitted goldens.

No goldens are filed. Inventing sixteen numbers without Appendix B inputs would test Hotel, not the law.

---

## Finding F1 — frozen spec is not on the board

| Check | Result |
|-------|--------|
| Path `Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.1.md` | **absent** |
| sha1 `8b977726b9d7b8bcf255b311fd4ac8b2a93bbf57` among Algo-Alert specs on this machine | **no match** |
| Workspace Algo-Alert files | `…-Spec-v1.0.md` sha1 `28cb4bd040107885cb92376da6f61b447c8e3712` · `…-Spec-v2.0.md` sha1 `8e05fc5ee0206a22cda3739637b9e033e795fb65` |
| v2.0 Appendix B of sixteen PaR / move_unit / gex_norm fixtures | **absent** (v2.0 has no Appendix B goldens table) |
| `algoProfitAtRisk.ts` · `algoMoveUnit.ts` · `algoGexNorm.ts` | **not opened** (packet law) |

Required change: land **v2.2.1** at the cited sha1 on this board, then re-fire ALGO-B. Do not retarget Hotel at v2.0.

---

## Finding F2 — fixtures 1–16 cannot be computed

Appendix B of the frozen model is the input list. It is not here. Hotel will not pick Δ, Γ, move_unit, m_adv, H, k, or GEX-norm samples to make a table close.

Fixture 1 (dimensional proof) needs the spec’s own quantities written with units. Fixture 2 vs 3 (apex PaR > wing PaR, E1) needs the spec’s own apex and wing rows. Without those rows, E1 is **untestable**, not failed.

| Fixture | Status |
|---------|--------|
| 1 dimensional proof | **not computed** — no Appendix B inputs |
| 2 apex (Δ≈0, Γ strongly negative) | **not computed** |
| 3 wing | **not computed** — E1 pair not evaluable |
| 4–16 | **not computed** |

Required change: Appendix B must name, for each of 1–16, every input the formula consumes (at least Δ, Γ, move_unit, m_adv, H, k or k-factors, GEX-norm inputs, floor). Then Hotel writes the arithmetic. If a named row still cannot be evaluated from the frozen text, that row is a **FINDING against the spec**, not a rounded golden.

---

## What was not done (on purpose)

- Did not invent sixteen goldens from the v2.0 worked example (`H = $1000`, `PaR = $300`, `k = 1.5`, `trail_level = $550`). That example is one Coach illustration, not Appendix B.  
- Did not run a calculator, Python, or any module.  
- Did not open `algoProfitAtRisk.ts`, `algoMoveUnit.ts`, or `algoGexNorm.ts`.  
- Did not adjust a number to fit E1.

---

**Re-fire:** Hotel, same packet, after v2.2.1 sha1 `8b977726b9d7b8bcf255b311fd4ac8b2a93bbf57` is a file on this board.

---

## 2026-09-03 — LAND attempt (Coach: attach v2.2.1, transfer check `6f491ee8f240aa06418b8e813fdb3152ed60deb5`)

**LAND: not executed.** The attached file did not arrive in this session. No `Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.1.md` on StudioTwo or MiniTwo. Transfer check cannot be verified. ALGO-B is **not** re-fired against invented text.

Coach: drop the file into `Specs/` (or paste it in the next turn) and say LAND again. Hotel still has nothing to redo.

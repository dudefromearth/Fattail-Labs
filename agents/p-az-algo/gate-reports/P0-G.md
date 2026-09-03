# P0-G — Delta P0 gate

**Verdict:** **PASS**  
**Date:** 2026-09-03  
**Token:** [`agents/go/AZALGO-W0.md`](../../go/AZALGO-W0.md) — **this file is the stamp (DL-328)**  
**Spec:** AZ-ALGO v2.2.2  
**Plan:** v2.0

Delta read the token, not chat.

## Evidence

| Check | Result |
|-------|--------|
| Token **GO** | [x] Signed Coach (Ernie Varitimos) · 2026-09-03 |
| Spec sha1 at stamp | `b757ba3f4b3816fcaebae857aeda70dff488ecdc` |
| `shasum -a 1` of landed v2.2.2 | `b757ba3f4b3816fcaebae857aeda70dff488ecdc` — **match** |
| OD-ALGO-1 | **DISPOSED: Guide** (pre-filled, confirmed) |
| OD-ALGO-2 | Accept — k constant at `k_base` until §14.5 |
| OD-ALGO-3 | Accept — `manual_confirm` under E9 |
| OD-ALGO-4 | Accept — percentile normalization |
| OD-ALGO-5 | Accept — VP overlay out of this spec |
| Plan v2.0 | Stamped with the token. v1.0.3 remains W1–W4 record |
| Fixtures 1–18 handwritten | `evidence/ALGO-B-appendix-b-goldens.md` |
| 1–16 freeze vs v2.2.1 `6f491ee8…` | **PASS** — arithmetic byte-identical to `596dc25`. E23/E24 did not move a 1–16 value. See `evidence/P0-2-goldens-vs-landed-spec.md` |
| 17–18 vs v2.2.2 | Floor (c) 750 vs morning 700.48 · PaR 144. Recorded. |
| Seeds P0–P6 | On disk under `agents/p-az-algo/seeds/P*.md` |
| Lima | **DL-664** |
| Product code opened in P0 | **No.** `algoConfig.ts` / `algoMoveUnit.ts` / `algoGexNorm.ts` / `algoProfitAtRisk.ts` absent. `algoEval.ts` exists as W1–W4 as-built and was **not opened** (**NX13**). |

## Does not pass

P1. Live eval. §14. DL-539 three-OK log (still empty). AT-ALGO-18.

## Next

P1 is **READY** on this gate. It does not fire until Juliet/Coach open P1-0, and if IKI remains the listed active program, until DL-539 is satisfied on the token.

Tango P3-1 already carries: proposed can print **tighter** than legacy inside the floor window (fixture 17: 750 vs 700).

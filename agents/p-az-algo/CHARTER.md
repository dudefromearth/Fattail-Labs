# Charter — Analyzer Algo Alert (AZ-ALGO)

**Program:** OTM-fly **advisory guide** on Analyzer (does not flatten)  
**Working plan:** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md) **v2.0 STAMPED GO**  
**W0 artifact:** [`agents/go/AZALGO-W0.md`](../go/AZALGO-W0.md) **GO** 2026-09-03  
**W1–W4 record:** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md) **v1.0.3**  
**Law:** [`Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.2.md`](../../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.2.md) **v2.2.2 BUILD AUTHORITY** · sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc`  
**Decisions:** **DL-664** · DL-663 · DL-662 · DL-661 · DL-660 · DL-472 · DL-473 · DL-474 · DL-479 · DL-482 · DL-484 · DL-485 · DL-488 · DL-489

## Mission

**W1–W4 stand (executed, v1 Demo-only trail).** Remaining work is plan **v2.0** P1–P6 against v2.2.2. **P0-G PASS.** P1 not fired.

| Packet | What | Lock |
|--------|------|------|
| **P0** | Token · seeds · goldens vs landed spec | **PASS** |
| **P1** | `algoConfig` + `algoMoveUnit` + `algoGexNorm` + `algoProfitAtRisk` vs fixtures 1–18. No UI. | **PASS** |
| **P2** | Gate · `risk_taken` incl. Batman · legacy trail · E23 floor | **PASS** |
| **P3** | Canvas + HUD **Guide** + freeze-on-fold + muted legacy + reduced motion | **PASS** |
| **P4** | Trader Feed allowlist | **PASS** |
| **P5** | **LIVE EVAL** — only exit **AT-ALGO-18** (E17) | **HOLD** (RTH transcript) |
| **P6** | Docs · DL · close | After P1–P5 |

## Invariants

1. No P1 until P0-G (now PASS) **and** an explicit P1-0 fire. DL-539 if IKI remains listed.  
2. Never close the position. Advisory guide only. HUD fourth row **Guide**.  
3. Line labelled **proposed** until Spec §14. Both lines.  
4. OT-EF: no invented debit / `x_S` / greeks.  
5. Live eval is P5. `algoEval.ts` is not a file of P1–P4 (**NX13**).  
6. Position, never strategy. One market WS. No MSC.  
7. Juliet does not invent WHAT. Seeds only. Delta ternary. Coach Content Law.  
8. Direct agent-to-agent communication is prohibited.  
9. Fixtures 1–16 frozen on v2.2.1 `6f491ee8…`. 17–18 on v2.2.2.  
10. Proposed can print **tighter** than legacy inside the floor window (fixture 17: 750 vs 700).

## Out of scope

Plan v2.0 NX1–NX17. VP overlay (FI-031). §14 k-fit. Bounce trigger on a sibling surface.

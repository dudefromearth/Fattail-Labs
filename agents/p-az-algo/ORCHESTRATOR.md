# ORCHESTRATOR — Analyzer Algo Alert

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Working plan:** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md) **v2.0 STAMPED GO**  
**W0 artifact:** [`agents/go/AZALGO-W0.md`](../go/AZALGO-W0.md) — **STAMPED GO** 2026-09-03. Delta gates by **this file**, not chat (**DL-328**).  
**W1–W4 as-built record:** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md) **v1.0.3** — keep. Do not execute leftover W5–W-G against it.

**Law:** AZ-ALGO Spec **v2.2.2 BUILD AUTHORITY** · sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc` · **DL-664** (stamp) · **DL-662** (E23/E24) · **DL-663** (token land). v2.2.1 SUPERSEDED as law (fixtures 1–16 freeze `6f491ee8…`). **OD-ALGO-1…5 disposed** (Guide · k_base · manual_confirm · percentile · VP overlay out). Prior: **DL-661** · **DL-660** · **DL-472** · **DL-473** · **DL-482** · **DL-484** · **DL-485** · **DL-488** · **DL-479** (W0-BA, v1)

**P0-G PASS.** No product code in P0. P1 does not fire until Juliet/Coach open P1-0 (DL-539 if IKI still listed).

## DAG (v2)

```text
P0  token · seeds · goldens vs landed spec     **P0-G PASS**
P1  algoConfig + move + gexNorm + PaR          **P1-G PASS** · no UI
P2  gate · Batman · legacy · floor             **P2-G PASS**
P3  canvas + HUD Guide + freeze + muted + RM   **P3-G PASS**
P4  Trader Feed allowlist                      **P4-G PASS**
P5  LIVE EVAL — AT-ALGO-18 only (E17) · NX13   **P5-G HOLD** (RTH)
P6  docs · DL · close
```

## Phase order

| Packet | Fire when | Board |
|--------|-----------|-------|
| **P0-0** | Coach stamp `AZALGO-W0` | **GO** 2026-09-03 |
| **P0-1…P0-3** | After P0-0 | **DONE** |
| **P0-G** | After P0-* | **PASS** |
| **P1** | After P0-G | **PASS** |
| **P2** | After P1-G | **PASS** |
| **P3** | After P2-G | **PASS** |
| **P4** | After P3-G | **PASS** |
| **P5** | After P2+P3; **not** folded into another phase | **HOLD** — live path in; transcript waits RTH |
| **P6** | After P1–P5 | Blocked |

## W1–W4 as-built (v1.0.3 — do not re-seed)

| Packet | State |
|--------|--------|
| W0-BA | **GO** · DL-479 |
| W1-G | **PASS** |
| W2-G | **PASS** |
| W3-G | **PASS** |
| W3-R | **READY** (additive; homed under P4 copy if still needed) |
| W4-G | **PASS** (paint-only) |
| W5–W-G | **Retired as leftover.** ATs re-homed on plan v2.0 §9. |

## Seed protocol

1. Copy seed → agent with **AZ-ALGO spec v2.2.2** + plan **v2.0** + charter + goldens path.  
2. PASS/FAIL/BLOCKED + evidence.  
3. Delta phase gate before the next packet. P0-G reads `AZALGO-W0.md`.  
4. Lima DL same body as code.

## Coordination

- `p-alerts`: C1 PASS. C2 = threshold apply, **not** this canvas.  
- `p-az-viewport-2d` / `p-az-viewport-return`: do not steal pan/handles.  
- Demo is a clock (DL-485 / DL-488). Live eval is **P5**. `algoEval.ts` is **NX13** for P1–P4.  
- Time Machine chrome is not this DAG.  
- Heatmap / LIM / Strike Turnover / SVP: do not encode the bounce trigger (E14).  
- **Tango P3-1:** proposed can print **tighter** than legacy inside the floor window (fixture 17: 750 vs 700). Do not say “usually wider.”

## Status (live)

| Packet | State |
|--------|--------|
| Spec | **v2.2.2 BUILD AUTHORITY** · sha1 `b757ba3f…` · **DL-664** |
| Goldens | Fixtures **1–18**. 1–16 freeze holds (`P0-2` PASS) |
| OD-ALGO-1…5 | **Disposed** on the token |
| Token | `AZALGO-W0` **GO** |
| Working plan | **v2.0 GO** |
| P0-G | **PASS** |
| P1-G | **PASS** — fixtures 1–18 · AT-ALGO-6d/6e/19/26/28 |
| P2-G | **PASS** — F10/11/12/15/16/17 · A1 ratchet · AT-ALGO-23 |
| P3-G | **PASS** — Guide · freeze · muted legacy · reduced motion |
| P3.1-G | **PASS** — labelled chips; image looked at |
| P4-G | **PASS** — algo-reason allowlist |
| P5-G | **HOLD** — 08:10 ET, RTH not open; trap inverted |

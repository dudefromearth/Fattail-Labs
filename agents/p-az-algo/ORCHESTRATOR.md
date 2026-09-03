# ORCHESTRATOR — Analyzer Algo Alert

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Working plan:** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md) **v2.0 UNSTAMPED**  
**W0 artifact:** [`agents/go/AZALGO-W0.md`](../go/AZALGO-W0.md) — Delta gates by **this file**, not chat (**DL-328**).  
**W1–W4 as-built record:** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md) **v1.0.3** — keep. Do not execute leftover W5–W-G against it.

**Law:** AZ-ALGO Spec **v2.2.2** · sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc` · **DL-662** (E23/E24) · **DL-663** (token + plan). v2.2.1 SUPERSEDED as law (fixtures 1–16 freeze `6f491ee8…`). **Not BUILD AUTHORITY** until `AZALGO-W0` is **GO**. **OD-ALGO-1 DISPOSED: Guide.** Prior: **DL-661** · **DL-660** · **DL-472** · **DL-473** · **DL-482** · **DL-484** · **DL-485** · **DL-488** · **DL-479** (W0-BA, v1)

**No product code until the stamp.**

## DAG (v2)

```text
P0  token · seeds · goldens vs landed spec     UNSTAMPED
P1  algoConfig + move + gexNorm + PaR          after P0-G · no UI
P2  gate · Batman · legacy · floor
P3  canvas + HUD Guide + freeze + muted + RM
P4  Trader Feed allowlist
P5  LIVE EVAL — AT-ALGO-18 only (E17)
P6  docs · DL · close
```

## Phase order

| Packet | Fire when | Board |
|--------|-----------|-------|
| **P0-0** | Coach stamp `AZALGO-W0` | **UNSTAMPED** |
| **P0-1…P0-G** | After P0-0 GO | Blocked |
| **P1** | After P0-G · DL-539 if IKI still listed | Blocked |
| **P2** | After P1-G | Blocked |
| **P3** | After P2-G | Blocked |
| **P4** | After P3-G | Blocked |
| **P5** | After P2+P3; **not** folded into another phase | Blocked |
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
- Demo is a clock (DL-485 / DL-488). Live eval is **P5**.  
- Time Machine chrome is not this DAG.  
- Heatmap / LIM / Strike Turnover / SVP: do not encode the bounce trigger (E14).

## Status (live)

| Packet | State |
|--------|--------|
| Spec | **v2.2.2** · sha1 `b757ba3f…` · land `6653745` · **DL-662** |
| Goldens | Fixtures **1–18** handwritten. 1–16 frozen on v2.2.1 `6f491ee8…` |
| OD-ALGO-1 | **DISPOSED: Guide** |
| Token | `AZALGO-W0` **UNSTAMPED** |
| Working plan | **v2.0 UNSTAMPED** |
| P0–P6 | Blocked on stamp |

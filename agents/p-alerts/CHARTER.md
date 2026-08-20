# Charter — Labs Alerts (Manager + Analyzer first client)

**Program:** Two-plane Alerts: Manager + API (ALM) · Analyzer Builder/holder/canvas (AZ-ALB)  
**Plan:** [`docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Labs-Alerts-Full-Agent-Bench-Plan-v1.0.md) **v1.0.3**  
**Law:** [`Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md`](../../Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md) (canonical draft §3.2) · [`Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md`](../../Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md)  
**Decisions:** DL-463 · DL-464 (India fold ALB-B1/B2 · A1–A4)

## Mission

W0: review gauntlet on both specs (India **must** restate ALB-A2 and the C2 viewport lock).  
Then three BUILD packets with **separate** Coach BA:

| Packet | What | Lock |
|--------|------|------|
| **M** | Manager app, settings wire, `/api/me/alerts*` | Independent of Risk graph |
| **C1** | Alert Builder, adapter, inspector holder | New files; **not** `HostPnLChart` |
| **C2** | Canvas apply | After `p-az-viewport-2d` W-G **and** `p-az-viewport-return` W-G · India C2-0 · own BA |
| **S** | Adapter swap | After M-G + C1-G · AT-ALB-9 |

## Invariants

1. No product code in W0. No M/C1 until W0-BA names them. No C2 until C2-0 + C2-BA.  
   W0-G names canvas-apply **reachability**; if reachable, W0-BA must keep-dark or accept-as-built+DL.  
2. ALM §3.2 is the only draft table (`suite` + `severity` always).  
3. Delete unshipped v1. Unbound `local_ref` never Active.  
4. Arch 28 one-socket law is **market data**. Alerts stream ≠ `MarketSocket`.  
5. **Position**, never strategy. DL-309. No MSC.  
6. Juliet does not invent WHAT. Seeds only. Delta ternary. Coach Content Law.  
7. Direct agent-to-agent communication is prohibited.  
8. **FP14 / §8.5:** HIG conversion is packet work. C1-G / M-G / C2-G FAIL without AT-ALB-11…15 / AT-ALM-12…13, Echo H1–H9 ticks, and Kilo lint. MSC chrome in the prototype is C1 debt, not as-built law.

## Out of scope

NX1–NX14 in the plan.

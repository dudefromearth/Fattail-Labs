# Charter — Analyzer Time Machine (AZ-ATM)

**Program:** OnDemand-class **day replay** on Analyzer (not What-if)  
**Plan:** [`docs/Options-Lab-Analyzer-Time-Machine-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Time-Machine-Full-Agent-Bench-Plan-v1.0.md) **v1.0**  
**Law:** [`Specs/FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md`](../../Specs/FatTail-Labs-Options-Lab-Analyzer-Time-Machine-Spec-v0.1.md) **v0.1.1 DRAFT**  
**Decisions:** DL-486 · DL-487 · DL-489 (this plan)

## Mission

W0: India · Echo · Tango · Hotel.  
W1+: implement only after Coach **W0-BA**.

| Packet | What | Lock |
|--------|------|------|
| **W1** | 1m day fetch · 390 path · close-to-close · playhead | **No** `HostPnLChart` · **no** Autofit strip |
| **W2** | Basic chrome (calendar, transport, mini chart, glows, GEX/Prob **off**) | **Behind** Packet A W-G → algo W4 → C2 |
| **W3** | Enhanced — allow GEX / Probability | After W2 |
| **W4** | TPO path | Behind simple; grain open (FI-037) |
| **W5 / W6 / W-G** | ATs · Lima · Delta | After W2 (+ W3/W4 if fired) |

## Invariants

1. No product code in W0. No W1 until W0-BA.  
2. What-if knobs stay **What-if**.  
3. No client Massive. No invented 390 pad.  
4. W1 does not edit contested chrome.  
5. W2 does not jump the HostPnLChart queue.  
6. Juliet does not invent WHAT. Seeds only. Delta ternary. Coach Content Law.

## Out of scope

Plan NX1–NX12.

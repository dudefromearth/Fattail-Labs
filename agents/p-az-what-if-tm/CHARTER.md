# Charter — Analyzer What-If Time & Measured Vol

**Program:** Analyzer What-if remaining last-trade + measured listed IV  
**Plan:** [`docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Full-Agent-Bench-Plan-v1.0.md)  
**Law:** [`Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md`](../../Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md) (**DRAFT · India fold**)  
**Parents:** OPF v0.2.1 §3.7 / §6.7 · Analyzer v0.2.1 §1.11 · Surface App v0.1.8 · OT-EF v1.1

## Mission

W0: spec-review gauntlet.  
W1+: implement What-if remaining last-trade + measured IV (OPF31 additive) per the **implementation plan**, only after Coach fires it.

**Impl plan:** [`docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Implementation-Plan-v1.0.md)

## Invariants

1. No product code in W0. No W1 fire until W0-BA, or impl stamp **plus a DL naming bypassed W0 packets**.  
2. Do not re-litigate OPF29 (τ 16:00 PM) or OPF31 (`vol_offset_pts` additive).  
3. Slider remaining = last trade; τ stays OPF. Two facts.  
4. Juliet does not invent WHAT. Seeds only. Delta ternary.  
5. Coach Content Law: remaining-last-trade and measured-IV stay; objections sit beside.  
6. Direct agent-to-agent communication is prohibited.

## Out of scope

NX1–NX11 in the plan (τ move, ratio wire without OPF delta, `/resolve` schema, VIX→IV, RTH-only, Heatmap/VP, Time-machine replay, inspector rail, MSC/WS, code before W0-BA, Analyzer residual).

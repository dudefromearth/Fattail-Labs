# Charter — Analyzer 2D Viewport Drag & Scroll

**Program:** Sticky 2D risk-graph view · left-drag pans · right-click alerts · Packet A only  
**Plan:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Full-Agent-Bench-Plan-v1.0.md)  
**Law:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md`](../../docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Analysis-2026-08-19.md)  
**Impl:** [`docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Viewport-Drag-Scroll-Implementation-Plan-v1.0.md)  
**Parents:** Analyzer v0.2.1 §1.14.3 · Surface Autofit AT-AF-7 · OT-EF / DL-309 · HI Spec v1.0

## Mission

W0: review gauntlet on the analysis (Echo **must** dispose VP-A1).  
W1+: Packet A — `PnLChart.tsx` sticky view + left-click pan + native wheel.  
Packet B (listed-grid handles) is a **later fire**.

## Invariants

1. No product code in W0. No W1 until W0-BA, or impl stamp **plus a DL naming bypassed W0 packets**.  
2. Packet A exclusive lock: `web/components/options-lab/risk-graph/PnLChart.tsx`. **Not** `OpfRiskAnalyzer.tsx` (VP-B1). What-If W2 is closed.  
3. Live tick / What-if / smoothed spot must not Autofit after the member moves the view (AT-AF-7 on 2D).  
4. Left-click is pan; alerts are right-click (§1.14.3).  
5. Do not invent strikes. Packet B uses `shiftCardStrikes` law only.  
6. Juliet does not invent WHAT. Seeds only. Delta ternary. Coach Content Law.  
7. Direct agent-to-agent communication is prohibited.

## Out of scope

NX1–NX10 in the review plan.

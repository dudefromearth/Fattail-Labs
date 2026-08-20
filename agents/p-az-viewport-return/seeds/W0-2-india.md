# Seed W0-2 — India persistence

**Project:** p-az-viewport-return  
**Agent:** India  
**Depends:** W0-1  
**Gate:** W0-3…5 · W0-G

## Ask

Read the analysis. Confirm the splitter is **process persistence** (layout, module `let`, listeners, bfcache) — not Market Bus, not Packet B, not T8 Autofit as this cause.

**RH-B1:** Packet A exclusive lock is **not** over by assertion. Cite `p-az-viewport-2d` **W-G not filed** (`W1-G.md` pending; ORCHESTRATOR W-G BLOCKED). **Name the lock handoff:** who may touch `PnLChart.tsx` and/or `OpfRiskAnalyzer.tsx` while that W-G is unfiled. Two boards must not both hold exclusive scope on the same file. W0-M still names the *survivor*; you name *who may edit which file* so Charlie does not collide with Packet A mid-flight.

## Out

Product code. Picking R1–R7 as *the* cause without W0-M FAIL. “Lock is over” without the W-G citation.

## Invariants

Arch 28 · OT-EF · standalone repo · Coach Content Law · VP-B1 inverted.

## Done when

`gate-reports/W0-2-india.md`: APPROVED or RETURNED. **Lock handoff named** (not silence).

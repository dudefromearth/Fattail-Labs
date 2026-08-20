# Seed W0-2 — India parents / VP-B1

**Project:** p-az-viewport-2d  
**Agent:** India  
**Phase:** W0  
**Depends:** W0-1  
**Gate it feeds:** W0-3…5 · W0-G

## Intent

Confirm Packet A does not break parents: OPF/DL-309, What-If W2 closed, Surface Autofit law is **extended** not forked, Analyzer §1.14.3 is conformance.

## Asks

1. Packet A file lock is `PnLChart.tsx` only — **APPROVE** VP-B1 or RETURN.  
2. **VPP-B1 (blocking):** Confirm What-If **W2 is closed** from an **artifact on that board**, not from this plan’s parent table (circular). Quote one of:
   - `agents/p-az-what-if-tm/gate-reports/W-G.md` **PASS**, **or**
   - the Architecture DL whose **title** is Analyzer What-if remaining T + measured IV (as-built) — cite title + date; that log also has unrelated `/apply` entries that reused DL-451/452 numbers,
   - plus that board’s `ORCHESTRATOR.md` W2-1 **PASS** row **and** the git commit it names.  
   If none of those exist, or W2 is still open / `OpfRiskAnalyzer.tsx` is live on that board, **BLOCK** VP-B1. Smoke #4 (What-if rebuilds the sheet) depends on the same fact — catch it here, not at W-G.  
3. AT-2D-AF-7 does not require reopening What-If W2 **once (2) is proven**.  
4. Packet B later + listed-grid only — no invented strikes. Packet B needs its **own Coach BA** (VPP-A1), not Packet A’s W0-BA.  
5. Do not move Autofit law into a second store; 2D must **cite** Surface AT-AF-7.

## Files in scope (read)

Analysis · review plan · Analyzer §1.14.3 · OT-EF · `surfaceAutofit.ts` · What-If **board** (`ORCHESTRATOR.md`, `gate-reports/`, DL **by title**) · `git log` for the W2 commit named on that board.

## Out of scope

Code. Packet B design beyond “listed grid / after A / own BA.” Treating this plan’s “W2 closed” sentence as evidence.

## Done when

`gate-reports/W0-2-india.md` — workflow verdict. **First paragraph quotes the W2-closure artifact** (path + excerpt or commit SHA). Block only invariant / law / system. If W2 is not closed by artifact, BLOCK.

## Invariants

India blocks unsafe architecture. Opinions labeled. Coach symptom stays.

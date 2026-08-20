# Seed W0-3 — Echo Packet A grammar + VP-A1

**Project:** p-az-viewport-2d  
**Agent:** Echo  
**Phase:** W0  
**Depends:** W0-2 APPROVED  
**Law:** HI Spec v1.0 · Analyzer §1.14.3 · analysis Echo section  
**Gate it feeds:** W0-G · Charlie W1 (lock-clear branch)

## Intent

Stamp Packet A interaction grammar. **Must dispose VP-A1.**

## Asks

1. Confirm: left-drag anywhere in the plot (including tent) = pan; alerts = right-click only.  
2. **VP-A1:** Juliet proposes Show/Hide T+0 / expiration = `scheduleDraw()` only; lock clears on **structure** (legs/strikes) and Auto-fit — not on hiding a series. Stamp or override (labeled).  
3. Packet A: 3% wheel stays (VP-A2). Do not gate A on a larger step.  
4. Packet B handles (≥44pt listed ticks) stay **out** of A. Review later.  
5. Do not invent chrome.

## Files in scope

Analysis · `PnLChart.tsx` **read only**.

## Out of scope

Implementation. Packet B landing. Inspector rail.

## Done when

`gate-reports/W0-3-echo.md` — verdict shape. **VP-A1 disposition in the first paragraph.** Block only HI invariant.

## Invariants

Echo owns HIG. Charlie does not invent later. Coach “immovable” symptom stays.

# Seed W-G — Delta Packet A gate

**Project:** p-az-viewport-2d  
**Agent:** Delta  
**Phase:** W-G  
**Depends:** W2-1 · W3-1 · W3-2 (W3-E)  
**Gate it feeds:** ship / MiniTwo (Coach)

## Evidence required

| Check | Pass if |
|-------|---------|
| AT-VS-1 | Zoom then jittered BEs — view stays |
| AT-2D-AF-7 | What-if rebuild does not Autofit |
| AT-CLICK-1 | Left-click tent pans; no menu |
| AT-CLICK-2 | Right-click alerts |
| AT-WH-1 | Native `{ passive: false }` wheel |
| AT-AZ-WIRE-1 | No `onStrikeDrag` on Analyzer (B not shipped) |
| W3-E | `gate-reports/W3-2-echo.md` filed (APPROVED or RETURN with Coach dispose) |
| Docs | Lima §1.14.3 + DL |
| NX | No `OpfRiskAnalyzer` Packet A diff · no `/resolve` |

Ternary **PASS / FAIL / BLOCKED**. Never waive.

## Deliverable

`gate-reports/W-G.md`

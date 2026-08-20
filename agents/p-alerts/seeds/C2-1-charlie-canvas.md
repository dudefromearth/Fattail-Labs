# Seed C2-1 — Charlie canvas apply

**Project:** p-alerts  
**Agent:** Charlie  
**Phase:** C2  
**Depends:** C2-BA · Echo W0-3 (grammar) · C1 Builder exists (open from menu)  
**Law:** AZ-ALB §3 · plan §8.3 · **§8.5 H9** · India C2-0 file lock  
**Gate it feeds:** C2-2 · C2-3

## Intent

MSC apply grammar on the Analyzer host: blank plot → Canvas price alert; tent ≤ 8px → Position picker (Shown, strike labels). Choosing an item **opens Alert Builder** with seed. Left-click still pans.

## Files in scope

**Only** what C2-0 named, expected:

- `web/components/options-lab/risk-graph/HostPnLChart.tsx`  
- `web/lib/risk-graph/hostAlertMenu.ts`  
- `web/lib/risk-graph/hostAlertMenu.test.ts`  
- `OpfRiskAnalyzer.tsx` **only** if C2-0 allowed callback wiring

Prototype may be kept and brought to law. If D0 kept the menu dark, **turn it back on** here — that is C2 BUILD, not a silent re-enable before C2-BA.

## Out of scope

Autofit, wheel, `ensureBound`, handle proximity, dollar grid, GEX. Manager HTTP. Delete. Severity picker. MiniTwo.

## Wire

1. `resolveAlertMenuKind` blank vs tent (`CURVE_HIT_DISTANCE` 8). Zero Shown → treat as Canvas. One Shown → may skip picker.  
2. Canvas menu: rises above / falls below / touches at click underlier price. Preview dashed vertical while menu open.  
3. Position labels `6700C/6720C/6740C`.  
4. Underlier-price alerts draw vertical lines (Idle dashed, Active solid). No fake line for P&L/greeks.  
5. Unbound: no line.  
6. **§8.5 H9:** menu rows ≥44pt; token chrome; **no** keyboard nav for the menu (**+** is the a11y path).

## Done when

AT-ALB-2, 3, 4, 8 **and 15** **would** pass once C2-3 lands. No Autofit/wheel policy change.

## Invariants

FP4 lock. DL-309. Left-click pan. Position never strategy. **FP14 / H9.**

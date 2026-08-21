# Seed W4-1 — Charlie canvas geometry

**Project:** p-az-algo  
**Agent:** Charlie  
**Phase:** W4  
**Depends:** W4-0 APPROVED · W1-G  
**Law:** AZ-ALGO §6 · §7.4–7.5 · §8  
**Gate it feeds:** W4-2 · W4-G

## Intent

Paint the trail. Do not change pan, handles, or threshold-alert menus.

## Files in scope

- `web/components/options-lab/risk-graph/HostPnLChart.tsx` — **draw**  
- `OpfRiskAnalyzer.tsx` — pass Armed geometry from `algoTrailMath`  
- Optional host `dataset`: `data-algo-phase` · `data-algo-side`

## Out of scope

`hostAlertMenu.ts` apply items · Autofit · strike handles · demo playhead

## Wire

1. Waiting: **no** lines.  
2. Armed: thin **dashed** verticals at `x_H` and `x_S`; colors from the record.  
3. Overlay optional (default off); trail-color alpha; pulse on 20% / off 25%.  
4. Far-side: same two lines; `x_S` is the far invert.  
5. Recorded: freeze; pulse off. Position **not** closed.  
6. Invert missing (**AT-ALGO-10** canvas): do not invent `x_S`; named state; **prior good `x_S` last paint may remain**.

## Done when

AT-ALGO-5, 7, 8, **10 (canvas last-paint)**, 12, 16 (canvas). Pan still pans. No C2 menu diff unless W4-0 allowed a tiny shared helper. Invert-missing draw posture is gated — not a deadline shortcut.

## Invariants

FP7 · FP8 · FP12. Keep-Warm: pulse is paint.

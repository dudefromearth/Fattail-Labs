# P3-G — Delta P3 gate

**Verdict:** **PASS**  
**Date:** 2026-09-03  
**Spec:** AZ-ALGO v2.2.2 sha1 `b757ba3f4b3816fcaebae857aeda70dff488ecdc`

## Undeclared P2 UI — disposed

`web/components/options-lab/OpfRiskAnalyzer.tsx` `[--color-on-inverse:#f5f5f7]` landed in `c2c77d6` (not the P2 math commit) while P2 declared no UI. **Rolled into P3’s declared file list.** Not reverted — P3 is the UI phase; reverting would re-break dark-theme PiP / Auto-fit / Time Machine. Delta notes the late declaration.

**Declared P3 files:** `HostPnLChart.tsx` · `OpfRiskAnalyzer.tsx` · `algoHud.ts` · HUD/overlay/line styling.

**Not:** Feed (P4) · `algoEval.ts` (P5 · NX13).

## Command

```
cd web && npx --yes tsx lib/options-lab/algoHud.test.ts
```

## Output

```
algoP3 HUD
  ok  AT-ALGO-17 fourth row Guide, payload guide_print
  ok  HUD hidden in waiting / idle (Armed no-fill and In trade)
  ok  E3 HUD visible Managing and frozen visible in Fold suggested
  ok  AT-ALGO-31 reduced motion kills pulse; density remains
  ok  three verticals: high-water, proposed labelled, legacy muted role
  ok  Tango floor-window caption does not say usually wider
  ok  F17 teaching: 750 vs 700 is tighter proposed, caption still not a fixed relationship
  ok  AT-ALGO-27 grep member chrome for level language
8 tests passed
```

Screenshot 1440: `agents/p-az-algo/evidence/P3-hud-1440.png`

**Next:** P4 Trader Feed allowlist.

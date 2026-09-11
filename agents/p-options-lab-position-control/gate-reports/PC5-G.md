# PC5-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Files (seed `PC5.md`)

- `web/components/options-lab/PositionBuilder.tsx`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`
- `web/lib/options-lab/undoStack.ts`
- `web/lib/options-lab/positionBuilder.pc5.test.ts`

## Evidence

```
$ npx --yes tsx lib/options-lab/positionBuilder.pc5.test.ts
  ok  AT-PC-04 Opening Edit writes zero fields — no snap, no reprice, no write
  ok  AT-PC-23 Edit Close / Esc; no Submit
  ok  AT-PC-21 Create Cancel …
  ok  AT-PC-22 Create draft is off-book until Submit
  ok  AT-PC-56 Create opens on Butterfly, unlocked, no seeded basis
  ok  AT-PC-32 dialog picker rebuilds legs
  ok  §5.1 removals …
  ok  AT-PC-50 Create-reopen half …
  ok  AT-PC-01 live bind …
positionBuilder.pc5.test.ts 9 ok
```

Tango: Create **Cancel · Submit**. Edit **Close** (header and footer) and Esc. No Update, no Analyze.

## Divergence

D-PC-6 — presets/defaults manager removed from the dialog per §5.1; not yet relocated to Analyzer workspace chrome (that chrome is later).

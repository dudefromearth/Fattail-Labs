# PC2 — Record model

**Phase:** PC2  
**Depends:** PC4 + Hotel W0-4  
**Laws:** PC-STRAT-7 · 9 · 4–6 · 10 · PC-QTY-1…6 · PC-LOCK-13 · §4.4  
**ATs:** AT-PC-26 (lock-field) · 32 (seed-rebuild) · 35 · 36 · 39 · 40 · 41 · 43 · 53 · 57

## Exact files

- `web/lib/options-lab/positionQty.ts`
- `web/lib/options-lab/positionQty.test.ts`
- `web/lib/options-lab/structureClassifier.ts`
- `web/lib/options-lab/structureClassifier.test.ts`
- `web/lib/options-lab/listedStructure.ts`
- `web/lib/options-lab/positionLabels.ts`
- `web/lib/options-lab/positionTypes.ts`
- `web/lib/options-lab/analyzerBook.ts`
- `web/components/options-lab/AnalyzerPositionsList.tsx`

Delta **FAIL**s any extra file. **Do not touch `PositionBuilder.tsx`.**

## Intent

1. Backup live book to `ft_options_lab_analyzer_positions_v2__backup_2026-09-11`, then lazy-rewrite (`contracts` × ratio → actual counts). Rollback: `restoreAnalyzerBookFromBackup()`.
2. POS = GCD. Leg rows show actual contracts. One-package BASIS (never × POS in the cell).
3. Classifier: signed patterns, Hotel table. `template` not stored.
4. `listedStructure` is a seed; chrome round-trips.

**Out:** dialog chrome (`PositionBuilder.tsx`) · quote-merge rewrite (PC3) · CHECK PRICE (PC6).

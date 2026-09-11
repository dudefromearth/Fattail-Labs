# PC2-G

**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Verdict:** PASS

## Files (seed `PC2.md`)

- `web/lib/options-lab/positionQty.ts`
- `web/lib/options-lab/positionQty.test.ts`
- `web/lib/options-lab/structureClassifier.ts`
- `web/lib/options-lab/structureClassifier.test.ts`
- `web/lib/options-lab/listedStructure.ts`
- `web/lib/options-lab/positionLabels.ts`
- `web/lib/options-lab/positionTypes.ts`
- `web/lib/options-lab/analyzerBook.ts`
- `web/components/options-lab/AnalyzerPositionsList.tsx`

`PositionBuilder.tsx` not touched.

## Evidence

```
$ npx --yes tsx lib/options-lab/structureClassifier.test.ts
  ok  AT-PC-41 …
  ok  AT-PC-53 …
  ok  AT-PC-35 …
  ok  AT-PC-36 …
  ok  AT-PC-39 …
  ok  AT-PC-40 …
  ok  AT-PC-26 …
  ok  AT-PC-32 seed-rebuild half …
  ok  AT-PC-43 …
  ok  AT-PC-57 …
structureClassifier.test.ts 11 ok

$ npx --yes tsx lib/options-lab/positionQty.test.ts
  ok  migrate contracts × ratio → actual counts; idempotent
  ok  backup once, migrate on load, restore one step
positionQty.test.ts 4 ok
```

## Backup (rollback path, not a second store)

| | |
|---|---|
| Key | `ft_options_lab_analyzer_positions_v2__backup_2026-09-11` |
| When | first `loadPositions` after this packet (does not overwrite) |
| Count | written at that load — parse the JSON array length. Test fixture: 1 |
| Restore | `restoreAnalyzerBookFromBackup()` or the console snippet in D-PC-5 |

PCZ: name this key under "what is still open" so Coach can delete it once he is satisfied.

## Divergences

D-PC-4 (POS chrome at PC8) · D-PC-5 (dated backup).

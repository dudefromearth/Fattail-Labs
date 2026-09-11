# PC3 — Structure signal · quote merge

**Phase:** PC3  
**Depends:** PC2  
**Laws:** PC-REC-3 · 4 · 6 · PC-SYM-8 · 9  
**ATs:** AT-PC-03 · 30 · 31 · 34 · 52

## Exact files

- `web/lib/options-lab/structureSignal.ts`
- `web/lib/options-lab/structureSignal.test.ts`
- `web/lib/options-lab/packageQuoteFinish.ts`
- `web/lib/options-lab/usePackageQuotes.ts`

Delta **FAIL**s any extra file.

## Intent

1. Structure key: symbol · expiry · strike · right · normalized ratio. POS scale does not fire it.
2. Quote merge in `packageQuoteFinish.ts`. Drop if structure moved. Session fields on `cur` win.
3. Hidden: no interest. Overflow: BUDGET LIMIT, definition intact.

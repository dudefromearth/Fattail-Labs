# PPL2-1 — Client read models consume the slot

**Project:** Practice Position Lifecycle  
**Agent:** Charlie  
**Depends:** PPL2-0 (or sibling after Alpha lands server grain — Juliet sequences)  
**Feeds:** PPL2-G

## Intent

Align client with server slot grain. Echo §8.6: existing Status badge only; **partial-residual is not Orphan amber**; Autofilter **English** waits on OD-21; **machine key** allowed.

| Function | After |
|----------|--------|
| `positionBadge` | Partial close not `orphan_close` |
| `tradeRowIssues` | Does not flag true partial as orphan |
| `findPairedClose` / `findPairedOpen` | See slices, not only `m.close` |
| `canDeleteTrade` | Open blocked while a non-synthetic slice exists |
| `listUnmatchedOpens` | Remainder is not a fully unmatched open |
| Autofilter | Machine key; not Orphan bucket |

## Files in scope

- `web/lib/tradeLog.ts`
- `web/lib/tradeLogAutofilter.ts`
- `web/components/trade-log/TradeSheet.tsx` (consume helpers only — kit confirm is PPL3)
- `web/components/trade-log/TradeLogTable.tsx` (badge color: not Orphan amber on residual)

## Out of scope

`page.tsx` restyle. `window.confirm` (PPL3). Import Manager. `AnalyzerPositionsList.tsx`. New Autofilter English token.

## Done when

Client 1-of-5 matches spec §9.1 subset. No Orphan amber on residual. `canDeleteTrade` false.

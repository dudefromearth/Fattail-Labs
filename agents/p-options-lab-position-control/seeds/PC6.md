# PC6 — Lock, CHECK PRICE, ToS

**Phase:** PC6  
**Depends:** PC5  
**Laws:** PC-LOCK · PC-STALE · PC-TOS · PC-LEG  
**ATs:** AT-PC-06 · 26 · 28 · 29 · 32/64 CHECK PRICE half · 48 · 51

## Exact files

- `web/lib/options-lab/analyzerBook.ts`
- `web/lib/options-lab/tosGenerator.ts`
- `web/lib/options-lab/lock.pc6.test.ts`
- `web/components/options-lab/AnalyzerPositionsList.tsx`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`

## Intent

CHECK PRICE lives on `CardLockState`. POS scale keeps the lock. Strike / side / ratio / date → CHECK PRICE. Script always `@LMT`; pending CHECK PRICE script uses live mid. Numeral marked not-current. Keep / Unlock on BASIS.

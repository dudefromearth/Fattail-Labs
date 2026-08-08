# W0-4 — Guide as-built (lifecycle)

**Agent:** Charlie  
**Verdict:** **PASS** (2026-08-08)

## Evidence

Live Guide `#campaign` describes **as-built only**:

- Open / Archive library views  
- Pause / Resume / Complete / Abandon  
- Optional frames, account scope, default for import  
- Dedicated open for edit  

**Not claimed as live:** Signed terms block, Amendments history UI, Renew button, Cycle chips.

## Restore plan (F1)

| Feature PR | Guide expansion |
|------------|-----------------|
| L3-1 editor lifecycle | Signed / Terms as of / Never signed · Amendments · Renew |
| L3-2 library cycle | Cycle chip · Archive Renew |

## Files

- `web/app/guide/page.tsx` (Campaigns title + default wording; no unbuilt promises)

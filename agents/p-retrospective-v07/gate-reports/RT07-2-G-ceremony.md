# RT07-2-G — Ceremony surface (PASS)

**Date:** 2026-07-30  
**Verdict:** **PASS** (R2)

## Deliverable

`web/components/retrospective/RetrospectiveWorkspace.tsx` rewritten for Spec **v0.7.1 §6 / §6.1**:

| Law | Implementation |
|-----|----------------|
| Nine fixed-order steps | `CEREMONY_STEPS` 1–9; all mounted |
| Not a wizard | No Next pagination; all sections visible |
| Current step focused | `focusedStep` + ring; nav chips 1–9 |
| Nothing here | `NothingHere` for empty CF/obstacles/worked/EVA/cluster |
| Carry-forward first | Step 1 (maiden → nothing here) |
| Book last collapsed | Step 9 |
| Interruption notice | Banner when `data.interrupted` |
| Cause (trader) | Step 5 textarea (`body_md`) |
| One thing + agent | Step 8 |

## Evidence

```
npx tsc --noEmit  # clean
rg "Section " web/components/retrospective/RetrospectiveWorkspace.tsx  # none
rg "Step step=" ...  # 1..9 present
```

## Residual for later phases

- R3 period-scoped indicator language (step 2 still uses gather process/integrity)
- R4 emotion mirror / R5 clustering content (step 4 stub)
- Specificity press UX polish on step 8

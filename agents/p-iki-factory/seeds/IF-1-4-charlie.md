# IF-1-4 — Admin board UI (Charlie)

**GO IF-1.** Depends on IF-1-2, IF-1-3.

## In scope

`web/app/admin/iki-factory/page.tsx`  
`web/components/admin/IkiFactoryBoard.tsx` (new)  
`web/components/admin/AdminNav.tsx` — **one link** to `/admin/iki-factory`  
Admin creates Idea. Drag/click call the API. 422 → card stays, reason shown on the card. Hold toggle. Priority/owner editable.

## Out of scope

`web/app/app/iki/factory/page.tsx` (B2: leave soon). `BoardKanban.tsx`. `AppChrome`. Runner.

## Completion

Board mounts only at `/admin/iki-factory`. Member soon testid unchanged.  

# GSC0-5 — Charlie · Feasibility

**Project:** p-sessions  
**Callsign:** Charlie  
**Depends:** —  
**Feeds:** GSC0-G · GSC4 (OD-S4 carried)  
**Invariants:** No product code this seed · no `next/dynamic` · GSC2-view must not write timeAxis/exchanges · no Practice edit · no DL-539 trees

## Files in scope

| File | Touch |
|------|--------|
| `web/components/resources/ResourcesHub.tsx` · `web/lib/useIsAdmin.ts` · `web/app/layout.tsx` | Read |
| `agents/p-sessions/evidence/charlie-feasibility.md` | **Write** |

## Out of scope

Writing `web/` or `server/`. MiniTwo. Editing Practice.

## Task sequence

1. File tree per JR4 including `sessionView.ts`. Write-tree split.  
2. How `ResourcesSubNav` gains a Sessions **Link** without Practice edits.  
3. CSR auth: `fetchMe()` once; no re-fetch on date change.  
4. No `next/dynamic` / dynamic `import()`.  
5. `find ~ -name 'session-clock*.html' -not -path '*/node_modules/*'` — path+sha1 or missing. Missing does **not** block GSC0.

## Completion

`evidence/charlie-feasibility.md`. HTML found or explicitly missing. Zero product lines.

# W0-4 — Guide strip to as-built (F1 / S2)

**Agent:** Charlie  
**Phase:** W0  
**Blocked by:** W0-0 Coach GO (may run in parallel with W0-1…W0-3 after GO)  
**Blocks:** W0-G (Delta must see evidence)

## Intent

Live member Guide (`/guide`) must **not** describe unbuilt Practice/Campaign/Journey features.  
Coach may review offline drafts; **members** only see as-built truth (F1).

## Tasks

1. Audit `web/app/guide/page.tsx` + `web/lib/guide.ts` for claims ahead of as-built (charter frames, Journal IF/THEN variance UI, pillar deep-links, recovery invites, etc.).  
2. Strip or soften to **as-built only**.  
3. Document restore plan: each feature PR **re-adds** its Guide section (same PR as UI).  
4. Evidence: checklist of removed claims + current Guide bullets that remain true.

## Files (only)

- `web/app/guide/page.tsx`  
- `web/lib/guide.ts` (TOC only if needed)  
- Optional: note in `docs/Practice-Charter-Day-Full-Agent-Bench-Plan-v1.0.md` as-built table  

## Out of scope

- Implementing B/J features  
- Marketing copy  

## Done when

- [ ] No member-visible unbuilt promises on `/guide`  
- [ ] Evidence list written to `gate-reports/W0-4-guide-asbuilt.md`  
- [ ] Delta can verify F1 for W0-G  

## Note

A Guide as-built pass may already have landed; this seed **re-verifies and greps** so W0-G is not waved through.

# Seed WK4 — Charlie: Wire the frontend + article page

**Project:** p-wiki · **Agent:** Charlie · **Prerequisite:** WK2 (∥ WK3)

## Files in scope

- `web/app/app/wiki/page.tsx` (entry — bind to `/api/wiki/index`)
- `web/app/app/wiki/search/page.tsx` (replace placeholder with real results)
- `web/app/app/wiki/graph/page.tsx` (bind to `/api/wiki/graph`; add list fallback)
- `web/app/app/wiki/[slug]/page.tsx` (**new** — article)
- `web/components/wiki/*` (new components as needed — register per Framework D2)
- `web/lib/` markdown/wikilink render helper if the shared renderer needs extension

## Out of scope

- Backend · practice rail (W4 of parent — render nothing, not a stub with fake data)
- Hover-preview on touch (D-i3: tap navigates)

## Work

1. **Entry:** search box (autofocus desktop) → `/app/wiki/search?q=`; Start here row
   from index payload; New this week strip (hide when empty); "Explore the map" link.
2. **Search:** call API; group Pages first (then "In the archive" group appears in
   parent W2 — structure the component for it); honest empty state; keep the
   sign-in gate.
3. **Article:** render markdown with `[[wikilinks]]` resolved to `/app/wiki/[slug]`
   (unresolved = muted span); kind label + title; "Compiled from" sources; provenance
   line; backlinks section; "See also" from resolved outbound links.
4. **Graph:** nodes/edges from API; click navigates; kind → color (Echo tokens);
   list-view fallback (`<noscript>` or toggle) for WI7.
5. **⌘K switcher:** palette over wiki routes; fuzzy title match via search endpoint;
   Enter navigates (WI8).
6. Copy: sentence case, no profit framing, no gamification (doctrine).

## Completion

- [ ] All four surfaces render real data from dev API (screens + curl of the same
      data pasted)
- [ ] Draft slug direct-nav → member 404 page experience (evidence)
- [ ] WI1/WI3/WI4/WI8 runbook rows pass on dev (outputs pasted)
- [ ] `next build` clean (output tail pasted)

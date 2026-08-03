# Seed AC3-3 — Charlie: Lesson lock UI from access payload

**Project:** p-access-control  
**Agent:** Charlie  
**Depends on:** AC3-1 (API shape stable)  
**Spec:** §§4.4–4.5, 6.1, 11.3  

---

## Intent

Member lesson UI renders lock/soft/time states from **server `access` payload only** — never invents role/plan rules client-side.

---

## Read first

1. Spec §11.3 copy rules  
2. Echo notes from AC0-4 if filed  
3. Existing lesson player lock UX  

---

## Files in scope

- `web/` lesson/course player components that gate content  

## Out of scope

Admin cockpit (AC5); catalog skeleton (AC6); inventing CTAs with profit claims.

---

## Invariants

- No client-trusted role query params  
- Time lock ≠ “not a member” (Tango)  
- Skeleton/neutral for SSG hydrate regions if touched (prefer AC6 for SSG)  

---

## Completion

- [ ] Locked lesson shows access.ui / mode correctly  
- [ ] Media not requested when deny hard  

## Feeds

→ AC3-4 · AC3-G

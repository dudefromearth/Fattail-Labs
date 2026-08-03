# Seed AC3-1 — Alpha: Lesson require_access + embed access

**Project:** p-access-control  
**Agent:** Alpha  
**Depends on:** AC2-G PASS  
**Spec:** §§8.1, 13, 15.1  

---

## Intent

Wire `require_access` into lesson detail (and media if separate). Embed `access` decision on member resource response. Prefer policy when present; else as-built type default / free_preview.

---

## Read first

1. Spec §8.1 resource-embedded access  
2. As-built lesson routes + `can_access_member_content` / free_preview  
3. Enrollment Access Spec  

---

## Files in scope

- Lesson detail handlers under `server/`  
- Target key construction: `lesson:{id}` or Spec-defined hierarchy  

## Out of scope

Dual-write free_preview (AC3-2); frontend chrome (AC3-3).

---

## Invariants

- Live membership elevation (Observer plan → member content) preserved  
- Hard mode: no media leak  
- No public decision probe  

---

## Completion

- [ ] Gated lesson: anon 401; free without membership 403; Observer membership 200  
- [ ] Response includes `access` object when signed in / locked  

## Feeds

→ AC3-2 · AC3-3 · AC3-5

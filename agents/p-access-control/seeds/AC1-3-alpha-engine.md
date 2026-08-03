# Seed AC1-3 — Alpha: evaluate engine

**Project:** p-access-control  
**Agent:** Alpha  
**Reviewers:** India · Mike (authz boundary)  
**Depends on:** AC1-1, AC1-2  
**Spec:** §§4.3.1, 4.3.2, 5, 8.3  

---

## Intent

Implement pure/domain evaluate path: `expand_plans`, `effective_plans`, `evaluate`, `evaluate_many`, `require_access` (hook-ready).

---

## Read first

1. Spec §5 algorithm (full)  
2. Spec §4.3.1 expand-at-eval  
3. As-built: `can_access_member_content`, role ladder, membership plan resolution  

---

## Files in scope

- `server/access_control/` — engine modules  
- Viewer context builder from request/session (may live here or thin wrapper in auth)  

## Out of scope

Admin HTTP CRUD; lesson dual-write; frontend; public decision API (**forbidden**).

---

## Deliverable (API shape)

```python
expand_plans(selected: set[str]) -> set[str]
effective_plans(policy) -> set[str]
evaluate(target_key, viewer) -> AccessDecision
evaluate_many(keys, viewer) -> dict[str, AccessDecision]
require_access(request, target_key, *, capability="read"|"write")
```

---

## Invariants

1. **Expand only inside evaluate** — never on write  
2. Admin bypass unless `preview_as`  
3. Preview enrollments default `[]`  
4. `deny_plans` does **not** strip data-bearing read/export floor  
5. Ungateable targets: evaluate may N/A; write path later rejects  
6. Grandfather: course family only; not when deny_plans matched for course deny path per Spec  
7. Type defaults when no policy row  

---

## Completion

- [ ] Module importable; no circular import with main  
- [ ] India algorithm walkthrough APPROVED  
- [ ] Mike: no public probe surface introduced  

## Feeds

→ AC1-4 · AC1-G

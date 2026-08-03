# Seed AC3-2 — Alpha: free_preview dual-write

**Project:** p-access-control  
**Agent:** Alpha  
**Depends on:** AC3-1  
**Spec:** §9 dual-write; §13  

---

## Intent

Admin/lesson flag updates write **both** `lessons.free_preview` and access policy (or coordinated path). **Read prefers policy** when row exists.

---

## Files in scope

- Lesson admin update paths that touch free_preview  
- Policy upsert for corresponding `lesson:*` target  

## Out of scope

Feature_gates merge (AC7); full admin cockpit (AC5).

---

## Invariants

- No silent drift: both stores agree after write  
- Policy preferred at evaluate  
- Expand still evaluate-only  

---

## Completion

- [ ] Write free_preview true/false → policy + column  
- [ ] Evaluate uses policy when present  
- [ ] Test coverage in AC3-5  

## Feeds

→ AC3-5 · AC5-2

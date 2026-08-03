# Seed AC7-1 — Alpha: Campaign bulk publish/end

**Project:** p-access-control  
**Agent:** Alpha  
**Depends on:** AC6-G  
**Spec:** §§10, 14 P2  

---

## Intent

Campaign bulk policy publish/end; fail-closed for `campaign:*` without policy; flag for admin when live with no policy.

---

## Invariants

- Same intent storage + evaluate expand  
- Fail closed campaign targets without policy  

---

## Completion

- [ ] Bulk API + fail-closed behavior tested  

## Feeds

→ AC7-2 · AC7-G

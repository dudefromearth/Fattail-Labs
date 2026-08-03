# Seed AC3-5 — Kilo: Lesson access matrix

**Project:** p-access-control  
**Agent:** Kilo  
**Depends on:** AC3-1, AC3-2  
**Spec:** §15.1–4  

---

## Intent

End-to-end characterization: free / Observer membership / Navigator / exact_plans / dual-write.

---

## Required cases

| Case | Expect |
|------|--------|
| Anon gated lesson | 401 |
| Free signed-in no membership | 403 |
| Observer membership + JWT role observer | 200 |
| selected observer-trial exact false + navigator plan | ALLOW |
| exact true Observer only + navigator plan | DENY |
| free_preview dual-write flip | evaluate prefers policy |

---

## Completion

- [ ] pytest and/or curl matrix green  
- [ ] Evidence pack for Delta  

## Feeds

→ AC3-G

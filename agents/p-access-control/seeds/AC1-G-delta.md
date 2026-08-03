# Seed AC1-G — Delta: Engine core gate

**Project:** p-access-control  
**Agent:** Delta  
**Depends on:** AC1-1 … AC1-4 complete  

---

## Intent

Ternary **PASS / FAIL / BLOCKED** on Access Policy Engine core. Evidence only. No code edits under review.

---

## Evidence required

1. Migration applied (name + dry-run empty)  
2. Spec §9 columns present (`selected_plans_json`, `exact_plans_only`; no expand cache col)  
3. pytest unit suite green (paste)  
4. Code review notes: expand_at_eval only; alumni not in commercial expand  
5. No public `/api/access/decision` route introduced  

---

## Verdict rules

| Verdict | When |
|---------|------|
| **PASS** | All evidence green |
| **FAIL** | Expand-at-write, missing DDL fields, red tests |
| **BLOCKED** | Seeds incomplete |

File: `agents/p-access-control/gate-reports/AC1-G.md`

## Completion

- [ ] Gate report  
- [ ] Next: AC2-1  

## Unlocks

AC2

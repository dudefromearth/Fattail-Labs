# Seed AC2-G — Delta: Admin API gate

**Project:** p-access-control  
**Agent:** Delta  
**Depends on:** AC2-1 … AC2-4  

---

## Intent

PASS only with curl/pytest evidence: 422 denylist + data floor; no expand-on-write; audit; no public decision.

---

## Evidence

1. pytest AC2 suite  
2. curl PUT login → 422  
3. curl PUT trade-log hard → 422  
4. curl PUT policy → GET selected_plans intent  
5. Route inventory: no public decision  

File: `gate-reports/AC2-G.md`

## Unlocks

AC3 and AC4 (parallel)

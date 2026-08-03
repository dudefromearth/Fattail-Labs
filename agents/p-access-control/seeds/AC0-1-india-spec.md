# Seed AC0-1 — India Spec & Architecture

**Project:** p-access-control  
**Agent:** India  
**Depends on:** AC0-0 optional; Spec v0.4  
**Spec:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`  
**Plan:** `docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md`

---

## Intent

Architecture integrity review for Access Control v0.4. **APPROVED** or **RETURNED** with required edits. No code.

---

## Read first

1. Spec v0.4 **in full** (esp. §§4–6, §5 algorithm, §9 DDL)  
2. Identity Access Spec (role ladder, plans)  
3. Enrollment Access Spec (lesson matrix defaults)  
4. Member Data Privacy Spec (data-bearing posture)  
5. Full agent plan §§3, 6 AC1–AC2  

---

## Deliverable

Written review covering:

1. Target key grammar + type defaults — sound?  
2. **Expand at evaluate** vs write-time — approve?  
3. `plan_role_combine` OR + commercial expansion — conflicts with Identity?  
4. Alumni non-commercial — consistent with ROLE_ORDER?  
5. Data-bearing floor vs Family B isolation  
6. Dual-write free_preview — dual-read risks  
7. Grandfather + deny_plans interaction  
8. **APPROVED** or **RETURNED** with concrete Spec line edits  

---

## Out of scope

Implementation, UI chrome, deploy.

---

## Completion

- [ ] Review note filed under `agents/p-access-control/gate-reports/` or Coach channel  
- [ ] APPROVED or RETURNED  

## Gate

Required for AC0-G.

# Charter — p-access-control

## Purpose

Implement **Access Control Spec v0.4**: admin-controlled access policies for surfaces, apps, and course elements so campaigns can set who sees what, when, without deploys.

## Spec authority

- **Canonical:** `Specs/FatTail-Labs-Access-Control-Spec-v0.4.md`  
- **Plan:** `docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md`  
- **Board:** `agents/p-access-control/ORCHESTRATOR.md`  

**No implementation until W0-G PASS and Coach BUILD AUTHORITY.**

## Success (MVP = through AC5-G)

1. Admin can set lesson/app policies via API + UI.  
2. Free vs Observer membership vs Navigator behave per Spec §15.  
3. Bulk campaign publish expands plans at **evaluate** (not frozen write).  
4. Data-bearing apps retain read/export.  
5. Ungateable surfaces reject policy writes.  
6. Audit trail on every write.  
7. Delta evidence gates green.

## Out of scope (this charter)

- Replacing SSO / provider_plan_map  
- Per-user ACL  
- Live session category full merge (AC7+)  
- Profit-claim CTAs  

## Hierarchy

Coach → Juliet board → specialists → Delta gates → Lima memory.  
India/Mike/Tango block on architecture, security, member trust.

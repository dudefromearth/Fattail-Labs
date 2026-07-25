# Seed W8 — Lima + Kilo: Docs, Parity, Suite Hardening

**Project:** p-app-framework · **Agents:** Lima, Kilo; Foxtrot if deploy notes · **Gate:** feeds Gate 8  
**Depends on:** Gate 7 PASS (or T-D2 early close after Gate 1 — Coach only)

## Objective

Documentation parity and test suite green for everything shipped in the cut.

## Task sequence

1. **Lima:**  
   - Decision log complete (all F-D/T-D/D-* that applied)  
   - `docs/ADMIN-GUIDE.md` — Family A edit stay-put notes; consent-gated examination procedure  
   - Application Framework / Privacy status lines match reality  
   - agents/README projects list  
2. **Kilo:** full `pytest` suite; any flaky isolation tests fixed.  
3. **Foxtrot** (if production deploy of W2+): migrate path on MiniTwo noted in `infra/deploy.md` — no secrets in repo.  
4. Mark Application Framework B6 statuses PASS where true.

## Out of scope

New features · reopening T-D2 scope

## Completion criteria

- [ ] Decision log current  
- [ ] ADMIN-GUIDE updated  
- [ ] pytest -q green  
- [ ] Deploy note if Family B shipped to staging/prod  

## Report

PASS / FAIL / BLOCKED.

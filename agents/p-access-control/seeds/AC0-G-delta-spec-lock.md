# Seed AC0-G — Delta Spec Lock Gate

**Project:** p-access-control  
**Agent:** Delta  
**Depends on:** AC0-1 … AC0-5 reviews filed; Coach AC0-0  

---

## Intent

Ternary gate: **PASS / FAIL / BLOCKED** on whether Spec v0.4 + multi-agent plan are ready for Coach BUILD AUTHORITY. **No code.**

---

## Evidence required

1. Paths to India / Mike / Tango reviews (Echo/Sierra if filed)  
2. Spec v0.4 still DRAFT vs any RETURNED items unresolved  
3. Plan exists: `docs/Access-Control-v0.4-Full-Agent-Bench-Plan.md`  
4. Board: `agents/p-access-control/ORCHESTRATOR.md`  
5. No implementation commits claiming Access Control engine (grep or board honesty)  

---

## Verdict rules

| Verdict | When |
|---------|------|
| **PASS** | Required reviews APPROVED (or Coach waived named advisory only); no open BLOCKING returns; Coach may stamp BUILD AUTHORITY |
| **FAIL** | Blocking RETURNED items not fixed in Spec |
| **BLOCKED** | Reviews missing |

File: `agents/p-access-control/gate-reports/AC0-G-spec-lock.md`

---

## Out of scope

Implementing AC1.

## Completion

- [ ] Gate report with evidence  
- [ ] Explicit next: Coach BUILD AUTHORITY or Spec v0.5  

## Gate

Unlocks AC1 only after Coach GO on Spec header.

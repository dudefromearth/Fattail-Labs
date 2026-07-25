# Gate 2 — Delta: Privacy Spine

**Project:** p-app-framework · **Agent:** Delta · **Wave:** W2  
**Depends on:** W2a, W2b PASS  

## Evidence

1. Migrations applied; tables exist (SHOW TABLES / migrate output).  
2. Isolation test: member A cannot read B’s rows.  
3. Admin individual read denied without consent; allowed with grant; audit log line shown.  
4. No raw content in any aggregate stub if present.  
5. Decision log notes for D-* that remain open.

## Verdict

PASS / FAIL / BLOCKED → `gate-reports/gate-2.md`  

W3–W4 blocked on FAIL.

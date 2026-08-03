# H5-2 — Coach production smoke

**Date:** 2026-08-03  
**Verdict: PASS**

| Check | Result |
|-------|--------|
| Environment | `https://labs.fattail.ai` (MiniTwo production) |
| Scenario | Sticky / Alpha-class session → logout → FatTail SSO as Ernie |
| Outcome | Works (Coach confirmed) |

Runbook: `docs/ops/Account-Switch-Runbook.md` (and/or Admin Access guide).

**Implication:** H5 deploy + human smoke complete. Sticky FatTail SSO remint residual closed for production.

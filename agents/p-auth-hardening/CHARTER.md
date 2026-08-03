# Charter — p-auth-hardening

## Purpose

Close **high-impact** findings from  
`docs/Auth-Hardening-Audit-2026-08-02.md` via **one multi-agent plan per finding**,  
with a **formal assessment after each ship** and **re-ranking of remaining work**.

## Audit authority

| Doc | Role |
|-----|------|
| `docs/Auth-Hardening-Audit-2026-08-02.md` | Findings + impact/effort |
| `docs/Auth-Hardening-Full-Agent-Bench-Plan.md` | Juliet program plan |
| This folder | Board, seeds, gate reports |

## In-program findings (P0 high impact)

| ID | Title | Default order |
|----|-------|---------------|
| **H5** | Deploy auth/logout/SSO fixes to staging/prod | 1st |
| **H3** | WP admin → Labs admin allowlist | 2nd |
| **H1** | Live role for authorization (not frozen JWT role only) | 3rd |
| **H2** | SSO JWT query-string exposure hygiene | 4th |
| **H4** | Account-switch dual-session ops (runbook + e2e) | 5th |

Medium (M1–M8) and low (L*) items are **backlog only** until a reevaluation  
after an H-gate promotes them.

## Operating rules

1. **One H at a time.** No parallel H-implementation without Coach GO.  
2. **Every H ends in Delta assessment** (`H*-G`) + written **reevaluation** of remaining board.  
3. **Evidence over assertion.** Deploy claims need curl/DevTools; code claims need pytest.  
4. **Change control.** Seeds declare files in scope before touch.  
5. **No waived gates.**  

## Hierarchy

Coach → Juliet board → Mike (security design) · Alpha · Foxtrot · Charlie · Kilo · India · Tango · Lima → Delta gates.

## Success

All five H findings closed (PASS) or explicitly deferred by Coach with residual log.  
Remaining M/L backlog re-ranked at least once after H3 and once after H1.

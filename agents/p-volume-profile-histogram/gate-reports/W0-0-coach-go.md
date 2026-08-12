# W0-0 Coach GO

**Date:** 2026-08-12  
**Authority:** Coach  
**Decision:** **GO** — Spec v0.4 + Plan revision **v1.1.1** accepted as program law.

**Spec:** `Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md`  
**Plan:** `docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md` (revision field **v1.1.1**; filename stable)  
**Board:** `agents/p-volume-profile-histogram/`  
**DL:** DL-314 (v0.4 adopt) · DL-315 (plan bookkeeping) · **DL-316 (this GO)**

## Content hashes (sha1)

| Artifact | sha1 |
|----------|------|
| Spec v0.4 | `6ec8bb866d19ce084f090f7fd3ccd0de90e6e397` |
| Plan file (rev v1.1.1) | `3245284aa56b0a456b04f96f64001337b7601b22` |

Recompute after material Spec/Plan edits; update DL if hashes drift before C-0.

## OD posture at GO

| OD | Decision |
|----|----------|
| OD-VP1 | **Closed** — quotes in full (VP21) |
| OD-VP2 | **Closed** — 1s native full (VP21) |
| OD-VP3 | After first measured symbols (chart cutover) |
| OD-VP4 | TV research deferred |
| OD-VP5 | Workstation + mounts OK now; launchd later |
| **OD-VP6** | **Confirm default: keep raw forever** on mounts until purge policy DL |
| **OD-VP7** | **Confirm default: `price_space=series` + `proxy_of` labels**; product-space mapping only after future DL |

## Execution authority

| Track | Authority |
|-------|-----------|
| **RAW full-estate campaign** | Runs under Spec §16 / Coach authority; do not halt solely for paperwork if already in flight |
| **Production bin writes** | **Blocked** until P2-3 condition freeze + C-0 + geometry changelog |
| **TV conditioner** | Out of critical path |

## Next

1. W0-1 — as-built SPY trades evidence file (path, GB, counts)  
2. A — multi-mount map + schemas (before new partition writes on cold host)  
3. B // remaining P2 (P2-3 is bin gate)  
4. C only after P2-3 freeze  

**Execution note:** Continuous run with logical commits; interrupt Coach only if blocked on a required answer not covered by Spec defaults.

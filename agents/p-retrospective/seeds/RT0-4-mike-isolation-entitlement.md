# Seed RT0-4 — Mike: isolation + plan-based entitlement

**Project:** p-retrospective  
**Primary:** Mike  
**Reviewers:** India  
**Phase:** W0  
**Prerequisite:** RT0-1  

## Goal

Lock security model for create/gather:

1. Entitlement by **plan slug `observer-trial`** OR role activator+ OR admin — **not** role alone  
   (trial often has navigator role).  
2. Free no-plan: 403.  
3. Isolation: identity A cannot read B’s retros/corpus.  
4. Pre_market quotes + future agent logs stay Family B (no external leakage).  
5. Option C: no coverage indicator for unreviewed gap.  

## Files in scope

- Spec v0.5 security / entitlement sections  
- Note for implementers: check `memberships`+`plans.slug`, not only `claims.role`  

## Completion criteria

- [x] Mike APPROVED  
- [x] Attack notes: spoof identity_id; cross-member GET; trial without plan  

## Feeds

→ RT0-G, RT1-1  

---

## Evidence (2026-07-29 — Mike RT0-4)

### Verdict: **APPROVED**

Security model locked in **Retrospective Spec v0.5 §10.1**.

### Entitlement formula (locked)

```
can_create_or_gather =
    administrator
    OR role_at_least(activator)          # Navigator + legacy Activator
    OR has_active_membership(observer-trial)
```

| Case | Expected |
|------|----------|
| Active `observer-trial` | Allow (G1) |
| Navigator / Activator | Allow |
| Free no-plan observer | **403** |
| Alumni-only | **403** |

**Why not role-only for trial:** `observer-trial` currently grants **navigator** role, so as-built `_require_tool_member` admits trial *by accident*. Plan-slug is the product fact (G1 + Journey E1). Implement R1b against **live** `memberships` + `plans.slug`, not “trust grants_role forever.”

**Downgrade:** Existing retros remain GET/complete/abandon for owner; **new create/gather** requires `can_create_or_gather`.

### Isolation (locked)

- Key: Labs `identity_id` only (PD-3b)  
- All mutations/reads: session identity; path id not owned → **404**  
- Body `identity_id` ignored  
- Admin: no Family B raw retro/corpus (PD-8)  
- Option C: **no** coverage indicator (Coach)  

### Family B classes

`pre_market` quotes · report/comparison JSON · agent prompts/`agent_json` · book sample — never public board, never marketing export (Sierra RT0-5), never cross-member.

### Attack notes (A1–A8) — must characterize in RT1-2

| # | Attack | Expected |
|---|--------|----------|
| A1 | Spoof `identity_id` in body | Session only |
| A2 | GET other member’s retro id | **404** |
| A3 | Free no-plan POST create | **403** |
| A4 | Bad session crypto | **401** |
| A5 | Expired trial membership | Create **403** (live membership check) |
| A6 | Second open concurrent | **409** |
| A7 | Admin raw Family B | No route / PD-8 |
| A8 | Agent missing config | Fail loud |

### As-built honesty

| Item | Status |
|------|--------|
| Query isolation on retro routes | Shipped |
| Plan-aware create | **R1b** — not shipped |
| Agent log isolation | Spec now; code R5 |

### India review (required): **APPROVED**

| Check | Result |
|-------|--------|
| Aligns with Coach E.2 entitlement | Yes — trial yes; free no-plan no; Activator legacy |
| Aligns Privacy PD-3/3b/8 | Yes |
| Aligns Journey E1 empty | Same “cannot create” predicate |
| SoR single section | §10.1 |
| No MSC boundary break | API-only agent later; no MSC import |

### Residual → RT1-1

Alpha implements `can_create_or_gather` helper; replace role-only gate on create/gather; Kilo RT1-2 proves A1–A3, A5–A6.  

# Seed W2a — Mike + Alpha + India: Privacy Schema & Consent Model

**Project:** p-app-framework · **Agents:** Mike (design), Alpha (migrations), India (boundary) · **Gate:** feeds Gate 2  
**Depends on:** Gate 0 PASS + Privacy D-1…D-5 decided or defaults Mike recorded in decision log  
**Read first:** Member-Data-Privacy v0.1 §§4–6, Identity-Access, migration style `server/migrations/`

## Objective

Land **data-model + consent/audit** design and migrations (Privacy A-2, A-3) without Family B feature UI yet.

## Task sequence

1. **India:** Approve entity list — no second progress store; Journey later reads enrollments/progress only.  
2. **Mike:** Spec tables (in seed report or `Specs/FatTail-Labs-Member-Tools-Data-Model-Spec-v1.0.md` if large):  
   - `member_consent_grants` (individual examination)  
   - `member_analytics_consent` (or preference flags)  
   - `member_access_audit` append-only  
   - Placeholder owned tables for trade_log / journal / playbook **or** single `member_tool_entries` with type — India chooses; prefer clear tables per surface.  
3. **Alpha:** Filename-ordered SQL migrations; `migrate.py` apply on dev.  
4. Isolation column: `identity_id` (or member user id Labs already uses) on all member content tables; indexes for (identity_id, …).  
5. No admin route yet that reads content without consent check stub.

## Out of scope

UI · aggregate reporting endpoints · encryption key management beyond documented posture · W4 Trade Log product fields (can stub minimal columns)

## Completion criteria

- [ ] Migration files + migrate apply evidence  
- [ ] Decision log or spec paragraph for schema  
- [ ] India explicit OK on single store  
- [ ] pytest green  

## Report

PASS / FAIL / BLOCKED.

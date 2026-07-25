# Seed W0 — Mike: Privacy / Isolation / Consent Review

**Project:** p-app-framework · **Agent:** Mike · **Gate:** feeds Gate 0  
**Depends on:** India review started or soft-OK preferred  
**Read first:** `agents/bench/mike.md`,  
`Specs/FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`,  
`Specs/FatTail-Labs-Application-Framework-Spec-v1.0.md` Part C2/C5,  
`Specs/FatTail-Labs-Identity-Access-Spec-v1.0.md`

## Objective

Sign off or return the privacy model: isolation, dual admin modes, consent tracks,
audit, encryption posture, entitlements hooks. No production code.

## Task sequence

1. Validate **PD-1…PD-7** against Labs auth (session JWT, roles, plans).  
2. Confirm admin **cannot** self-authorize individual content read (IN-2).  
3. Propose concrete **D-2** default (k-anonymity floor) and **D-5** encryption posture for MySQL host reality (MiniTwo).  
4. Sketch consent grant shape (fields only — full schema is W2): grant_id, member_id, admin_id, surfaces[], purpose, expires_at, revoked_at.  
5. Flag any Identity-Access gaps (identity_id as isolation key).  
6. Entitlements: list questions for T-A4 / Privacy A-4 (which plans unlock tools).  
7. Verdict on Privacy spec: APPROVED / RETURNED.

## Out of scope

Implementing tables · UI · DPIA legal text · Family A course edit paths

## Completion criteria

- [ ] APPROVED or RETURNED on Member-Data-Privacy v0.1  
- [ ] Recommended defaults for D-2 and D-5 (or explicit “needs Foxtrot”)  
- [ ] Isolation key = Labs identity_id (or documented alternative)  
- [ ] List of API surface names for W2 (no full OpenAPI required)  

## Report

PASS / FAIL / BLOCKED + security notes Coach must see before approval.

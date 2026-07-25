# Seed W2b — Alpha + Mike: Isolation Middleware & API Skeleton

**Project:** p-app-framework · **Agents:** Alpha, Mike · **Gate:** feeds Gate 2  
**Depends on:** W2a PASS  

## Objective

Server enforcement: member can only access own rows; admin content read denied without valid consent grant; fail loud.

## Task sequence

1. Helper: `require_member_self(identity_id)` / `assert_row_owner`.  
2. Stub routes (even if 501 for unfinished tools): pattern for CRUD scoped by session identity.  
3. Admin: `GET .../members/{id}/tools/{surface}` → **403** without active grant; with grant → 200 + audit row.  
4. Characterization tests: two identities; cross-read fails; consent path audited.  
5. Mike reviews: no silent allow; audit append-only.

## Out of scope

Full Trade Log UX · aggregate metrics engine · encryption implementation beyond DB defaults

## Completion criteria

- [ ] pytest: isolation + consent deny/allow + audit row exists  
- [ ] curl evidence as two users (or test harness equivalent)  
- [ ] Application Framework AF8/AF10 partially green at API layer  

## Report

PASS / FAIL / BLOCKED.

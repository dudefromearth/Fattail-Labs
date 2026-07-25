# Seed W4 — Trade Log MVP (Family B)

**Project:** p-app-framework · **Agents:** Alpha (API/schema), Charlie (UI), Hotel + Tango (review) · **Gate:** feeds Gate 4  
**Depends on:** Gate 2 PASS, Gate 3 PASS (entitlements)  
**Read first:** Member-Data-Privacy; Application Framework C5; T-D5 process-first

## Objective

Ship **Trade Log** template: member CRUD, process-first fields, private, stay-put, isolation.

## Task sequence

1. **Hotel + Tango:** approve field set before Alpha locks migration (process fields primary; P&L neutral optional).  
2. **Alpha:** tables (if not stubbed in W2), CRUD API scoped to identity_id, characterization tests.  
3. **Charlie:** template page — list + create/edit row; HIG; no reload; no share UI.  
4. Consent: tool usable **without** analytics or individual-exam consent (CN-3).  
5. Copy: process language only.

## Out of scope

Sharing · admin examination UI (W7) · Journal · leaderboards · profit dashboards

## Completion criteria

- [ ] Member CRUD curl + UI evidence  
- [ ] Cross-member read fails  
- [ ] Field set signed by Hotel/Tango in report  
- [ ] pytest green  
- [ ] AF9 addressed  

## Report

PASS / FAIL / BLOCKED.

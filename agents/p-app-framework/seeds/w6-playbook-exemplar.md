# Seed W6 — Playbook + Optional Method Exemplar

**Project:** p-app-framework · **Agents:** Alpha, Charlie; Sierra if Exemplar public · **Gate:** feeds Gate 6  
**Depends on:** Gate 5 PASS (or Coach parallel after Gate 4)  
**Read first:** Application Framework C5/C6; Privacy DS-3

## Objective

1. **Playbook** — member private setups/rules CRUD.  
2. **Method Exemplar** (optional if T-D2 includes it) — admin-authored **separate** public/gated teaching content; never a view into member rows.

## Task sequence

1. Alpha: playbook tables + API.  
2. Charlie: Playbook template.  
3. If Exemplar: Family A content model (could be CMS markdown or structured); admin edit path; Sierra JSON-LD only if public page.  
4. Hard rule: Exemplar queries never join member_trade_* tables.

## Out of scope

Sharing playbooks between members · social

## Completion criteria

- [ ] Playbook isolation tests  
- [ ] Exemplar (if in cut) has no private data path (code review note)  
- [ ] pytest green  

## Report

PASS / FAIL / BLOCKED.

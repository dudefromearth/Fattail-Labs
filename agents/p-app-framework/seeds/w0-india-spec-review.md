# Seed W0 — India: Spec & Architecture Review

**Project:** p-app-framework · **Agent:** India · **Gate:** feeds Gate 0  
**Depends on:** Specs drafted in repo  
**Read first:** `agents/bench/india.md`, `agents/bench/doctrine.md`,  
`Specs/FatTail-Labs-Application-Framework-Spec-v1.0.md`,  
`Specs/FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`,  
`Architecture/00-decision-log.md` (recent entries)

## Objective

Approve or return the Application Framework + Member Data & Privacy drafts as the
architecture for Labs page composition, edit modes, and Family B privacy. No code.

## Task sequence

1. **Boundary:** Confirm standalone repo; Family B data in Labs MySQL only; Journey reuses progress (no second store); Calendar extends live_sessions (T-D4).  
2. **Layering:** L1 Display–Edit · L2 Components · L4 Templates · privacy at L0 — no dual registries (reject shell vs template dual truth).  
3. **Family A as-built:** C4 map matches reality or list REQUIRED returns for gaps.  
4. **Family B:** T-D1 privacy model sufficient for product boundary; list missing domain-model requirements (block build until A-2).  
5. **Decisions:** Recommend APPROVE / AMEND for F-D1, F-D2, T-D1–T-D5, Privacy D-1–D-6 (may APPROVE directionally with open D-*).  
6. **Returns:** If RETURNED, list exact section edits Juliet must make (do not rewrite the whole spec yourself).

## Out of scope

Implementation · migrations · UI · legal counsel drafting · changing Identity-Access without a return note

## Completion criteria

- [ ] Written verdict: **APPROVED** or **RETURNED** (with required changes) for each of the two specs  
- [ ] Explicit stance on T-D2 ship cut (W0+W1 only vs full wave plan)  
- [ ] List of blocking open decisions before W2 code  
- [ ] No silent “looks fine” — cite sections  

## Report

PASS (review complete with APPROVED/RETURNED) · FAIL · BLOCKED + evidence (quoted conflicts with doctrine or existing specs).

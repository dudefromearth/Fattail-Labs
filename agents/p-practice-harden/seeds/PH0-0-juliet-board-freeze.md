# Seed PH0-0 — Juliet: Board freeze & collaboration kickoff

**Project:** p-practice-harden  
**Primary:** Juliet  
**Reviewers (required):** Coach (acknowledge scope)  
**Phase:** H0  
**Prerequisite:** none  

## Goal

Freeze the hardening scope from the architectural audit. Ensure every later seed has
clear collaborators and no feature creep (no Retrospective content, no new blotter UX).

## In scope

- Update `agents/p-practice-harden/ORCHESTRATOR.md` status for PH0-0 → done when Coach acks  
- Optionally add a one-page `SCOPE.md` listing in-scope files (Practice stack only)  
- Confirm seed list completeness vs CHARTER goals  

## Out of scope

- Any code changes  
- Spec product features  

## Collaboration

- Present scope summary to Coach.  
- Coach responds: **ACK** or **ADJUST** (Juliet updates board).  

## Completion criteria

- [x] Scope list explicit (Trade Log server/web Practice stack + tests + linked Specs) — `SCOPE.md`  
- [x] Seed list completeness vs CHARTER goals — mapped in `SCOPE.md`  
- [x] Coach ACK recorded in ORCHESTRATOR notes or gate-reports/PH0-0-coach-ack.md  
- [x] No later H0 seed started until this seed done  

## Juliet evidence (2026-07-29)

1. Expanded `SCOPE.md` with concrete as-built paths, out-of-scope freeze, audit→seed map.  
2. CHARTER goals + DoD ↔ seed coverage matrix — verdict **COMPLETE**.  
3. Board set to **awaiting Coach ACK**; PH0-1/2 blocked.  
4. Coach packet: `gate-reports/PH0-0-coach-ack.md` (PENDING).  
5. Sequencing note: PH0-1 then PH0-2 (not parallel — both touch `server/routes/trade_log.py`).  

## Feeds

→ PH0-1, PH0-2, PH0-3 (only after Coach ACK)  


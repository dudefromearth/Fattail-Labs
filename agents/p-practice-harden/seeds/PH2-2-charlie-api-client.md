# Seed PH2-2 — Charlie: Shared Trade Log API client

**Project:** p-practice-harden  
**Primary:** Charlie  
**Reviewers (required):** Alpha · Echo  
**Phase:** H2  
**Prerequisite:** PH1-2 contract stable  

## Goal

Introduce `web/lib/tradeLogApi.ts` (or equivalent) so Trade Log, Reports, Journal,
and deep links share one client. **Zero intentional UX change.**

## Files in scope

- New shared client module  
- Call sites on Practice pages  

## Out of scope

- Visual redesign  
- New endpoints  

## Collaboration / review protocol

1. Charlie extracts client.  
2. **Alpha** — request paths/types match server.  
3. **Echo** — no accidental chrome/control grammar break (smoke).  

## Completion criteria

- [ ] Pages import shared client  
- [ ] Alpha · Echo APPROVED  
- [ ] Evidence: `npm run build` or targeted smoke  

## Feeds

→ PH2-G  

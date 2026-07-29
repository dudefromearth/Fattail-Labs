# Seed PH1-3 — Charlie: Wire Reports + Journal to server domain

**Project:** p-practice-harden  
**Primary:** Charlie  
**Reviewers (required):** Alpha · Kilo  
**Phase:** H1  
**Prerequisite:** PH1-2 APPROVED  

## Goal

Point **Reports** and **Journal day book** at server read models / enriched payloads.
Remove (or quarantine as dev-only with fail-loud) dual client algorithms such as
`enrichTradesWithSyntheticPnl` and open-on-day matching twins.

**Default behavior:** same metrics and UX as pre-harden unless Coach labeled a change.

## Files in scope

- `web/` Practice pages: reports, journal (and shared libs under `web/lib/` or page-local)  
- Possibly shared `tradeLogApi` if already started; full API client extraction can wait PH2-2  
- Tests if any client characterization exists  

## Out of scope

- Visual redesign / HIG chrome (Echo only if layout break forces touch)  
- Retrospective content  
- Blotter ToS rules  

## Invariants

1. Family B: authenticated member routes only.  
2. No silent wrong empty state when API errors — fail visible.  
3. Deep links (`?trade=`, trade-log `?id=`) still work.  

## Collaboration / review protocol

1. Charlie implements + manual or automated smoke evidence.  
2. **Alpha** reviews: client calls match contract; no reinvented formulas.  
3. **Kilo** reviews: regression risk; suggests missing tests.  
4. Both **APPROVED**. If UI chrome breaks, Juliet adds Echo mini-review (optional seed).  

## Completion criteria

- [x] Reports equity/DD/stats/distribution use server (or single shared path)  
- [x] Journal day open/close/still-open uses same domain semantics  
- [x] Dual client domain logic removed or documented exception with Coach  
- [x] Alpha · Kilo APPROVED  
- [x] Evidence: build + key flow notes  

## Evidence (2026-07-29)

- Review: `gate-reports/PH1-3-review.md`  
- Client domain twins removed from `reportsBook` / `journalDayBook`  
- `tsc --noEmit` clean · `npm run build` ok · server 19 passed  

## Feeds

→ PH1-4, PH1-5, PH1-G  


# Seed JS1-4-charlie-calendar — Charlie: Calendar attach

**Project:** p-journal-session  
**Primary:** Charlie  
**Reviewers:** Echo  
**Phase:** J1  
**Prerequisite:** JS0-0 GO · JS1-2  

## Goal

Start session by tag from calendar day; list entries; day-book unchanged.

## Files in scope

- `web/lib/journalSessionApi.ts` (new)  
- `web/components/journal/JournalCalendar.tsx`  
- `web/components/journal/DayTradesPanel.tsx` (day panel blurb only)  

## Out of scope

Agent interview UI (J3); structured form confirm (J2); media (J5).

## Invariants

- Day-book trade panel unchanged · multi-year trade dots preserved · process-first copy  
- retrospective chip navigates (no session row)  

## Completion criteria

- [x] UI walkthrough; multi-year dots still work  
- [x] Reviewers APPROVED  

## Feeds

→ JS1-G  

---

## Evidence (2026-07-30 — Charlie JS1-4 · Echo co-sign)

### Verdict: **APPROVED**

### Behavior

| Action | Result |
|--------|--------|
| Day chips Pre-Market / End of Day / Reflection… | `POST /api/me/journal-sessions` with mapped tag + `journal_date` |
| List entries this day | `GET …?journal_date=` · selectable rows |
| Active entry | messages · add note · partial · seal |
| Retrospective chip | create retro + navigate (unchanged; no session row) |
| Day-book trades | `DayTradesPanel` still below sessions shell |
| Multi-year dots | `loadDaysInterest` still today±15y — **untouched** |

### Tag map (D1)

| Chip | Tag |
|------|-----|
| Pre-Market | `pre_market` |
| End of Day | `post_session` |
| Trade Reflection / Deep Dive / Lessons / Manual | `reflection` |
| Retrospective | navigate only |

### Echo co-sign

Process-first chrome; existing tokens/chips; no P&L hero; sealed state honest; day-book separation clear.

### Verify

```
$ cd web && npx tsc --noEmit -p tsconfig.json
# exit 0
```

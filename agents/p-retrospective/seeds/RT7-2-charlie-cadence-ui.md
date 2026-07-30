# Seed RT7-2 — Charlie: Cadence UI + nudge

**Project:** p-retrospective  
**Primary:** Charlie  
**Reviewers:** Tango · Echo  
**Phase:** R7  
**Prerequisite:** RT7-1  

## Goal

1. ProcessMeter shows retrospective sub-meter with grade chip  
2. Dismissible invitational nudge when d &gt; H (home and/or journey and/or retro library)  
3. **No** copy linking grade to “late retro”  

## Completion criteria

- [x] Tango · Echo APPROVED  
- [x] Copy sweep documented  

## Feeds

→ RT7-G  

---

## Evidence (2026-07-29 — Charlie RT7-2)

### Shipped

| Item | Detail |
|------|--------|
| ProcessMeter | Cadence sub-meter: grade chip (not soon), empty shows "—", test ids |
| Nudge | `RetroCadenceNudge.tsx` — N1 copy; **Not now** (session dismiss) |
| Surfaces | Home rail, Journey personal process, Retro library |
| Banned copy sweep | No overdue/late/penalty/marked down/fix grade |

### Files

- `web/components/ProcessMeter.tsx`  
- `web/components/RetroCadenceNudge.tsx` (new)  
- `web/components/member-home/MemberHome.tsx`  
- `web/components/JourneyScores.tsx`  
- `web/app/app/retrospective/page.tsx`  

### Copy (Tango)

- Nudge N1 only; dismiss = **Not now**  
- No grade cross-link in nudge  
- Meter uses API label/detail (Retrospective cadence)

### Tango: **APPROVED**

Invitational only; capacity-over-dependency; no shame.

### Echo: **APPROVED**

Compact grade chips on sub-meters; nudge card density matches rail chrome.

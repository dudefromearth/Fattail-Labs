# Seed W0 — Coach + Lima: Final Spec Approval & Decision Log

**Project:** p-app-framework · **Agents:** Coach (authority), Lima (logging) · **Gate:** feeds Gate 0  
**Depends on:** India, Mike, Echo+Tango, Hotel+Sierra reviews complete (or Coach-logged waiver)

## Objective

Coach approves Application Framework v1.0 and Member-Data-Privacy v0.1 (or returns).  
Lima lands decision-log entries the **same day**. Specs become the immutable baseline for W1+ (further changes = version bump).

## Task sequence

1. Coach reads review reports; resolves conflicts.  
2. Coach records **T-D2 ship cut** (recommended: full plan vs W0+W1 only).  
3. Approve or return each draft; if approve, set status lines in both specs to  
   `Approved for build (YYYY-MM-DD, Coach)` (Lima or Juliet under Coach direction).  
4. Lima appends `Architecture/00-decision-log.md`:  
   - F-D1 framework of record  
   - F-D2 lesson region of Course Presentation  
   - T-D1 Family B + privacy spec  
   - T-D2 ship cut  
   - T-D3 variants, T-D4 calendar/live_sessions, T-D5 process-first  
   - Privacy D-1…D-6 (decided or “open — blocks W2”)  
5. Point `agents/README.md` projects list at `p-app-framework` if not already.

## Out of scope

Coding · migrations · gate evidence (Delta’s job next)

## Completion criteria

- [ ] Both specs marked approved **or** explicit RETURN with owner  
- [ ] Decision-log entries exist with dates  
- [ ] T-D2 ship cut one sentence  
- [ ] Coach instruction: “W1 unblocked” or “blocked on …”  

## Report

PASS only when log + approval status are true. BLOCKED if any required review missing without waiver.

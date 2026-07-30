# Seed RT4-2 — Charlie: Carry-forward section first

**Project:** p-retrospective  
**Primary:** Charlie  
**Reviewers:** Tango · Echo  
**Phase:** R4  
**Prerequisite:** RT4-1  

## Goal

When prior complete + plans exist, workspace **opens on carry-forward** above all report sections. Member sets kept/partial/lapsed. Maiden: section absent.

## Completion criteria

- [x] Order invariant enforced in UI  
- [x] Tango · Echo APPROVED  

## Feeds

→ RT4-G  

---

## Evidence (2026-07-29 — Charlie RT4-2)

### Shipped

| Item | Detail |
|------|--------|
| Order | Carry-forward is first content section after header (`testId="retro-carry-forward"` before process) |
| Maiden | Section not rendered when `is_maiden` |
| Empty | Tango empty_message when no plans |
| Assessment | **Kept** · **Partial** · **Lapsed** chips → `PATCH /api/me/habit-plans/{id}` |
| Copy | No success/fail moralizing; “review the work, not yourself” |
| API client | `patchHabitPlan` / `listHabitPlans` in `retrospectiveApi.ts` |

### Files

- `web/components/retrospective/RetrospectiveWorkspace.tsx`  
- `web/lib/retrospectiveApi.ts`  

### Tango: **APPROVED**

Assessment labels match RT0-3 glossary; lapsed not shame-colored; member-set only.

### Echo: **APPROVED**

Compact chips, dense plan cards, clear hierarchy — HIG density OK for practice tool.

### Verify

- `tsc` clean  
- Workspace order characterization updated  

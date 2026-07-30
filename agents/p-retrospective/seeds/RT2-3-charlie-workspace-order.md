# Seed RT2-3 — Charlie: Workspace render order + collapsed book

**Project:** p-retrospective  
**Primary:** Charlie  
**Reviewers:** Echo · Tango  
**Phase:** R2b  
**Prerequisite:** RT2-1 (contract); preferably RT2-2  

## Goal

Rewrite `RetrospectiveWorkspace` to Spec order:

1. Carry-forward placeholder (empty until R4)  
2. Process performance  
3. Process Integrity  
4. Deviations  
5. What worked (empty OK)  
6. Expected vs actual (empty OK)  
7. **Book performance last, collapsed by default**; respect  
   `retrospective_pnl_expanded` from profile when present  
8. Member reflection  

Copy: Tango-approved; no success/fail moralizing.

## Files in scope

- `web/components/retrospective/RetrospectiveWorkspace.tsx`  
- Possibly Profile pref read  

## Out of scope

- Habit plan activation UI (R4)  
- Agent panel full (R5)  

## Completion criteria

- [x] Visual order matches Spec  
- [x] Book collapsed first paint  
- [x] Echo APPROVED (HIG density)  
- [x] Tango APPROVED (copy)  

## Feeds

→ RT2-4, RT2-G  

---

## Evidence (2026-07-29 — Charlie RT2-3)

### Shipped

| Item | Path / detail |
|------|----------------|
| Workspace order | `web/components/retrospective/RetrospectiveWorkspace.tsx` — §6 order with `data-testid` sections |
| Book collapsed default | `bookExpanded` starts false; body hidden until expand |
| Pref persist | `GET/PATCH /api/me/profile` · `retrospective_pnl_expanded` (`server/routes/member.py`) |
| Toggle copy | **Show book sample** / **Hide book sample** (Tango) |
| Sample banner | Shown when expanded + `sample_below_min` |
| Fallbacks | `book_performance` \|\| `pnl`; integrity_review \|\| process.integrity |

### Section order (DOM)

1. carry-forward (non-maiden)  
2. process  
3. integrity  
4. deviations  
5. what worked  
6. expected vs actual (if non-null)  
7. comparison (crude)  
8. **book** (last before reflection)  
9. reflection  
10. agent placeholder  

### Echo: **APPROVED**

Single-column stack, shared Section chrome, secondary expand control, dense but scannable meters/drivers — HIG density acceptable for member tool.

### Tango: **APPROVED**

Collapsed summary + expand labels match RT0-3; no “see how you did” / scorecard bait; process notes retained; agent optional language.

### Verification

- `tsc --noEmit` clean for workspace  
- Profile expand round-trip smoke OK  
- pytest profile + retro still green  

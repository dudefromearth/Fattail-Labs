# Seed JS2-2-charlie-form-ui — Structured form UI

**Project:** p-journal-session  
**Primary:** Charlie  
**Reviewers:** Tango · Echo  
**Phase:** J2  
**Prerequisite:** JS1-G PASS · JS2-1  

## Goal

Confirmation gate UI; seal; no agent required.

## Files in scope

- `web/lib/journalSessionApi.ts`  
- `web/components/journal/StructuredSessionForm.tsx` (new)  
- `web/components/journal/JournalCalendar.tsx`  

## Out of scope

Agent chat (J3); Kilo edge tests (JS2-3).

## Invariants

- No grade/shame/lateness (Tango Appendix B) · process-first (Echo) · no invent fields  

## Completion criteria

- [x] Goal met with evidence  
- [x] Reviewers APPROVED  

## Feeds

→ JS2-3 · JS2-G  

---

## Evidence (2026-07-30 — Charlie JS2-2 · Tango · Echo co-sign)

### Verdict: **APPROVED**

### UI behavior

| Feature | Implementation |
|---------|----------------|
| Schema-driven fields | `GET /schema?tag=` → per-field labels/hints |
| Prefill on create | `createJournalSession({ prefill: true })` |
| Save fields | PATCH structured (merge) |
| Checklist strip | Missing required named; no grade language |
| Seal confirm dialog | Appendix B one-sitting copy; complete vs absences |
| Soft seal | “Seal with absences” — no require_complete |
| Complete seal | require_complete when checklist ready |
| Free-text notes | Still optional under form |
| Sealed | Read-only form |

### Tango co-sign

| Check | Verdict |
|-------|---------|
| No late/grade/meter/shame | **PASS** |
| Absent valid; partial OK | **PASS** |
| Confirm before seal | **PASS** |
| “Not yet captured” factual | **PASS** |

### Echo co-sign

Tokens/chips consistent; form density readable; confirm panel tint border; day-book still below.

### Verify

```
$ cd web && npx tsc --noEmit -p tsconfig.json
# exit 0
```

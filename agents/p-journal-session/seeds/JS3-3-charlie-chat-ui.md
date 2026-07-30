# Seed JS3-3-charlie-chat-ui — Chat UI

**Project:** p-journal-session  
**Primary:** Charlie  
**Reviewers:** Tango  
**Phase:** J3  
**Prerequisite:** JS3-0 GO · JS3-1 · JS3-2  

## Goal

Chat; intraday silent; clean_day one turn; form fallback UX.

## Files in scope

- `web/lib/journalSessionApi.ts` (agent client)  
- `web/components/journal/SessionInterviewChat.tsx` (new)  
- `web/components/journal/JournalCalendar.tsx`  

## Out of scope

Validator corpus expansion (JS3-4); LLM provider UI.

## Invariants

- Form always available · no AI-failed shame · Appendix B agent→form copy  

## Completion criteria

- [x] Goal met with evidence  
- [x] Reviewers APPROVED  

## Feeds

→ JS3-4 · JS3-G  

---

## Evidence (2026-07-30 — Charlie JS3-3 · Tango co-sign)

### Verdict: **APPROVED**

### UI behavior

| Feature | Implementation |
|---------|----------------|
| Interview panel | Transcript (Interviewer / You); depth budget |
| Auto first probe | When mode local + entitled + open |
| Member reply | `POST …/agent/turn` with body_md |
| Intraday silent | Phase hint; quiet note placeholder |
| clean_day | Cap shown as max 1; copy after depth 0 |
| Form fallback | Appendix B tone: “Interview isn't available… form” |
| Agent off (default) | Same form path; no shame |
| Structured form | Always below interview |

### Tango co-sign

| Check | Verdict |
|-------|---------|
| No “AI failed” / score language | **PASS** |
| Form switch no penalty framing | **PASS** |
| Process interviewer framing | **PASS** |
| clean_day not a day grade | **PASS** |

### Verify

```
$ cd web && npx tsc --noEmit -p tsconfig.json
# exit 0
```

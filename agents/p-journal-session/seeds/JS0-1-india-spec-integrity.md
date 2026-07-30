# Seed JS0-1 — India: Spec integrity + domain SoR

**Project:** p-journal-session  
**Primary:** India  
**Reviewers:** Coach  
**Phase:** J0  
**Prerequisite:** none  

## Goal

1. Confirm Session Spec **v0.2** is internally consistent with Retrospective **v0.6**, Journey §4.1a, Practice Export v1.1.  
2. Lock **D1** (tags replace type) and **D2** (routine on `session_started_at`) or RETURN with required edits.  
3. Approve schema sketch §14 as migration SoR (or amend Spec).  
4. Dual-read plan for `member_tool_notes` → sessions.

## Files in scope

- `Specs/FatTail-Labs-Journal-Session-Spec-v0.2.md`  
- `Architecture/00-decision-log.md`  

## Out of scope

Implementation code; D3–D5 owner gates (other seeds).

## Invariants

- No MSC imports · product boundary · Observer 6-week term only difference vs Navigator (DL-128).  
- Locking ≠ waived gate for others' domains.

## Completion criteria

- [x] Written APPROVED or RETURNED with enumerated Spec edits  
- [x] D1/D2 explicit verdict  
- [x] Schema SoR approved for JS1-1  

## Feeds

→ JS0-G · JS1-1  

---

## Evidence (2026-07-29 — India JS0-1)

### Verdict: **APPROVED**

Session Spec v0.2 is domain-consistent with shipped Practice parents. D1 and D2 locked. Schema §14 expanded as migration SoR. Dual-read plan §2.1 is mandatory for JS1-3.

### Consistency checks

| Parent | Check | Result |
|--------|-------|--------|
| Retrospective **v0.6** | §6.5 expected-vs-actual consumes pre_market intent | **PASS** — Spec §1/§7 restrict to `pre_open` member + structured; dual-read preserves as-built `_is_pre_market_note` path until cutover |
| Retrospective **v0.5** §10.1 | Create entitlement | **PASS** — Observer plan + activator+ + admin; free no-plan out; DL-128 term-only difference |
| Journey **v1.0 §4.1a** | Cadence completed_at-only; separate from journal | **PASS** — routing does not move cadence; routine D2 is separate meter |
| Journey routine (as-built) | Counts journal activity days | **PASS with D2** — must rekey to `session_started_at` NY day + dual-count legacy notes (Spec §2.1) so meters do not cliff |
| Practice Export **v1.1** | `fattail.labs.journal` notes | **PASS** — §12 adds `journal_session` alongside legacy `journal` during dual-read; additive import D9 |
| Product boundary | No MSC | **PASS** |
| Observer | Not free; 6-week term | **PASS** — header + D6 |

### D1 — tags replace type: **LOCKED · APPROVED**

Single `tag` vocabulary avoids dual taxonomy. As-built has `member_tool_notes.surface` ∈ {journal, pre_market, …}, not a rich type enum — mapping rule is correct:

- `surface=pre_market` → tag `pre_market`  
- other journal notes → `reflection` until reclassify  

`retrospective` tag must **not** insert a session row (navigate only) — schema note added.

### D2 — routine meter keying: **LOCKED · APPROVED** (India)

Routine must not key solely on `journal_date` (backdate gaming). Key: **`session_started_at` → America/New_York calendar day**.  

`journal_date` remains retrospective **scope** key (gather window).  

Tango may soft-review member-facing “routine” copy on JS0-2; domain SoR does not wait.

### Schema §14: **APPROVED for JS1-1**

Expanded with FK/index/phase enum detail. Attachments may ship J5 if D4 open. Closure FK policy left as Alpha choice with India constraint: closed dates stay closed even if retro row is soft-referenced.

### Dual-read: **APPROVED** (§2.1)

Mandatory until cutover. Gather, journey routine, and export all union sessions + legacy notes. No invention of invalidation from free text without J2 confirm.

### Spec edits made this seed

1. D1/D2 status → India LOCKED  
2. §2.1 Dual-read plan  
3. §14 expanded migration SoR  

### Required follow-ons (not RETURN)

| Item | Owner seed |
|------|------------|
| D3 image P&L | JS0-2 Tango |
| D4 private media | JS0-3 Mike |
| D5 is_demo | JS0-4 |
| Journey Spec routine wording patch when J1 ships | Lima · India JS1/J9 |
| Export Spec formal journal_session section | JS6-1 |

### Coach

Formal co-sign optional on this seed; **JS0-0 GO** remains after JS0-G.

### India: **APPROVED**

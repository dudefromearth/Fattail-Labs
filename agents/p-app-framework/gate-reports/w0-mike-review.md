# W0 Mike Review — Member Data & Privacy (+ Framework Family B hooks)

**Agent:** Mike  
**Date:** 2026-07-25  
**Seed:** `seeds/w0-mike-privacy-review.md`  
**Depends on:** India APPROVED (architecture)

---

## Verdict

| Spec | Result |
|---|---|
| Member Data & Privacy v0.1 | **APPROVED** for build direction (defaults below) |
| Application Framework Family B / AF-B1 | **APPROVED** — no admin back door |

---

## Isolation

- **Key:** Labs `identity_id` (PD-3b) — **required**. Matches `lesson_progress` and session identity.  
- Member cross-read: always deny at API layer (not UI-only).  
- Admin content read: only §4.2 grant path; fail loud 403 with reason code.

## Consent grant shape (W2 implement)

```
member_consent_grants:
  id, member_identity_id, granted_to_admin_identity_id,
  surfaces JSON/array,  -- e.g. ["journal","trade_log"]
  purpose text,
  created_at, expires_at, revoked_at NULL,
  request_note optional
member_access_audit:
  id, at, actor_admin_identity_id, subject_member_identity_id,
  surfaces, consent_grant_id, action (read|export|deny)
member_analytics_consent:
  identity_id PK, opted_in bool, updated_at
```

## Decision defaults (Mike — land in Coach log unless Coach overrides)

| ID | Default |
|---|---|
| **D-2** | Minimum cohort **k = 5** for any aggregate cell; suppress if n < 5 |
| **D-5** | **v1 posture:** MySQL on MiniTwo with volume/disk encryption as ops provides; **application-level field encryption deferred** (document in deploy; do not claim client-side E2E). Revisit if counsel requires. |
| **D-3** | Analytics opt-in default **false** (must opt in); separate from exam consent |
| **D-1** | Allowlist starts: completion rates, lesson progress distributions, tool **usage counts** (entries/week), streak **length histograms** — **no** free-text, **no** per-trade P&L series, **no** raw journal bodies |
| **D-4** | Content: retain while account active; purge authored tools within 30d of account delete. Audit: retain **2 years**. Aggregates: retain as de-identified. |

## Entitlements (T-A4 questions for Coach)

1. Which plans unlock Trade Log / Journal / Playbook / Journey?  
2. Is Journey available to all enrolled members (progress already exists) vs paid-only tools?  
**Mike default proposal:** Journey = any authenticated member with enrollments; authored tools (Trade Log, Journal, Playbook) = activator+ (or navigator+) — **Coach must confirm**.

## API names (W2 skeleton)

- `GET/POST /api/me/privacy/analytics-consent`  
- `POST /api/me/privacy/examination-grants` · `DELETE .../{id}`  
- `GET /api/admin/members/{id}/tools/{surface}` — 403 without grant  
- `GET /api/admin/analytics/...` — aggregates only  

## Risks

- Claiming “encryption at rest” without Foxtrot confirming disk posture — use D-5 wording carefully in privacy notice.  
- Counsel/DPIA still **recommended before production Family B** (status may be “scheduled”).

## Report

**PASS** — privacy model approved with defaults; W2 unblocked **after Gate 0 Coach**.

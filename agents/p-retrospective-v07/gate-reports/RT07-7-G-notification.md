# RT07-7-G — Notification (PASS)

**Date:** 2026-07-30  
**Verdict:** **PASS**

## Channel policy (R7-1 · Mike interim lock)

| Rule | Implementation |
|------|----------------|
| Primary channel | **in_app** |
| Family B material in email | **Forbidden** until Mike-approved payload |
| `email_status` on material rows | Always `skipped` |
| Policy surface | `GET /api/me/retrospectives/channel-policy` + list responses |

## Deliverable

### Schema
- `migrations/056_member_retro_notifications.sql` — `member_notifications`
- Unique `(identity_id, kind, period_key)` → **once per period**

### Backend
- `member_notify.py` — channel policy, RTH helper, in-app CRUD
- `retrospective_notify.py` — material eval:
  - Material preview copy (trades / deviations / tag names) — not “due”
  - Suppress during RTH (America/New_York 09:30–16:00 weekdays)
  - Open-position check **fails soft** (`unavailable` proceeds; never logs position detail)
  - Skip if open retrospective already exists
- Routes:
  - `GET /api/me/notifications`
  - `POST /api/me/notifications/{id}/read`
  - `POST /api/me/retrospectives/notify-eval` (idempotent)
  - `GET /api/me/retrospectives/channel-policy`

### Frontend
- `RetroMaterialNotice` on retrospective library + member home
- Evaluates on mount; dismiss marks read

### Tests
```
pytest tests/test_retrospective_notify.py -q  # 8 passed
test_channel_policy_in_app_first
test_rth_weekday_window
test_once_per_period_no_second_ping
test_rth_suppresses_without_position_leak
test_open_position_check_soft_fail_no_leak
test_material_copy_not_chore
test_notify_eval_api
test_ui_material_notice_source
```

### Evidence claims
| Claim | Evidence |
|-------|----------|
| Once per period | UNIQUE + second eval → `already_sent` |
| Never during RTH | mid-session ET → `suppressed` / `rth` |
| No position leak | suppressed payload has no position fields |
| Not chore-based | body lacks “due”; material counts present |
| In-app only for Family B | `channel=in_app`, `email_status=skipped` |

## Out of scope (later)
- Email with Mike-approved payload
- First-class open-position model (soft fail until then)
- Optimal-window / meter on-time alignment (§20 open)

# FatTail Labs — Admin Notifications Spec v1.0

**Status:** Approved as built (2026-07-23)  
**Context:** When a work product or system event requires administrator action,
every administrator is notified by **email** (if mail is configured) and by
**local (in-app + browser) notification**.  
**Related:** Content Board Spec v1.0, Admin Dual Surface Spec v1.0

---

## 1. Purpose

Administrators should not have to poll the Kanban board. Events that need human
judgment emit notifications:

1. **In-app inbox** — persistent rows in MySQL, shown in the admin shell  
2. **Browser local notification** — `Notification` API when permission granted and tab may be backgrounded  
3. **Email** — SMTP when configured; fail loud only when send is attempted without config if `LABS_NOTIFY_EMAIL_REQUIRED=1`; otherwise log skip

---

## 2. Trigger events (v1.0)

| Event `kind` | When | Action CTA |
|---|---|---|
| `board.awaiting_approval` | Card transitions **to** `awaiting_approval` | Open board card |
| `board.revision_requested` | Card → `revision_requested` | Open board card |
| `board.flag_opened` | Guardian flag opened with severity `block` | Open board card |

Future (not v1): package ready (Phase C), billing anomalies, agent key expiry.

Recipients: all identities with `role_override = 'administrator'` **or** derived
role administrator via active membership is **not** required for v1 — **role_override
administrators only** (bootstrap admins + explicit grants). Avoids notifying every
navigator. Spec note: optional later “notify all role=administrator including derived.”

Do **not** notify the actor who caused the event if they are a human admin (self-noise).
Still notify other admins. Agent-caused events notify all admins.

---

## 3. Data model — `admin_notifications`

| Column | Notes |
|---|---|
| id | PK |
| identity_id | Recipient admin |
| kind | Event kind |
| title | Short |
| body | Longer text |
| href | Admin path e.g. `/admin/board?item=12` |
| resource_type | e.g. `content_item` |
| resource_id | e.g. item id |
| read_at | NULL until read |
| email_status | `pending` \| `sent` \| `skipped` \| `failed` |
| email_error | Truncated error |
| created_at | |

---

## 4. API

`/api/admin/notifications` — human administrator only.

| Method | Path | Behavior |
|---|---|---|
| GET | `/` | List for current admin (`?unread=1` optional), newest first, limit 50 |
| GET | `/unread-count` | `{count}` |
| POST | `/{id}/read` | Mark one read |
| POST | `/read-all` | Mark all read for me |

Poll every 30s from admin shell (or on focus).

---

## 5. Email (optional subsystem)

Env (all optional unless required flag set):

| Variable | Role |
|---|---|
| `LABS_SMTP_HOST` | If unset, email channel **skipped** (in-app still works). **FatTail:** `smtp.hostinger.com` |
| `LABS_SMTP_PORT` | Default **465** (Hostinger SSL). Alternate **587** with STARTTLS |
| `LABS_SMTP_MODE` | `ssl` (default when port 465) \| `starttls` \| `plain` |
| `LABS_SMTP_USER` / `LABS_SMTP_PASSWORD` | Full mailbox address + password (Hostinger email account) |
| `LABS_SMTP_FROM` | From address (required if host set); typically same as USER |
| `LABS_SMTP_TLS` | Legacy: if `MODE` unset and not port 465, `1` → starttls |
| `LABS_NOTIFY_EMAIL_REQUIRED` | `1` = missing SMTP is error on notify |
| `LABS_WEB_ORIGIN` or `NEXT_PUBLIC_SITE_URL` | Absolute links in email |

### FatTail / Hostinger defaults

| Setting | Value |
|---|---|
| Host | `smtp.hostinger.com` |
| Port / mode (preferred) | **465** / `ssl` |
| Port / mode (alternate) | **587** / `starttls` |
| Auth | Full email as username (e.g. `labs@fattail.ai`) |

Email body: plain text + title, body, absolute href.

---

## 6. Local (browser) notification

Admin shell client:

1. On load, request `Notification.permission` once (button if default).  
2. When unread-count increases or new items appear vs last poll, call  
   `new Notification(title, { body, tag: kind-resource })`.  
3. Click focuses `/admin` href.  
4. No service worker required for v1 (page must have been opened in a tab recently;
   permission persists).

---

## 7. Non-goals

- SMS / Slack / push service workers  
- Member-facing notifications  
- Digest digests (v1 is immediate per event)  

---

## 8. Verification

- Transition to awaiting_approval creates one notification per other admin  
- GET inbox returns it; mark read  
- Email skipped without SMTP (email_status=skipped)  
- Characterization tests with no SMTP  

---

## 9. Implementation map

| Path | Role |
|---|---|
| `migrations/018_admin_notifications.sql` | Table |
| `server/notify.py` | Create + email |
| `server/routes/notifications_admin.py` | API |
| `server/board.py` | Hooks on transition / flag |
| `web/components/admin/AdminNotifications.tsx` | Bell + browser Notification |
| `server/tests/test_admin_notifications.py` | Tests |

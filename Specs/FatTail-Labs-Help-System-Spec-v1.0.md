# FatTail Labs — Help System Spec v1.0

**Status:** Draft — pending live verification (2026-07-31)
**Context:** Members need an in-app way to ask for help and get answers. Modeled on
MarketSwarm-Canonical's in-app bug reporter (capture → submit → admin triage →
reply), but **stored in the Labs DB** (MSC proxies to GitHub Issues; Labs owns the
data in MySQL).
**Related:** Admin Notifications (`notify.py`), Member Notifications
(`member_notify.py`), Identity & Access Spec v1.0. Decision: DL-211.

---

## 1. Scope (v1)

A **help desk**: members ask questions, admins answer in a thread, statuses track
the queue. Everything persists in the Labs DB.

- **In:** ask (with optional screenshot), member's own thread + follow-ups, admin
  queue/triage/answer (public reply or internal note), status, both-direction
  notifications.
- **Out (future):** public FAQ/knowledge base, categories taxonomy UI, SLA/assignment,
  attachments beyond one screenshot.

## 2. Data model (migration **080** — was drafted as 058; 058 was already tag-manager)

```
help_questions(id, identity_id→identities, email, subject, body, category,
               page_context, status[open|answered|closed], screenshot_path,
               created_at, updated_at, answered_at)
help_messages(id, question_id→help_questions, author_identity_id, author_role[member|admin],
              body, visibility[public|internal], created_at)
```

Email is the identity key. `internal` messages are admin-only notes never shown to
the member. Cascades on identity/question delete.

## 3. Capture (frontend)

`HelpLauncher` (mounted in `AppChrome` **behind an ErrorBoundary**, non-admin
routes, authenticated members only): a floating "Help" button → panel with **Ask**
and **My questions** tabs. Ask = subject + body + category + **optional image
upload** (a standard file picker — no auto-capture "click the area" mode, no extra
library). The backend validates the upload by magic bytes (jpg/png/webp/gif), caps
it at 5 MB, and stores it under `uploads/help/` (served via `/api/media/...`).

## 3a. Isolation (purely additive bolt-on)

The feature is designed so it can fail without affecting anything else:
- **Boot-safe:** help routers are registered in a guarded `try/except` in
  `main.py` — an import/registration error logs and is skipped; the rest of Labs
  boots normally.
- **Render-safe:** the member widget is wrapped in an `ErrorBoundary`; a render
  error renders nothing, never white-screening a page.
- **Build-safe:** no new frontend dependency (upload uses native browser APIs);
  `package.json` and the build graph are untouched.
- **Schema-safe:** migration `080_help_system.sql` is additive only (`CREATE TABLE IF NOT EXISTS`,
  two new tables, no `ALTER` of existing tables).
- **Integration-safe:** notification calls are lazy-imported and wrapped.
Worst-case failure of anything help-related = "the Help button doesn't work."

## 4. API

**Member** (`require_session`, own questions only):
- `POST /api/help/questions` — `{subject, body, category, page_context, screenshot_base64?}`; rate-limited to 10/hour/member
- `GET /api/help/questions` — own list
- `GET /api/help/questions/{id}` — own thread (public messages only)
- `POST /api/help/questions/{id}/messages` — follow-up; re-opens an answered question

**Admin** (`require_admin`):
- `GET /api/admin/help/questions?status=&search=&limit=&offset=` — queue (open-first)
- `GET /api/admin/help/questions/{id}` — full thread incl. internal notes + member info
- `POST /api/admin/help/questions/{id}/messages` — `{body, visibility}`; a **public**
  answer sets status `answered` + notifies the member
- `PATCH /api/admin/help/questions/{id}/status` — `{status}`

## 5. Notifications (both directions, reused infra, best-effort)

- **New question** → `notify.notify_admins` (admin in-app + email).
- **Public admin answer** → `member_notify.create_in_app` (member in-app, idempotent
  on `help-{q}-msg-{m}`) inside the txn, **plus** an email via `notify._send_email`
  sent **after commit** (SMTP latency never holds the transaction).

All notification calls are wrapped and never fail the underlying write.

## 6. Failure modes / "breaks" & mitigations

| Break | Handling |
|---|---|
| DB down on submit | 5xx surfaced; client keeps the typed draft, shows retry; nothing silently lost |
| Upload too large / not an image | >5 MB → 413; non-image / invalid base64 → ignored (question still submits); storage error → ignored |
| Spam / flooding | 10 questions/hour/member (429) |
| Double-submit | button disabled while sending |
| Ownership leak | member endpoints 404 on non-owned questions; internal notes filtered from member view |
| Anonymous / expired session | 401; launcher hidden for logged-out visitors |
| SMTP down / unconfigured | member email best-effort; in-app still delivered; admin notify still recorded |
| No admins configured | admin notify logs & no-ops; question still stored |
| Help feature itself errors | guarded router registration (boot) + ErrorBoundary (render) → Labs unaffected, help just unavailable |

## 7. Files

- `migrations/080_help_system.sql`
- `server/help.py` (screenshot + notifications), `server/routes/help.py` (member),
  `server/routes/help_admin.py` (admin), `server/main.py` (register)
- `web/components/HelpLauncher.tsx`, `web/components/ErrorBoundary.tsx`,
  `web/components/AppChrome.tsx` (guarded mount),
  `web/app/admin/help/page.tsx`, `web/app/admin/layout.tsx` (nav)
  — **no `package.json` change** (upload uses native browser APIs)
- `server/tests/test_help.py`

## 8. Verification

1. `cd server && .venv/bin/python -m pytest tests/test_help.py -q` — screenshot
   storage, ask/list/thread + ownership, anonymous reject, admin gate, public
   answer→answered+notify, internal-note hidden, status change.
2. Live: as a member, ask a question (with screenshot) → appears in `/admin/help`;
   admin answers → member gets in-app + email and sees the reply; internal note
   stays hidden.

## 9. Deployment

Migration **080** → `pytest tests/test_help.py` → API reload → frontend
`npm run build` + restart → live smoke. On MiniTwo. **No `npm install`**
(no new dependency).

**Note:** Spec v1.0 originally said migration 058; that number was already used by
`058_tag_manager_personal_vocab.sql`, so the help DDL ships as **080**.

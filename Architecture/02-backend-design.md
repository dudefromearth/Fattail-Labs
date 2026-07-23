# Backend Design — FastAPI (`server/`)

**Status:** As-built (retroactive, 2026-07-23)

---

## 1. Responsibilities

The API is the **system of record interface** for:

- Identity, sessions, roles, memberships  
- Public catalog and gated lesson payloads  
- Enrollment, progress, quizzes  
- Live sessions (materialized + recurrences)  
- Resources / attachments  
- Pathway, reviews, discussion, students  
- In-place admin mutations + media upload  
- Optional Stripe billing + WP provider webhooks  
- Optional agent model completions (P2 workbench)

It does **not** serve the Next.js UI (that is `web/`). It does **not** store lesson
video binaries (YouTube IDs only).

---

## 2. Process model

```text
uvicorn main:app
  → create_app()
      → get_config()          # fail loud
      → mount routers
      → StaticFiles /api/media → uploads/
```

| Module | Role |
|---|---|
| `main.py` | App factory, health, router registration |
| `config.py` | Env-driven `Config` (fail loud for structural keys) |
| `db.py` | PyMySQL connect + `transaction()` context manager |
| `auth.py` | Session JWT issue/verify, role ladder |
| `identity.py` | Identities, passwords (scrypt), memberships, role derivation |
| `providers.py` | WordPress SSO JWT verify, login URLs, pluggable registry |
| `video.py` | YouTube param allowlist + embed URL construction |
| `guards.py` | `require_session` / `require_role` / `require_admin` |
| `repo.py` | Shared small query helpers |
| `migrate.py` | Filename-ordered SQL migration runner |
| `ai/` | LLM interface + agent task runtime |
| `agent_auth.py` | Agent principals, API keys, scopes |
| `board.py` | Content backlog / Kanban domain |
| `packages.py` | Package checklist, freeze, Labs placement |
| `notify.py` | Admin in-app + optional SMTP notifications |
| `routes/*` | HTTP surface by domain |

---

## 3. Configuration

Loaded once at boot (`get_config()`). **Missing structural env → process abort.**

| Category | Variables (representative) |
|---|---|
| Runtime | `LABS_ENV`, `LABS_PORT` |
| MySQL | `LABS_DB_*` |
| SSO secrets | `LABS_SSO_SECRET_FATTAIL`, `LABS_SSO_SECRET_0DTE` (≥32 chars) |
| Session | `LABS_SESSION_SECRET`, `LABS_SESSION_TTL_SECONDS`, `LABS_COOKIE_DOMAIN` |
| Billing (optional) | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LABS_WEB_ORIGIN` |
| AI (optional) | `XAI_API_KEY`, `ANTHROPIC_API_KEY`, `LABS_AI_*` |

Pattern: **Stripe and AI are optional at boot**; they fail loud when used without keys
(same product doctrine as “no silent half-config”).

---

## 4. HTTP surface (grouped)

### 4.1 Auth

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login` | Native email/password |
| POST | `/api/auth/register` | Native signup |
| GET | `/api/auth/sso/{provider}` | WP SSO callback path |
| GET | `/api/auth/providers` | SSO button URLs |
| GET | `/api/auth/me` | Session claims + display fields |
| GET | `/api/auth/logout` | Clear cookie |
| GET | `/api/auth/dev-login` | **dev only** admin mint |

### 4.2 Catalog & content (public / gated)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/courses` | Published only; filters/sort |
| GET | `/api/courses/{slug}` | Detail; no gated lesson bodies |
| GET | `/api/courses/{slug}/lessons/{lesson}` | Auth + access rules |
| GET | `/api/courses/{slug}/lessons/{lesson}/public` | Free-preview safe subset |
| GET | `/api/hub` | Course hub CMS payload |
| GET | `/api/resources` | Library listing |
| GET | `/api/attachments/{id}/download` | Role/free gate |
| GET | `/api/live/sessions` | Materialized schedule |
| GET | `/api/live/sessions/{id}/ics` | Calendar export |

### 4.3 Member

| Method | Path |
|---|---|
| POST | `/api/courses/{slug}/enroll` |
| POST | `/api/progress`, `/api/progress/complete` |
| GET | `/api/me/progress`, `/enrollments`, `/activity`, `/continue` |
| GET/POST | `/api/me/pathway` |
| Quiz | `/api/courses/.../quiz`, `/api/me/quiz-results` |
| Social | reviews, threads, comments, students under `/api/courses/{slug}/…` |

### 4.4 Admin

Prefix `/api/admin/*` — human administrator cookie and/or agent bearer (scoped).

- Course/module/lesson CRUD, reorder, categories, instructors  
- Attachments, media upload/list/delete  
- Live session + recurrence admin  
- Quiz question admin  
- Hub CMS admin  
- Review/thread moderation  
- **AI workbench:** `/api/admin/ai/*` (optional `content_item_id` attaches to board card)  
- **Agent keys:** `/api/admin/agents/principals|…/keys` (human only)  
- **Board:** `/api/admin/board` Kanban snapshot, items, transition, artifacts, flags,
  package validate, **place** (Phase D)  
- **Notifications:** `/api/admin/notifications` inbox for human admins  

### 4.5 Content factory (board → package → place)

```text
content_items (card)
  → artifacts (stages) + ai_invocations
  → validate checklist → content_approval_packages (freeze)
  → human Approve → apply_placement → draft course (modules/lessons/videos/resources)
  → human publishes course in-place on /courses/{slug}
```

Placement plan: JSON in `placement_proposal` (or `lesson_plan` / single-lesson fallback);
`video_package` supplies per-slug YouTube ids. Re-place rebuilds **draft** only.

### 4.6 Billing

| Method | Path | Notes |
|---|---|---|
| GET | `/api/billing/plans` | Public plan display |
| POST | `/api/billing/checkout` | Stripe Checkout |
| POST | `/api/billing/portal` | Customer portal |
| POST | `/api/billing/webhook` | Entitlement sync |

### 4.7 Health

`GET /api/health` — DB round-trip + env name.

---

## 5. Cross-cutting design patterns

### 5.1 Transactions

All mutating handlers use `db.transaction()` — commit on success, rollback on
exception, connection **returned to pool**. Phase E: fixed-size pool
(`LABS_DB_POOL_SIZE`, default 10) with ping-on-checkout.

### 5.2 Authorization

1. Cookie → `auth.verify_session` **or** `Authorization: Bearer ftl_ag_…` agent key  
2. Role ladder: `observer < alumni < activator < navigator < administrator`  
3. Agent scopes: `ai:run`, `ai:status`, `board:operate`, … (never billing/key mint by default)  
4. Content access often combines **role**, **free_preview**, and **enrollment**  
5. Live **category** is an audience contract (not raw min_role plumbing)

### 5.3 Fail-loud validation

- Unknown video params → hard error (not silent drop)  
- Admin field allowlists → 422 outside set  
- AI missing keys / incomplete agent sections → 503/422  

### 5.4 Video embeds

`video.embed_config(provider, video_id, params)` builds
`youtube-nocookie.com` URLs server-side. Clients never assemble player URLs from raw DB.

### 5.5 Media

- Public images under `uploads/` served at `/api/media/...`  
- Private resources under `uploads/private/` with download gate  
- Content-hash filenames; delete refused while referenced (409)

---

## 6. Agent model subsystem (`server/ai/`)

| Piece | Role |
|---|---|
| `complete()` | Chat completion orchestration |
| Providers | xAI Chat Completions (primary), Anthropic Messages (secondary) |
| `agents.py` | Load `agents/bench/*.md`, task catalog, `run_agent_task` |
| Admin routes | Browser/workbench gateway; optional board attach |

Default model policy: **Grok (`grok-4.5`)** primary; **Claude** secondary.
Spec: `Specs/FatTail-Labs-Agent-Model-Interface-Spec-v1.0.md`.

---

## 7. Migrations

`server/migrate.py` applies `migrations/NNN_*.sql` in filename order; tracks applied
files. **Never edit an applied migration** — add `NNN+1_*.sql`.

Factory-related: `016` agent identity, `017` content board, `018` admin notifications,
`019` production packages + placement columns.

See `04-domain-data-model.md` for table map.

---

## 8. Testing (backend)

`server/tests/` — pytest + FastAPI `TestClient`, real dev DB, probe rows cleaned up.

```bash
cd server && .venv/bin/python -m pytest tests -q
```

Includes board, packages/placement, agent identity, notifications (SMTP disabled in suite).
Mandatory before commits that touch `server/`.

---

## 9. Deliberate limitations (as-built)

| Limitation | Note |
|---|---|
| Connection pool | **Phase E shipped** (`LABS_DB_POOL_SIZE`) |
| YouTube for gated video | Leakage tradeoff; Phase F CDN |
| Agent `admin:content` not broadly granted | Placement is human-triggered apply |
| No member-facing LLM chat | Operator/agent runtime only |
| Placement does not auto-publish courses | Draft only; in-place publish remains |
| WP SSO live path | External WP endpoints; native login works |
| Private file binaries not in placement | Resource **links** only in Phase D |

---

*Frontend consumption of this API: `03-frontend-design.md`.*

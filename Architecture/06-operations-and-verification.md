# Operations & Verification

**Status:** As-built (retroactive, 2026-07-23)

---

## 1. Repository layout (ops-relevant)

```text
Fattail-Labs/
  server/           # FastAPI API
  web/              # Next.js app
  migrations/       # SQL, ordered
  Specs/            # Feature contracts
  Architecture/     # This set + decision log
  agents/           # Bench + P1/P2 orchestration
  docs/             # Operator / product guides
  infra/deploy.md   # Host topology + deploy steps
```

---

## 2. Local development

```bash
# API
cd server
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
# load .env from repo root (LABS_* , DB, secrets)
.venv/bin/python migrate.py
.venv/bin/uvicorn main:app --port "${LABS_PORT:-4000}"

# Web
cd web
# NEXT_PUBLIC_LABS_API_URL=http://127.0.0.1:4000
# NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
npm install && npm run dev
```

Optional AI:

```bash
export XAI_API_KEY=...          # Grok primary
export ANTHROPIC_API_KEY=...    # Claude secondary
```

Optional admin email (FatTail Hostinger):

```bash
export LABS_SMTP_HOST=smtp.hostinger.com
export LABS_SMTP_PORT=465
export LABS_SMTP_MODE=ssl
export LABS_SMTP_FROM=labs@fattail.ai
export LABS_SMTP_USER=labs@fattail.ai
export LABS_SMTP_PASSWORD=...   # never commit
export LABS_WEB_ORIGIN=https://labs.fattail.ai
```

Dev admin cookie: open `/api/auth/dev-login` (proxied through Next or hit API origin).
Note: identity_id=0 has no notification inbox — use a real admin identity for alerts.

---

## 3. Production deploy (summary)

Canonical steps live in `infra/deploy.md`:

1. `git pull` on MiniTwo  
2. `pip install -r` if needed  
3. **`migrate.py` before restart**  
4. `npm ci && npm run build` in `web/`  
5. `launchctl kickstart` API (and web service per playbook)  
6. Verify health, a public course page, and an authenticated lesson  

**Invariants**

- No `next dev` in staging/production  
- Migrations never skipped  
- Restart proof: new PID after kickstart (stale process class of bugs)  

---

## 4. Verification culture

Doctrine: **evidence over assertion**. “It should work” is banned.

| Layer | How |
|---|---|
| API characterization | `cd server && .venv/bin/python -m pytest tests -q` |
| Agent/model unit | `test_ai_models.py`, `test_agent_tasks.py` (fakes) |
| Admin AI API | `test_ai_admin_api.py` (+ live if `XAI_API_KEY`) |
| Board / packages / place | `test_content_board.py`, `test_production_packages.py` |
| Agent identity / notify | `test_agent_identity.py`, `test_admin_notifications.py` |
| Browser AI | `cd web && npm run test:e2e:ai` (Playwright; live needs key + servers) |
| Manual | curl matrices, browser walk (Delta gates) |

**Rule:** every commit touching `server/` must pass pytest first.

---

## 5. Observability (current)

| Signal | Mechanism |
|---|---|
| Liveness | `GET /api/health` (+ DB SELECT 1) |
| Process | launchd on MiniTwo |
| App logs | Process stdout/stderr (host-level) |
| Agent provenance | Workbench response fields; not yet a durable audit table |

**Gap:** mechanized audit spine (who/when/what for agent packages) is a P2 pillar,
not shipped as DB tables yet.

---

## 6. Backup & data

- MySQL `labs` is the system of record — host backups are an ops responsibility
  (document any MiniTwo dump schedule in runbooks as they solidify).  
- `uploads/` must be backed up with the DB for resource integrity.  
- Secrets live only in env / secret store — restore includes re-injecting env.  

---

## 7. Incident playbooks (short)

| Symptom | First checks |
|---|---|
| 502 from Next API calls | API process up? rewrite URL? |
| Empty catalog | DB migrated? published courses? fetch-cache cleared on build? |
| Auth loop | Cookie domain? HTTPS? session secret stable across restarts? |
| Admin AI 503 | `XAI_API_KEY` present on API process? |
| Stale public page | Revalidate path? rebuild? old Next PID? |

---

## 8. Documentation ownership

| Change type | Update |
|---|---|
| Behavior | Spec version + tests |
| Decision | `Architecture/00-decision-log.md` |
| Topology / layer design | Architecture 01–06 |
| Operator how-to | `docs/ADMIN-GUIDE.md` |
| Deploy steps | `infra/deploy.md` |

---

*Audit that motivated this retroactive pack: `07-audit-snapshot-2026-07-23.md`.*

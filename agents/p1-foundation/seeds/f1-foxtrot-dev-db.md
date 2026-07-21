# Seed F1 — Foxtrot: Dev Database + Live Spine Verification

**Project:** p1-foundation · **Agent:** Foxtrot · **Gate:** feeds Gate 1
**Repo:** `/Users/ernie/Fattail-Labs` · **Read first:** `agents/bench/foxtrot.md`,
`agents/bench/doctrine.md`, `infra/deploy.md`

## Objective

Stand up the local dev environment on this machine and prove the backend spine works
end-to-end against a real MySQL database.

## Task sequence

1. Verify MySQL is available locally (`brew services list` / `lsof -iTCP:3306`); install
   + start via Homebrew if absent. Do NOT disturb any existing MarketSwarm databases.
2. Create database + user per `infra/deploy.md` §3 (database `labs`, user `labs`,
   generated password).
3. Create `.env` from `.env.example` with real dev values (`LABS_ENV=dev`, strong
   generated secrets ≥32 chars, real DB credentials). Confirm `.env` is git-ignored.
4. Run migrations: `cd server && set -a && source ../.env && set +a && .venv/bin/python migrate.py`
   (venv already exists; `pip install -r requirements.txt` first if missing).
5. Re-run `migrate.py` — must report "No pending migrations." (idempotency).
6. Boot: `.venv/bin/uvicorn main:app --port $LABS_PORT` (dev machine only — allowed).
7. Verify: `curl -s localhost:4000/api/health` returns `{"status":"ok","env":"dev"}`;
   `curl -s -i localhost:4000/api/auth/me` returns 401 with no cookie.
8. Show the `labs` schema: `SHOW TABLES` output (expect 15 domain tables +
   schema_migrations).

## Out of scope

Staging/production machines · nginx/Cloudflare · any `web/` work · schema changes.

## Completion criteria (all with captured output)

- [ ] `migrate.py` applied 001 on fresh DB, second run reports nothing pending
- [ ] Health endpoint returns ok with DB round-trip proven
- [ ] `/api/auth/me` unauthed → 401
- [ ] `SHOW TABLES` listing included
- [ ] `.env` confirmed untracked (`git status` clean of it)

## Report

PASS / FAIL / BLOCKED + evidence + anything `infra/deploy.md` got wrong (amend it).

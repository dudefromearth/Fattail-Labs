# FatTail Labs — Deploy Playbook

## Topology

| Environment | Machine | Hostname | Notes |
|---|---|---|---|
| Dev | StudioTwo (localhost) | — | uvicorn + next dev allowed here ONLY |
| Staging | DudeTwo | `labs-stage.fattail.ai` | alongside MSC staging services |
| Production | **MiniTwo** (M2 Mac Mini) | `labs.fattail.ai` | sole Labs host |
| Routing | MiniThree nginx | both vhosts | Cloudflare proxied A records → 173.48.76 public IP |

Build happens entirely on the internal network. DNS/cert/vhost wiring is a launch-day step:
two proxied A records in the Cloudflare fattail.ai zone (`labs`, `labs-stage` →
173.48.54.249), a `*.fattail.ai` Origin CA cert on MiniThree, two nginx server blocks.

**Canonical host (SEO spec v1.0):** `https://labs.fattail.ai` is the ONLY
canonical origin. The MiniThree vhost must 301 every variant (http, any alias)
to it, and production `NEXT_PUBLIC_SITE_URL=https://labs.fattail.ai` — the
sitemap, robots, canonicals, and OG URLs all derive from that env var.
Wire this BEFORE announcing the domain so the first crawl sees one clean host.

## MiniTwo provisioning (one-time)

1. **Audit leftovers** (former flyonthewall.ai webserver):
   `lsof -iTCP -sTCP:LISTEN -P` — retire any old Apache/PHP/MySQL listeners before installing.
2. Homebrew → `brew install git mysql node python`
3. `brew services start mysql` → create database + user:
   ```sql
   CREATE DATABASE labs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'labs'@'localhost' IDENTIFIED BY '<password>';
   GRANT ALL PRIVILEGES ON labs.* TO 'labs'@'localhost';
   ```
4. GitHub SSH key (`ssh-keygen` → add to repo deploy keys) → clone:
   `git clone git@github.com:dudefromearth/Fattail-Labs.git ~/Fattail-Labs`
5. Backend env: `cd ~/Fattail-Labs/server && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
6. `.env` from `.env.example` — production values, `LABS_ENV=production`,
   `LABS_COOKIE_DOMAIN=.fattail.ai`. Secrets never committed.

   **WordPress SSO + WooCommerce:** secrets must match WP **fotw-sso** (same as
   MarketSwarm-Canonical `SSO_FOTW_SECRET` / `SSO_0DTE_SECRET`):

   ```bash
   LABS_SSO_SECRET_FATTAIL=<fotw-sso secret on fattail.ai, ≥32 chars>
   LABS_SSO_SECRET_0DTE=<fotw-sso secret on 0-dte.com, ≥32 chars>
   # LABS_SSO_LOGIN_URL_FATTAIL=https://fattail.ai/fotw-sso?redirect=...
   # LABS_SSO_LOGIN_URL_0DTE=https://0-dte.com/fotw-sso?redirect=...
   ```

   Full integration (MSC sources, JWT shape, webhooks, plan map):  
   `docs/WooCommerce-SSO-Integration-Guide.md`.
   **Outbound mail (admin notifications):** FatTail uses Hostinger SMTP:

   ```bash
   LABS_SMTP_HOST=smtp.hostinger.com
   LABS_SMTP_PORT=465
   LABS_SMTP_MODE=ssl
   LABS_SMTP_FROM=<full mailbox e.g. labs@fattail.ai>
   LABS_SMTP_USER=<same mailbox>
   LABS_SMTP_PASSWORD=<mailbox password>
   LABS_WEB_ORIGIN=https://labs.fattail.ai
   ```

   Alternate if SSL/465 fails: `LABS_SMTP_PORT=587` and `LABS_SMTP_MODE=starttls`.

   **DB pool (Phase E):** optional `LABS_DB_POOL_SIZE=10` (default).

   **Bunny Stream (Phase F, gated lessons):**

   ```bash
   LABS_BUNNY_LIBRARY_ID=<library id>
   LABS_BUNNY_TOKEN_KEY=<embed token authentication key>
   LABS_VIDEO_SIGNED_TTL_SECONDS=3600
   ```

   **HeyGen studio (Phase G, optional until live produce):**

   ```bash
   HEYGEN_API_KEY=<heygen api key>
   # LABS_HEYGEN_DRY_RUN=1
   # LABS_HEYGEN_MAX_BATCH=3
   # LABS_HEYGEN_DAILY_JOB_LIMIT=10
   # LABS_HEYGEN_MONTHLY_JOB_LIMIT=100
   # LABS_QUEBEC_AUTO=1
   ```

   Install HeyGen CLI on the host for live/render (`heygen` on PATH). Cast files ship
   in-repo under `docs/studio/cast/`. Migrations **020** (cast_id), **021**
   (heygen_job_ledger), and **022** (password_reset_tokens) must be applied.

   **Password reset emails** need the same Hostinger SMTP block above **and**
   `LABS_WEB_ORIGIN=https://labs.fattail.ai` so reset links are absolute.
7. Tailscale up; note the stable LAN IP for MiniThree's upstream.
8. launchd plists (see below) → `launchctl load`.

## Deploy (every release)

```bash
ssh minitwo
cd ~/Fattail-Labs && git pull origin main
server/.venv/bin/pip install -r server/requirements.txt   # if requirements changed
set -a && source .env && set +a
(cd server && .venv/bin/python migrate.py)                 # migrations BEFORE restart
(cd web && npm ci && npm run build)
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.api
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.web
# VERIFY — same doctrine as MarketSwarm: same code on disk + old process = old behavior
lsof -iTCP:4000 -sTCP:LISTEN -P
curl -s localhost:4000/api/health
```

## launchd (production process management)

`~/Library/LaunchAgents/ai.fattail.labs.api.plist` — runs
`server/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 4000` with
`WorkingDirectory` = repo `server/`, `EnvironmentVariables` from `.env` values,
`KeepAlive` = true, stdout/stderr to `~/Library/Logs/fattail-labs/api.log`.

`ai.fattail.labs.web.plist` — runs `npm start` (Next.js built output) in `web/`,
port 4001, same KeepAlive/log pattern.

Never run services by hand in staging/production; launchd owns them.

### Quebec board poller (optional)

Keeps production cards moving (claim → produce stages → awaiting approval).
**Does not publish.** Spec: `Specs/FatTail-Labs-Quebec-Poller-Spec-v1.0.md`.

```bash
# in .env on MiniTwo
LABS_QUEBEC_POLLER=1
LABS_QUEBEC_AUTO_PRODUCE=1
LABS_QUEBEC_AUTO_PRODUCE_MODE=fixtures   # or auto/live with XAI_API_KEY
LABS_QUEBEC_POLL_INTERVAL_SECONDS=60
```

```bash
# manual smoke
cd ~/Fattail-Labs/server && set -a && source ../.env && set +a
.venv/bin/python quebec_poller.py
```

launchd: WorkingDirectory `server/`, Program `…/server/.venv/bin/python`,
args `quebec_poller.py`, EnvironmentVariables from `.env`, KeepAlive true,
logs under `~/Library/Logs/fattail-labs/quebec-poller.log`.

### Member Wiki content checkout + sync tick

The wiki serves content from a **git checkout of `dudefromearth/lab-wiki`**
(Member-Wiki Spec §3.0). The API refuses to boot without it (fail-loud).

```bash
# one-time per host (dev = already at /Users/ernie/lab-wiki)
git clone git@github.com:dudefromearth/lab-wiki.git ~/lab-wiki

# in .env on every host
LABS_WIKI_ROOT=/Users/ernie/lab-wiki
```

After deploy or content change, rebuild the derived index:

```bash
curl -s -X POST localhost:4000/api/admin/wiki/reindex -H "Cookie: ft_session=<admin>"
# expect counts: {"pages":N,"published":P,...} — N must match the checkout
```

**Sync tick (MiniTwo, production):** pull + reindex every 5 minutes so pushes
from StudioTwo (agents/Coach) go live without a deploy. launchd job
`com.fattail.labwiki.sync` — plist template: `infra/labwiki-sync.plist`;
script logic:

```bash
git -C "$LABS_WIKI_ROOT" pull --ff-only && \
  curl -fsS -X POST localhost:4000/api/admin/wiki/reindex \
    -H "Authorization: Bearer $LABS_WIKI_SYNC_KEY" || echo "labwiki-sync FAILED $(date)" >&2
```

(v1: reindex needs an admin session or an agent key with admin scope — mint a
dedicated agent key at `/admin/agents` for the tick; never reuse a human session.)
Logs: `~/Library/Logs/fattail-labs/labwiki-sync.log`. A failed pull or reindex
must log loudly; the previous index keeps serving (stale beats broken).

## Community Discord workers (p-community — design lock C0-5)

**Status:** Ops design approved (`agents/p-community/gate-reports/C0-5-foxtrot.md`).  
**Not installed until C1b/c** code + secrets. C1a shell uses `LABS_DISCORD_BRIDGE=0`.

| Process | launchd label (prod) | Type |
|---------|----------------------|------|
| Gateway bridge (mirror) | `ai.fattail.labs.discord-bridge` | KeepAlive |
| Role reconcile (DL-238) | `ai.fattail.labs.discord-reconcile` | StartInterval **900s** |
| Message backfill | `ai.fattail.labs.discord-backfill` | StartInterval **600s** |

**Host:** MiniTwo only for production guild **FatTail AI**. Do **not** run staging + prod
Gateway on the **same** bot token. Staging: separate Discord guild + bot, or bridge off.

**Env when `LABS_DISCORD_BRIDGE=1` (fail loud if missing outside dev):**

```bash
LABS_DISCORD_BRIDGE=1
LABS_DISCORD_GUILD_ID=
LABS_DISCORD_BOT_TOKEN=
LABS_DISCORD_CONNECT_URL=https://fattail.ai/...
LABS_DISCORD_PAID_ROLE_IDS=
LABS_DISCORD_INTERNAL_KEY=   # ≥32 chars; launchd → internal API
```

Channel map SoR = DB `community_channels` (not dual env SoR). Webhook tokens per channel:
host/DB secrets only — never git.

**Logs:** `~/Library/Logs/fattail-labs/discord-{bridge,reconcile,backfill}.log`  
**Verify:** kickstart bridge; tail READY; POST reconcile with internal key; no token in logs.  
**Rollback:** `LABS_DISCORD_BRIDGE=0` + unload three plists.  
**Member connect** remains fattail.ai WP plugin (DL-240) — not this bot’s OAuth.

## Hard rules (inherited doctrine)

- Migrations run BEFORE service restart, every deploy.
- Never claim "deployed" from commit hash — verify the running process (`lsof`, health curl).
- No dev servers outside dev.
- Never edit an applied migration; add a new `NNN_*.sql`.

## Access Control (Spec v0.4 / p-access-control)

1. Apply migrations including **`075_access_policies.sql`** before restart:
   `cd server && .venv/bin/python migrate.py`
2. Confirm tables: `access_policies`, `access_policy_audit`.
3. Admin UI: `/admin/access` (production build only).
4. No new env vars for P0 engine (code constants for ungateable + data-bearing apps).
5. Characterization: `cd server && .venv/bin/python -m pytest tests/test_access_control_ -q`

## Auth hardening (H5 / H2)

**One-shot on MiniTwo** (after `git pull`):

```bash
bash infra/scripts/deploy-minitwo-auth-hardening.sh
```

Full operator notes: `docs/ops/MiniTwo-Auth-Deploy-Runbook.md`  
SSH key setup (authorize StudioTwo agent on MiniTwo): `docs/ops/MiniTwo-SSH-Agent-Access.md`

### Deploy checklist (H5)

After `git pull` on MiniTwo / DudeTwo:

1. Ensure `.env` has `LABS_ADMIN_EMAILS=` (comma-separated; **required** outside dev).
2. `cd server && .venv/bin/python migrate.py` (include `075_access_policies` if pending).
3. Restart API launchd; rebuild + restart Next (production build only).
4. Verify:
   - `curl -sS https://labs.fattail.ai/api/health`
   - Logout response `Set-Cookie` expires `ft_session` (`Max-Age=0`, `Path=/`, Domain if set).
   - `curl -sS https://labs.fattail.ai/api/auth/providers` — FatTail URL contains `reauth=1`.

Commits: `fca01d7` … `889cc9b` (logout, reauth, allowlist, live role).

### SSO JWT log hygiene (H2)

**Nginx (MiniThree):** install snippet  
`infra/nginx/labs-sso-access-log.conf` — log `$uri` without query for `/api/auth/sso/`.

**WordPress fotw-sso TTL:** see `docs/ops/WP-SSO-JWT-TTL.md` — target **≤ 120s**.

**Labs:** never log the raw `sso` query parameter or JWT body (H2).
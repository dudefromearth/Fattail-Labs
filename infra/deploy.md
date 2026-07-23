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

## Hard rules (inherited doctrine)

- Migrations run BEFORE service restart, every deploy.
- Never claim "deployed" from commit hash — verify the running process (`lsof`, health curl).
- No dev servers outside dev.
- Never edit an applied migration; add a new `NNN_*.sql`.

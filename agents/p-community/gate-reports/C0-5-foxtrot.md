# C0-5 — Foxtrot workers / deploy

**Agent:** Foxtrot  
**Date:** 2026-08-06  
**Depends on:** C0-0 PASS · Spec v1.0.2 §6.6 · §8.5–8.6 · DL-238 · Mike C0-3  
**Verdict:** **APPROVED** (ops design) — no workers ship until C1b/c code + C0-G

**Playbook owner:** `infra/deploy.md` (section stub added)  
**Evidence home at gate:** `Architecture/06-operations-and-verification.md` (reconcile logs + sample diff at C1b-G)

---

## 1. Seed checklist

| # | Item | Verdict |
|---|------|---------|
| 1 | Gateway bot process: host, launchd, restart | **PASS** — §2 |
| 2 | Role reconcile interval + log + fail-loud alert | **PASS** — §3 |
| 3 | Message backfill schedule + rate limits | **PASS** — §4 |
| 4 | Config keys fail loud | **PASS** — §5 |
| 5 | Staging vs production guild/channel map | **PASS** — §6 |

---

## 2. Discord Gateway / bridge process

### 2.1 Role

Long-lived **Labs bridge** process (not the WP member-connect OAuth app):

- Discord Gateway: `MESSAGE_CREATE` / `UPDATE` / `DELETE` (mapped channels only) → Labs upsert  
- Optional: reconnect-triggered channel backfill (Spec §6.6.1)  
- Does **not** own member Discord OAuth (DL-240 / Mike C0-3)

### 2.2 Host

| Env | Host | Notes |
|-----|------|--------|
| Production | **MiniTwo** | Sole Labs host (`infra/deploy.md`) |
| Staging | **DudeTwo** | Staging API + optional bridge against **staging guild or disabled** |
| Dev | StudioTwo | Optional local bot; never required for C1a shell |

**One Gateway connection per bot token.** Do not run MiniTwo + DudeTwo against the **same** production bot token simultaneously (event races + double-write risk).

### 2.3 launchd (production)

| Label | Purpose |
|-------|---------|
| `ai.fattail.labs.discord-bridge` | KeepAlive Gateway worker |

```text
Program:   server/.venv/bin/python
Args:      -m labs_discord.bridge   # Alpha names module; Foxtrot owns process
WorkingDirectory: ~/Fattail-Labs/server
Environment: from Labs .env (same as API — source .env into plist or shared pattern)
KeepAlive: true
ThrottleInterval: 10
stdout/stderr: ~/Library/Logs/fattail-labs/discord-bridge.log
```

**Restart policy:** launchd KeepAlive only — no hand-started `python` on MiniTwo.  
**Deploy:** after `git pull` + migrate + pip if needed:

```bash
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.discord-bridge
# VERIFY
tail -n 50 ~/Library/Logs/fattail-labs/discord-bridge.log
# expect: gateway READY / identified; no secret dumps
```

**Staging:** same label prefix `ai.fattail.labs-stage.discord-bridge` **or** omit process and set `LABS_DISCORD_BRIDGE=0`.

### 2.4 Coupling to API

| Option | Foxtrot pick for v1 |
|--------|---------------------|
| Bridge process writes MySQL directly | **Yes** — same DB credentials as API; simplest for upsert |
| Bridge only POSTs to internal API | Optional later for auth centralization |

Bridge and API share `LABS_DB_*` and Discord secrets from host `.env`. Fail loud at bridge boot if Community bridge enabled and secrets missing.

---

## 3. Scheduled role reconcile (DL-238)

### 3.1 Process model

| Label | Type |
|-------|------|
| `ai.fattail.labs.discord-reconcile` | launchd **StartInterval** job (not KeepAlive loop preferred) |

```text
StartInterval: 900   # 15 minutes (default; env override LABS_DISCORD_RECONCILE_INTERVAL_SECONDS)
Program: server/.venv/bin/python -m labs_discord.reconcile_roles
# or: curl -fsS -X POST localhost:4000/api/internal/discord/reconcile-roles \
#        -H "Authorization: Bearer $LABS_DISCORD_INTERNAL_KEY"
```

**Preferred v1:** HTTP internal endpoint on API (same pattern as wiki reindex) so one code path + auth key; launchd only curls. Fallback: standalone script if Gateway isolation preferred.

### 3.2 Job behavior (Mike hybrid)

1. Load paid role id set from config (`LABS_DISCORD_PAID_ROLE_IDS`).  
2. Enumerate Labs Discord-linked identities + date-aware entitlement.  
3. For each (or batch guild members with paid roles): diff vs guild roles via bot REST.  
4. **Not entitled + paid role present → revoke** (bot) + log.  
5. **Entitled + missing role → alert** (P1b); optional grant when map ready.  
6. Exit non-zero if batch error rate exceeds threshold → launchd logs stderr.

### 3.3 Logging & fail-loud alert

| Sink | Content |
|------|---------|
| `~/Library/Logs/fattail-labs/discord-reconcile.log` | Start/end, counts: checked / revoked / alerted / errors — **never tokens** |
| API structured log | Same summary line |
| Alert path v1 | stderr + log file; optional SMTP via existing Hostinger config to `LABS_ADMIN_EMAILS` / ops mailbox when `errors > 0` or `revoked > N` |
| Architecture/06 gate evidence | Sample run: command + log excerpt + before/after role sample |

**Silent success is OK; silent failure is forbidden.** Wiki sync pattern: `|| echo "discord-reconcile FAILED $(date)" >&2`.

### 3.4 Interval rationale

| Interval | Use |
|----------|-----|
| **15 min** | Default — Observer/alumni date expiry lag acceptable |
| 5 min | If Coach wants tighter revoke |
| Not event-only | Webhooks/WP remain fast path; sweep is mandatory safety net |

---

## 4. Message gap-heal backfill

### 4.1 Triggers

| Trigger | When |
|---------|------|
| Bridge reconnect | Per mapped channel after Gateway resume |
| Scheduled | Same reconcile host or separate StartInterval **300–900s** |

| Label | `ai.fattail.labs.discord-backfill` |
|-------|-------------------------------------|
| Interval | **600s** (10 min) default |
| Action | `POST /api/internal/discord/backfill-channel` per mapped channel **or** one `backfill-all` |

### 4.2 Rate limits

- Discord REST: respect 429 + `Retry-After`; exponential backoff; never tight loop.  
- Batch: max N messages/channel/run (Alpha config; e.g. 100) then continue next tick.  
- Idempotent upsert on `discord_message_id` (Spec).  
- Fail loud if backfill errors persist > K consecutive runs → alert same path as reconcile.

### 4.3 Logs

`~/Library/Logs/fattail-labs/discord-backfill.log` — channel id, messages upserted, gaps healed, errors. No message body dump at info level (PII/moderation); debug only in dev.

---

## 5. Config keys (fail loud)

### 5.1 Feature flag

```bash
# 0 = Community workers and Discord-dependent API paths inactive (C1a OK)
LABS_DISCORD_BRIDGE=0|1
```

When `LABS_DISCORD_BRIDGE=1` **outside dev**, boot of bridge **and** API Community sync routes require full set below — **ConfigError / process exit**, no silent half-on.

### 5.2 Required when bridge enabled

```bash
LABS_DISCORD_GUILD_ID=<snowflake>           # FatTail AI (prod) or staging guild
LABS_DISCORD_BOT_TOKEN=<token>              # Labs bridge bot; never commit; never log
LABS_DISCORD_CONNECT_URL=https://fattail.ai/...   # member CTA (Mike)
LABS_DISCORD_PAID_ROLE_IDS=<id,id,...>      # reconcile revoke set
LABS_DISCORD_INTERNAL_KEY=<≥32 chars>       # launchd → internal API auth
```

### 5.3 Channel map

| Storage | Foxtrot pick |
|---------|----------------|
| **DB** `community_channels.discord_channel_id` | **SoR** after C1a seed |
| Env override | Optional bootstrap only — not dual SoR |

### 5.4 Per-channel webhooks (Labs → Discord send)

| Storage | Encrypted/secret column or vault pattern on host |
|---------|---------------------------------------------------|
| Fields | webhook id + token per mapped channel |
| Fail | Composer send fails loud if webhook missing for channel |

Do **not** put webhook tokens in git. Optional: single bot `channel.createMessage` without webhook if Alpha chooses bot send — still needs bot token only.

### 5.5 Optional tuning

```bash
LABS_DISCORD_RECONCILE_INTERVAL_SECONDS=900
LABS_DISCORD_BACKFILL_INTERVAL_SECONDS=600
LABS_DISCORD_BACKFILL_MAX_MESSAGES=100
# LABS_DISCORD_APPLICATION_ID=
```

### 5.6 Explicitly not Labs env

WP Discord client secret, member OAuth access/refresh tokens (Mike C0-3).

---

## 6. Staging vs production mapping

| Concern | Production | Staging |
|---------|------------|---------|
| Guild | **FatTail AI** (live) | **Separate staging Discord guild** (recommended) **or** bridge off |
| Channel map | Prod Discord channel ids in prod DB | Staging channel ids in stage DB — **never copy prod ids to stage** |
| Bot token | Prod Labs bridge bot | Staging bot application (second Discord app) |
| WP connector | fattail.ai production | Stage WP if exists; else mock link / manual identity_links for tests |
| Dual Gateway same token | **Forbidden** | — |

**If staging must share FatTail AI:** only with Coach written exception; risk of test messages in member channels. Default **no**.

**C1a (shell only):** `LABS_DISCORD_BRIDGE=0`; fake/empty channel rows OK; no launchd Discord jobs required.

---

## 7. Deploy checklist (when C1b/c ships)

```bash
# MiniTwo
cd ~/Fattail-Labs && git pull origin main
set -a && source .env && set +a
# confirm LABS_DISCORD_* set; LABS_DISCORD_BRIDGE=1 only when ready
(cd server && .venv/bin/pip install -r requirements.txt)
(cd server && .venv/bin/python migrate.py)
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.api
launchctl bootstrap/kickstart bridge + reconcile + backfill as installed
# VERIFY
curl -s localhost:4000/api/health
tail -n 30 ~/Library/Logs/fattail-labs/discord-bridge.log
# manual reconcile smoke:
curl -fsS -X POST localhost:4000/api/internal/discord/reconcile-roles \
  -H "Authorization: Bearer $LABS_DISCORD_INTERNAL_KEY"
```

**Rollback:** `LABS_DISCORD_BRIDGE=0` + unload bridge/reconcile/backfill plists; API continues; chat sync stops; shelves may remain.

**Migrations before restart** — always (global doctrine).

---

## 8. Runbook outline → `infra/deploy.md`

Stub section title: **Community Discord workers (p-community)**.

Contents (landed in playbook as design; implement at C1b):

1. Topology: MiniTwo bridge only for prod guild.  
2. Env table §5.  
3. Three launchd labels: bridge KeepAlive, reconcile interval, backfill interval.  
4. Verify + rollback.  
5. Pointer: Mike C0-3, Spec §6.6, Architecture/06 evidence.

---

## 9. Residuals (ops evidence, not design RETURN)

1. Mint Discord **Labs bridge** application (intents) — Mike/Coach portal.  
2. Create staging guild or explicit Coach exception.  
3. Plist files under `infra/` when Alpha module path frozen.  
4. Wire SMTP alert for reconcile failures if log-only insufficient.  
5. Confirm prod guild id + paid role ids with operator.

---

## 10. Bench delta

1. **Three processes:** KeepAlive Gateway + interval reconcile + interval backfill.  
2. **Feature flag** `LABS_DISCORD_BRIDGE` lets C1a ship without Discord ops.  
3. **No dual Gateway** on one token across hosts.  
4. **Staging guild isolation** default.

---

## 11. Verdict

**APPROVED.** Foxtrot will install launchd units and verify `lsof`/logs at C1b/c deploy seeds — not before Alpha implements bridge/reconcile modules and secrets exist on host.

# P1a StudioTwo plane bring-up — 2026-09-01

**Host:** StudioTwo (OD-GP3). **Scope:** P1a infra only.  
**Working law:** spec v0.2.2 + plan as folded at `374ed86`. Token `agents/go/GP-W0.md`. W0-G PASS `59295ac`. P0-G PASS `e96be54`.  
**Not AT-GP23.** A key from a documented one-shot is the expected P1a state.

No secret values in this file.

---

## P1a-0 — remote-access survivability (read only)

| Item | Result |
|------|--------|
| Tailscale install | `which tailscale` — not on PATH. `/Applications/Tailscale.app` present. CLI: `/Applications/Tailscale.app/Contents/MacOS/Tailscale`. |
| Daemon vs agent | **No** `LaunchDaemon` plist named tailscale. **No** `LaunchAgent` plist named tailscale. `sudo launchctl print system/com.tailscale.tailscaled` not run (sudo password required). |
| How it actually runs | **System Network Extension**, activated+enabled: `io.tailscale.ipn.macsys.network-extension` (1.96.2). Process as **root** pid 1322 since boot 13 Aug 2026. GUI app as `ernie` pid 630 since boot. Starts at boot; does not need a logged-in session. |
| `tailscale status` | **Online.** Node name **studiotwo**. Tailscale IP `100.83.63.113`. |
| Self.Online | `True` |
| Self.KeyExpiry | `2026-09-25T15:36:43Z` |
| FileVault | **Off** (`fdesetup status`). Reboot does **not** halt at the unlock screen. |
| autoLoginUser | `ernie` |
| Remote Login / sshd | `sudo systemsetup -getremotelogin` not run (sudo password required). **Observed:** `*.22` LISTEN; ESTABLISHED sessions from `ernies-macbook-pro` (`100.120.179.125`) over Tailscale. `launchctl print system/com.openssh.sshd`: LaunchDaemon, socket-activated (`state = not running` with listeners is normal). |
| Power | `sudo systemsetup -getrestartpowerfailure` not run. `pmset`: `autorestart 1`, `sleep 0`, `standby 0`, `womp 1`, `displaysleep 0`, `disksleep 0`. Uptime 19 days at probe. |

**Unattended reboot tonight — does Coach get back in?** **Yes.** FileVault is off, so boot does not stop at unlock. Tailscale is a **system network extension** (root, since boot), not a login LaunchAgent, so the tailnet node should return without a GUI session. sshd is listening on port 22 (socket-activated). Auto-login `ernie` is extra (GUI / Grok Bot / API), not the first hop. **What would stop him first if something failed:** Tailscale key expiry is 2026-09-25 (not tonight); a failed Network Extension after an OS update; Remote Login turned off (it is not, empirically). **Remediations, not built:** (1) install `tailscale` CLI on PATH for future probes; (2) confirm `systemsetup -getremotelogin` On with sudo when Coach is at the machine; (3) `ai.fattail.labs.api.plist` so the API returns without Grok Bot — open Coach decision, not P1a.

P1a-0 does not gate the process work.

---

## Pass A′ — launch + env (read only; pid 79091 not touched)

### A′(1) Restart verb

There is **no** `ai.fattail.labs.api.plist` on StudioTwo. Pid **79091** parent was Grok Bot `local-exec-daemon` (22768 → Grok Bot 8735). The daemon does **not** source the repo `.env` as launchd `EnvironmentVariables`.

**Restart verb used in Pass C** (documented pattern `deploy.md` + live argv, `--workers` omitted):

```bash
cd /Users/ernie/Fattail-Labs/server && set -a && source ../.env && set +a
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 4001
```

Live argv before C: `uvicorn main:app --port 4001 --host 127.0.0.1` (no `--workers`). Started Tue Aug 25 08:35:34 2026.

**Carry:** durable fix (teach the daemon to source `.env`, or stand up `ai.fattail.labs.api.plist` per `deploy.md` launchd section) is an **open Coach decision**. Not built in P1a.

### A′(2) Pid 79091 env NAMES only

GO-prescribed `ps eww 79091 | grep -oE '(^| )[A-Z_]{3,}='` drops names that contain digits (`LABS_SSO_SECRET_0DTE`, Discord 0DTE, …). Digit-aware list used for the set difference. Product-relevant names on 79091 included the full `LABS_*` set from `.env` except SSR archive, plus extras `HEYGEN_API_KEY` and `POLYGON_API_KEY`. **Not present:** `LABS_MARKET_BUS`, `REDIS_URL`, `LABS_OPF_STORE_MAX_STALE_MS`, `LABS_MB_*`.

### A′(3) Repo `.env` NAMES only

57 names. Includes all `config.py` `_require*` names and `LABS_WIKI_ROOT`. Includes `LABS_SSR_ARCHIVE_URL` / `LABS_SSR_ARCHIVE_TOKEN`. **Did not** include the three P1a names before Pass C.

### A′(4) Set difference — live has, `.env` lacks (restart hazard)

Product-relevant: **`HEYGEN_API_KEY`**, **`POLYGON_API_KEY`**. Remainder is shell / Grok / Cursor (`SAND_*`, `CURSOR_*`, `HOME`, `PATH`, …).

All `config.py` `_require*` names and `LABS_WIKI_ROOT` were in **both** live and `.env`. Sourcing `.env` is sufficient to pass fail-loud boot (proven in B1). The two extra keys are inherited from the daemon shell on restart (overlay, not replace). They are **not** in `.env`; a future `api.plist` would have to name them if those features are required under launchd.

---

## Pass B — prove the boot (pid 79091 not touched)

### B1 Import smoke

Throwaway shell: `set -a && source ../.env && set +a`, then
`LABS_MARKET_BUS=1`, `REDIS_URL=redis://127.0.0.1:6379/0`, `LABS_OPF_STORE_MAX_STALE_MS=20000`.

```
cd server && .venv/bin/python -c "import main; print('boot ok')"
```

**Result:** `boot ok`, exit 0. Pid 79091 still alive. Live `/api/health` HTTP 200.

### B2 Spare-port 4009

Same env. `.venv/bin/uvicorn main:app --host 127.0.0.1 --port 4009` (pid 89254). `--workers` omitted.

`curl -s localhost:4009/api/health` → **HTTP 200**, `status=ok`, `env=dev`, `git_sha=e96be54802802c336c7db8049a342a6ece78c209`.

4009 process env NAMES: `LABS_MARKET_BUS`, `REDIS_URL`, `LABS_OPF_STORE_MAX_STALE_MS` present.

`get_store()` in a same-env interpreter: not `None`; `ping True`. One-shot wrote `mb:ladder:p1a-b2-touch:1970-01-01:w1:dual`. **Not AT-GP23.** Key deleted before Pass C so C's SCAN-before was 0.

Pid 79091 untouched throughout. 4009 killed after probes.

**Record:** 4009 shared the DB (`/api/health` does `SELECT 1` and nothing else). `server/main.py` has **no** `lifespan` and **no** `on_event` startup hooks.

### B3 Scratch backup (outside the repo)

`/Users/ernie/.grok/p1a-b3-backup-20260901T152424/` (mode 700). Contains live launch command, pid/ppid, `.env` verbatim (mode 600), live health JSON. **Not in git.**

Live health before C: HTTP 200, `env=dev`, `git_sha=44b4368e6d4d8a08657fc0cb651b4e0366bba5cd` (process had been up since 25 Aug).

---

## Pass C — the change

### C1 Three names into repo `.env`

Appended (were absent):

```
LABS_MARKET_BUS=1
REDIS_URL=redis://127.0.0.1:6379/0
LABS_OPF_STORE_MAX_STALE_MS=20000
```

`.env` is not committed.

### C2 Restart via A′(1)

Killed 79091. Grok Bot did **not** respawn it. Port 4001 free at t=1s. Started `/tmp/p1a-c/run4001.sh` (sources `.env`, then uvicorn as above).

New pid **90357**. `Uvicorn running on http://127.0.0.1:4001`. Member WS `/api/me/market/stream` accepted (existing Options Lab tab).

### C3 Health + three names

`curl /api/health` → **HTTP 200**, `status=ok`, `env=dev`, `git_sha=e96be54802802c336c7db8049a342a6ece78c209`.

New process env NAMES present: `LABS_MARKET_BUS`, `REDIS_URL`, `LABS_OPF_STORE_MAX_STALE_MS`.

Argv: `uvicorn main:app --host 127.0.0.1 --port 4001` — **no `--workers`**.

### C4 One plist

Copied `infra/launchd/ai.fattail.labs.chain-feed.plist.example` → `~/Library/LaunchAgents/ai.fattail.labs.chain-feed.plist`. `launchctl load` rc=0.

`launchctl print gui/501/ai.fattail.labs.chain-feed`: **loaded**, `state = running`, pid **90821**, `runs = 1`, `last exit code = (never exited)`. Program: `.venv/bin/python -m market_data.chain_feed --interval 2`. Plist env: `LABS_MARKET_BUS=1`, `REDIS_URL=redis://127.0.0.1:6379/0`.

**SSR before and after:** `launchctl print gui/501/ai.fattail.labs.ssr-live-capture` → `Could not find service "ai.fattail.labs.ssr-live-capture" in domain for user gui: 501`. Plist remains on disk (1519 B, 14 Aug). **Not loaded.**

### C5 Workers

`--workers` omitted on 4001 (GP23).

### C6 Rollback

Not used. Health 200 on the new process.

### Redis / SCAN / one-shot

| Probe | Result |
|-------|--------|
| `redis-cli ping` | `PONG` |
| SCAN `mb:*` **before C restart** | **0** |
| SCAN `mb:*` after restart, before documented one-shot | `mb:ladder:I:SPX:2026-09-01:w25:dual` and `mb:interest:mb:ladder:I:SPX:2026-09-01:w25:dual` — **member WS path** (Options Lab tab reconnected). Not plane interest. Not SSR. **Not AT-GP23.** |
| Documented one-shot | `get_store().set_json("mb:ladder:p1a-c-touch:1970-01-01:w1:dual", …)` |
| SCAN `mb:ladder:*` **after** | `mb:ladder:p1a-c-touch:1970-01-01:w1:dual` and the member I:SPX key |

### chain_feed behaviour (correct P1a outcome, not a defect)

Feed **runs** (KeepAlive, never exited). It does **not** idle: a member is holding `I:SPX` w25. Each tick logs:

```
skip mb:ladder:I:SPX:2026-09-01:w25:dual: Missing required environment variable: LABS_ENV
```

The example plist only sets `LABS_MARKET_BUS` and `REDIS_URL`. P1a loaded that plist only — did not expand it. Skip-and-continue is not a crash loop. Plane-owned interest is **P1b**. Do not treat the member I:SPX key as AT-GP23.

---

## Boundary

| Constraint | Honored |
|------------|---------|
| MiniTwo | not touched |
| Product Python | none (`plane_interest.py` is P1b) |
| Five frozen modules | none edited |
| `--workers` > 1 | not used |
| Secret values in artifacts | none |
| `ssr-live-capture` | not loaded |
| AT-GP23 | not claimed |

## Carries (surface only; not acted)

1. **P1b vs `main.py`.** Seed P1b-1 declares `server/main.py` for lifespan start. `main.py` has no `lifespan` today and is on the frozen §8 allowlist. **P1b needs DL-539 OK 2** (and OK 3 before any allowlist edit). It is not true that `plane_interest.py` can start in-process without touching `main.py` as the file stands.
2. **Daemon vs `.env`.** The owner of uvicorn does not source `.env` by itself. Durable fix: teach the daemon, or stand up `ai.fattail.labs.api.plist` per `deploy.md`. Open Coach decision.

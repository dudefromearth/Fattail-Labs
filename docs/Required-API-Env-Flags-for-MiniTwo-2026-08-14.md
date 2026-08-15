# Required API env flags — note for Conor

**Date:** 2026-08-14  
**From:** Ernie / StudioTwo  
**For:** MiniTwo (`labs.fattail.ai`) and anyone who will run the Labs API under **launchd**

**Bottom line:** These eleven flags are now required at boot. They are already on MiniTwo (`.env` **and** the launchd plist). If you rewrite `.env` later, also update the plist — `.env` alone does not start the production API.

**If you want launchd on your own Mac:** you do not have to set it up yourself. Do the one-time access below, then tell the agent: *“Set up Labs launchd on my machine.”*

---

## Why

The API used to swallow typos and missing flags: a bad value quietly became a default. That is now illegal. Boot dies loud if a flag is missing or not one of the allowed values.

The values below are the **old silent defaults**, written out so production behavior does not change.

---

## Keys (all required)

Add to `/Users/ernie/Fattail-Labs/.env` on MiniTwo if they are not already there. Do not wrap in quotes unless the rest of that file does.

```bash
# Option position marks: 1 = live OPF package marks, 0 = at-cost only
LABS_POSITIONS_OPF=1

# Auth rate limits (login / forgot / register / SSO / password-reset)
LABS_RL_LOGIN_PER_MIN=10
LABS_RL_FORGOT_PER_HOUR=5
LABS_RL_REGISTER_PER_MIN=5
LABS_RL_SSO_PER_MIN=30
LABS_RL_RESET_PER_MIN=10

# Membership webhook freshness (seconds)
LABS_WEBHOOK_MAX_AGE_SECONDS=300
LABS_WEBHOOK_FUTURE_SKEW_SECONDS=60

# Journal agent: llm | local | off
# Production was “llm” when unset. StudioTwo (dev) uses local.
LABS_JOURNAL_AGENT_MODE=llm

# Member AI ethos preamble: on | off
LABS_MEMBER_AI_ETHOS_MODE=on

# Help concierge may call Grok: 1 = yes (still needs XAI_API_KEY), 0 = humans only
LABS_HELP_AI_ENABLED=1
```

**StudioTwo vs MiniTwo (one difference):**

| Flag | StudioTwo | MiniTwo |
|------|-----------|---------|
| `LABS_JOURNAL_AGENT_MODE` | `local` | `llm` |
| everything else above | same | same |

Do **not** copy StudioTwo’s `local` onto MiniTwo unless you intend to stop the live journal agent in production.

---

## Allowed values

| Flag | Must be |
|------|---------|
| `LABS_POSITIONS_OPF` | `0` / `1` (also true/false/yes/no/on/off) |
| `LABS_RL_*` and webhook seconds | integer **≥ 1** |
| `LABS_JOURNAL_AGENT_MODE` | `llm` \| `local` \| `off` |
| `LABS_MEMBER_AI_ETHOS_MODE` | `on` \| `off` |
| `LABS_HELP_AI_ENABLED` | `0` / `1` (also true/false/yes/no/on/off) |

A typo (`maybe`, `ten`, `enbale`) aborts boot. That is the point.

---

## Status as of 2026-08-14

- **StudioTwo:** all eleven set in `.env`.  
- **MiniTwo `.env`:** all eleven appended. Backup `.env.bak.20260814131858`.  
- **MiniTwo launchd:** the API job does **not** read `.env`. The same eleven keys must also be on `~/Library/LaunchAgents/ai.fattail.labs.api.plist` under `EnvironmentVariables`. They were added there on the 2026-08-14 deploy. Plist backup next to it.  
- **Deployed:** MiniTwo pulled `main` `f66a1da`. After plist update, API is running. Public `https://labs.fattail.ai/api/health` returns `ok` + that `git_sha`.

If you rewrite `.env` later, also update the **plist** (or the next API restart will refuse to boot again).

---

## launchd vs `.env` (why the first restart died)

On MiniTwo the API is a LaunchAgent:

`~/Library/LaunchAgents/ai.fattail.labs.api.plist`

That job runs uvicorn with an **`EnvironmentVariables` block baked into the plist**. It does **not** source `.env`.

We wrote the eleven flags into `.env` first. Then `git pull` + kickstart loaded the **new** code with the **old** plist. Boot failed:

`ConfigError: Missing required environment variable: LABS_POSITIONS_OPF`

The flags were then added to the plist and the job was reloaded. Public health came back with `git_sha` `f66a1da…`.

Web on MiniTwo is a separate job (`ai.fattail.labs.web`) and listens on **:4001**, not :3000.

---

## How to get launchd going on your machine

You do **not** need to copy-paste plists. Once access is in place, ask the agent.

### One-time — so the agent can do it

1. A Mac with the repo at `~/Fattail-Labs` (or tell the agent the real path).
2. A working `.env` in that repo (secrets stay on the machine; never paste them into chat).
3. Python venv already able to boot the API (`server/.venv`).
4. **If the agent is not sitting at your keyboard:** authorize the StudioTwo deploy key the same way MiniTwo did.  
   Follow [`docs/ops/MiniTwo-SSH-Agent-Access.md`](./ops/MiniTwo-SSH-Agent-Access.md): append the StudioTwo public key to **your** `~/.ssh/authorized_keys`, then from StudioTwo `ssh you@your-host` should print `OK`.

That is the whole human setup.

### Then say this to the agent

> Set up Labs launchd on my machine.

That is enough. The agent will:

1. Copy / write `~/Library/LaunchAgents/ai.fattail.labs.api.plist` (and the web job if you want Next under launchd too).
2. Put the eleven flags above into the API plist `EnvironmentVariables` (and copy existing secrets **from your `.env` into the plist**, never into chat).
3. `launchctl bootstrap` / `kickstart` the job(s).
4. Prove it: `curl -sS http://127.0.0.1:4000/api/health` returns `ok` and a `git_sha`.
5. Tell you the listen ports (API is 4000; MiniTwo web is 4001).

On **MiniTwo / production** keep `LABS_JOURNAL_AGENT_MODE=llm`. On a **dev** Mac use `local` unless you mean to call the live model.

### If you are already at the MiniTwo terminal

Do not invent a second plist. Reload the existing jobs after a pull:

```bash
# migrations first
cd ~/Fattail-Labs && set -a && source .env && set +a
(cd server && .venv/bin/python migrate.py)

# if any of the eleven flags are new, add them to the API plist first
# (or ask the agent: “Add the fail-loud flags to MiniTwo launchd and kickstart”)

launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.api
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.web
curl -sS http://127.0.0.1:4000/api/health
```

`kickstart` only works if the plist already has every required flag. If health fails, the API log is:

`~/Library/Logs/fattail-labs/api.log`

---

## What this is not

These are not new secrets. They are on/off and number switches. SSO secrets, DB password, session secret, and API keys are unchanged and are **not** listed here. Do not put those in Slack or this file.

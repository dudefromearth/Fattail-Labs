# REQ-009 fold-in AFTER — loader PP-1 + MiniTwo web launchd + stash

**Date:** 2026-09-20 ~08:35 ET  
**Machines:** StudioOne `:4011` (CP-1) · MiniTwo web launchd  
**HEAD this report assumes:** `608e131f` on origin/main (StudioOne checkout was `6e65104f` at inspect — ancestor that already carries `/spec`)

## 1. MiniTwo `ai.fattail.labs.web`

Plist existed (`KeepAlive` true, `npm start`, `PORT=4001`) but **was not loaded**. Web was hand-started (`npm start` pid 14245, ppid 1).

- Stopped 14245; `launchctl bootstrap gui/501 ~/Library/LaunchAgents/ai.fattail.labs.web.plist`
- Job running pid **14439** → kill-and-watch SIGTERM → pid **14471** (`runs=2`) in <1 s
- `node` listen `*:4001`; `GET http://127.0.0.1:4001/` **307**; API `:4000/api/health` **200**

**DL-791.** API launchd was already loaded (pid 14152); not bounced.

## 2. Spec loader (StudioOne)

Named job had no log line before this packet. Sidecar pid **61940** already served `/spec` (import loads pinned snapshots). Ran the named job anyway:

```
cd ~/Fattail-Labs/server && .venv/bin/python -m symbology.load_specs
{"loaded": [], "ok": true, "roots": ["ES", "MES", "ZB"]}
```

`loaded: []` = snapshots already matched in-memory (idempotent).

**CP-1:** chain_feed pid **538** RSS **71088** before and after; last line `no interest keys; idle`. `:4010` pid **61894** unchanged. `:4011` pid **61940** unchanged.

**PP-1 (computing GET `http://192.168.1.111:4011`):**

| Row | Status | Body |
|-----|--------|------|
| ES | 200 | spec_version **1**, as_of **2026-09-18**, BPV **50**, tick_value **12.5**, ES contract-specs URL, no `session_summary` |
| MES | 200 | spec_version **1**, as_of **2026-09-18**, BPV **5**, tick_value **1.25**, MES own contract-specs URL |
| ZB | 404 | `not_found` (unlisted) |
| SPY | 404 | `not_found` |

Member-hop screen pass is Coach's.

## 3. Stash `s1-local-pre-main-2026-09-20` — propose, do not decide

`stash@{0}: On main: s1-local-pre-main-2026-09-20`  
12 files, **+502 / −97**. One-line purpose: **StudioOne local WIP from before today's main overlay** — SSR snapshot-dash VP ops pane, volume-page cache, Massive client additions, width-maturity CLI, capture-run.sh, plus auth/config/sym_feed flags. Not REQ-009.

| File | Intent |
|------|--------|
| `.gitignore` | ignore `Specs/wm_test/` |
| `Specs/make-synthetic-wm.py` | CLI `--out` for synthetic width-maturity parquet |
| `Specs/width-maturity.py` | visual CLI rewrite |
| `scripts/ssr-live-capture-run.sh` | capture runner tweak |
| `server/auth.py` | +34 local auth |
| `server/config.py` | +12 local config |
| `server/market_data/massive_client.py` | +119 client additions |
| `ssr_archive_cache.py` / `ssr_snap_counts.py` | small cache/count |
| `ssr_snapshot_dash.py` | VP data-end ops pane on chain snapshot dash |
| `ssr_volume_page.py` | pgrep/sum caches |
| `sym_feed.py` | optional `LABS_VP_SPY_TRADES` ingest thread |

**Proposal: drop** after Coach OK. Reasons: mixed packets (SSR dash ≠ width-maturity ≠ auth); main already has the intended overlay; committing the blob would put unreviewed StudioOne-only edits on main and keep a third place code lives. If the VP ops pane is wanted, extract that hunk in a **named later GO** — do not `stash pop` onto the overlay.

Not dropped. Not applied. Not committed.

# SODP0 — Foxtrot (infra)

**Verdict:** **APPROVED**  
**Date:** 2026-09-19 21:45 ET (Saturday, post-close)  
**Seat:** Foxtrot  
**Machine:** StudioTwo read-only; StudioOne SSH **read-only** (`ernie@192.168.1.111`, no bootout, no git pull, no install).  
**Review object:** spec §4 process set · Arch 36 machine catalog · plan SODP2 / SODP4 / SODP5.  
**Token:** `agents/go/SODP0-W0.md` (intake only — **not BUILD**).

Open REQs: **REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN.** D6 / D7 / D8 open. ES/MES model ACTIVE blocked on VPS Q1. MiniTwo not this tree until SODP4 is **named**. No report writes "done" before Coach AP-1.

---

## CP-1 — CHAIN PRIMACY (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

This packet: **read-only** (`lsof` / `launchctl list` / `ps` / `df` / health GET / `tail` logs). No overlay. No kickstart. A stray `du -sh` on `/Volumes/FatTail2TB/fattail-market-data` was **killed** (CP-1 pessimism — not a feed).

---

## Pin law (confirmed live)

| Use | Pin | Evidence 21:42 ET |
|-----|-----|-------------------|
| **LAN** | `http://192.168.1.111` | StudioOne `ifconfig` inet **192.168.1.111**. Ping 0.681 ms. `GET :4010/v1/health` → **401**  (computing-class; listener up). |
| **Tailscale / MiniTwo** | `http://100.74.220.38` | `tailscale ip -4` = **100.74.220.38**. Ping 18.7 ms. `GET :4010/v1/health` → **401** in 13.5 ms. MagicDNS `studioone` → `studioone.tail0a50af.ts.net` **100.74.220.38**. |
| **Never** | `studioone.local` | `dscacheutil` extra A **192.168.68.57** + IPv6 (`fe80` / `fdbc`). Same extra A is on the box (`ifconfig`). Prior stall ~1.2 s/request (DEV-API.md · DL). |

SSH from StudioTwo used **`ernie@192.168.1.111`** + `~/.ssh/id_studioone`. `~/.ssh/config` still maps Host `studioone` → `HostName studioone.local` — HTTP pin is the law; do not put `.local` in hop env. Live hop already correct:

- `LABS_SA_DEV_VP_API_BASE=http://192.168.1.111:4010`
- `LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011`

StudioTwo LAN `192.168.1.112` · Tailscale `100.83.63.113`.

---

## 1. Live listeners vs spec §4 / Arch 36

### StudioOne (D1 home) — 21:42 ET

Hostname `StudioOne.local`. uid **503**. Git **`36699be9`** (stale vs Labs `main`; **no git-pull**). Store `/Volumes/FatTail2TB/fattail-market-data` **mounted** (1.8 Ti, 1.1 Ti free). Internal Data 912 Gi free. No `/Users/ernie/fattail-market-data` on this box.

| Process | launchd | pid | Listen | Notes |
|---------|---------|-----|--------|-------|
| `chain_feed` `--interval 2` | `ai.fattail.labs.chain-feed` | **538** | (Redis writer, no HTTP) | CP-1 sacred. RSS **71088**. elapsed 4d14h. last line `no interest keys; idle`. log `~/Library/Logs/fattail-labs/chain-feed.out.log` mtime **21:45:25**, still growing. |
| `vp-api` | `ai.fattail.labs.vp-api` | **74792** | **\*:4010** | health 401. `LABS_VP_API_HOST=0.0.0.0`. RSS ~330 MB. |
| `symbology_app` | `ai.fattail.labs.symbology` | **26514** | **\*:4011** | sidecar since 16:42 ET (DL-773). `/v1/health` 404 (path is `/symbology/v1/*`). |
| history provider | — | — | **:4012 empty** | target only. |
| `sym_feed` `--interval 5` | `ai.fattail.labs.sym-feed` | 82012 | — | live. |
| `vp-engine` `bin_loop` | `ai.fattail.labs.vp-engine` | 53072 | — | histograms. |
| `vp_ingest.futures_feed` | `ai.fattail.labs.vp-futures` | 53424 | — | prints = tail only. |
| Redis | — | 5790 | 127.0.0.1:6379 | local. |
| `ssr_live_capture` | `ai.fattail.labs.ssr-live-capture` | 2712 | — | **capture — SODP5 does not touch.** |
| `ssr_snapshot_dash` | `ai.fattail.labs.ssr-snapshot-dash` | 54391 | \*:5055 | ops pane. |

Spec §4 process set **matches live**, except history (not built). Arch 36 catalog **matches**.

### StudioTwo leftovers (as-built drift · SODP-1)

Hostname `StudioTwo.local`. uid **501**. UI host Next **:3000** (pid 25784) + Labs **:4000** (71066/71070) — **keep**. Redis 127.0.0.1:6379. **:4011 / :4012 empty.** FatTail2TB **not** mounted. Local store `/Users/ernie/fattail-market-data`.

| Leftover | launchd | pid | Listen | Notes |
|----------|---------|-----|--------|-------|
| `vp-api` | `ai.fattail.labs.vp-api` **running** | **66270** | **127.0.0.1:4010** | DEV sidecar. health 401. RSS 121 MB. elapsed 1d8h. `LABS_MARKET_DATA_ROOT=/Users/ernie/fattail-market-data`. |
| `chain_feed` `--interval 2` | `ai.fattail.labs.chain-feed` **running** | **99058** | — | **second Massive account caller.** idle `no interest keys`. RSS 73584. elapsed **18d**. log `/tmp/labs-chain-feed.log`. |
| `vp-engine` `bin_loop` | `ai.fattail.labs.vp-engine` **running** | **31332** | — | local store only. looping `ES sessions_ingested would not be contiguous`. RSS 123 MB. |

Plist on disk, **not loaded:** `ai.fattail.labs.ssr-live-capture`, `ai.fattail.labs.vp-futures`. Do not load them.

`plane-interest` (pid 14535) is Labs OPF on the UI host — **not** a SODP5 target.

---

## 2. CP-1 (c) BEFORE / AFTER this packet

| | BEFORE 21:42:31 ET | AFTER 21:45:25 ET |
|--|--|--|
| `chain_feed` | pid **538** · RSS **71088** · 0.0% CPU · elapsed 04-14:13:57 · `Python -m market_data.chain_feed --interval 2` | pid **538** same · RSS **71088** same · 0.0% CPU · elapsed 04-14:15:47 |
| last-snapshot freshness | log mtime 21:43 · last line `no interest keys; idle` · size 37 976 384 | mtime **21:45:25** · last line `no interest keys; idle` · size **37 977 603** (still writing) |
| vp-api :4010 | pid **74792** \*:4010 | pid **74792** unchanged |
| symbology :4011 | pid **26514** \*:4011 | pid **26514** unchanged |

**AFTER: chain_feed not degraded.** Saturday idle is expected (ES closed Friday 17:00 ET). Load 2.89 → 3.65 during the killed `du`; feeds unchanged.

---

## 3. History provider footprint vs `chain_feed` (SODP2 bind)

Plan draft is confirmed, with one Foxtrot **bind** (flag, not a kill): **sibling `:4012`**, not a route bolted onto live vp-api `:4010`.

| Resource | `chain_feed` (sacred) | History provider (SODP2) |
|----------|----------------------|--------------------------|
| **Process** | existing launchd `ai.fattail.labs.chain-feed`. Do **not** edit plist or wrapper. | **+1** idle FastAPI, new label `ai.fattail.labs.history`. Overlay/rsync only. StudioOne git stays `36699be9`. |
| **Port** | none | **4012** (empty tonight). 4010 / 4011 / 6379 untouched. |
| **Massive** | REST ladder poll `--interval 2` when interest keys exist; **0 GETs** while idle. Shared account. | Historical `GET /futures/v1/aggs/{vendor}` (ESZ6 / MESZ6). Paged, `max_pages=20`, `limit≤50000`. **After RTH (16:00 ET) or HOLD.** Proven size: ESZ6 5m ≈ 12 098 bars from 2025-09-10. Not a 2 s poll. One connection class. Do not run a cache fill while `chain_feed` is writing ladders. |
| **Disk** | Redis `mb:*` + existing logs. | **Internal Data**, not FatTail2TB (Arch 36 §5: on-box store; 2TB can unmount). Fail loud if cache root missing. Create `/Users/ernie/fattail-market-data/history` at SODP2 (does not exist tonight). 90 d × ES+MES × 5m is tens of MB — not a 2TB consumer. Completed days immutable; today refreshes **post-close**. |
| **CPU / RSS** | 71 MB, 0.0% idle | expect ~60 MB idle (symbology analogue). Burst only during post-close fill. No `--interval` competing with chain 2 s. |
| **Redis** | `mb:*` DB 0 | **none** for history cache. Do **not** raise `vp:hot` 64 MiB cap. |
| **launchd** | untouched | new agent only. Do not edit chain-feed / vp-api / sym-feed / vp-engine / vp-futures / ssr-live-capture. |

**Why not overlay vp-api `:4010`:** kickstart of `ai.fattail.labs.vp-api` would bounce pid **74792** (KeepAlive −15). Rollback would bounce it again. Sibling `:4012` is one bootout and leaves health/structure/range up. Spec §4 "part of vp-api **or** sibling `:4012`" — Foxtrot takes the second. Coach box if he wants it in-process.

**Massive-account honesty (as-built, not this packet):** StudioTwo leftover `chain_feed` pid **99058** already shares the account. It is idle tonight. SODP5 removes that second writer. SODP2 must not add a **third** writer during RTH.

---

## Rollback (one line) — SODP2 history agent

```
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.history.plist
```

Labs hop off (`LABS_SA_DEV_VP_API_BASE` stays the VP pin; do not point OHLC at `:4012` until the agent is up). Does **not** bootout chain-feed / vp-api / symbology / capture.

If a later packet wrongly overlays vp-api instead, rollback is revert-rsync + `kickstart -k gui/$(id -u)/ai.fattail.labs.vp-api` — **worse CP-1**. Do not take that path.

---

## 4. SODP5 — retire StudioTwo leftovers (plan, do not execute)

**When:** after SODP3 hop holds (member `/ohlc` `/contracts` `/stream` through StudioOne). Not tonight. Not during RTH. Not as a "fix" for `:3000`/`:4000`.

**Do not touch capture.** StudioTwo `ssr-live-capture` is already **unloaded**. StudioOne `ssr-live-capture` pid **2712** stays. Do not bootout anything on StudioOne in SODP5.

**Keep:** Next `:3000`, Labs `:4000`, `plane-interest`, Redis used by Labs.

**Bootout order (StudioTwo only, uid 501):**

```
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.vp-engine.plist
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.vp-api.plist
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.chain-feed.plist
```

**Prove:** `lsof -nP -iTCP:4010 -sTCP:LISTEN` empty. `launchctl print gui/$(id -u)/ai.fattail.labs.{vp-api,vp-engine,chain-feed}` not found. Leave plists on disk (same pattern as unloaded `ssr-live-capture`) so a named rollback can `bootstrap` them. Do **not** `load` SSR.

**Rollback of SODP5 (restore leftover plane, not capture):**

```
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.vp-api.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.vp-engine.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.chain-feed.plist
```

---

## 5. SODP4 — MiniTwo (named later)

Tailscale pin **`http://100.74.220.38:4010`** (and `:4011` / future `:4012`) is live from this LAN tonight. Product Labs (MySQL / SSO / courses) stays MiniTwo until Coach stamps **SODP-LABS**. No MiniTwo deploy in this intake.

---

## Flags (opinion — not a block)

1. Spec §4 "or" on `:4010` vs `:4012` — Foxtrot binds **`:4012`**. Record in SODP2-W0.  
2. History cache on **internal Data**, never the 2TB path (unmount = named failure, not a silent print fill).  
3. StudioTwo leftover `chain_feed` is a second Massive writer **today**. SODP5 is the kill; do not wait on it to start SODP2, but do not fill history while that leftover is non-idle either.  
4. SSH `HostName studioone.local` is operator convenience; hop env must stay the IP pin.

---

## Isolation

No LIM / QFRIC / XS / PPL / Help Watch files. No `_aggs_price_fill` repair. No StudioOne git pull. No MiniTwo. No stop of `:3000`/`:4000`. Capture untouched.

---

**APPROVED** for Coach stamp of the review object. Juliet does not start SODP2 until BUILD + `SODP2-W0` with this footprint and the rollback line above.

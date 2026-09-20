# SODP0 — Foxtrot (infra)

**Verdict:** **APPROVED**  
**Date:** 2026-09-19 22:45 ET (Saturday, post-close)  
**Seat:** Foxtrot  
**Machine:** StudioTwo read-only; StudioOne SSH **read-only** (`ernie@192.168.1.111`, identity `~/.ssh/id_studioone`). **No** bootout, **no** git pull, **no** install, **no** restart.  
**Review object:** spec **v0.1.5** §4 process set · §12 CP-1 budgets · Arch 36 machine catalog · plan SODP2 / SODP4 / SODP5.  
**Token:** `agents/go/SODP0-W0.md` (intake only — **not BUILD**).  
**Spec sha1:** `dab97e4f19cb1fdc71a7b165dfadbc0d617876fd`  
**Arch 36 sha1:** `edf6f58b6cddf9c8fb07d37fc0309c3fe8fc8bbd`

Open REQs: **REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN.** D6 / D7 / D8 open. ES/MES model ACTIVE blocked on VPS Q1. MiniTwo not this tree until SODP4 is **named**. No report writes "done" before Coach AP-1.

---

## CP-1 — CHAIN PRIMACY (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

## CP-1 — SODP host law (verbatim · Coach SODP0)

> StudioOne is the only host that talks to Massive. StudioTwo talks to StudioOne. Never put `MASSIVE_API_KEY` on StudioTwo. Never point a StudioTwo feed at `rest.massive.com`.

This packet: **read-only** (`lsof` / `launchctl list` / `ps` / `stat` / `tail` / health GET). **0** new Massive connections. **0** launchd changes. **0** installs. Disk: sequential `ls`/`stat`/`tail` of known logs (no `du`). One brief StudioOne home `.env` glob (CP-1 pessimism — should not have walked home); AFTER below proves `chain_feed` undegraded.

---

## Spec §12 confirmed (Coach SODP0 · v0.1.5)

Spec status line and change table **0.1.5** name the law. §12 body matches Coach tonight:

> **Interim combined standing (until SODP-MB closes):** StudioOne (`chain_feed` + `sym_feed` + capture + recognition if standing) **plus StudioTwo (`chain_feed` + `sym_feed`)**. Foxtrot’s SODP1 headroom measurement **counts BOTH sets**. A number that omits a live writer does **not** satisfy SODP-8. After SODP-MB, StudioTwo feeds drop out of the standing set.

Table row **StudioTwo `chain_feed` / `sym_feed` (interim):** live until SODP-MB; same intervals as StudioOne twins; **counted in combined standing**.

**SODP1 bind (this packet, not SODP1-G):** a headroom number that only cites StudioOne `chain_feed` pid 538 is **FAIL**. Count **both** writer sets. Do not invent a StudioTwo `sym_feed` interval that is not loaded tonight — count **live** writers, and keep the StudioTwo `sym_feed` slot named as **absent / not loaded** until SODP-MB (so a later load cannot hide).

---

## Pin law (confirmed live)

| Use | Pin | Evidence 22:42–22:44 ET |
|-----|-----|-------------------------|
| **LAN** | `http://192.168.1.111` | StudioOne `ifconfig` inet **192.168.1.111**. Ping avg 0.847 ms. `GET :4010/v1/health` → **401** in 11 ms (computing-class; listener up). |
| **Tailscale / MiniTwo** | `http://100.74.220.38` | StudioOne inet **100.74.220.38**. Ping 2.6–15.8 ms. `GET :4010/v1/health` → **401** in 14 ms. |
| **Never** | `studioone.local` | `dscacheutil` A **192.168.1.111** + extra A **192.168.68.57** + IPv6 (`fe80` / `fdbc`). Same extra A is on the box (`ifconfig`). |

SSH from StudioTwo used **`ernie@192.168.1.111`** + `~/.ssh/id_studioone`. `~/.ssh/config` still maps Host `studioone` → `HostName studioone.local` — HTTP/SSH pin is the law; do not put `.local` in hop env. Live hop already correct:

- `LABS_SA_DEV_VP_API_BASE=http://192.168.1.111:4010`
- `LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011`

StudioTwo LAN `192.168.1.112` · Tailscale `100.83.63.113`.

**Key location (Coach host law, no values printed):** StudioOne `/Users/ernie/Fattail-Labs/.env` has `MASSIVE_API_KEY` **SET** (len 32). StudioOne `chain_feed` / `sym_feed` / `vp-api` / `vp-futures` process env contain the key. StudioTwo repo `.env` does **not** contain `MASSIVE_API_KEY` or `rest.massive.com`. StudioTwo leftover `chain_feed` / `vp-api` / Labs `:4000` process env: key **absent**, no `rest.massive.com`. Labs hop is the LAN pin, not Massive REST.

---

## 1. Live listeners vs spec §4 / Arch 36

### StudioOne (D1 home) — 22:42 ET BEFORE / 22:44 ET AFTER

Hostname `StudioOne.local`. uid **503**. Git **`36699be9`** (stale vs Labs `main`; **no git-pull**). Store `/Volumes/FatTail2TB/fattail-market-data` **mounted** (1.8 Ti, 1.1 Ti free). Internal Data 912 Gi free. No `/Users/ernie/fattail-market-data` on this box.

| Process | launchd | pid | Listen | Notes |
|---------|---------|-----|--------|-------|
| `chain_feed` `--interval 2` | `ai.fattail.labs.chain-feed` | **538** | (Redis writer, no HTTP) | CP-1 sacred. RSS **71088**. last line `no interest keys; idle`. log `~/Library/Logs/fattail-labs/chain-feed.out.log` still growing. |
| `sym_feed` `--interval 5` | `ai.fattail.labs.sym-feed` | **82012** | — | **standing Massive**. AFTER last line `sym MSFT mid=493.89 src=massive`. RSS 58928. |
| `vp-api` | `ai.fattail.labs.vp-api` | **74792** | **\*:4010** | health 401. RSS ~330 MB. |
| `symbology_app` | `ai.fattail.labs.symbology` | **26514** | **\*:4011** | `/v1/health` 404 (path is `/symbology/v1/*`). |
| history provider | — | — | **:4012 empty** (`curl` connection refused) | target only. cache dir `/Users/ernie/fattail-market-data/history` **absent**. |
| `vp-engine` `bin_loop` | `ai.fattail.labs.vp-engine` | 53072 | — | histograms. |
| `vp_ingest.futures_feed` | `ai.fattail.labs.vp-futures` | 53424 | — | prints = tail only. |
| Redis | — | 5790 | 127.0.0.1:6379 | local. |
| `ssr_live_capture` | `ai.fattail.labs.ssr-live-capture` | 2712 | — | **capture — SODP5 does not touch.** |
| `ssr_snapshot_dash` | `ai.fattail.labs.ssr-snapshot-dash` | 54391 | — | ops pane. |
| recognition cache | — | **none found** | — | SODP1 must **name** it or write “none found.” |

Spec §4 process set **matches live**, except history (not built). Arch 36 catalog **matches**.

### StudioTwo leftovers (as-built drift · SODP-1 · counted until SODP-MB)

Hostname `StudioTwo.local`. uid **501**. UI host Next **:3000** (pid 25784) + Labs **:4000** (71066/71070) — **keep**. Redis 127.0.0.1:6379. **:4011 / :4012 empty.** FatTail2TB **not** mounted. Local store `/Users/ernie/fattail-market-data`.

| Leftover | launchd | pid | Listen | Notes |
|----------|---------|-----|--------|-------|
| `vp-api` | `ai.fattail.labs.vp-api` **running** | **66270** | **127.0.0.1:4010** | DEV sidecar. health 401. RSS 121 MB. `LABS_MARKET_DATA_ROOT=/Users/ernie/fattail-market-data`. SODP5 target. |
| `chain_feed` `--interval 2` | `ai.fattail.labs.chain-feed` **running** | **99058** | — | **StudioTwo writer set.** idle `no interest keys`. RSS 73584. elapsed **18d**. log `/tmp/labs-chain-feed.log`. Wrapper sources repo `.env` (**no** Massive key in that file). **Counted in §12 combined standing until SODP-MB. Not a SODP5 delete.** |
| `sym_feed` | **not loaded** | — | — | `launchctl print gui/501/ai.fattail.labs.sym-feed` → not found. **No plist.** Slot is **absent**, still named in the combined set so SODP1 does not forget it. |
| `vp-engine` `bin_loop` | `ai.fattail.labs.vp-engine` **running** | **31332** | — | local store only. RSS 123 MB. SODP5 target. |

Plist on disk, **not loaded:** `ai.fattail.labs.ssr-live-capture`, `ai.fattail.labs.vp-futures`. Do not load them.

`plane-interest` (pid 14535) is Labs OPF on the UI host — **not** a SODP5 target.

---

## 2. CP-1 (c) BEFORE / AFTER this packet

| | BEFORE 22:42:10 ET | AFTER 22:44:17 ET |
|--|--|--|
| `chain_feed` | pid **538** · RSS **71088** · 0.0% CPU · elapsed 04-15:12:31 · `Python -m market_data.chain_feed --interval 2` | pid **538** same · RSS **71088** same · 0.1% CPU · elapsed 04-15:14:38 |
| last-snapshot freshness | (inventory SSH; log later 22:43:00 size 38 015 024 · last line `no interest keys; idle`) | mtime **22:44:16** · last line `no interest keys; idle` · size **38 015 875** (still writing) |
| `sym_feed` | pid **82012** · RSS 58928 · `--interval 5` | pid **82012** same · last line `sym MSFT mid=493.89 src=massive` · log still writing |
| vp-api :4010 | pid **74792** \*:4010 | pid **74792** unchanged |
| symbology :4011 | pid **26514** \*:4011 | pid **26514** unchanged |

**AFTER: chain_feed not degraded.** Saturday idle is expected (ES closed Friday 17:00 ET). `sym_feed` continues Massive marks (standing, not this packet). Load AFTER `{ 1.91 2.42 2.51 }`.

---

## 3. Combined standing (interim · both machines) — SODP1 measurement bind

Citation of CP-1 without these rows is not a GO (spec §12). One Massive account.

| Writer | Host | Standing Massive | Burst | Tonight |
|--------|------|------------------|-------|---------|
| `chain_feed` `--interval 2` | **StudioOne** | 1 REST loop (idle when no interest keys) | per hot exp | pid **538** idle · 0 GETs |
| `sym_feed` `--interval 5` | **StudioOne** | 1 REST marks loop | — | pid **82012** **live** `src=massive` |
| `vp-futures` capture | StudioOne | session trades | — | pid 53424 existing |
| recognition cache | StudioOne | **unnamed** | if it polls, count before SODP2 GO | **none found** this packet |
| `chain_feed` `--interval 2` | **StudioTwo** | 1 REST loop (same class) | per hot exp | pid **99058** idle · no key in this host `.env` · **still counted** |
| `sym_feed` | **StudioTwo** | same interval **if loaded** | — | **not loaded** — name the absence |
| **History provider (F3)** | StudioOne | **0 standing** | 1 paginated GET/(vendor ticker, tf) on cache miss; today-refresh 1 GET | not installed |
| leftover StudioTwo `vp-api` / fill | StudioTwo | **must go to 0 at SODP5** | — | pid 66270 :4010 — not a standing Massive writer after fill delete |

**Interim combined standing tonight:** StudioOne (`chain_feed` + `sym_feed` + capture + recognition-if-standing) **+** StudioTwo (`chain_feed` + `sym_feed`-if-loaded). Live count = **two** StudioOne REST loops + **one** StudioTwo REST loop + capture. History remains **0 standing**.

If SODP1 cannot show headroom against **this** set, SODP2 is HOLD until after 16:00 ET **and** the standing set is unchanged.

---

## 4. History provider footprint vs `chain_feed` (SODP2 bind)

Plan draft is confirmed, with one Foxtrot **bind** (flag, not a kill): **sibling `:4012`**, not a route bolted onto live vp-api `:4010`. Spec §12 table still says “`:4010` route or `:4012`”; spec §4 already records the sibling bind.

| Resource | `chain_feed` (sacred) | History provider (SODP2) |
|----------|----------------------|--------------------------|
| **Process** | existing launchd `ai.fattail.labs.chain-feed`. Do **not** edit plist or wrapper. | **+1** idle FastAPI, new label `ai.fattail.labs.history`. Overlay/rsync only. StudioOne git stays `36699be9`. |
| **Port** | none | **4012** (empty tonight). 4010 / 4011 / 6379 untouched. |
| **Massive** | REST ladder poll `--interval 2` when interest keys exist; **0 GETs** while idle. Shared account with **all** §12 writers. | Historical `GET /futures/v1/aggs/{vendor}` (ESZ6 / MESZ6). Paged, `max_pages=20`, `limit≤50000`. **After RTH (16:00 ET) or HOLD.** Proven size: ESZ6 5m ≈ 12 098 bars from 2025-09-10. Not a 2 s poll. One connection class. Do not run a cache fill while `chain_feed` is writing ladders **or** while StudioTwo leftover `chain_feed` is non-idle. |
| **Disk** | Redis `mb:*` + existing logs. | **Internal Data**, not FatTail2TB (Arch 36 §5: on-box store; 2TB can unmount). Fail loud if cache root missing. Create `/Users/ernie/fattail-market-data/history` at SODP2 (absent tonight). 90 d × ES+MES × 5m is tens of MB — not a 2TB consumer. Completed days immutable; today refreshes **post-close**. |
| **CPU / RSS** | 71 MB, ~0% idle | expect ~60 MB idle (symbology analogue). Burst only during post-close fill. No `--interval` competing with chain 2 s **or** sym 5 s. |
| **Redis** | `mb:*` DB 0 | **none** for history cache. Do **not** raise `vp:hot` 64 MiB cap. No `CONFIG SET`. |
| **launchd** | untouched | new agent only. Do not edit chain-feed / vp-api / sym-feed / vp-engine / vp-futures / ssr-live-capture. |

**Why not overlay vp-api `:4010`:** kickstart of `ai.fattail.labs.vp-api` would bounce pid **74792** (KeepAlive −15). Rollback would bounce it again. Sibling `:4012` is one bootout and leaves health/structure/range up.

### Rollback (one line) — SODP2 history agent

```
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.history.plist
```

Labs hop off (`LABS_SA_DEV_VP_API_BASE` stays the VP pin; do not point OHLC at `:4012` until the agent is up). Does **not** bootout chain-feed / vp-api / symbology / capture.

**This packet rollback:** none. Leave StudioOne `chain_feed` / `:4010` / `:4011` as they are; do not bootout; StudioTwo leftover VP units stay loaded until an explicit later packet.

---

## 5. SODP5 — retire StudioTwo leftovers (plan, do not execute)

**When:** after SODP3 hop holds (member `/ohlc` `/contracts` `/stream` through StudioOne). Not tonight. Not during RTH. Not as a "fix" for `:3000`/`:4000`.

**SODP-MB hold (spec SODP-11 · §12 · §13):** SODP5 does **not** retire StudioTwo `chain_feed` / `sym_feed`. Those stay until a named **SODP-MB** GO hops Arch 28 member routes. StudioTwo `sym_feed` is already absent; do not load it; do not bootout `chain-feed` in SODP5.

**Do not touch capture.** StudioTwo `ssr-live-capture` is already **unloaded**. StudioOne `ssr-live-capture` pid **2712** stays. Do not bootout anything on StudioOne in SODP5.

**Keep:** Next `:3000`, Labs `:4000`, `plane-interest`, Redis used by Labs, **`ai.fattail.labs.chain-feed`** (until SODP-MB).

**Bootout order (StudioTwo only, uid 501) — SODP5:**

```
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.vp-engine.plist
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.vp-api.plist
```

**Prove:** `lsof -nP -iTCP:4010 -sTCP:LISTEN` empty. `launchctl print gui/$(id -u)/ai.fattail.labs.{vp-api,vp-engine}` not found. `launchctl print gui/$(id -u)/ai.fattail.labs.chain-feed` still **running**. Leave plists on disk so a named rollback can `bootstrap` them. Do **not** `load` SSR or vp-futures.

**Rollback of SODP5 (restore leftover VP plane, not capture, not a new sym-feed):**

```
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.vp-api.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.vp-engine.plist
```

---

## 6. SODP4 — MiniTwo (named later)

Tailscale pin **`http://100.74.220.38:4010`** (and `:4011` / future `:4012`) is live from this LAN tonight. Product Labs (MySQL / SSO / courses) stays MiniTwo until Coach stamps **SODP-LABS**. No MiniTwo deploy in this intake.

---

## Flags (opinion — not a block)

1. Spec §4 / Foxtrot bind: history on **`:4012`**. Spec §12 table still says “`:4010` route or `:4012`”. Record in SODP2-W0.  
2. History cache on **internal Data**, never the 2TB path (unmount = named failure, not a silent print fill).  
3. **Arch 36 §5** combined-standing sentence still omits StudioTwo writers. Spec **v0.1.5 §12** is law; Lima should copy the interim set. Not a kill.  
4. Plan SODP5 packet prose still lists leftover `chain-feed` in the deletion set; the DAG + SODP-MB paragraph + spec §13 do not. **Spec SODP-11 wins.** A later SODP5 seed that bootouts StudioTwo `chain-feed` before SODP-MB is FAIL.  
5. StudioTwo leftover `chain_feed` is a second Massive **writer process** tonight (idle, no key in this `.env`). Count it. Do not fill history while it is non-idle.  
6. SSH `HostName studioone.local` is operator convenience; hop env must stay the IP pin.

---

## Isolation

No LIM / QFRIC / XS / PPL / Help Watch / GC files. No `_aggs_price_fill` repair. No StudioOne git pull. No MiniTwo. No stop of `:3000`/`:4000`. Capture untouched. No Massive GET from this seat.

---

**APPROVED** for Coach stamp of the review object (spec v0.1.5 §12 combined standing **confirmed**). Juliet does not start SODP2 until BUILD + `SODP2-W0` with this footprint, the rollback line above, and a SODP1 combined budget that counts **both** StudioOne and StudioTwo writer sets.

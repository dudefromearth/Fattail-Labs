# F0 — Foxtrot · live tap health (read-only)

**Agent:** Foxtrot  
**Date:** 2026-09-28  
**Host:** StudioOne (`StudioOne.local`) via `ssh -o BatchMode=yes ernie@studioone`  
**Clock:** `2026-09-28 15:02:07 EDT` — **RTH** (America/New_York until 16:00).  
**Seed:** `agents/p-opf-band-2p5sigma/seeds/F0-live-health.md`  
**CP-1:** no kickstart, no kill, no plist edit, no collector restart. Finding only.

**Verdict:** **FINDING** — live tap is **up and writing** as the **Friday 16:29 process (pid 42355)**. Redis and FatTail2TB are healthy. **Plist is not all mexp2:** `LABS_REPO` is mexp2; `ProgramArguments` and `WorkingDirectory` still point at `Fattail-Labs`. That is the Friday-miss class. Do not repair during RTH.

---

## 0. What was not done

- Did not `launchctl kickstart` / `bootout` / `kill` `ai.fattail.labs.ssr-live-capture`.
- Did not edit `~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist`.
- Did not restart `chain_feed` pid **538**.
- Did not write to the archive (no `touch`). Writable check was `test -w` only.

---

## 1. Redis `127.0.0.1:6379`

`redis-cli` is **not** on default PATH (`zsh:1: command not found: redis-cli`). Homebrew binary is present.

```
$ /opt/homebrew/bin/redis-cli -h 127.0.0.1 -p 6379 ping
PONG
```

```
$ ps -p 39817 -o pid,lstart,etime,command
  PID STARTED                          ELAPSED COMMAND
39817 Fri Sep 25 11:01:04 2026     03-04:01:03 /opt/homebrew/opt/redis/bin/redis-server 127.0.0.1:6379
```

```
$ lsof -nP -iTCP:6379 -sTCP:LISTEN
COMMAND     PID  USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
redis-ser 39817 ernie    6u  IPv4 …                 0t0  TCP 127.0.0.1:6379 (LISTEN)
redis-ser 39817 ernie    7u  IPv6 …                 0t0  TCP [::1]:6379 (LISTEN)
```

**Finding:** Redis is up. Friday Connection refused is **not** current. Server started **Fri Sep 25 11:01** (before the 16:29 tap).

---

## 2. FatTail2TB / `LABS_MARKET_DATA_ROOT`

```
$ mount | grep -i -E "FatTail2TB|Sabrant|fattail"
/dev/disk5s2 on /Volumes/Sabrant 2TB (apfs, sealed, local, nodev, nosuid, read-only, journaled, noowners)
/dev/disk5s1 on /Volumes/FatTail2TB (apfs, local, nodev, nosuid, journaled, noowners, nobrowse)

$ df -h /Volumes/FatTail2TB
Filesystem      Size    Used   Avail Capacity iused ifree %iused  Mounted on
/dev/disk5s1   1.8Ti   775Gi   1.0Ti    43%    7.7M   11G    0%   /Volumes/FatTail2TB

$ ls -ld /Volumes/FatTail2TB /Volumes/FatTail2TB/fattail-market-data \
         /Volumes/FatTail2TB/fattail-market-data/ssr \
         /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture
drwxrwxrwx@ 23 ernie  staff   736 Sep 28 13:49 /Volumes/FatTail2TB
drwxr-xr-x  15 ernie  staff   480 Sep 24 10:25 /Volumes/FatTail2TB/fattail-market-data
drwxr-xr-x   4 ernie  staff   128 Aug 21 00:58 /Volumes/FatTail2TB/fattail-market-data/ssr
drwxr-xr-x  50 ernie  staff  1600 Sep 28 02:21 /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture

test -d /Volumes/FatTail2TB → YES
test -w /Volumes/FatTail2TB/fattail-market-data → YES
test -w /Volumes/FatTail2TB/fattail-market-data/ssr/live_capture → YES
```

Both trees `.env`: `LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data`.

Live process env: `LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data`.

Today’s folder is being written (ls only, ~15:01 ET):

```
drwxr-xr-x  9 ernie  staff  288 Sep 28 15:00 …/day=2026-09-28
-rw-r--r--  1 ernie  staff  47475 Sep 28 15:01 …/day=2026-09-28/COUNTS.json
…/chain/SPX  newest snaps mtime Sep 28 15:01 (snap-190134960Z.json)
…/chain/XSP  newest snaps mtime Sep 28 15:01
```

**Finding:** Gold volume is **mounted and writable**. `/Volumes/Sabrant 2TB` is a **read-only** other slice — not the archive. Friday FileNotFound is **not** current.

---

## 3. Plist: ProgramArguments, WorkingDirectory, LABS_REPO — all mexp2?

**No.** File: `~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist`  
mtime **Sep 25 16:29:08 2026** (one second before pid 42355 lstart). Domain **`user/503`** (gui/503: service not found).

| Key | Value | mexp2? |
|-----|-------|--------|
| `ProgramArguments[1]` | `/Users/ernie/Fattail-Labs/scripts/ssr-live-capture-run.sh` | **NO** — `Fattail-Labs` |
| `WorkingDirectory` | `/Users/ernie/Fattail-Labs/server` | **NO** — `Fattail-Labs` |
| `EnvironmentVariables.LABS_REPO` | `/Users/ernie/Fattail-Labs-mexp2` | **YES** |

Quoted:

```
$ plutil -extract ProgramArguments xml1 -o - ~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist
<array>
<string>/bin/zsh</string>
<string>/Users/ernie/Fattail-Labs/scripts/ssr-live-capture-run.sh</string>
</array>

$ plutil -extract WorkingDirectory raw …
/Users/ernie/Fattail-Labs/server

$ plutil -extract EnvironmentVariables.LABS_REPO raw …
/Users/ernie/Fattail-Labs-mexp2
```

`launchctl print user/503/ai.fattail.labs.ssr-live-capture` (excerpt):

```
state = running
program = /bin/zsh
arguments = { /bin/zsh /Users/ernie/Fattail-Labs/scripts/ssr-live-capture-run.sh }
working directory = /Users/ernie/Fattail-Labs/server
environment = {
  LABS_REPO => /Users/ernie/Fattail-Labs-mexp2
  LABS_SSR_MAX_DTE => 5
  …
}
pid = 42355
runs = 1
last exit code = (never exited)
```

Wrapper (both trees, same text) cds via `LABS_REPO`:

```
ROOT="${LABS_REPO:-/Users/ernie/Fattail-Labs}"
…
cd "$ROOT/server"
```

So **this** process cwd is mexp2 **because env is set**. A kickstart/load **without** that env still execs the **Fattail-Labs** wrapper and defaults `ROOT` to `Fattail-Labs` — Friday miss #1.

**Finding for Coach (do not repair in RTH):** after close / F1, point `ProgramArguments` and `WorkingDirectory` at **mexp2** as well, or F1’s parallel label must not inherit this split. Live pid 42355 must not be edited in place.

---

## 4. `LABS_SSR_MAX_DTE` in plist env

**Present.**

```
$ plutil -extract EnvironmentVariables.LABS_SSR_MAX_DTE raw ~/Library/LaunchAgents/ai.fattail.labs.ssr-live-capture.plist
5
```

Also in plist: `LABS_SSR_MEXP=on`, `LABS_SSR_MEXP_MAX_DTE=5`.

Live pid 42355 env (`ps eww`):

```
LABS_SSR_MEXP=on
LABS_SSR_MAX_DTE=5
LABS_REPO=/Users/ernie/Fattail-Labs-mexp2
PWD=/Users/ernie/Fattail-Labs-mexp2/server
LABS_MARKET_DATA_ROOT=/Volumes/FatTail2TB/fattail-market-data
```

**Not** in either tree `.env` (only `LABS_SSR_CHAIN_EVERY_S=2` and `LABS_SSR_WINGS=15`). MAX_DTE lives in **plist env only**.

Err log last write is **historical**, not this process:

```
ssr-live-capture.err.log  mtime=Sep 25 16:26:13 2026
ssr-live-capture.out.log  mtime=Sep 28 15:01:18 2026   (still writing)
```

Err tail still shows Friday’s `RuntimeError: LABS_SSR_MAX_DTE is missing` — frozen at 16:26, **before** 16:29:09 start. Current process has the key.

---

## 5. Live `python -m market_data.ssr_live_capture` — still Friday pid 42355?

**Yes. Same process.**

```
$ ps -p 42355 -o pid,lstart,etime,stat,command
  PID STARTED                          ELAPSED STAT COMMAND
42355 Fri Sep 25 16:29:09 2026     02-22:32:58 S    …/Python -m market_data.ssr_live_capture

$ lsof -a -p 42355 -d cwd
Python  42355 ernie  cwd    DIR  …  /Users/ernie/Fattail-Labs-mexp2/server

$ pgrep -lf "market_data.ssr_live_capture"
42355 …/Python -m market_data.ssr_live_capture
```

launchd: `pid = 42355`, `runs = 1`, `last exit code = (never exited)`.

mexp2 HEAD (read): `a91302a23b59` `feat(ssr): weekday 20:00 ET sleep finalizes the day's books (DL-794)…`

**One writer.** No second `ssr_live_capture` / `ssr_mexp_capture` python.

Tap is capturing this RTH (Monday) from that same pid — SPX/XSP snaps mtime 15:01 on `day=2026-09-28`. Out log is `mexp_chain_miss` noise on far-expiry topics; not a down process.

---

## 6. `chain_feed` (do not restart)

**Present. Untouched.**

```
$ ps -p 538 -o pid,lstart,etime,stat,command
  PID STARTED                          ELAPSED STAT COMMAND
  538 Tue Sep 15 07:29:39 2026     13-07:32:28 S    …/Python -m market_data.chain_feed --interval 2

$ lsof -a -p 538 -d cwd
Python  538 ernie  cwd    DIR  …  /Users/ernie/Fattail-Labs/server
```

Env: `PWD=/Users/ernie/Fattail-Labs/server` (not mexp2). `LABS_MARKET_BUS=1`. No `LABS_REPO` on this process.

`sym_feed` also present (not asked, not touched): pid **82012**, lstart **Wed Sep 16 20:36:53 2026**, `--interval 5`.

---

## Scoreboard

| Check | Result |
|-------|--------|
| 1. Redis `:6379` ping | **PONG** (`/opt/homebrew/bin/redis-cli`; pid 39817 since Fri 11:01) |
| 2. FatTail2TB mounted + writable path | **YES** (`/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`, `test -w` YES) |
| 3. Plist ProgramArguments + WorkingDirectory + LABS_REPO all mexp2 | **NO** — only `LABS_REPO` is mexp2; script + WD are `Fattail-Labs` |
| 4. `LABS_SSR_MAX_DTE` in plist env | **YES** (`5`); also on pid 42355; **not** in `.env` |
| 5. Live tap still Friday pid 42355 @ 16:29 | **YES** — cwd mexp2/server; writing today |
| 6. `chain_feed` pid | **538** since Tue Sep 15 07:29; cwd `Fattail-Labs/server`; not restarted |

---

## Findings (Coach) — no action until after close / F1

1. **Split plist is still the Friday-miss trap.** Env saved this run; `ProgramArguments` + `WorkingDirectory` did not move to mexp2. Do not kickstart during RTH.
2. **`LABS_SSR_MAX_DTE` is plist-only.** A start that drops EnvironmentVariables still dies with the 16:26 RuntimeError.
3. **Live writer is the long-lived Friday process**, not a Monday 04:00 respawn. It is capturing today. Swap/parallel (F1/F2) must not kill **42355** during RTH.
4. **`chain_feed` 538** is 13+ days on the **Fattail-Labs** tree. CP-1: leave it. Parallel tap must not steal it.
5. **`.env` still has `LABS_SSR_WINGS=15`** in both trees (spec retires the count model; not F0 repair).

F1 (parallel launchd, different archive root, mexp2-only label) is the repair seat. This seed is health only.

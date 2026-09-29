# Runner 500 diagnostic v0.1

**Diagnostic v0.1.** Read-only. Nothing in production was changed.
Date: 2026-09-28, 23:06 ET.
**Host serving `labs.fattail.ai`:** MiniTwo (`MiniTwo.local`). Public `GET /api/health` returned `env=production` and git sha `70453700a3225ea5f4920f8f44000f6cdda3cb71`. The same sha and the same health body are on MiniTwo localhost:4000. DudeTwo (`DudeTwo.local`) is on sha `03d26fdd` and its port 4000 is not listening. `labs-stage.fattail.ai` does not resolve. MiniThree (edge nginx) did not accept SSH from StudioTwo (timed out at `100.94.9.60`), so the edge access log was not read. The inventory below is the origin logs.

Code read on StudioTwo from `refs/remotes/minitwo/prod-2026-09-24`, which is that sha. Commit subject: `fix(help): dark-mode text invisible in Help widget inputs`, 2026-09-24 12:32 ET. MiniTwo `main` is that commit. The running processes were not rebuilt from the StudioTwo working tree.

**Hotfix: NO-GO.** Do not apply one tonight. The packet is described at the end and waits for Coach, after the close.

---

## Root cause

The words "Internal Server Error" are written by Next.js 16.2.10 when its same-origin proxy cannot finish a connection to the Labs API on `127.0.0.1:4000`. The function sets status 500 and the body `Internal Server Error` (`web/node_modules/next/dist/server/lib/router-utils/proxy-request.js` lines 73–82 at this Next version, which `web/package.json` pins to 16.2.10). From 11:26 ET to 19:06 ET on 2026-09-28 that log line was written 111,061 times. 85,309 of the targets were `GET /api/me/market/chain-ladder`. 95,660 were `connect ETIMEDOUT` to port 4000, while the API process that had started at 11:26:52 ET was still the process answering other requests. The API itself almost never returned HTTP 500 for that route (41 clocked responses in the last seven days). Members hit a proxy that had given up on connecting, not a Python traceback on the ladder handler.

---

## What was serving

| Process | Pid | Started (ET) | Command |
|---|---|---|---|
| API | 77873 | Mon Sep 28 11:26:52 | `uvicorn main:app --host 127.0.0.1 --port 4000` (one process, no `--workers`) |
| Web | 77878 / next 77905 | Mon Sep 28 11:26:59 | `next start` on port 4001, Next 16.2.10 |

MiniTwo last booted Tue Jul 21 09:02 ET (`kern.boottime`). No new commit was checked out at 11:26. No crash report under `~/Library/Logs/DiagnosticReports`. Launchd `runs` is 10 for the API job and 14 for the web job. The reason for that paired start is not in the logs that were read.

`web.log` begins with this process's `next start` banner, so it is this process's lifetime only. Its last write is Sep 28 19:06:27 ET. `api.log` is append-only, 7.5 GB, 51,510,327 lines, and has no timestamp on access lines. Days below are taken from the last `[ohlc_feed] … from 2026-…T…` stamp seen before the access line. Sep 26 and Sep 27 produced no such stamp, so a quiet gap stays on the previous stamp. Requests before the first in-window stamp are omitted from the day table (15.9 million historical chain-ladder 200s sit in that prefix).

The web log has no per-request clock and neither log records duration. Response time is not available. The 500 log has no member id and no role. Role below is from `page_views` joined to the member's latest `login_events.role` at or before the view. MySQL `NOW()` is Eastern (`SYSTEM`); `UTC_TIMESTAMP()` was four hours ahead.

---

## 1. The 500s

Next rewrite: every browser `/api/*` except Next's own handlers is proxied to `NEXT_PUBLIC_LABS_API_URL` (`web/next.config.ts` lines 13–17). On proxy error the log line is `Failed to proxy <url>`.

This web process, Sep 28 11:26–19:06 ET:

| Proxy error | Count |
|---|---|
| `connect ETIMEDOUT` 127.0.0.1:4000 | 95,660 |
| `socket hang up` | 11,614 |
| `connect ECONNREFUSED` | 3,049 |
| `ECONNRESET` | 738 |
| **Total `Failed to proxy`** | **111,061** |

The 2,624 `/api/me/market/stream` lines are the WebSocket. The same function does not set status 500 when the response is a duplex. The other **108,437** lines are ordinary HTTP and take status 500 with body `Internal Server Error`.

Targets, path only:

| Count | Path |
|---|---|
| 85,309 | `/api/me/market/chain-ladder` |
| 6,867 | `/api/me/market/session-status` |
| 6,348 | `/api/help/unread-count` |
| 2,624 | `/api/me/market/stream` |
| 1,895 | `/api/presence` |
| 1,782 | `/api/me/market/ohlc` |
| 724 | `/api/auth/me` |
| 516 | `/api/me/pricing/package-quote` |
| 289 | `/api/me/market/chain-ladder/expirations` |
| 98 | `/api/me/options-lab/archive/coverage` |

Chain-ladder parameters on those 85,309 lines. The route has no `template` argument. Template is chosen in the browser after the ladder arrives.

| Symbol | Count | Wings | Count | Side | Count |
|---|---|---|---|---|---|
| SPX | 82,068 | 50 | 31,438 | call | 85,250 |
| SPY | 1,980 | 100 | 23,505 | put | 59 |
| XSP | 1,246 | 25 | 15,898 | | |
| GLD | 10 | 10 | 14,468 | | |

Expirations on those failures, top of the list: 2026-09-28 (14,884), 2026-09-29 (11,461), 2026-09-30 (7,914), 2026-10-01 (7,874), 2026-10-02 (7,836), 2026-09-25 (7,793). Many failures carry `since_hash`, which is the diff poll.

Failures are spread through the file (about 13,000 in each 200,000-line slice, 4,184 in the last partial slice). They are not one spike at the 11:26 start.

### API status for the same route

`api.log`, clocked from the ohlc feed stamp, `GET /api/me/market/chain-ladder`:

| Day (ET, via feed stamp) | 200 | 502 | 500 | 401 |
|---|---|---|---|---|
| Sep 21 | 1,551,916 | 125,641 | 2 | 58,009 |
| Sep 22 | 1,905,893 | 81,062 | 2 | 89,981 |
| Sep 23 | 3,388,052 | 53,419 | 16 | 4,981,363 |
| Sep 24 | 2,139,802 | 125,730 | 0 | 1,588,682 |
| Sep 25 | 2,109,407 | 260,676 | 3 | 4,659 |
| Sep 28 | 1,660,672 | 369,320 | 18 | 4 |

Clocked chain-ladder HTTP 500s: **41**. Clocked HTTP 502s: **1,015,848**. A 502 is FastAPI's answer and is proxied onward as 502 when Next is connected. It is a different screen from the 500 body.

The handler raises 502, not an uncaught 500, on the Massive failure and the empty book (`server/routes/chain_ladder.py` lines 320, 330, 353, and 454 at sha `70453700`). The access log does not record which of those branches fired, and `HTTPException` does not leave a traceback. There is no stack for those 1,015,848 lines.

Unhandled HTTP 500s with stacks in the whole file are a separate, smaller set (1,446 access lines of status 500, all causes, all history in the file). The ones tied to a real clock inside the window and saved with a stack are below.

---

## 2. Correlation

**Deploys.** MiniTwo commits since Sep 21, newest first: `70453700` Sep 24 12:32 (the running sha), `080f86eb` Sep 24 12:16, `1d76df62` and `1a0ba7a7` Sep 23 21:15, plus heatmap and trade-log commits on Sep 23 and Sep 22. No commit on Sep 25, 26, 27, or 28. The 11:26 ET restart on Sep 28 is not a deploy of a new sha.

**Collector 0–5 DTE on Sep 25, and the `exp=*/` archive layout.** The live Runner poll does not call the OPF API. At this sha, `GET /api/me/market/chain-ladder` fills from Redis when the market bus is on, otherwise from Massive inside the API process (`_fetch_ladder` / `_fetch_ladder_uncached` in `server/routes/chain_ladder.py`). The running API environment has no `LABS_MARKET_BUS` and no `LABS_SSR_ARCHIVE_URL`. `:5055` appears in this tree as the StudioOne chain-snapshot pane and as the archive base URL for the archive proxy, not as the heatmap poll. Today's proxy log shows 98 failures for `/api/me/options-lab/archive/coverage` against 85,309 for chain-ladder. The Monday archive gaps are not the requests that became these 500s. No `:5055` latency was measured for them, because this path does not send them there.

**Monday's slow capture session.** Same calendar day as the proxy storm. The storm is Next on MiniTwo failing to connect to MiniTwo's own API. It lines up in time with that session and does not share its process.

**File descriptors and sockets.** At 23:02 ET, after the error log had stopped, API pid 77873 had 74 open files and 16 internet sockets, RSS about 293 MB, CPU 0.3%, load average 1.35. That is not a socket-cap lockup at the time it was sampled. There is no sample from 11:26–19:06. The historical evidence is in `api.log`: `OSError: [Errno 24] Too many open files` raised in `asyncio/selector_events.py` `_accept_connection` → `socket.accept`. Clocked counts: Sep 21: 224, Sep 23: 132, Sep 24: 357, Sep 25: 16, Sep 28: 31. That is the accept-path failure Dude One hit on Sep 7. `web.log` contains zero of those lines. Thirty-one accept failures on Sep 28 do not add up to 95,660 connect timeouts. Both happened. The timeout count is the one that matches the member-facing 500.

**Other load on the same route.** Sep 23 records 4,981,363 chain-ladder **401** responses (the request reached the API and was rejected as unsigned). Sep 24 records another 1,588,682. Those are not 500s. They are extra accepts on the same single process on the days the accept path also ran out of files.

---

## 3. Reproduction (StudioTwo, production not called)

Same Next 16.2.10 `proxyRequest`, same query `expiration=2026-09-29&symbol=SPX&side=call&wings=50`, upstream `127.0.0.1:9` with nothing listening:

```
Failed to proxy http://127.0.0.1:9/api/me/market/chain-ladder Error: connect ECONNREFUSED 127.0.0.1:9
proxy_error ECONNREFUSED status 500
client_status 500
body Internal Server Error
```

That is the production log line and the production status. `ECONNREFUSED` is 3,049 of today's production lines. `ETIMEDOUT` is the same `proxy.on('error')` branch; it was not re-created here because a black-hole connect would sit until the TCP timer.

The same query against the already-running StudioTwo dev server, `http://127.0.0.1:3000/api/me/market/chain-ladder?expiration=2026-09-29&symbol=SPX&side=call&wings=50`, returned **401** `{"detail":"Sign in required"}` from uvicorn. The proxy reached an API and did not return 500. That dev server is this checkout's working tree, not sha `70453700`. It was used only as a live proxy target. No production request was sent.

---

## Ranked causes

1. **Next proxy 500.** Explains the 108,437 HTTP 500s in today's web log, 85,309 of them on the Runner chain-ladder poll. Evidence: the log counts above, and the reproduction. Missing for Sep 21–27 because that web log was replaced when Next started at 11:26 ET today.
2. **API chain-ladder 502.** Explains 1,015,848 clocked responses over Sep 21–25 and Sep 28, including 369,320 on Sep 28. Different status. The branch is in `chain_ladder.py` lines 320, 330, 353, and 454. The log does not say which branch.
3. **`socket.accept` out of files.** Explains 760 clocked `Errno 24` lines on the accept path (31 of them today). Same shape as Dude One. It is a real accept failure and it is too small to be the whole of today's timeout count.

The handler's own HTTP 500 (41 clocked chain-ladder responses) does not explain the reports.

---

## Hotfix — NO-GO

Do not restart MiniTwo and do not edit a plist tonight.

The smallest change the accept-path stack supports is a file-descriptor limit on the API job, so `socket.accept` is not the call that raises `Errno 24`. It would touch `~/Library/LaunchAgents/ai.fattail.labs.api.plist` on MiniTwo and would restart that one job, after the close. It would not touch the web job, the Runner page, chain-ladder's response, the collector, or StudioOne.

That change does not account for 95,660 connect timeouts or for 369,320 chain-ladder 502s on Sep 28. Those two remain open. They are not a one-line hotfix, and this diagnostic does not pretend a worker count or a Massive retry would remove them. A packet for either one waits on Coach, after the close, with its own gate.

**GO / NO-GO:** diagnostic is complete and production is unchanged. **NO-GO** on a hotfix.

---

## Logging gaps that bound this inventory

- Access lines in `api.log` have no time and no duration. Days are inferred from the ohlc feed stamp.
- `web.log` has no time except the process start (ps) and the file's last write (19:06:27 ET).
- Neither log stores a member id. Role is from page views, which record that the Runner route was opened, not that a 500 was returned.
- `HTTPException` 502s have no stack.
- The edge nginx log on MiniThree was not reachable.

Page views of `/app/options-lab/heatmap` (role at login, identities are counts):

| Day | navigator views (identities) | activator | administrator |
|---|---|---|---|
| Sep 21 | 342 (45) | 46 (9) | 6 (1) |
| Sep 22 | 295 (43) | 44 (6) | 2 (1) |
| Sep 23 | 305 (48) | 74 (13) | 6 (1) |
| Sep 24 | 254 (46) | 73 (11) | 4 (1) |
| Sep 25 | 204 (44) | 52 (9) | 4 (1) |
| Sep 26 | 63 (13) | 1 (1) | 0 |
| Sep 27 | 49 (14) | 6 (2) | 3 (1) |
| Sep 28 | 290 (53) | 23 (9) | 14 (2) |

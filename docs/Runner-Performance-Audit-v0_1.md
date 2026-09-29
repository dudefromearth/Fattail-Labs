# Runner performance audit v0.1

**Audit v0.1.** Read-only. Nothing in this audit is built. Production was not changed.
Date: 2026-09-28, after the diagnostic.
**Host:** MiniTwo, sha `70453700a3225ea5f4920f8f44000f6cdda3cb71`. Code citations are that sha unless a path is named as a log or a build artifact on MiniTwo.
**Phase 1:** `docs/Runner-500-Diagnostic-v0_1.md`. Its hotfix decision is **NO-GO**. This audit started because that diagnostic is complete and production stayed untouched.

The live Runner page is `/app/options-lab` → `/app/options-lab/heatmap` (`web/app/app/options-lab/page.tsx` line 7). The grid is `HeatmapChainPanel`, which reads `useOptionChainBus` (`HeatmapChainPanel.tsx` lines 695–700).

---

## Bugs

### 1. A slow or refused connection to the API becomes HTTP 500 on the Runner poll

Next's proxy sets status 500 and the body `Internal Server Error` when the upstream connection fails (`web/node_modules/next/dist/server/lib/router-utils/proxy-request.js` lines 73–82, Next 16.2.10). Today's web log recorded 108,437 of those on HTTP routes, 85,309 of them `GET /api/me/market/chain-ladder`. The failure they cause is the internal server error members see. Detail, counts, and the StudioTwo reproduction are in the diagnostic. This audit does not restate them as a second root cause.

The handler underneath is a synchronous `def get_chain_ladder` (`server/routes/chain_ladder.py` lines 495–496) on one uvicorn process with no `--workers` (pid 77873, started 11:26 ET). The Massive client blocks that thread on `urllib.request.urlopen` with `timeout_s` default 60 (`server/market_data/massive_client.py` lines 38 and 68). Next's proxy timeout is 30 seconds (`proxy-request.js` line 33). A fill that is still inside the 60-second urlopen is a client the proxy has already given up on. The log split today is 95,660 `ETIMEDOUT` and 11,614 `socket hang up`. The hang-up count matches a proxy that connected and then gave up. The timeout count is larger, and the diagnostic does not claim the 60-second urlopen produced all of it.

### 2. During regular hours, about one chain-ladder response in five is HTTP 502

The access log has no clock of its own. Hours below are the `from` timestamp on the preceding `[ohlc_feed]` line, which is UTC. 13:00 UTC is 09:00 ET. The stamp was still `2026-09-28T19:35:00Z` at 23:00 ET, so hour 19 holds everything after the stamp stopped advancing.

| Stamp hour (UTC) | ET | 200 | 502 | 502 share |
|---|---|---|---|---|
| 13 | 09 | 207,873 | 54,084 | 21% |
| 14 | 10 | 257,835 | 69,257 | 21% |
| 15 | 11 | 278,965 | 78,181 | 22% |
| 16 | 12 | 286,020 | 70,466 | 20% |
| 17 | 13 | 254,894 | 45,005 | 15% |
| 18 | 14 | 164,906 | 32,930 | 17% |
| 19 | 15 and after | 244,065 | 20,316 | 8% |

The failure is a ladder that does not paint a book. The handler raises 502, and does not leave a traceback, on a Massive error (`chain_ladder.py` lines 320 and 454), on an empty book (line 330), and on a wing-window error (line 353). The log does not say which branch fired. Expired expirations are in the client's failure list (diagnostic), and an empty book is one of the four branches. The share above is from hours when the feed stamp was moving, so this is not only the after-close empty book.

### 3. `socket.accept` runs out of files on the only API process

`OSError: [Errno 24] Too many open files` in `asyncio/selector_events.py` `_accept_connection`. Clocked counts: Sep 21: 224, Sep 23: 132, Sep 24: 357, Sep 25: 16, Sep 28: 31. The failure is a connection the process does not accept, which the proxy then reports as the 500 in bug 1. Thirty-one lines today do not add up to 95,660 timeouts. At 23:02 ET the same process had 74 open files and 16 sockets. There is no sample from the hours the timeouts were logged.

---

## What the live page fetches, and what Tuesday's full book changes

With the market bus unset on the running API, a cache miss calls Massive. The in-process cache lives 1.5 seconds (`chain_ladder.py` line 63, checked at line 433). Each miss also opens a database transaction to read the symbol row (`with db.transaction()` at line 268) and then calls Massive twice: a spot probe (line 288) and the chain page (`max_pages=3` at line 310). Those calls are serial, on the request thread.

The member can ask for wings 100. The server stores at most 50 (`_MAX_DUAL_WINGS = 50`, line 76) and at most 3 pages (`max_pages=3` at line 310). The comment on line 76 sizes that at about 202 contracts. Today's proxy failures included 23,505 requests with `wings=100`. They are clamped before the fill. The live grid does not receive the full listed book.

`useOptionChainBus` does not poll on a timer. It hydrates on mount (line 385), retries once after 2 seconds if the grid is still empty (lines 386–391), and refreshes on tab-visible or bfcache with an 8-second throttle (`pokeLive`, lines 251–254 and 393–401). The stream is the steady path. `since_hash` on the refresh is the diff (`refreshOnce`, lines 218–226).

Term Mass is on in the production build: `web/.env.production` contains `NEXT_PUBLIC_LABS_HEATMAP_TERM_MASS=1`, and `termMassFlagOn` is that exact check (`web/lib/options-lab/templates/gexCal.ts` lines 68–70). When the selected template's layout is `matrix-profile`, the panel loads up to 7 expirations (`TERM_MASS_EXPIRY_COUNT = 7`, `HeatmapChainPanel.tsx` line 176) and `useGexCalPack` requests them one after another (`for (const exp of list)` with `await pollChainLadder`, `useGexCalPack.ts` lines 105–114). Seven serial ladder fills, each able to block for the Massive timeout, before that template's grid is full. Other templates do not take that loop (`termMassOn` at `HeatmapChainPanel.tsx` lines 703–711).

The heatmap also mounts `useChainAtPlayhead` (`HeatmapChainPanel.tsx` line 934). While replay is off it returns the live context and does not fetch (`tmChainAtT.ts` line 274). When replay is on and the projector is the archive, `fetchChainAtT` requests up to nine archive levels in series (lines 196–204, `level` from 0 through 8) and `snapToChainContext` walks every row in the snap (lines 73–76).

**Tuesday's full-book archive, stated directly.** The live chain-ladder response stays the clamped window, about 202 contracts, because that cap is in the API and the Tuesday swap does not change it. A replay of an archive day walks every row of the snap. The SPX 2026-09-30 book measured after the close is 1,198 contracts, about six times that window. Coach's planning range for the swap is 5–10 times the rows on SPX and XSP snaps. That multiplier lands on `snapToChainContext` and on any other reader of those snaps. It does not land on the live poll that produced today's 500s.

---

## Client

The production build directory `web/.next` is 67 MB (Sep 24 12:31–12:32). The heatmap route's server HTML is 41 KB and its server `page.js` is 1.0 KB. The shared chunks named in that route's `build-manifest.json` `rootMainFiles`, plus the polyfill, total about 555 KB (6.4, 31, 221, 134, 43, 10, and 110 KB). A second read did not recover a page-specific client chunk name, so this is the shared shell, not a measured cost of painting the tile grid. No browser trace was taken. Render time of the grid is not in any log.

Changing symbol, expiration, side, or wings changes the bus key (`useOptionChainBus.ts` line 83, `chain:${symbol}:${expiration}:w${wings}`) and runs bootstrap hydrate again (the effect ending at line 406). That is one HTTP ladder, not a timer. Term Mass, when that template is selected, adds the seven serial ladders above, and repeats them when symbol or wings change (the effect depends on those values).

---

## Ops and instrumentation

The diagnostic's logging gaps are the ops finding, with the evidence from trying to use the logs:

- `api.log` access lines have no time and no duration, so the 502 table above is hung on the ohlc feed stamp.
- `web.log` has no time except process start and the file's mtime (19:06:27 ET). It was replaced when Next started at 11:26 ET, so Sep 21–27 proxy 500s are not on disk.
- `HTTPException` 502s have no branch and no stack.
- MiniThree's edge log was not reachable.
- No fd or socket sample exists for 11:26–19:06 ET.

`page_views` records `identity_id` and `path` (`migrations/039_user_activity.sql` lines 28–38). `record_pageview` stores that path and nothing else (`server/activity.py` lines 76–91). The diagnostic's role table is the latest login role joined to views of `/app/options-lab/heatmap`. There is no symbol, no template, no status, and no duration. Labs' member instrumentation does not show Runner slowness by member, symbol, or template. It shows who opened the page.

---

## Opportunities

Ranked after the bugs. Gains that were not measured are marked as estimates.

1. **Know which 502 branch it is.** One log field on the four `raise HTTPException(status_code=502)` sites. Estimated gain: the next session's 502s (369,320 on Sep 28, about 15–22% through the midday hours) become a count per branch instead of one number. No change to the status the member sees.
2. **Put time and duration on the access line.** Estimated gain: the next 500 can be placed on a clock and next to the fill that was in flight. The diagnostic could not do that for the 108,437 proxy 500s.
3. **Term Mass's seven ladders overlap, with a cap, instead of awaiting in order.** Estimated gain: that template's fill time approaches the slowest of the seven books instead of the sum. Not timed on a member session. The live single-book poll is a different path and is not part of this estimate.
4. **A timing row for the chain-ladder poll:** duration, symbol, expiration, template id, HTTP status. No name. Estimated gain: the question "who was slow, on which symbol and template" becomes answerable. Today it is not.

An extra uvicorn worker is not proposed. The duration log has to show the single process waiting before a worker change is a measured fix. The file-descriptor limit from the diagnostic remains the only plist change the accept stack supports, and it remains **NO-GO** until Coach accepts it after the close. It does not clear the 502s.

---

## Packets, for Coach to approve one at a time

Nothing here is authorized to start.

| Packet | Scope | Does not touch | Evidence gate |
|---|---|---|---|
| P1. 502 branch log | The four 502 raises in `server/routes/chain_ladder.py` (lines 320, 330, 353, 454). Log the branch name. Status stays 502. | Runner UI, Massive calls, collector, StudioOne, web plist | One regular-hours hour on MiniTwo where the log counts the four branches and they add up to that hour's 502 access lines |
| P2. Access line | Uvicorn access format, or one middleware, adding time, duration, status, and path. No body, no member name. | Response JSON, Runner controls, the collector | A line from a real chain-ladder request shows those four fields |
| P3. Poll timing row | One client record per chain-ladder poll: duration, symbol, expiration, template id, status. Stored without a name. | The ladder payload, archive snaps, the collector | A day grouped by symbol and template, with a count and a duration |
| P4. Term Mass overlap | `useGexCalPack.ts` lines 105–114 only, and only when `termMassOn` is true. Cap the in-flight ladders. | The single-book `useOptionChainBus` poll, wings clamp, archive reader | A test where seven expirations are in flight together and the component still ends with seven books |
| P5. API file-descriptor limit | `ai.fattail.labs.api` plist on MiniTwo, after the close, one restart of that job. | Web job, Runner page, chain-ladder code, collector, StudioOne | The next session's log has zero `Errno 24` on `socket.accept`, and one RTH sample of that process's open-file count is written down |

P5 is the hotfix the diagnostic declined to apply tonight. P1 comes before any attempt to "fix" the 502, because the branch is not known. Tuesday's full-book swap is not a packet: the live ladder cap stays, and the archive walk in `tmChainAtT.ts` lines 73–76 is the place a later change has to budget for the larger snap.

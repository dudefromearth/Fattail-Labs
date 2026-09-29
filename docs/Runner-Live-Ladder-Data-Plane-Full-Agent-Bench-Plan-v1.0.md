# Runner live ladder — full agent bench plan v1.0

**Plan v1.0.** The plan of spec v0.1 only: `docs/Runner-Live-Ladder-Data-Plane-v0_1.md`.
**Status: PLAN.** Not a GO. No packet below is dispatched by this file. Coach accepts the plan, then W0 runs. P1, P2, P3, and P5 were approved by Coach on 2026-09-28 as instrumentation and are dated below. They are not a license to edit the ladder fill, the plist, or production before the close they name.
**Inventory:** `docs/Massive-Call-Site-Inventory-v0_1.md`. GO there is Runner ladder only. The whole market-data path is NO-GO for this plan.
**Machine:** StudioTwo writes and tests. MiniTwo is production (`labs.fattail.ai`, sha `70453700` until a later deploy). StudioOne is the data plane, reached only as the spec says. CP-1 on every StudioOne packet.

This plan does not revise diagnostic v0.1, audit v0.1, OPF spec v0.3, or OPF plans v1.1, v1.2, or v1.3. It does not commit `ssr_fullbook.py`. It does not restart capture, `chain_feed`, or the band tap.

---

## Decision the plan executes

MiniTwo's Runner handlers stop calling Massive. They read the ladder the StudioOne feed already writes, through `GET /api/ladder` on the process at `:5055` (`ssr_snapshot_dash.py`). The browser JSON does not gain a key. Wings effective stays 50. A missing hot key returns the last document with the existing `stale` field set true. A missing document returns the existing 502 and does not urlopen Massive. The hop timeout is 2 seconds.

Direct Redis from MiniTwo to StudioOne is not the reach path. The spec §2 states why. A one-line override from Coach ("use the bus") replaces §2 before W2. Silence is not that override.

---

## Schedule

| When | What | Restart |
|---|---|---|
| This file | Record only | None |
| After Coach accepts | W0 India, read-only, StudioTwo | None |
| Tuesday 2026-09-29 after 16:00 ET | P5, and P1, and P2, on MiniTwo | **One** restart of `ai.fattail.labs.api`. P3 is the web job in the same window, a different launchd label |
| After W0-G, and after P2 is on the production process | W1 tests on StudioTwo, then W2 code in the repo | None on MiniTwo or StudioOne during RTH |
| A close after W2, not Tuesday | W3 loads the `:5055` route and turns the allow-list on for the canary identities | StudioOne: the `:5055` process only, after the close. MiniTwo: one API restart to load the hop behind the allow-list. Not the Tuesday restart |
| A later close, after the canary hour is in the P2 log | W4 production cut | One MiniTwo API restart. Massive is then unreachable from the two Runner handlers |
| After W4 | P4 | Web only. `useGexCalPack.ts` lines 105–114. No API restart required for P4 alone |

Tuesday's one API restart is P5 plus P1 plus P2 so Wednesday's session can show the file-descriptor gate and the 502 branch counts and the duration line together. Those three do not change the fill, the JSON, or the Massive call. If Tuesday's restart is to be the plist alone, Coach says so before 16:00 ET Tuesday. The default in this plan is the one restart that makes Wednesday readable. The data-plane code is not in it.

P4 is last because it changes the order Term Mass fills seven books. The canary's duration log is measured before that order changes.

---

## P5, P1, P2, P3 — approved, dated, not started

Evidence gates are the audit's, copied here so this plan does not depend on memory.

**P5.** Foxtrot. MiniTwo. After Tuesday 2026-09-29 16:00 ET. File-descriptor limit on `~/Library/LaunchAgents/ai.fattail.labs.api.plist`. One `launchctl` kickstart of `ai.fattail.labs.api`. Does not touch the web job, the Runner page, chain-ladder code, the collector, or StudioOne. Extra workers are not part of it.
Gate: the next session's log has zero `Errno 24` on `socket.accept`, and one RTH sample of that process's open-file count is written down.

**P1.** Alpha. Same restart as P5, unless Coach split them. Log the branch name at the four `HTTPException(status_code=502)` sites in `server/routes/chain_ladder.py` (lines 320, 330, 353, 454 at sha `70453700`). Status stays 502.
Gate: one regular-hours hour on MiniTwo where the four branch counts add up to that hour's 502 access lines.

**P2.** Alpha. Same restart. Access line carries time, duration, status, and path. No body. No member name.
Gate: a line from a real chain-ladder request shows those four fields. Later canary measurement uses this line.

**P3.** Charlie. Web job, same window, label `ai.fattail.labs.web`. One client record per chain-ladder poll: duration, symbol, expiration, template id, status. Stored without a name. Does not change the ladder payload.
Gate: a day grouped by symbol and template, with a count and a duration.

---

## After accept

### W0 — India

StudioTwo. Read-only. Spec v0.1 against SODP-1, SODP-2, SODP-3, SODP-4, SODP-11, Arch 28, Arch 30's `not_configured` line, and the inventory. Confirm the reach path is the `:5055` route, the hot-key TTL fact (default 6 seconds), the browser keys in spec §4, and the wings cap. Confirm this plan does not hop OHLC, session-status, marks, correlation, trade-chart, or algo-replay.
Gate: MATCH or FAIL, written. FAIL stops W1. India does not edit the spec. A miss is a new version.

### W1 — Kilo

StudioTwo. Tests only, against the repo, not against MiniTwo. No production process.

- Hot document returns through the handler with the existing keys, and `stale` follows provenance.
- Hot key absent, last document present: response is that document, `stale` is true, `content_hash` unchanged, and `MassiveClient` was not constructed.
- Neither document: HTTP 502 with `No option contracts returned for {product} {expiration}`, and `MassiveClient` was not constructed. Elapsed time is inside the 2-second hop budget, not the 60-second client timeout.
- `wings=100` touches `w50` and returns `wings_requested=100`, `wings_effective=50`.
- `get_chain_ladder` and `list_chain_ladder_expirations` do not call `_fetch_ladder_uncached` or `_scan_expirations_live`.
- `chain_feed`'s call to `_fetch_ladder_uncached` still resolves.

Gate: those tests pass in StudioTwo's `server/.venv`.

### W2 — Alpha

StudioTwo repo, after W1's tests exist. Not loaded on StudioOne during RTH. Not deployed to MiniTwo.

- `:5055` route as spec §2. Redis read, shadow key, interest touch, no Massive import on that route.
- Member handler hop as spec §3. Allow-list unset means today's fill, so a deploy with the env unset does not change members.
- Expirations handler does not call `_scan_expirations_live`.
- Fail loud when the allow-list is non-empty and `LABS_SSR_ARCHIVE_URL` is missing.

Mike reads the hop: bearer from the existing archive token, member cookie not forwarded, StudioOne URL not in the browser response. That read is part of W2-G, not a separate build.

### W3 — Foxtrot, canary

After a close. Not Tuesday 2026-09-29.

**CP-1, verbatim (DL-707).** The chain-snapshot collection on StudioOne (`chain_feed` and its supporting jobs) is never disrupted. If any step could disrupt it — including indirectly via shared Massive account connection or rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is redesigned or held until after 16:00 ET. Every StudioOne packet carries this, states its footprint, records `chain_feed` status and last-snapshot freshness before and after, and has one rollback line. A degraded `chain_feed` after the step is a FAIL, and the rollback runs.

Footprint of this step: the `:5055` process gains a Redis GET and, on a hot hit, a SET of `mb:ladder-last:…`. Zero new Massive connections. No `chain_feed` plist edit. No new port. Disk is one Redis value per live ladder key.
Before and after: `chain_feed` pid, and the age of one live `mb:ladder:` key it writes.
Rollback: remove the new route from the `:5055` process and kickstart that process only. Do not kickstart `chain_feed`.

Then MiniTwo, one API restart, `LABS_LADDER_HOP_IDENTITIES` set to the identities Coach names before the close. Everyone else stays on the current fill. `LABS_SSR_ARCHIVE_URL` points at StudioOne `:5055` over Tailscale. The token is the existing archive token.

Gate: one regular-hours hour of P2 lines for the canary identities, durations inside 2 seconds, and the same hour for a non-canary request still on the previous path. `chain_feed` before and after, undegraded. No member name in the report.

### W4 — Delta, production cut

A later close. The allow-list and the Massive branches reachable from the two Runner handlers are deleted. One MiniTwo API restart. Non-canary members take the hop from that restart. There is no UI default to flip.

Gate: `git grep` of the deployed tree shows `get_chain_ladder` and `list_chain_ladder_expirations` do not reach `MassiveClient`, `fetch_option_chain`, `fetch_option_chain_until`, or `_fetch_ladder_uncached`. The next regular-hours hour of P2 lines is inside the 2-second hop. Spec §8 ship bar. Coach AP-1 closes REQ-013. Until that hour is in the log, REQ-013 stays open.

### P4 — Charlie, last

After W4. `web/lib/options-lab/useGexCalPack.ts` lines 105–114 only, and only when `termMassOn`. Cap the in-flight ladders. Does not touch `useOptionChainBus`, the wings clamp, or the archive reader.
Gate: a test with seven expirations in flight and seven books at the end.

---

## Out of this plan

OHLC, session-status, underlier marks, Curate correlation, trade-chart, algo-replay, collectors, VP ingest, probes. They are in the inventory so they are not forgotten. They are not packets here.

SODP-MB for the rest of `/api/me/market/*`. Not granted.

A staging host. `labs-stage.fattail.ai` did not resolve on 2026-09-28. DudeTwo is not the canary.

Wings above 50. A new browser field. A Runner control, screen, selector, or default. A second uvicorn worker. A MiniTwo Redis. An edit to `chain_feed`. Tuesday's full-book capture.

---

## Acceptance

Coach accepts this plan, or he replaces the reach path in one line before W2. W0 does not start on this file alone. P5 does not start before Tuesday 2026-09-29 16:00 ET. Nothing in this plan restarts an API tonight.

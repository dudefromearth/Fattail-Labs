# Runner live ladder — full agent bench plan v1.1

**Plan v1.1.** Supersedes `docs/Runner-Live-Ladder-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`.
**Status: ACCEPTED.** Coach accepted plan v1.0 on 2026-09-28 and added the three rows below. Spec v0.1 is unchanged. W0 is dispatched. W1 waits on W0-G.
**Law for packets:** this file. v1.0 stays on disk as the accepted baseline and is not edited.

| Change from v1.0 | What v1.1 says |
|---|---|
| Reach path | Confirmed. `:5055` is the route. The bus is not. The override line in v1.0 is closed |
| Tuesday 2026-09-29 after 16:00 ET | Confirmed. One restart of `ai.fattail.labs.api` carries P5, P1, and P2. Data-plane code is not in it. The plist-only alternative is closed |
| W3 allow-list | Two identities: Coach's own, and one administrator. Coach names both ids before that close. No member identity is in the canary |

The packet body below is v1.0 with those three rulings written in. Inventory, machines, CP-1, and the ship bar are unchanged.

**Spec:** `docs/Runner-Live-Ladder-Data-Plane-v0_1.md`.
**Inventory:** `docs/Massive-Call-Site-Inventory-v0_1.md`. GO there is Runner ladder only.
**Machine:** StudioTwo writes and tests. MiniTwo is production. StudioOne is the data plane. CP-1 on every StudioOne packet.

This plan does not revise diagnostic v0.1, audit v0.1, spec v0.1, plan v1.0, OPF spec v0.3, or OPF plans v1.1, v1.2, or v1.3. It does not commit `ssr_fullbook.py`. It does not restart capture, `chain_feed`, or the band tap.

---

## Decision the plan executes

MiniTwo's Runner handlers stop calling Massive. They read the ladder the StudioOne feed already writes, through `GET /api/ladder` on the process at `:5055` (`ssr_snapshot_dash.py`). The browser JSON does not gain a key. Wings effective stays 50. A missing hot key returns the last document with the existing `stale` field set true. A missing document returns the existing 502 and does not urlopen Massive. The hop timeout is 2 seconds.

Coach confirmed that door. A MiniTwo client of StudioOne Redis is not the reach path.

---

## Schedule

| When | What | Restart |
|---|---|---|
| W0 | India, read-only, StudioTwo. Dispatched with this acceptance | None |
| Tuesday 2026-09-29 after 16:00 ET | P5, P1, and P2, on MiniTwo | **One** restart of `ai.fattail.labs.api`. Data-plane code is not in it. P3 is the web job in the same window, label `ai.fattail.labs.web` |
| After W0-G MATCH, and after P2 is on the production process | W1 tests on StudioTwo, then W2 code in the repo | None on MiniTwo or StudioOne during RTH |
| A close after W2, not Tuesday, and only after Coach has named the two ids | W3 loads the `:5055` route and turns the allow-list on for those two identities | StudioOne: the `:5055` process only, after the close. MiniTwo: one API restart to load the hop behind the allow-list. Not the Tuesday restart |
| A later close, after the canary hour is in the P2 log | W4 production cut | One MiniTwo API restart. Massive is then unreachable from the two Runner handlers |
| After W4 | P4 | Web only. `useGexCalPack.ts` lines 105–114. No API restart required for P4 alone |

P4 is last because it changes the order Term Mass fills seven books. The canary's duration log is measured before that order changes.

---

## P5, P1, P2, P3 — approved, dated, not started

Evidence gates are the audit's.

**P5.** Foxtrot. MiniTwo. After Tuesday 2026-09-29 16:00 ET. File-descriptor limit on `~/Library/LaunchAgents/ai.fattail.labs.api.plist`. One `launchctl` kickstart of `ai.fattail.labs.api`, shared with P1 and P2. Does not touch the web job, the Runner page, the collector, or StudioOne. Extra workers are not part of it. Data-plane code is not in this restart.
Gate: the next session's log has zero `Errno 24` on `socket.accept`, and one RTH sample of that process's open-file count is written down.

**P1.** Alpha. That same restart. Log the branch name at the four `HTTPException(status_code=502)` sites in `server/routes/chain_ladder.py` (lines 320, 330, 353, 454 at sha `70453700`). Status stays 502.
Gate: one regular-hours hour on MiniTwo where the four branch counts add up to that hour's 502 access lines.

**P2.** Alpha. That same restart. Access line carries time, duration, status, and path. No body. No member name.
Gate: a line from a real chain-ladder request shows those four fields. The canary measurement uses this line.

**P3.** Charlie. Web job, same window, label `ai.fattail.labs.web`. One client record per chain-ladder poll: duration, symbol, expiration, template id, status. Stored without a name. Does not change the ladder payload.
Gate: a day grouped by symbol and template, with a count and a duration.

---

## W0 — India (dispatched)

StudioTwo. Read-only. Spec v0.1 against SODP-1, SODP-2, SODP-3, SODP-4, SODP-11, Arch 28, Arch 30's `not_configured` line, and the inventory. Confirm the reach path is the `:5055` route, the hot-key TTL fact (default 6 seconds), the browser keys in spec §4, and the wings cap. Confirm this plan does not hop OHLC, session-status, marks, correlation, trade-chart, or algo-replay. Confirm plan v1.1's canary rule fits spec §7 without a spec revision: the allow-list is still server-side identity ids, and v1.1 only names which two ids may be on it.
Gate: MATCH or FAIL, written to `agents/p-runner-live-ladder/gate-reports/W0-G-v0_1-2026-09-28.md`. FAIL stops W1. India does not edit the spec or either plan. A miss is a new version.

## W1 — Kilo

Starts only after W0-G MATCH. StudioTwo. Tests only, against the repo, not against MiniTwo. No production process.

- Hot document returns through the handler with the existing keys, and `stale` follows provenance.
- Hot key absent, last document present: response is that document, `stale` is true, `content_hash` unchanged, and `MassiveClient` was not constructed.
- Neither document: HTTP 502 with `No option contracts returned for {product} {expiration}`, and `MassiveClient` was not constructed. Elapsed time is inside the 2-second hop budget, not the 60-second client timeout.
- `wings=100` touches `w50` and returns `wings_requested=100`, `wings_effective=50`.
- `get_chain_ladder` and `list_chain_ladder_expirations` do not call `_fetch_ladder_uncached` or `_scan_expirations_live`.
- `chain_feed`'s call to `_fetch_ladder_uncached` still resolves.

Gate: those tests pass in StudioTwo's `server/.venv`. Not dispatched by the acceptance.

## W2 — Alpha

StudioTwo repo, after W1's tests exist. Not loaded on StudioOne during RTH. Not deployed to MiniTwo.

- `:5055` route as spec §2. Redis read, shadow key, interest touch, no Massive import on that route.
- Member handler hop as spec §3. Allow-list unset means today's fill, so a deploy with the env unset does not change members.
- Expirations handler does not call `_scan_expirations_live`.
- Fail loud when the allow-list is non-empty and `LABS_SSR_ARCHIVE_URL` is missing.
- The allow-list rejects a value that is not exactly the two ids Coach named for W3.

Mike reads the hop: bearer from the existing archive token, member cookie not forwarded, StudioOne URL not in the browser response. That read is part of W2-G, not a separate build.

## W3 — Foxtrot, canary

After a close. Not Tuesday 2026-09-29. Does not start until Coach has named the two ids.

The allow-list is Coach's own identity and one administrator identity. No member identity. If the named list is any other shape, W3 does not load.

**CP-1, verbatim (DL-707).** The chain-snapshot collection on StudioOne (`chain_feed` and its supporting jobs) is never disrupted. If any step could disrupt it — including indirectly via shared Massive account connection or rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is redesigned or held until after 16:00 ET. Every StudioOne packet carries this, states its footprint, records `chain_feed` status and last-snapshot freshness before and after, and has one rollback line. A degraded `chain_feed` after the step is a FAIL, and the rollback runs.

Footprint of this step: the `:5055` process gains a Redis GET and, on a hot hit, a SET of `mb:ladder-last:…`. Zero new Massive connections. No `chain_feed` plist edit. No new port. Disk is one Redis value per live ladder key.
Before and after: `chain_feed` pid, and the age of one live `mb:ladder:` key it writes.
Rollback: remove the new route from the `:5055` process and kickstart that process only. Do not kickstart `chain_feed`.

Then MiniTwo, one API restart, `LABS_LADDER_HOP_IDENTITIES` set to those two ids. Everyone else stays on the current fill. `LABS_SSR_ARCHIVE_URL` points at StudioOne `:5055` over Tailscale. The token is the existing archive token.

Gate: one regular-hours hour of P2 lines for those two identities, durations inside 2 seconds, and the same hour for a request outside the list still on the previous path. `chain_feed` before and after, undegraded. The report carries no member name and no member identity id.

## W4 — Delta, production cut

A later close. The allow-list and the Massive branches reachable from the two Runner handlers are deleted. One MiniTwo API restart. Requests outside the canary take the hop from that restart. There is no UI default to flip.

Gate: `git grep` of the deployed tree shows `get_chain_ladder` and `list_chain_ladder_expirations` do not reach `MassiveClient`, `fetch_option_chain`, `fetch_option_chain_until`, or `_fetch_ladder_uncached`. The next regular-hours hour of P2 lines is inside the 2-second hop. Spec §8 ship bar. Coach AP-1 closes REQ-013. Until that hour is in the log, REQ-013 stays open.

## P4 — Charlie, last

After W4. `web/lib/options-lab/useGexCalPack.ts` lines 105–114 only, and only when `termMassOn`. Cap the in-flight ladders. Does not touch `useOptionChainBus`, the wings clamp, or the archive reader.
Gate: a test with seven expirations in flight and seven books at the end.

---

## Out of this plan

OHLC, session-status, underlier marks, Curate correlation, trade-chart, algo-replay, collectors, VP ingest, probes. They are in the inventory. They are not packets here.

SODP-MB for the rest of `/api/me/market/*`. Not granted.

A staging host. `labs-stage.fattail.ai` did not resolve on 2026-09-28. DudeTwo is not the canary. A member identity on the canary list.

Wings above 50. A new browser field. A Runner control, screen, selector, or default. A second uvicorn worker. A MiniTwo Redis. An edit to `chain_feed`. Tuesday's full-book capture. Putting data-plane code in Tuesday's API restart.

---

## Acceptance

Accepted 2026-09-28. DL-803. W0 is the only packet this acceptance dispatches. P5 does not start before Tuesday 2026-09-29 16:00 ET. W3 does not start until the two ids are named. Nothing in this plan restarts an API tonight.

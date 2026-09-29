# Runner live ladder from the StudioOne data plane — v0.1

**Spec v0.1.** Status: **PLAN.** Not build authority. No packet in the plan runs until Coach accepts the plan.
**Machine for this file:** StudioTwo. Production citations are `refs/remotes/minitwo/prod-2026-09-24` = `70453700a3225ea5f4920f8f44000f6cdda3cb71`. Do not check that sha out. The StudioTwo work tree is a later commit and is dirty.
**Inventory:** `docs/Massive-Call-Site-Inventory-v0_1.md`.
**Plan:** `docs/Runner-Live-Ladder-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`.
**Does not revise:** `docs/Runner-500-Diagnostic-v0_1.md`, `docs/Runner-Performance-Audit-v0_1.md`, any OPF band spec or plan.

---

## Coach, 2026-09-28

P1, P2, P3, and P5 are approved. P5 is after Tuesday's close (2026-09-29, after 16:00 ET), one restart of the API job, evidence as the audit states. P4 is approved and scheduled last. P4 changes fill order. The 500 and the 502 are unchanged by it.

Nothing else in Runner changes. No control, no screen, no selector, no default.

Production Runner's live ladder is served from the data plane on StudioOne, not from Massive inside the Labs API process on MiniTwo. State the design that already exists (`LABS_MARKET_BUS` / Redis ladders). State what reaching it from MiniTwo requires under TOPO-1: the bus, or a ladder route on the OPF API. The bench decides which and says why. When the bus has no fresh ladder, the handler returns a stale-but-marked ladder, never a 60-second Massive wait on the request thread. The response JSON to the browser does not change. The wings cap stays at 50 until Coach rules otherwise. Parallel-run: a canary member set or a staging host first, measured with P2's duration log, then production after a close. No Massive call remains on the Runner request path when this ships.

---

## 1. The design that already exists

Market Bus Spec and Arch 28. At sha `70453700`:

- `bus_enabled()` is true only when `LABS_MARKET_BUS` is `1`, `true`, `yes`, or `on` (`server/market_data/market_bus/config.py:8–10`). Missing `REDIS_URL` with the bus on raises at boot (`:15–17`).
- The ladder key is `mb:ladder:{chain_underlier}:{expiration}:w{wings}:dual` (`server/routes/chain_ladder.py:71–72` and `server/opf/keys.py:40–42`). `chain_underlier` may contain a colon (`I:SPX`). This is the member window. It is not `mb:book:…`, which is the full-book key and is not this spec.
- `chain_feed` lists `mb:interest:` topics under `mb:ladder:` (`server/market_data/chain_feed.py:45`), builds that same key (`:60`), fills by calling `_fetch_ladder_uncached` (`:70`), and `set_json`s the document (`:83`). That fill is the Massive call, and it belongs on the feed.
- The member handler `_fetch_ladder` (`chain_ladder.py:390`) asks `get_store().get_json(bus_key)` first (`:409`). A hit is returned. `get_store()` is `None` when the bus is off (`store.py:83–84`).
- On a miss, or when the bus is off, the handler uses a 1.5 s process cache (`_CACHE_TTL_S`, line 63, checked at 433) and then `_fetch_ladder_uncached`, which constructs `MassiveClient` (line 284) and calls `fetch_option_chain` (line 301, `max_pages=3`). The spot probe is a second `fetch_option_chain` (line 220, called at 288).
- `MassiveClient` default `timeout_s` is 60.0 (line 38). `urlopen` uses it (line 68). Next's proxy gives up at 30 s. That pair is the wait this spec removes from the request thread.
- The Redis value's TTL is `max(2, int(chain_ttl_s * 3))` (`store.py` `set_json`). `LABS_MB_CHAIN_TTL_S` defaults to 2.0, so the hot key lives about 6 seconds. Interest grace defaults to 45 s.
- `apply_chain_provenance` sets `stale` and `epoch_quality` on the document and does not recompute `content_hash` (`server/market_data/chain_provenance.py`). `stale` is age against `live_marks.stale_seconds()`, default 60 (`LABS_MARK_STALE_SECONDS`). The HTTP envelope already carries both fields (`chain_ladder.py:566` and `:590`). Arch 28: the hash does not include `stale`.

The production API process (pid 77873, started 2026-09-28 11:26:52 ET) had `LABS_MARKET_BUS` unset. Every ladder miss in that process is the Massive fill above. Arch 30 recorded MiniTwo as `bus: "not_configured"`. This spec is the packet that changes the Runner ladder. It does not turn the bus on inside the MiniTwo process.

`chain_feed` on StudioOne remains the writer. This spec does not edit it, does not restart it, and does not change its Massive call.

## 2. How MiniTwo reaches it

**The reach path is a ladder route on the StudioOne process bound at `:5055`.** That process is `server/market_data/ssr_snapshot_dash.py` (`DEFAULT_PORT = 5055`). This house calls it the OPF API. The route reads the Redis ladder the feed already writes. It does not call Massive.

TOPO-1 is the StudioOne Data Plane spec v0.1.

- SODP-1: StudioOne is the runtime for data movement and data APIs.
- SODP-2: a UI host does not call Massive. MiniTwo is the production UI host (SODP-4). The product API stays there.
- SODP-3: the browser never talks to StudioOne. The member cookie stays on MiniTwo. The hop is server-side.
- SODP §4: Redis on StudioOne is local.
- SODP-11: hopping every `/api/me/market/*` route is a named SODP-MB GO that has not been given. This spec hops the Runner ladder and the Runner expirations fetch only. It does not retire `chain_feed` or `sym_feed` anywhere.

The facts that settle the door:

1. Redis is local to StudioOne, and Arch 28 binds it to `127.0.0.1`. The product process on MiniTwo is not a client of that store. The hop that already exists for this port is HTTP, `LABS_SSR_ARCHIVE_URL` plus `Authorization: Bearer`, in `server/routes/ssr_archive.py`. The production API has that URL unset. Setting it is configuration for the canary, not a new port and not a Redis listener on the tailnet.
2. The hot key expires in about 6 seconds. A feed pass over a large topic set has been measured near 50 seconds (`docs/OPF-Actual-Cadence-Finding-v0_1.md`, the chain-feed pass after the close on 2026-09-28). A reader that only sees the hot key will usually miss. Today's miss calls Massive inside whichever process is reading. If that process is MiniTwo, the request thread is back on the 60-second urlopen.
3. A stale ladder has to be a document that outlives the 6-second key. The process that sees the feed's writes is on StudioOne. The route keeps that document. MiniTwo does not invent one.
4. CP-1: the route's footprint is one local Redis read and, on a hot hit, one shadow write. Zero Massive connections. No `chain_feed` plist edit. No new port. `:5055` is already bound.

A MiniTwo `REDIS_URL` pointed at StudioOne was the other door in Coach's sentence. It is not the reach path. It would put a data-store client on the product host, would require Redis off localhost, and would leave the miss fill one exception away from Massive on MiniTwo. SODP-MB, when Coach names it, is still the hop for the rest of `/api/me/market/*`. This spec does not grant that.

### Route

On `:5055`, one new read:

`GET /api/ladder?symbol=&expiration=&wings=`

It resolves the product the way the member handler already does, clamps wings with the existing cap (section 5), and reads `mb:ladder:{chain_underlier}:{expiration}:w{wings_effective}:dual`.

- Hot key present: return that document.
- Hot key absent, last document present: return the last document.
- Neither present: return the existing empty-book failure, no Massive call.

The last document is stored at `mb:ladder-last:{chain_underlier}:{expiration}:w{wings}:dual`. That key is not an interest topic and is not published on `mb:pub`. Its TTL is 18 hours, so a halted feed still has a document the next session. The route copies a hot hit into that key. `chain_feed` is not modified to do it.

The route calls `touch_interest` on the canonical ladder key (grace 45 s, already the store method). That is how `chain_feed` already learns demand. `opf.plane_interest` heartbeats only `LABS_OPF_PLANE_WINGS_TOPICS`, which defaults to empty, so a member window the feed is not already writing appears on the pass after the first touch. The first request in that gap returns the empty-book failure immediately. It does not wait for the feed and it does not call Massive.

Auth is the archive bearer already required on this port (`LABS_SSR_ARCHIVE_TOKEN`, at least 32 characters). MiniTwo sends it server-side. The browser does not receive the StudioOne URL, the token, or a computing cookie.

The expirations fetch the Runner page makes (`GET /api/me/market/chain-ladder/expirations`, `fetch_option_chain_until` at `chain_ladder.py:770`, `max_pages` 20–80) is the same request path. A sibling read on `:5055` returns the listed dates the data plane already holds. The member route maps them onto the keys the client already reads (`contracts`, `default_expiration`, `symbol`, `session_open`, `count`, `max_dte` — `web/lib/chainLadderApi.ts:127–135`). The client does not read `source`. The route does not call `_scan_expirations_live`.

## 3. What the handler does

`get_chain_ladder` stays the member route. For a request on the hop:

1. It calls the `:5055` route with a 2-second timeout. Two seconds is the health-probe timeout already used by `opf.plane_interest` (`HEALTH_TIMEOUT_S`). It is not 60.
2. A document comes back. The handler runs `apply_chain_provenance` as it does today. If the document was the hot key, `stale` stays whatever that function computes. If the document was the last key, the handler then sets the existing `stale` field to `true` on the ladder document and on the envelope. `content_hash` is not recomputed. `epoch_quality` stays the provenance value.
3. No document: HTTP 502 with the existing detail `No option contracts returned for {product} {expiration}` (`chain_ladder.py:330–332`). No Massive call. Interest was already touched by the route.
4. The hop does not answer within 2 seconds, or the URL is unset while this request is required to hop: HTTP 503, the status provenance failure already uses (`:563`). No fall-through to `MassiveClient`. A canary or a production cut that requires the hop and has no `LABS_SSR_ARCHIVE_URL` fails loud at that request. It does not silently fill from Massive.

`list_chain_ladder_expirations` returns the stored preform calendar when it is fresh, as it does today, or the dates from the sibling read. It does not call `_scan_expirations_live`. No stored dates and no sibling answer: the existing 502. The `refresh=true` query stops meaning "scan Massive on this request." The data plane refreshes the calendar. The query parameter remains so the request URL does not change.

The feed's call to `_fetch_ladder_uncached` stays. That is the Massive call, on StudioOne, off the member request.

## 4. The browser JSON

The success body stays the three modes already returned (`chain_ladder.py:578–611`):

- `unchanged`: `unchanged`, `mode`, `content_hash`, `as_of`, `spot`, `vix`, `product`, `opf_session`, `server_time`, `stale`, `epoch_quality`
- `diff`: `unchanged`, `mode`, `product`, the existing patch keys, `opf_session`, `server_time`, `stale`, `epoch_quality`
- `full`: `unchanged`, `mode`, `product`, `ladder`, `content_hash`, `opf_session`, `server_time`, `stale`, `epoch_quality`

No new key. `stale` and `epoch_quality` are already on the wire (DL-535, Market Bus v1.0.2, Arch 28). A served-last ladder uses `stale: true`. Status codes on failure stay in the set this route already returns (401, 422, 502, 503).

The expirations success keys stay the set `fetchLadderExpirations` reads. No new key.

## 5. Wings

`_MAX_DUAL_WINGS = 50` (`chain_ladder.py:76`). The member may send 100. `wings_effective` is `min(requested, 50)`. The response keeps `wings_requested` and `wings_effective`. The Redis key and the interest topic use `wings_effective`. A request for 100 does not create a `w100` topic and does not widen the feed. The cap stays 50 until Coach rules otherwise. Tuesday's full book is `mb:book`, and it is not this response.

## 6. What does not change

No Runner control, screen, selector, or default. No wings default change (the query default stays 25; the cap stays 50). No template change. No `useOptionChainBus` change. No `useGexCalPack` change in this spec (P4 is later and is not this design). No archive replay change. No Massive site outside section 1's Runner rows. No `chain_feed` edit. No OPF full-book module, ceiling, or Tuesday capture. No second worker. No Redis listener on MiniTwo.

## 7. Parallel run

`labs-stage.fattail.ai` did not resolve on 2026-09-28. DudeTwo was a different sha and was not listening on `:4000`. There is no staging host to put this on until Coach names one.

The canary is a server-side identity allow-list on MiniTwo, `LABS_LADDER_HOP_IDENTITIES`, comma-separated identity ids. It is not a screen and not a member setting. Empty or unset means every member stays on today's handler. A malformed value fails boot, the same way a bad bus URL fails boot. Listed identities take the hop. Everyone else stays on the current fill until the production cut.

The canary is measured with P2's duration log (time, duration, status, path). P2 has to be on the API process before that measurement. The production cut is a later close, after the canary hour is in the log. At the cut, the allow-list is retired by deleting the Massive reachability from the two request handlers, not by flipping a default in the UI.

## 8. Ship bar

When this ships, no Massive call remains on the Runner request path.

Reachable from `get_chain_ladder` and from `list_chain_ladder_expirations`: no `MassiveClient`, no `fetch_option_chain`, no `fetch_option_chain_until`, no `urlopen` to `api.massive.com`.

Still present, and required: `chain_feed`'s call to `_fetch_ladder_uncached`. That function may still construct `MassiveClient`. The request handlers do not call it.

One regular-hours hour after the cut, on MiniTwo, the P2 log shows chain-ladder durations inside the 2-second hop, and the process log shows no `MassiveClient` fill from those two handlers.

## 9. P1–P5, recorded so this spec does not absorb them

These are the audit's packets. Coach approved them in the ruling above. They are not this design. The plan dates them. None of them is built by writing this file.

| Packet | Approval | What it is |
|---|---|---|
| P1 | Approved | Log which of the four 502 branches fired. Status stays 502. Lines 320, 330, 353, 454 |
| P2 | Approved | Access line: time, duration, status, path. No body, no name. This is the canary's measurement |
| P3 | Approved | Client timing row: duration, symbol, expiration, template id, status. No name |
| P4 | Approved, last | `useGexCalPack.ts` lines 105–114 only, when `termMassOn`. Cap in-flight. Changes fill order. Does not change the 500 or the 502 |
| P5 | Approved, after Tuesday 2026-09-29 16:00 ET | `ai.fattail.labs.api` file-descriptor limit. One restart of that job. Evidence: next session zero `Errno 24` on `socket.accept`, and one RTH open-file sample |

P5's restart does not load this spec. This spec has no production restart until Coach has accepted the plan and the canary has been measured.

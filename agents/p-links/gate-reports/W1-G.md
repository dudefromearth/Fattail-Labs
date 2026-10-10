# Links — W1-G

**Gate:** W1-G
**Seat:** Delta (verify only; no product edit)
**Machine:** StudioTwo (`hostname` `StudioTwo.local`, ComputerName StudioTwo)
**HEAD:** `4faabfd8` (`git rev-parse --short HEAD`)
**Clock:** Mon Oct 5 01:09:45 EDT 2026 (`date`, after the suite and the header capture below). Status and stamp were read at Mon Oct 5 01:01:47 EDT 2026 on the same HEAD.
**Law under test:** `Specs/LK-1.1.md` — AT-1, AT-4, AT-5, AT-6, AT-10, AT-11a, and RD-L1 (under 0.5 s after receipt on a warm worker).
**Stamped baseline:** `Specs/LK-1.md`, checked against `Specs/LK-1-STAMP.md`. Neither file was edited.
**Plan read, not edited:** `agents/p-links/build-plan-v0_4.md` W1 Alpha and W1 Kilo lists.
**Servers:** not started and not killed. Next was already listening on `*:3000` (node pid 13888). The worker was already `Python -m links.public_worker` on `127.0.0.1:4017` (pid 58417, started Mon Oct 5 00:49:13 2026, cwd `/Users/ernie/Fattail-Labs/server`). `server/links/public_worker.py` mtime 00:47:57 is before that start.

## Verdict

**GO.**

## 1. Stamp

```
920fa7bc4d6405b2481b71fa19e44926bd46e847830f49cee9b02fdbe578022b  Specs/LK-1.md
   21872 Specs/LK-1.md
```

`Specs/LK-1-STAMP.md` sha256 line is `920fa7bc4d6405b2481b71fa19e44926bd46e847830f49cee9b02fdbe578022b`. Bytes are 21872. Match.

## 2. Pytest

Command (cwd `server/`):

```
set -a && source ../.env && set +a && .venv/bin/python -m pytest tests/test_links_w1.py -q
```

Output:

```
....................................                                     [100%]
36 passed in 160.56s (0:02:40)
```

Exit code 0. No failures, no skips. The HTTP tests did not skip, so Next on port 3000 accepted the suite's curls. The 160.56 s is suite wall time (reachability's 5 s cap under the suite's socket monkeypatch on each stored create). It is not redirect latency. Redirect samples are in section 7.

36 is 16 single tests plus 20 fence-case parameters of `test_at10_fence_case_refuses_and_stores_nothing`. Named gate tests that ran and passed: `test_at1_decide_is_uncached_302_and_follows_edit`, `test_at1_http_when_next_route_is_up`, `test_at4_device_referrer_kind_and_bots_excluded`, `test_at5_unknown_and_inactive`, `test_at6_request_destination_is_not_a_decide_parameter`, the 20 fence cases, `test_at10_flip_resolution_refuses_before_connect`, `test_at11a_reserved_identity_columns_stay_null`, `test_at11a_http_cookie_does_not_fill_identity`.

## 3. What the test file asserts

Read `server/tests/test_links_w1.py`. These assertions are in the file, and section 2 says they passed.

- Latency: `test_at1_decide_is_uncached_302_and_follows_edit` calls `decide` once, then times the next call, and asserts `elapsed < 0.5`.
- 302, not 301 or 308: same test, and `test_at1_http_when_next_route_is_up`.
- Four cache headers, verbatim, on the Next response: `test_at1_http_when_next_route_is_up` asserts `cache-control`, `pragma`, `expires`, and `vary` against `no-store, no-cache, max-age=0, must-revalidate`, `no-cache`, `0`, and `*`.
- No `Set-Cookie`: that HTTP test, and `test_at11a_http_cookie_does_not_fill_identity`.
- Fence cases store nothing and do not connect: each case expects `FenceError` from `assert_destination_storable` and from `create_link` / `update_link`, asserts `net.connects == []`, forbids `reachability` on that path, and asserts the bad destination is not stored. The edit target keeps `https://example.com/zztest-w1`.
- Flip-resolution does not connect: `test_at10_flip_resolution_refuses_before_connect` resolves twice, expects a warning string, asserts `net.connects == []`, and expects the row stored with `destination` equal to the flip URL and a non-empty `warning`.
- `member_id` and `marker_id` stay NULL with a Cookie header: `test_at11a_http_cookie_does_not_fill_identity` sends `Cookie: ft_session=present` to `http://127.0.0.1:3000/q/<slug>` and asserts both columns are `None` on the written event.

`decide()` itself does not carry the four cache headers (`inprocess_keys` were `body`, `location`, `status`). The Next route sets them. The HTTP test is the assertion that counts for the header set.

## 4. Allowlist

`git diff --stat` on the W1 paths is empty. Every W1 path is untracked, so it does not appear in `git diff`.

`git status --short` on those paths:

```
?? migrations/155_links.sql
?? server/links/
?? server/tests/test_links_w1.py
?? web/app/q/
?? web/lib/links/
```

Product files under those paths (no `__pycache__`, no `.pyc`):

```
migrations/155_links.sql
server/links/__init__.py
server/links/events.py
server/links/fence.py
server/links/fixtures/d4_bots.txt
server/links/fixtures/fence_cases.json
server/links/fixtures/user_agents.json
server/links/public_worker.py
server/links/slug.py
server/links/store.py
server/tests/test_links_w1.py
web/app/q/[slug]/route.ts
web/lib/links/publicRedirect.ts
```

That is the W1 Alpha list plus the W1 Kilo list. No other product file is in those trees. `__pycache__` under `server/links/` is gitignored bytecode, not a product path.

`server/main.py` is dirty (+23) and is not on the W1 list. Its diff contains no `link`, `4017`, or `/q/` token. The plan already says that access-line hunk is not this program. This packet did not touch it. Other dirty paths outside this list were not opened as this packet and are not named.

## 5. Redirect source

`web/app/q/[slug]/route.ts` reads `user-agent` and `referer` only. It does not import `cookies`, does not read a `Cookie` header, and does not set `Set-Cookie`. Cache headers are the four required values, including `Vary: *`. Status 302 is returned only when `schemeIsHttps` passes.

`web/lib/links/publicRedirect.ts` posts JSON `{ slug, ua, referrer }` to `http://127.0.0.1:4017/decide` and `http://127.0.0.1:4017/log`. Request headers are `content-type` and `accept` only. There is no `Cookie` header, no port 4000, and no `/api` path. `AbortSignal.timeout(4000)` is a 4 second limit, not port 4000.

`server/links/__init__.py` has no FastAPI import. `public_worker.py` binds `127.0.0.1:4017`, takes only slug, ua, and referrer, and `log_message` returns without writing.

## 6. INSERT

`store.create_link` inserts:

```sql
INSERT INTO links (
    slug, destination, label, active, `static`,
    source, medium, campaign, placement, design_json
) VALUES (%s, %s, %s, 1, %s, %s, %s, %s, %s, %s)
```

`owner` is not a column in that statement and not a parameter. `update_link` does not assign `owner`. The column is `VARCHAR(128) NULL`. A probe row read back `owner_column None`.

`events.record_pass` inserts `member_id` and `marker_id` as SQL `NULL`. The statement has no IP column. `record_miss` inserts `attempted` and `occurred_at` only.

Live columns (`SHOW COLUMNS`):

```
links slug,destination,label,active,static,source,medium,campaign,placement,owner,design_json,created_at,updated_at
link_events id,occurred_at,slug,kind,device_class,os_family,referrer,country,region,bot,member_id,marker_id
link_misses id,attempted,occurred_at
```

No IP column on any of the three tables.

## 7. Flip-resolution, latency, and the wire

RD-L6 refuses the connection when the second resolution is non-public. `fence.reachability` re-resolves, and on `FenceError` from `assert_public_answers(second)` returns `"non-public answer"` before `_probe`. `_probe` is the only `sock.connect`. The flip test asserts `net.connects == []` and a stored row whose `warning` is a non-empty string. That stored warning is AD-L4 (reachability failure after a passing store fence is a warning). A connect on the flip case was not observed; the test failed the run if one was recorded. The test passed.

Warm `decide()` in-process, five samples after one warmup, max 0.001380 s. Status 302, location `https://example.com/zztest-w1-gate`.

Warm `POST http://127.0.0.1:4017/decide`, five samples after one warmup, max 0.001569 s. Body `{"status": 302, "location": "https://example.com/zztest-w1-gate", "body": ""}`.

Warm `GET http://127.0.0.1:3000/q/<slug>` via curl `time_total`, five samples after one warmup: 0.006427, 0.005387, 0.005483, 0.006796, 0.006154. All under 0.5 s. All HTTP 302.

HEAD (curl `-sI`):

```
HTTP/1.1 302 Found
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
vary: *
cache-control: no-store, no-cache, max-age=0, must-revalidate
expires: 0
location: https://example.com/zztest-w1-gate
pragma: no-cache
Date: Mon, 05 Oct 2026 05:09:44 GMT
Connection: keep-alive
Keep-Alive: timeout=5
```

GET with `Cookie: ft_session=present`:

```
HTTP/1.1 302 Found
vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
vary: *
cache-control: no-store, no-cache, max-age=0, must-revalidate
expires: 0
location: https://example.com/zztest-w1-gate
pragma: no-cache
Date: Mon, 05 Oct 2026 05:09:44 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked
```

No `Set-Cookie` on either response. Required `Vary: *` is its own header. The four required cache values are present verbatim. Events written by those requests had `member_id` None and `marker_id` None. The probe row was deleted (`leftover_links` 0).

The suite's header parser keeps the last `Vary` only, so its pass shows `vary == *` and does not show Next's earlier `Vary`. The raw blocks above are the measurement of both.

## Unmeasured

- Next also sends `vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch` before `vary: *`, on HEAD and on GET. The required header set is still present verbatim, including `Vary: *`. This extra `Vary` is not a defect.
- No OS-level packet capture (tcpdump or pcap) was taken. AT-10's capture is the suite's in-process `socket.connect` / `create_connection` guard. Fence cases and flip-resolution asserted `net.connects == []` and those tests passed.
- The worker process stdout was not tailed. In the file that process loaded, `log_message` returns without writing a line.
- The Cookie header used by the suite and by the probe was the literal `ft_session=present`, not a verified Labs session JWT. The route and the loopback client do not read or forward a Cookie header, and `record_pass` writes `NULL`, `NULL`. A valid session has no writer on this path. One was not minted here.
- An HTTP query such as `?destination=` was not sent on the wire. `route.ts` does not read the query. `decide` has no destination parameter (`test_at6_request_destination_is_not_a_decide_parameter` passed).

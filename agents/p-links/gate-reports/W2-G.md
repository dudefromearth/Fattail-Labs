# Links — W2-G

**Gate:** W2-G
**Seat:** Delta (verify only; no product edit)
**Machine:** StudioTwo (`hostname` `StudioTwo.local`, ComputerName StudioTwo)
**HEAD:** `4faabfd8` (`git rev-parse --short HEAD`)
**Clock:** Mon Oct 5 01:38:21 EDT 2026 (`date`, after the suite and the worker-log read below)
**Law under test:** `Specs/LK-1.1.md` — AT-2, AT-3, LK-L4, RD-L3
**Plan read, not edited:** `agents/p-links/build-plan-v0_5.md` W2 Alpha allowlist
**W1-G:** already GO. The W1 suite was not re-run.

## Verdict

**NO-GO.**

The route takes the visitor address from the client-supplied `X-Forwarded-For` header. A visitor can choose the country stored on the event. RD-L3 uses the raw IP of the connection, then discards it. This packet does not. Not fixed.

## 1. IP source (the defect)

`web/app/q/[slug]/route.ts` does not read the connection. `peerAddress` reads only the request header and keeps the first list item:

```ts
function peerAddress(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (!forwarded) {
    return "";
  }
  return forwarded.split(",")[0]?.trim() ?? "";
}
```

`handle` passes that string to `logAfter`. There is no socket address, no `remoteAddress`, and no other hop header in this file.

When the header is absent, the peer is `""`. `public_worker._log_after` then skips `locate`, and the event keeps `classify`'s `unknown` / `unknown`. When the header is present, the first value is the address looked up. The client supplies that header. The client chooses the country and region written on the event.

`server/tests/test_links_w2.py` requires the defect. It asserts `"x-forwarded-for" in route.lower()` and then posts `peer` straight to `127.0.0.1:4017`. A green suite does not clear this. No forged header was sent at this gate, and the route was not changed.

## 2. Pytest

Command (cwd `server/`):

```
set -a && source ../.env && set +a && .venv/bin/python -m pytest tests/test_links_w2.py -q
```

Output:

```
.......................                                                  [100%]
23 passed in 36.13s
```

Exit code 0. No failures, no skips. Secrets from `.env` are not copied here.

23 is 16 parameters of `test_at2_every_level_format_and_logo_decodes` (SVG and PNG × L/M/Q/H × logo off and on) plus `test_at2_default_has_no_logo`, `test_at2_logo_forces_h`, `test_at2_failing_contrast_is_refused`, `test_at2_quiet_zone_is_four_modules`, `test_at3_fixture_resolves_country_and_region_not_city`, `test_at3_missing_database_is_unknown`, and `test_at3_worker_stores_country_region_and_drops_the_address`.

AT-2 and the worker half of AT-3 passed. Section 1 is why the gate is still NO-GO.

## 3. AT-2

Read `server/links/qr.py` and `server/tests/test_links_w2.py`. Section 2 says those tests passed.

- SVG and PNG, levels L, M, Q, and H, with and without the logo: the 16-case test renders, then `qr.decode_image` must return the short link and level `H` when the logo is on, otherwise the requested level. PNG cases also call `zxingcpp.read_barcodes` on the raster and require one valid QR with that text and level. SVG cases require an `<image` tag if and only if the logo is on.
- The decoder is the pinned `zxing-cpp` module `zxingcpp`. `decode_image` calls `zxingcpp.read_barcodes` (`formats=QRCode`). `render` calls `decode_image` before it returns, so a failed decode raises `QrRefused` and returns no image. Installed versions, inside the pins: `zxing-cpp` 3.1.1, `segno` 1.6.6, `pillow` 12.3.0. The tests import `zxingcpp` and were not skipped, so that decoder ran.
- Logo off by default: `render(..., logo=False)` is the default. `test_at2_default_has_no_logo` passed: SVG has no `<image`, error-correction is `M`, and a PNG at H with `logo=False` is not byte-identical to `logo=True`.
- Logo forces H: `_level` returns `"h"` whenever `logo` is true, including when the caller passed L, M, or Q. `test_at2_logo_forces_h` passed for L, M, and Q in both formats. The 16-case test also requires `H` on every logo-on image.
- Bad contrast raises and returns no image: ratios under 3, or a dark color that is not darker than the light color, hit `raise QrRefused("contrast")` before `_draw`. `test_at2_failing_contrast_is_refused` passed for `#ffff00`/`#ffffff`, `#ffffff`/`#000000`, and `#222222`/`#333333`, SVG and PNG. The exception is the refusal. No image bytes are returned.
- The mark file was read, not edited. `_mark_path` opens `web/app/icon.png` (there is no `web/icon.png`) with `Image.open`. Nothing in `qr.py` writes that path. `web/app/icon.png` mtime is 2026-08-18 16:58:47. sha256 `faea875634b0a084178ee334807ba4eea63cd74e26a6ac06429b51b3ea009f32`. `git hash-object` equals `HEAD:web/app/icon.png` (`3a1a63c26b9155dd42e683ce305057f92fbed1ac`). `git diff -- web/app/icon.png` is empty. The hash was the same after the suite.

## 4. AT-3 (lookup and discard)

The fixture is `server/links/fixtures/geolite2-test.mmdb`. `test_at3_fixture_resolves_country_and_region_not_city` opened it with `geoip2` and passed: `198.51.100.10` is United States / California, and the city name in that database is `W2CityMustNotAppear`. `203.0.113.10` raises `AddressNotFoundError`. `geo.locate` returns only `country` and `region`. The city string and the address are not in that dict. The unresolvable address, a non-address, `""`, and `None` are `unknown` / `unknown`. A missing database file is the same.

`locate` calls `reader.city` and then reads country and subdivision only. It does not put `record.city` in the result. `record_pass` inserts `country` and `region` and has no IP column and no city column:

```sql
INSERT INTO link_events (
    occurred_at, slug, kind, device_class, os_family, referrer,
    country, region, bot, member_id, marker_id
) VALUES (
    UTC_TIMESTAMP(6), %s, %s, %s, %s, %s, %s, %s, %s, NULL, NULL
)
```

On `/log`, `_take_peer` pops `peer` off the body. `_log_after` calls `locate(peer)` when the peer is non-empty, then sets `peer = ""` before `record_pass`. `decide` and `log_after` do not take a peer. `log_message` returns without writing. The handler's `handle_error` returns without writing.

`test_at3_worker_stores_country_region_and_drops_the_address` posted both fixture addresses to the live worker on `127.0.0.1:4017` and passed: the resolvable row is United States / California, the unresolvable row is `unknown` / `unknown`, the city string is absent, and neither address is in the row, the response body, or the worker log the test read. The same test's in-process capture also passed. The suite then deletes `zztest-w2` rows. Those rows were not re-read after teardown.

The worker log after that suite is still empty. See section 6. Discard of an address the worker was given is shown. The address the route would give it is the defect in section 1.

## 5. Cookie and the redirect contract

`web/app/q/[slug]/route.ts` and `web/lib/links/publicRedirect.ts` do not read or forward `Cookie`. A case-insensitive read of both files has no `cookie`. The route reads `user-agent`, `referer`, and `x-forwarded-for` only. `decide` posts `{ slug, ua, referrer }` to `http://127.0.0.1:4017/decide` with headers `content-type` and `accept` only. `logAfter` posts `{ slug, ua, referrer, peer }` to `http://127.0.0.1:4017/log` with `content-type` only.

Neither file calls port 4000 or `/api`. `AbortSignal.timeout(4000)` is a 4 second limit, not a port. The W1 cache headers are still the four required values (`Cache-Control: no-store, no-cache, max-age=0, must-revalidate`, `Pragma: no-cache`, `Expires: 0`, `Vary: *`). Status 302 is still returned only when `schemeIsHttps` passes. That contract is intact in the source. The W1 suite was not re-run.

## 6. Allowlist and the worker

Product paths newer than W1-G (01:09) are only the W2 allowlist:

- `server/links/qr.py`
- `server/links/geo.py`
- `server/links/fixtures/geolite2-test.mmdb`
- `server/requirements.txt`
- `server/tests/test_links_w2.py`
- `server/links/public_worker.py`
- `web/lib/links/publicRedirect.ts`
- `web/app/q/[slug]/route.ts`

`git diff -- server/requirements.txt` adds only the W2 block: `segno>=1.6.6,<2`, `pillow>=12.3,<13`, `zxing-cpp>=3.1,<4`, `geoip2>=5.1,<5.2`, `maxminddb>=2.8,<3`, plus the comment that names them. Installed: segno 1.6.6, pillow 12.3.0, zxing-cpp 3.1.1, geoip2 5.1.0, maxminddb 2.8.2. No other requirement line changed.

Already-untracked W1 product files are still the only other files in those trees: `migrations/155_links.sql`, `server/links/__init__.py`, `server/links/events.py`, `server/links/fence.py`, `server/links/fixtures/d4_bots.txt`, `server/links/fixtures/fence_cases.json`, `server/links/fixtures/user_agents.json`, `server/links/slug.py`, `server/links/store.py`, `server/tests/test_links_w1.py`, and the two route files above (those two are also on the W2 list). No new product file outside that set was written after W1-G. The rest of `git status` is the pre-existing dirty tree W1-G left unnamed. It is not why this gate is NO-GO.

Worker: `lsof` shows `Python -m links.public_worker` pid 80376, cwd `/Users/ernie/Fattail-Labs/server`, listening on `127.0.0.1:4017`. Started Mon Oct 5 01:32:14 2026. `server/links/public_worker.py` mtime is 2026-10-05 01:29:31, before that start. The same pid was still listening after the suite. It was not killed. The suite's post of `198.51.100.10` stored United States / California, which the W1 worker did not do, so this process is the restarted W2 worker.

Stdout and stderr are `/private/tmp/links-public-worker.log`. After the suite that file is 0 bytes. It has no access line and no address. `log_message` returns without writing.

## Unmeasured

- The W1 suite was not re-run. Cookie, port 4000, `/api`, and the four cache headers plus 302 were read in source after the W2 edit. They were not curled again. Next on `*:3000` is still pid 13888, the process W1-G already found. Whether that process has loaded the edited `route.ts` was not measured. Ports 3000 and 4000 were not restarted.
- No request with a forged `X-Forwarded-For` was sent. The defect is the source in section 1. It was not exercised on the live route, and it was not fixed.
- The suite deletes its `zztest-w2` event rows on teardown. Those rows were not selected again after the run. The passing assertions are the record of country, region, absent city, and absent address.
- No packet capture. The in-process capture in the suite redirects the pytest process, not the 4017 log. The 4017 log was read on its own and is empty.
- Database age in admin, and the monthly GeoLite2 download, are not this gate. With `LABS_GEOLITE2_PATH` unset, `geo.locate` opens the test fixture.

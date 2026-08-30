# W3-G — Delta

**Project:** p-studioone-archive-read  
**Agent:** Delta  
**Phase:** W3-G  
**Date:** 2026-08-27  
**Law:** SO-AR v0.8 + Amendment A1 · plan v2.1 W3-G  
**Depends:** W3-1

---

## Verdict: **PASS**

Unblocks **W4**. Does **not** unblock W5 (Coach word). No dash bounce.

---

## Coach confirmations (not assumed)

### UNKNOWN vs NONE

They were **not** distinguishable. Both were 200 with empty `snaps`. That is closed.

| Fact | `hole` | HTTP | Meaning |
|------|--------|------|---------|
| COUNTS names the expiration, zero snaps | `NONE` | **200** | This day has nothing for that book |
| COUNTS missing (cannot identify the book) | `UNKNOWN` | **404** | Refused, not guessed. Not an empty day |

`hole_http_status("NONE") == 200` and `hole_http_status("UNKNOWN") == 404`. Test: `test_none_and_unknown_are_distinguishable`. A calendar that only looks at empty 200 will not paint UNKNOWN as “no days.”

### Dense session, S=64

`derived_stride(5800)` was formula-only. **Now an actual session:** 5800 snap files on `day=2026-08-25/chain/SPX/`, clocks from `04:00:00Z`. Index reports `S=64`, `k=6`, `count=5800`. Level-0 fetch returns **91** snaps, indices `0, 64, …, 5760`. Test: `test_dense_session_s64_level0_about_91`.

---

## Evidence

```text
cd server && .venv/bin/python -m pytest \
  tests/test_ssr_archive_read.py \
  tests/test_ssr_archive_ladder.py \
  tests/test_ssr_archive_proxy.py \
  tests/test_ssr_snapshot_dash.py -q
```

**52 passed** (2.02s).

| Fail-closed | Evidence |
|-------------|----------|
| Boot abort on **absent** archive env | `validate_ssr_archive_env()` returns url=None; coverage **501** `ARCHIVE NOT CONFIGURED`. Absent is supported. |
| Malformed aborts | Present invalid URL / token < 32 → `ConfigError`. |
| Tool-gate on member replay | `_require_tool_member` gone. Observer session indexes. |
| Browser given StudioOne URL | Coverage body has no host/port. |
| Coverage `no-store` | `Cache-Control: max-age=0, must-revalidate`. ETag present. |
| 401 mapped to empty calendar | 401 → `ARCHIVE AUTH`, not `{days:[]}`. |

Disk cache: whole-day LRU module, hash in the key, 20 GB ceiling. Second fetch same `day_hash` is `_cache_hit` without a second origin call. Member routes session-only. Admin `/stats` and `/cadence` are `require_admin` (403 for navigator).

---

## Out of this gate

W4 Bearer on StudioOne archive routes. W5 dash bounce and AT-SOAR-45. W6 nightly stats pass. MiniTwo.

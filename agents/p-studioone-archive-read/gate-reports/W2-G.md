# W2-G — Delta

**Project:** p-studioone-archive-read  
**Agent:** Delta  
**Phase:** W2-G  
**Date:** 2026-08-27  
**Law:** SO-AR v0.8 + Amendment A1 · plan v2.1 W2-G  
**Depends:** W2-1

---

## Verdict: **PASS**

Unblocks **W3**. Does **not** unblock W5 (Coach word). No dash bounce.

---

## Evidence

Command:

```text
cd server && .venv/bin/python -m pytest \
  tests/test_ssr_archive_read.py \
  tests/test_ssr_archive_ladder.py \
  tests/test_ssr_snapshot_dash.py \
  tests/test_ssr_archive_proxy.py -q
```

**38 passed.**

| Fail-closed | Evidence |
|-------------|----------|
| No name-sorted ladder | `reconstruct_book` sorts `(t is None, t, name)`. Wrap fixture `001730Z` / `051730Z` indexes as `051730` then `001730`. Hash ≠ `sorted(name)`. |
| No local-date candidate test | `folder_window` = `[D 00:00 NY, D+1 00:00 NY)`. No `NY.date() == D`. |
| No quiet `json.loads` on index | Snap JSON opens only via `open_envelope_for_dst` (DST two-in-window). Index test asserts `dst_envelope_opens == []` and row keys `{t,file,bytes,hole}` — **no** `spot` / `content_hash`. COUNTS + PROVENANCE are the two small files. Fetch `load_snap` is fetch, not index. |
| Two-in-window ≠ `OUT OF WINDOW` | Fall-back `043000Z` → envelope nearest / neighbour / `AMBIGUOUS INSTANT`. Spring-forward `043000Z` → `OUT OF WINDOW`. `hole_http_status("AMBIGUOUS INSTANT") == 200`. |

AT-SOAR reader set exercised: 1–18 (health, cadence, stride, holes, hash, today 409, optional expiration, next_index), 30 (Friday-flat), 33/40–43, 46/46b/46c, 47–49. **32** (pool 429) and **45** remain W5.

---

## Dash handlers (Coach W2 ask)

Making `expiration` optional would have turned a TypeError into a quiet 200. Handlers were inspected and wired, not left as “it stopped crashing.”

| Call | Before W2 | After W2 |
|------|-----------|----------|
| `/api/index?day=&symbol=` (no expiration) | TypeError | Serves that day’s 0DTE book **only if COUNTS names it**. Missing COUNTS → `UNKNOWN`, empty snaps — not a guessed book. |
| `…&expiration=` mismatch | never reached | **404** `WRONG BOOK` |
| `/api/fetch` same | TypeError | optional assertion + `from_index`; `day_changed` **409** |
| Index row | tests wanted `spot` / `content_hash` | those fields **absent**; HTTP test asserts that |

Workspace dash is still not the live StudioOne process. **No bounce.**

---

## Out of this gate

W3 Labs proxy (session-only, 501 absent, must-revalidate, disk cache). W5 dash bounce and AT-SOAR-45. Pool 4 / nice. MiniTwo.
